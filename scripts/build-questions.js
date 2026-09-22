// Builds the question library from the PDFs saved in exports/: College Board Question Bank exports at
// the top level, and ACT practice test booklets in exports/act/.
// Runs when the server starts, or on its own with `npm run build`. Output goes to data/: questions.json
// plus an image for each question part that contains math, graphs or tables. Results are cached per PDF
// by content hash, so only new or changed exports are processed.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { readPage } from '../js/cb-pdf.js';
import { inkBounds } from '../js/ink.js';
import { picturesOf } from '../js/library-bundle.js';
import { questionFromBooklet, questionFromExport } from '../js/question-builder.js';
import { parseExport } from '../js/cb-layout.js';
import { parseBooklet } from '../js/act-layout.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FORMAT = 6;           // bump to rebuild every export after changing parsing or rendering
const RENDER_SCALE = 2.4;   // canvas pixels per PDF point
const DISPLAY_SCALE = 1.3;  // CSS pixels per PDF point, so the export's 9pt text shows at about 12px
const PADDING = 4;
const SPAN_GAP = 6;         // pixels between the pieces of a part that crosses a page break
const PAGE_CACHE = 3;

const imagesOf = picturesOf;   // the one list of where a question keeps a picture, in js/library-bundle.js
const fileOf = image => image.src.split('/').pop();

export async function buildQuestions({ exportsDir = join(ROOT, 'exports'), dataDir = join(ROOT, 'data'), log = console.log } = {}) {
  const imagesDir = join(dataDir, 'img');
  const cacheDir = join(dataDir, 'cache');
  await mkdir(imagesDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  const pdfsIn = async dir => (existsSync(dir) ? (await readdir(dir)).filter(f => f.toLowerCase().endsWith('.pdf')).sort() : []);
  const sources = [
    ...(await pdfsIn(exportsDir)).map(file => ({ file, path: join(exportsDir, file), kind: 'cb' })),
    ...(await pdfsIn(join(exportsDir, 'act'))).map(file => ({ file, path: join(exportsDir, 'act', file), kind: 'act' })),
  ];
  const files = sources.map(s => s.file);
  const questions = new Map();
  let shared = 0;
  const warnings = [];
  const caches = new Set();

  for (const { file, path, kind } of sources) {
    const bytes = await readFile(path);
    const hash = createHash('sha256').update(`${FORMAT}:`).update(bytes).digest('hex').slice(0, 16);
    const cachePath = join(cacheDir, `${hash}.json`);
    caches.add(`${hash}.json`);

    let result = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : null;
    if (result && !result.questions.flatMap(imagesOf).every(img => existsSync(join(imagesDir, fileOf(img))))) result = null;
    if (!result) {
      log(`Building questions from ${file}…`);
      try {
        result = await buildFile(bytes, file, imagesDir, kind);
      } catch (err) {
        // A damaged or half-downloaded PDF shouldn't keep the rest of the library from building.
        const expected = kind === 'act' ? 'an ACT practice test booklet' : 'a complete College Board Question Bank export';
        warnings.push(`${file}: could not be read (${err.message}). Is it ${expected}?`);
        continue;
      }
      await writeFile(cachePath, JSON.stringify(result));
    }
    warnings.push(...result.warnings);
    // A question exported from two banks (the SAT's and a PSAT's, say) is one question in both tests: it is kept
    // once, listing every bank it came from. Keeping only the first would take it away from the other test.
    for (const q of result.questions) {
      const seen = questions.get(q.id);
      if (!seen) { questions.set(q.id, q); continue; }
      const banks = new Set([...(seen.assessments ?? [seen.assessment]), q.assessment]);
      if (banks.size > (seen.assessments?.length ?? 1)) { questions.set(q.id, { ...seen, assessments: [...banks] }); shared++; }
    }
  }

  if (shared) log(`${shared} question${shared === 1 ? ' is' : 's are'} in more than one test's bank, and counted in each.`);

  // Remove cached results and images that no current export produces.
  const used = new Set([...questions.values()].flatMap(imagesOf).map(fileOf));
  for (const name of await readdir(cacheDir)) if (!caches.has(name)) await rm(join(cacheDir, name));
  for (const name of await readdir(imagesDir)) if (!used.has(name)) await rm(join(imagesDir, name));

  const list = [...questions.values()];
  await writeFile(join(dataDir, 'questions.json'), JSON.stringify({ builtAt: new Date().toISOString(), files: files.length, questions: list, warnings }));
  log(`Question library: ${list.length} questions from ${files.length} export${files.length === 1 ? '' : 's'}${warnings.length ? ` (${warnings.length} skipped; see the Library page)` : ''}.`);
  return { questions: list, warnings, files: files.length };
}

async function buildFile(bytes, fileName, imagesDir, kind) {
  const loading = getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  const doc = await loading.promise;
  try {
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) pages.push(await readPage(await doc.getPage(n), OPS));
    const parse = kind === 'act' ? parseBooklet : parseExport;
    const build = kind === 'act' ? questionFromBooklet : questionFromExport;
    const { questions: parsed, warnings } = parse(pages, fileName);
    const image = createRenderer(doc, imagesDir);
    const shared = new Map();   // pictures more than one question uses, such as a science passage
    const questions = [];
    for (const p of parsed) {
      try {
        questions.push(await build(p, image, fileName, shared));
      } catch (err) {
        warnings.push(`${fileName}: skipped question ${p.cbId ?? `${p.section} ${p.number}`}: ${err.message}`);
      }
    }
    return { questions, warnings };
  } finally {
    await loading.destroy();
  }
}

