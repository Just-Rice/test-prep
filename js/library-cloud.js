// The shared question library, delivered to signed-in accounts that have been invited to it.
//
// The questions built from College Board exports and ACT booklets are never committed, so the live
// site has only the questions written for this app. This module is how an invited account gets the
// rest: an admin uploads the packed bundle once, and anyone on the admin or tester list downloads it
// the next time they sign in.
//
// It all goes in Cloud Firestore. Cloud Storage would be the natural home for the images, but a
// Firebase project now needs a billing account before a storage bucket can be created at all, and
// this project runs on the free Spark plan. Firestore's free allowance is 1 GiB stored and 50,000
// reads a day, and the whole library is about 2 MB read once per device, so it fits with room to
// spare. A document may hold 1 MiB, so the bundle is split across a handful of them:
//
//   library/manifest   what version is up there, and how many pieces it is in
//   library/chunk-N    one piece of the bundle, stored as bytes rather than base64 text
//
// Who may read or replace it is decided by firestore.rules, from the admins/ and testers/ lists that
// no client can write to. A downloaded library is kept in IndexedDB, so it costs one read to check
// the version on later visits and nothing at all to use it offline.

import { decodeBundle, attachImages } from './library-bundle.js';

const CHUNK_BYTES = 700 * 1024;     // a Firestore document holds 1 MiB; this leaves room for overhead
const MANIFEST = 'manifest';
const DB_NAME = 'satprep-library';
const STORE = 'bundle';
const CACHE_KEY = 'current';

let fb = null;

// sync.js owns the Firebase app; this module borrows its handles rather than starting a second one.
export function useFirebase(handles) {
  fb = handles;
}

export const libraryConfigured = () => Boolean(fb);

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

// ---------- reading it ----------

export async function readManifest() {
  const { doc, getDoc } = fb.firestore;
  const snap = await getDoc(doc(fb.db, 'library', MANIFEST));
  return snap.exists() ? snap.data() : null;
}

// The bundle's bytes: from this device's copy when it is already the current version, otherwise from
// Firestore. Returns null when no library has been uploaded yet.
export async function fetchBundle({ onProgress = () => {} } = {}) {
  const manifest = await readManifest();
  if (!manifest) return null;

  const cached = await readCache();
  if (cached?.version === manifest.version) {
    onProgress({ done: manifest.chunks, total: manifest.chunks, cached: true });
    return { bytes: cached.bytes, manifest, cached: true };
  }

  const { doc, getDoc } = fb.firestore;
  const pieces = [];
  for (let i = 0; i < manifest.chunks; i++) {
    const snap = await getDoc(doc(fb.db, 'library', `chunk-${i}`));
    if (!snap.exists()) throw new Error(`the library is incomplete in the cloud (piece ${i + 1} of ${manifest.chunks} is missing)`);
    pieces.push(snap.data().data.toUint8Array());
    onProgress({ done: i + 1, total: manifest.chunks, cached: false });
  }

  const bytes = new Uint8Array(pieces.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const piece of pieces) {
    bytes.set(piece, at);
    at += piece.length;
  }
  if (manifest.bytes && bytes.length !== manifest.bytes) {
    throw new Error('the library downloaded incompletely; try again');
  }
  await writeCache({ version: manifest.version, bytes });
  return { bytes, manifest, cached: false };
}

// The questions themselves, with every image pointed at a URL made from the downloaded bytes.
export async function loadCloudQuestions(options) {
  const result = await fetchBundle(options);
  if (!result) return null;
  const { questions, images, packedAt, builtAt } = decodeBundle(result.bytes);
  const linked = attachImages(questions, images, bytes => URL.createObjectURL(new Blob([bytes], { type: 'image/webp' })));
  return { questions: linked, packedAt, builtAt, cached: result.cached, bytes: result.bytes.length };
}

// ---------- replacing it ----------

// Splits the bundle across documents and writes them, newest manifest last so a half-finished upload
// never looks like the current library.
// Reads the bundle's own header for the version and question count, then puts it up.
export async function publishLibrary(bytes, { onProgress } = {}) {
  const { questions, packedAt } = decodeBundle(bytes);
  return uploadBundle(bytes, { questions: questions.length, packedAt, onProgress });
}

async function uploadBundle(bytes, { questions, packedAt, onProgress = () => {} } = {}) {
  const { doc, setDoc, deleteDoc, Bytes } = fb.firestore;
  const chunks = Math.ceil(bytes.length / CHUNK_BYTES);
  const previous = await readManifest().catch(() => null);

  for (let i = 0; i < chunks; i++) {
    const piece = bytes.subarray(i * CHUNK_BYTES, Math.min(bytes.length, (i + 1) * CHUNK_BYTES));
    await setDoc(doc(fb.db, 'library', `chunk-${i}`), { data: Bytes.fromUint8Array(piece) });
    onProgress({ done: i + 1, total: chunks });
  }

  await setDoc(doc(fb.db, 'library', MANIFEST), {
    version: packedAt, packedAt, questions, bytes: bytes.length, chunks, updatedAt: new Date().toISOString(),
  });

  // A smaller library than last time leaves pieces behind that nothing points at any more.
  for (let i = chunks; i < (previous?.chunks ?? 0); i++) {
    await deleteDoc(doc(fb.db, 'library', `chunk-${i}`)).catch(() => {});
  }
  return { chunks, bytes: bytes.length, questions };
}

// ---------- this device's copy ----------

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readCache() {
  try {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(CACHE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value ? { version: value.version, bytes: new Uint8Array(value.bytes) } : null;
  } catch {
    return null;   // private browsing, or storage turned off: download it again instead
  }
}

async function writeCache({ version, bytes }) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ version, bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }, CACHE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Not being able to keep a copy only costs a download next time.
  }
}

export async function forgetCachedLibrary() {
  try {
    const db = await openDb();
    await new Promise(resolve => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(CACHE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  } catch {
    // nothing cached
  }
}
