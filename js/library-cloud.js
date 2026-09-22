// The shared question library, delivered to signed-in accounts that have been invited to it.
//
// The questions built from College Board exports and ACT booklets are never committed, so the live
// site has only the questions written for this app. This module is how an invited account gets the
// rest: an admin uploads the packed library once, and anyone on the admin or tester list gets it the
// next time they sign in.
//
// It all goes in Cloud Firestore. Cloud Storage would be the natural home for the pictures, but a
// Firebase project now needs a billing account before a storage bucket can be created at all, and this
// project runs on the free Spark plan. The library travels in two parts (see library-bundle.js):
//
//   library/manifest            which version is up, how many pieces the questions are in, and the id of
//                               every picture that has been uploaded
//   library/chunk-N             the gzipped questions, split because a document holds at most 1 MiB
//   library/images/items/<id>   one picture, stored as bytes, named by the hash of its contents
//
// A tester downloads the questions once, about a megabyte, and each picture the first time a question
// shows it. Both are kept in IndexedDB, so later visits cost one read to check the version, and anything
// already seen works offline. That keeps well inside the free plan's 50,000 reads a day and its monthly
// download allowance, which the whole library sent to everyone would not.
//
// Who may read or replace any of it is decided by firestore.rules, from the admins/ and testers/ lists
// that no client can write to; everything here sits under library/, which those rules already cover.

import { decodeLibrary } from './library-bundle.js';

const CHUNK_BYTES = 700 * 1024;     // a Firestore document holds 1 MiB; this leaves room for overhead
const MANIFEST = 'manifest';
const DB_NAME = 'satprep-library';
const DB_VERSION = 2;
const CACHE_KEY = 'current';
const UPLOADS_AT_ONCE = 8;            // deletions of pictures no longer used, sent side by side
const BATCH_WRITES = 400;             // Firestore's own limit is 500 writes in one batch
const BATCH_BYTES = 4 * 1024 * 1024;  // and 10 MiB in one request

let fb = null;

// sync.js owns the Firebase app; this module borrows its handles rather than starting a second one.
export function useFirebase(handles) {
  fb = handles;
}

export const libraryConfigured = () => Boolean(fb);

const pictureDoc = id => fb.firestore.doc(fb.db, 'library', 'images', 'items', id);
const listOf = text => (text ? text.split(',') : []);

// ---------- who may see it ----------

// 'admin' (may replace the library), 'tester' (may read it), or null.
export async function libraryAccess(uid) {
  if (!fb || !uid) return null;
  const { doc, getDoc } = fb.firestore;
  const look = async name => {
    try {
      return (await getDoc(doc(fb.db, name, uid))).exists();
    } catch {
      return false;   // the rules refuse a list this account is not on; that is simply a "no"
    }
  };
  if (await look('admins')) return 'admin';
  if (await look('testers')) return 'tester';
  return null;
}

// ---------- the invite code ----------
//
// Testers can join with a code instead of being added by hand. The admin chooses it; it is kept at
// settings/invite, which only an admin may read, and firestore.rules compares what a tester types against
// it before letting them onto the testers/ list, so the code never has to be sent to anyone's browser to be
// checked. Codes are compared without case, spaces or dashes, so "K7M2-X9QP" and "k7m2x9qp" are the same.

