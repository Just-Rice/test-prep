// The packed question library as a single block of bytes, so it can be carried to the live site.
//
// The library is mostly pictures: the College Board export draws equations, graphs and tables as
// graphics, and so do ACT's booklets, so about half of every question is a cropped image. Those
// cannot go in JSON without base64, which would make them a third larger again, so the bundle keeps
// the question text as JSON and the images as raw bytes after it:
//
//   bytes 0-3   how long the header is, as a 32-bit little-endian number
//   header      UTF-8 JSON: the questions, plus where each image sits in the block below
//   images      every image, one after another, exactly as it was encoded
//
// Nothing here knows about Firebase or the DOM, so the packer builds a bundle in Node and the browser
// takes one apart with the same code.

const VERSION = 1;
const HEADER_BYTES = 4;

const nameOf = src => String(src).split('/').pop();

// questions: the packed questions, whose image srcs name files in `images`.
// images: Map or object of file name -> Uint8Array.
export function encodeBundle({ questions, images, builtAt = null, packedAt = new Date().toISOString() }) {
  const entries = [...(images instanceof Map ? images : new Map(Object.entries(images)))];
  const index = [];
  let offset = 0;
  for (const [name, bytes] of entries) {
    index.push([name, offset, bytes.length]);
    offset += bytes.length;
  }

  const header = new TextEncoder().encode(JSON.stringify({ v: VERSION, builtAt, packedAt, questions, images: index }));
  const out = new Uint8Array(HEADER_BYTES + header.length + offset);
  new DataView(out.buffer).setUint32(0, header.length, true);
  out.set(header, HEADER_BYTES);
  let at = HEADER_BYTES + header.length;
  for (const [, bytes] of entries) {
    out.set(bytes, at);
    at += bytes.length;
  }
  return out;
}

export function decodeBundle(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length < HEADER_BYTES) throw new Error('the library bundle is empty');
  const headerLength = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0, true);
  const start = HEADER_BYTES + headerLength;
  if (!headerLength || start > data.length) throw new Error('the library bundle is damaged');

  let header;
  try {
    header = JSON.parse(new TextDecoder().decode(data.subarray(HEADER_BYTES, start)));
  } catch {
    throw new Error('the library bundle is damaged');
  }
  if (header.v !== VERSION) throw new Error(`this library was packed by a different version (${header.v})`);

  const images = new Map();
  for (const [name, offset, length] of header.images) {
    const from = start + offset;
    if (from + length > data.length) throw new Error('the library bundle is missing some images');
    images.set(name, data.subarray(from, from + length));
  }
  return { builtAt: header.builtAt, packedAt: header.packedAt, questions: header.questions, images };
}

// Every image a set of questions refers to, by file name.
export function imageNames(questions) {
  const names = new Set();
  for (const q of questions) {
    for (const image of [q.promptImage, q.answerImage, q.rationaleImage, q.original, ...(q.choices || []).map(c => c.image)]) {
      if (image?.src) names.add(nameOf(image.src));
    }
  }
  return names;
}

// Points every image in `questions` at a URL made from the bundle's own bytes, so the questions can be
// shown without the files they were built from. `urlFor` turns one image's bytes into a URL.
export function attachImages(questions, images, urlFor) {
  const urls = new Map();
  const link = image => {
    if (!image?.src) return image;
    const name = nameOf(image.src);
    const bytes = images.get(name);
    if (!bytes) return null;      // an image that did not travel: the part is dropped rather than broken
    if (!urls.has(name)) urls.set(name, urlFor(bytes, name));
    return { ...image, src: urls.get(name) };
  };
  return questions.map(q => ({
    ...q,
    promptImage: link(q.promptImage),
    answerImage: link(q.answerImage),
    rationaleImage: link(q.rationaleImage),
    original: link(q.original),
    choices: q.choices?.map(c => (c.image ? { ...c, image: link(c.image) } : c)) ?? q.choices,
  }));
}
