// Packs the built question library for the shared library that invited accounts read on the live site
// (js/library-cloud.js). See js/library-bundle.js for why it travels as two parts.
//
// The local build (scripts/build-questions.js) is tuned for reading on a big screen and keeps an archive crop
// of every question. Neither matters when the library has to travel over a metered connection, so:
//
//   - the "original" crop of each question is left out. The app only shows it behind the "View the original
//     from the export" toggle, and questionHtml already skips that block when it is missing.
//   - every remaining picture is re-rendered smaller and at lower quality, which stays comfortably readable
//     because these are crops of printed text and line art, not photographs.
//
// Output goes to data/pack/, which is gitignored like the rest of data/:
//   library.bin          the questions, gzipped, with each picture replaced by the id of its contents
//   images/<id>.webp     one file per picture

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { encodeLibrary, PICTURE_KEYS } from '../js/library-bundle.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCALE = 0.7;      // of the already-rendered crop
const QUALITY = 70;     // WebP quality

const mb = bytes => `${(bytes / 1048576).toFixed(1)} MB`;
const idOf = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 20);

export async function packQuestions({ dataDir = join(ROOT, 'data'), outDir = join(ROOT, 'data', 'pack'), log = console.log } = {}) {
  const source = join(dataDir, 'questions.json');
  if (!existsSync(source)) throw new Error('No built library found. Run `npm run build` first.');
  const built = JSON.parse(await readFile(source, 'utf8'));

  const outImages = join(outDir, 'images');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outImages, { recursive: true });

  // Each built picture file is shrunk once, however many questions use it, and named by what it contains.
  const idByFile = new Map();
  let from = 0;
  let to = 0;
  async function pack(image) {
    if (!image?.src) return image;
    const name = image.src.split('/').pop();
    if (!idByFile.has(name)) {
      const path = join(dataDir, 'img', name);
      from += (await stat(path)).size;
      const picture = await loadImage(path);
      const canvas = createCanvas(Math.max(1, Math.round(picture.width * SCALE)), Math.max(1, Math.round(picture.height * SCALE)));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(picture, 0, 0, canvas.width, canvas.height);
      const encoded = await canvas.encode('webp', QUALITY);
      const id = idOf(encoded);
      if (!existsSync(join(outImages, `${id}.webp`))) {
        to += encoded.length;
        await writeFile(join(outImages, `${id}.webp`), encoded);
      }
      idByFile.set(name, id);
    }
    // The stored size is in CSS pixels, so it stays as it is: the picture is smaller, drawn at the same size.
    return { id: idByFile.get(name), width: image.width, height: image.height };
  }

  const questions = [];
  for (const q of built.questions) {
    // Drop the archive crop; keep everything the student actually needs to answer and learn from.
    const { original, ...rest } = q;
    for (const key of PICTURE_KEYS) if (rest[key]) rest[key] = await pack(rest[key]);   // `original` was dropped above
    if (rest.choices) rest.choices = await Promise.all(rest.choices.map(async c => (c?.image ? { ...c, image: await pack(c.image) } : c)));
    questions.push(rest);
  }

  const library = await encodeLibrary({ questions, builtAt: built.builtAt });
  await writeFile(join(outDir, 'library.bin'), library);

  const pictures = new Set(idByFile.values()).size;
  log(`Packed ${questions.length} questions.`);
  log(`  questions: ${mb(library.length)}, which is what a tester downloads on signing in`);
  log(`  pictures: ${pictures}, ${mb(from)} -> ${mb(to)}, each fetched only when its question comes up`);
  return { questions: questions.length, libraryBytes: library.length, pictures, pictureBytes: to };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  packQuestions().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