export const MIN_CODE = 8;
export const plainCode = code => String(code ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function joinWithCode(uid, code, name) {
  const { doc, setDoc } = fb.firestore;
  try {
    await setDoc(doc(fb.db, 'testers', uid), { code: plainCode(code), name: String(name || '').slice(0, 80), joinedAt: new Date().toISOString() });
  } catch (err) {
    // The rules refuse a wrong code the same way as any other refusal.
    if (err?.code === 'permission-denied') throw new Error('That invite code isn’t right. Check it with whoever gave it to you and try again.');
    throw new Error('Could not join just now. Check your connection and try again.');
  }
}

export async function readInviteCode() {
  const { doc, getDoc } = fb.firestore;
  const snap = await getDoc(doc(fb.db, 'settings', 'invite'));
  return snap.exists() ? snap.data().code : null;
}

export async function saveInviteCode(code) {
  const plain = plainCode(code);
  if (plain.length < MIN_CODE) throw new Error(`An invite code needs at least ${MIN_CODE} letters or numbers, so it can’t be guessed.`);
  const { doc, setDoc } = fb.firestore;
  await setDoc(doc(fb.db, 'settings', 'invite'), { code: plain, changedAt: new Date().toISOString() });
  return plain;
}

export async function listTesters() {
  const { collection, getDocs } = fb.firestore;
  const snap = await getDocs(collection(fb.db, 'testers'));
  return snap.docs.map(d => ({ uid: d.id, name: d.data().name || '', joinedAt: d.data().joinedAt || null }))
    .sort((a, b) => String(a.joinedAt).localeCompare(String(b.joinedAt)));
}

export async function removeTester(uid) {
  const { doc, deleteDoc } = fb.firestore;
  await deleteDoc(doc(fb.db, 'testers', uid));
}

// ---------- reading it ----------

export async function readManifest() {
  const { doc, getDoc } = fb.firestore;
  const snap = await getDoc(doc(fb.db, 'library', MANIFEST));
  return snap.exists() ? snap.data() : null;
}

// The questions: from this device's copy when it is already the current version, otherwise from
// Firestore. Returns null when no library has been uploaded yet.
export async function loadCloudQuestions({ onProgress = () => {} } = {}) {
  const manifest = await readManifest();
  if (!manifest) return null;

  let bytes = null;
  const cached = await cacheGet('core', CACHE_KEY);
  if (cached?.version === manifest.version) {
    bytes = new Uint8Array(cached.bytes);
    onProgress({ done: manifest.chunks, total: manifest.chunks, cached: true });
  } else {
    const { doc, getDoc } = fb.firestore;
    const pieces = [];
    for (let i = 0; i < manifest.chunks; i++) {
      const snap = await getDoc(doc(fb.db, 'library', `chunk-${i}`));
      if (!snap.exists()) throw new Error(`the library is incomplete in the cloud (piece ${i + 1} of ${manifest.chunks} is missing)`);
      pieces.push(snap.data().data.toUint8Array());
      onProgress({ done: i + 1, total: manifest.chunks, cached: false });
    }
    bytes = join(pieces);
    if (manifest.bytes && bytes.length !== manifest.bytes) throw new Error('the library downloaded incompletely; try again');
    await cachePut('core', CACHE_KEY, { version: manifest.version, bytes: bytes.slice().buffer });
  }

  const { questions, packedAt, builtAt } = await decodeLibrary(bytes);
  return { questions, packedAt, builtAt, cached: Boolean(cached?.version === manifest.version), bytes: bytes.length };
}

// A picture, as a URL the page can show: from this device if it has been seen before, otherwise fetched
// now and kept. Each is asked for once however many times it is drawn.
const pictureUrls = new Map();

export function pictureUrl(id) {
  if (!pictureUrls.has(id)) {
    const loading = (async () => {
      let bytes = await cacheGet('images', id);
      if (!bytes) {
        if (!fb) throw new Error('not signed in');
        const snap = await fb.firestore.getDoc(pictureDoc(id));
        if (!snap.exists()) throw new Error('this picture is missing from the shared library');
        bytes = snap.data().data.toUint8Array().slice().buffer;
        await cachePut('images', id, bytes);
      }
      return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
    })();
    // A failed fetch is not remembered, so it is tried again the next time the picture is drawn.
    loading.catch(() => pictureUrls.delete(id));
    pictureUrls.set(id, loading);
  }
  return pictureUrls.get(id);
}

// ---------- replacing it ----------

// Uploads a packed library. Only pictures not already up there are sent, so publishing again after adding
// an export sends just the new ones. The manifest is written last, so a half-finished upload is never
// mistaken for the library, and pictures the new library no longer uses are removed afterwards.
//
// library: the packed questions (library.bin). ids: every picture id they use. readPicture(id): its bytes.
export async function publishLibrary({ library, ids, packedAt, questions, readPicture, onProgress = () => {} }) {
  const { doc, setDoc, deleteDoc, Bytes } = fb.firestore;
  const previous = await readManifest().catch(() => null);
  const already = new Set(listOf(previous?.images));
  const wanted = [...ids];
  const toSend = wanted.filter(id => !already.has(id));

  // Pictures go up in batches. Sent one write at a time the web SDK manages about three a second, which
  // is three-quarters of an hour for a full library; a batch commits hundreds in one request. Firestore
  // allows 500 writes and 10 MiB in a batch, and these stay well inside both.
  const { writeBatch } = fb.firestore;
  let sent = 0;
  let batch = writeBatch(fb.db);
  let inBatch = 0;
  let batchBytes = 0;
  const commit = async () => {
    if (!inBatch) return;
    await batch.commit();
    sent += inBatch;
    onProgress({ phase: 'pictures', done: sent, total: toSend.length });
    batch = writeBatch(fb.db);
    inBatch = 0;
    batchBytes = 0;
  };
  onProgress({ phase: 'pictures', done: 0, total: toSend.length });
  for (const id of toSend) {
    const bytes = await readPicture(id);
    if (inBatch >= BATCH_WRITES || batchBytes + bytes.length > BATCH_BYTES) await commit();
    batch.set(pictureDoc(id), { data: Bytes.fromUint8Array(bytes) });
    inBatch++;
    batchBytes += bytes.length;
  }
  await commit();

  const chunks = Math.ceil(library.length / CHUNK_BYTES);
  for (let i = 0; i < chunks; i++) {
    const piece = library.subarray(i * CHUNK_BYTES, Math.min(library.length, (i + 1) * CHUNK_BYTES));
    await setDoc(doc(fb.db, 'library', `chunk-${i}`), { data: Bytes.fromUint8Array(piece) });
    onProgress({ phase: 'questions', done: i + 1, total: chunks });
  }

  // The list of pictures is kept in the manifest itself, about 21 characters each, which is what lets a
  // later upload skip the ones already there. A document's 1 MiB limit leaves room for some 45,000.
  await setDoc(doc(fb.db, 'library', MANIFEST), {
    version: packedAt, packedAt, questions, bytes: library.length, chunks,
    pictures: wanted.length, images: wanted.join(','), updatedAt: new Date().toISOString(),
  });

  // What the new library no longer needs: pieces past its end, and pictures no question uses any more.
  for (let i = chunks; i < (previous?.chunks ?? 0); i++) await deleteDoc(doc(fb.db, 'library', `chunk-${i}`)).catch(() => {});
  const keep = new Set(wanted);
  const unused = [...already].filter(id => !keep.has(id));
  await eachAtOnce(unused, UPLOADS_AT_ONCE, id => deleteDoc(pictureDoc(id)).catch(() => {}));

  return { questions, pictures: wanted.length, sent: toSend.length, removed: unused.length, bytes: library.length };
}

async function eachAtOnce(items, limit, work) {
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await work(items[next++]);
  });
  await Promise.all(lanes);
}

function join(pieces) {
  const out = new Uint8Array(pieces.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const piece of pieces) {
    out.set(piece, at);
    at += piece.length;
  }
  return out;
}

// ---------- this device's copy ----------

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Version 1 kept the whole library, pictures and all, in one record; it is replaced, not converted.
      if (db.objectStoreNames.contains('bundle')) db.deleteObjectStore('bundle');
      for (const store of ['core', 'images']) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheGet(store, key) {
  try {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value ?? null;
  } catch {
    return null;   // private browsing, or storage turned off: fetch it again instead
  }
}

async function cachePut(store, key, value) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Not being able to keep a copy only costs a download next time.
  }
}
