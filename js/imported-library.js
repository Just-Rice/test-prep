// Questions a student imported themselves, kept on their own device.
//
// Two stores in one IndexedDB database: what was imported from each file, and the pictures those questions
// show, named by a hash of their contents so two files that share a picture store it once. Nothing here is
// ever uploaded, and removing a file takes its questions and any pictures nothing else uses with it.

import { picturesOf as allPicturesOf } from './library-bundle.js';

const DB_NAME = 'satprep-imports';
const DB_VERSION = 1;
const FILES = 'files';
const PICTURES = 'pictures';

// Which pictures are held locally, so the page can tell at a glance whether to look here or in the cloud.
const held = new Set();
const urls = new Map();

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PICTURES)) db.createObjectStore(PICTURES);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const run = (store, mode, work) => openDb().then(db => new Promise((resolve, reject) => {
  const tx = db.transaction(store, mode);
  const result = work(tx.objectStore(store));
  tx.oncomplete = () => { db.close(); resolve(result?.result ?? result); };
  tx.onerror = () => { db.close(); reject(tx.error); };
}));

export const importsSupported = () => typeof indexedDB !== 'undefined';

// What has been imported, newest first, without the questions themselves.
export async function listImports() {
  try {
    const files = await run(FILES, 'readonly', store => store.getAll());
    return files
      .map(({ id, name, kind, at, questions, warnings }) => ({ id, name, kind, at, questions: questions.length, warnings }))
      .sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

// Every imported question, from every file. Later files win, so importing a file twice cannot double a question.
export async function importedQuestions() {
  try {
    const files = await run(FILES, 'readonly', store => store.getAll());
    held.clear();
    const byId = new Map();
    for (const file of files.sort((a, b) => a.at - b.at)) {
      for (const q of file.questions) {
        byId.set(q.id, q);
        for (const picture of picturesOf(q)) held.add(picture.id);
      }
    }
    return [...byId.values()];
  } catch {
    return [];
  }
}

export async function saveImport({ name, kind, questions, warnings, pictures }) {
  const id = `${Date.now().toString(36)}-${name.replace(/[^\w.-]+/g, '-').slice(0, 40)}`;
  await run(PICTURES, 'readwrite', store => {
    for (const [pictureId, bytes] of pictures) store.put(bytes.buffer ?? bytes, pictureId);
  });
  await run(FILES, 'readwrite', store => store.put({ id, name, kind, at: Date.now(), questions, warnings }));
  for (const [pictureId] of pictures) held.add(pictureId);
  return id;
}

export async function removeImport(id) {
  const files = await run(FILES, 'readonly', store => store.getAll());
  const going = files.find(file => file.id === id);
  if (!going) return;
  await run(FILES, 'readwrite', store => store.delete(id));
  // Pictures any remaining file still shows are kept; the rest go with it.
  const stillUsed = new Set(files.filter(file => file.id !== id).flatMap(file => file.questions.flatMap(q => picturesOf(q).map(p => p.id))));
  const dropping = [...new Set(going.questions.flatMap(q => picturesOf(q).map(p => p.id)))].filter(pictureId => !stillUsed.has(pictureId));
  await run(PICTURES, 'readwrite', store => {
    for (const pictureId of dropping) store.delete(pictureId);
  });
  for (const pictureId of dropping) {
    held.delete(pictureId);
    const url = urls.get(pictureId);
    if (url) URL.revokeObjectURL(url);
    urls.delete(pictureId);
  }
}

export const hasPicture = id => held.has(id);

// A picture from this device, as a URL the page can show. Asked for once however many times it is drawn.
export async function importedPictureUrl(id) {
  if (!urls.has(id)) {
    const bytes = await run(PICTURES, 'readonly', store => store.get(id));
    if (!bytes) throw new Error('this picture is not on this device');
    urls.set(id, URL.createObjectURL(new Blob([bytes], { type: 'image/webp' })));
  }
  return urls.get(id);
}

const picturesOf = q => allPicturesOf(q).filter(picture => picture.id);
