// Packs the built question library into a slim bundle for carrying to other devices.
//
// The local build (scripts/build-questions.js) is tuned for reading on a big screen and keeps an archive crop
// of every question. Neither matters when the library has to travel over a metered connection, so this makes
// two cuts that together shrink it by roughly six times:
//
//   - the "original" crop of each question is left out. The app only shows it behind the "View the original
//     from the export" toggle, and questionHtml already skips that block when it is missing.
//   - every remaining image is re-rendered smaller and at lower quality, which stays comfortably readable
//     because these are crops of printed text and line art, not photographs.
//
// Output goes to data/pack/, which is gitignored like the rest of data/.

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCALE = 0.7;      // of the already-rendered crop
const QUALITY = 70;     // WebP quality

const mb = bytes => `${(bytes / 1048576).toFixed(1)} MB`;

export async function packQuestions({ dataDir = join(ROOT, 'data'), outDir = join(ROOT, 'data', 'pack'), log = console.log } = {}) {
  const source = join(dataDir, 'questions.json');
  if (!existsSync(source)) throw new Error('No built library found. Run `npm run build` first.');
  const built = JSON.parse(await readFile(source, 'utf8'));

  const outImg = join(outDir, 'img');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outImg, { recursive: true });

  const keep = new Set();
  const questions = built.questions.map(q => {
    // Drop the archive crop; keep everything the student actually needs to answer and learn from.
    const { original, ...rest } = q;
    for (const image of [rest.promptImage, ...(rest.choices || []).map(c => c?.image), rest.answerImage, rest.rationaleImage]) {
      if (image?.src) keep.add(image.src.split('/').pop());
    }
    return rest;
  });

  let from = 0;
  let to = 0;
  for (const name of await readdir(join(dataDir, 'img'))) {
    if (!keep.has(name)) continue;
    const path = join(dataDir, 'img', name);
    from += (await stat(path)).size;
    const image = await loadImage(path);
    const canvas = createCanvas(Math.max(1, Math.round(image.width * SCALE)), Math.max(1, Math.round(image.height * SCALE)));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = await canvas.encode('webp', QUALITY);
    to += encoded.length;
    await writeFile(join(outImg, name), encoded);
  }

  // The stored sizes are CSS pixels, so they stay as they are: the picture is smaller, drawn at the same size.
  const json = JSON.stringify({ builtAt: built.builtAt, packedAt: new Date().toISOString(), questions });
  await writeFile(join(outDir, 'questions.json'), json);

  const total = to + Buffer.byteLength(json);
  log(`Packed ${questions.length} questions: ${mb(total)} (${(total / questions.length / 1024).toFixed(1)} KB each)`);
  log(`  images ${mb(from)} -> ${mb(to)}, archive crops dropped, ${keep.size} files kept`);
  return { questions: questions.length, bytes: total, perQuestion: total / questions.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  packQuestions().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
