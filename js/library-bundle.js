// The shared question library as it travels to invited accounts.
//
// It travels in two parts. The questions go as one small file of gzipped JSON, in which every picture is
// replaced by an id: the first 20 hex digits of a SHA-256 of the picture's own bytes. The pictures go
// separately, each on its own, and are fetched only when a question that shows one comes up.
//
// That split is what lets the library grow. Built from the full Question Bank it is about 90 MB, almost
// all of it pictures, and more than half of those are worked solutions nobody sees until they have
// answered. Sending all of it to every tester would have meant 90 MB on a phone before the first question,
// and a Firebase free plan that runs out of monthly downloads after a few testers. The questions alone come
// to about a megabyte. Naming a picture by its contents also means an unchanged picture is never uploaded
// twice, and identical pictures are stored once.
//
// Nothing here knows about Firebase or the DOM, so the packer writes a library in Node and the browser reads
// it back with the same code. Compression uses the platform's CompressionStream, which both have.

const VERSION = 2;

// Every place a question keeps a picture.
export function picturesOf(q) {
  return [q.promptImage, q.answerImage, q.rationaleImage, q.original, ...(q.choices || []).map(c => c?.image)].filter(Boolean);
}

// The id of every picture a set of questions uses.
export function pictureIds(questions) {
  const ids = new Set();
  for (const q of questions) for (const picture of picturesOf(q)) if (picture.id) ids.add(picture.id);
  return ids;
}

async function transform(bytes, stream) {
  const piped = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

export async function encodeLibrary({ questions, builtAt = null, packedAt = new Date().toISOString() }) {
  const json = new TextEncoder().encode(JSON.stringify({ v: VERSION, builtAt, packedAt, questions }));
  return transform(json, new CompressionStream('gzip'));
}

export async function decodeLibrary(bytes) {
  let library;
  try {
    library = JSON.parse(new TextDecoder().decode(await transform(bytes, new DecompressionStream('gzip'))));
  } catch {
    throw new Error('the shared library is damaged');
  }
  if (library?.v !== VERSION) throw new Error(`this library was packed by a different version (${library?.v})`);
  if (!Array.isArray(library.questions)) throw new Error('the shared library is damaged');
  return { builtAt: library.builtAt, packedAt: library.packedAt, questions: library.questions };
}