function createRenderer(doc, imagesDir) {
  const pages = new Map();

  function renderPage(index) {
    if (!pages.has(index)) {
      if (pages.size >= PAGE_CACHE) pages.delete(pages.keys().next().value);
      pages.set(index, (async () => {
        const page = await doc.getPage(index + 1);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        return { canvas, viewport };
      })());
    }
    return pages.get(index);
  }

  async function crop(span) {
    const { canvas, viewport } = await renderPage(span.page);
    const [ax, ay] = viewport.convertToViewportPoint(span.left, span.top);
    const [bx, by] = viewport.convertToViewportPoint(span.right, span.bottom);
    const x = Math.max(0, Math.floor(Math.min(ax, bx)));
    const y = Math.max(0, Math.floor(Math.min(ay, by)));
    const w = Math.min(canvas.width, Math.ceil(Math.max(ax, bx))) - x;
    const h = Math.min(canvas.height, Math.ceil(Math.max(ay, by))) - y;
    if (w <= 0 || h <= 0) return null;
    const ink = inkBounds(canvas.getContext('2d').getImageData(x, y, w, h));
    return ink && { canvas, sx: x + ink.x, sy: y + ink.y, w: ink.w, h: ink.h };
  }

  return async function image(spans, name) {
    const pieces = [];
    for (const span of spans) {
      const piece = await crop(span);
      if (piece) pieces.push(piece);
    }
    if (!pieces.length) throw new Error('part of the question rendered blank');
    const out = createCanvas(
      Math.max(...pieces.map(p => p.w)) + PADDING * 2,
      pieces.reduce((sum, p) => sum + p.h, 0) + SPAN_GAP * (pieces.length - 1) + PADDING * 2,
    );
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    let top = PADDING;
    for (const p of pieces) {
      ctx.drawImage(p.canvas, p.sx, p.sy, p.w, p.h, PADDING, top, p.w, p.h);
      top += p.h + SPAN_GAP;
    }
    const file = `${name.replace(/[^\w-]/g, '_')}.webp`;
    await writeFile(join(imagesDir, file), await out.encode('webp', 92));
    const toCss = px => Math.round((px / RENDER_SCALE) * DISPLAY_SCALE);
    return { src: `data/img/${file}`, width: toCss(out.width), height: toCss(out.height) };
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildQuestions().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
