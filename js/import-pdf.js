// Reads a question PDF the student picked themselves, in their own browser.
//
// Everything happens on the device: the file is never uploaded, and nothing about it is sent anywhere. The
// same readers the build script uses take the pages apart (js/cb-layout.js for a College Board Question Bank
// export, js/act-layout.js for an ACT practice test booklet), and js/question-builder.js shapes the questions,
// so a question imported here is identical to the same question built from exports/.
//
// The only part that differs is the drawing. The build script renders pages with a canvas library in Node and
// writes files; here the page is drawn on the browser's own canvas and each picture kept as bytes, named by a
// hash of its contents so the same picture is never stored twice.

import { readPage } from './cb-pdf.js';
import { parseExport } from './cb-layout.js';
import { parseBooklet } from './act-layout.js';
import { inkBounds } from './ink.js';
import { questionFromBooklet, questionFromExport } from './question-builder.js';

// Pinned, and the same version the build script uses, so both read a PDF the same way.
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/';
const RENDER_SCALE = 2.4;    // canvas pixels per PDF point
const DISPLAY_SCALE = 1.3;   // CSS pixels per PDF point, so the export's 9pt text shows at about 12px
const PADDING = 4;
const SPAN_GAP = 6;          // pixels between the pieces of a part that crosses a page break
const PAGE_CACHE = 3;
const QUALITY = 0.82;

let pdfjs = null;

async function loadPdfjs() {
  pdfjs ||= (async () => {
    const library = await import(`${PDFJS}build/pdf.min.mjs`);
    library.GlobalWorkerOptions.workerSrc = `${PDFJS}build/pdf.worker.min.mjs`;
    return library;
  })();
  return pdfjs;
}

const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
const idOf = async bytes => hex(await crypto.subtle.digest('SHA-256', bytes)).slice(0, 20);

// Reads one file. onProgress reports which stage it is at, so a long PDF doesn't look stuck.
export async function importPdf(file, { onProgress = () => {} } = {}) {
  const { getDocument, OPS } = await loadPdfjs();
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()), verbosity: 0,
    // Where the library keeps the fonts it falls back to, so an unusual one still draws.
    standardFontDataUrl: `${PDFJS}standard_fonts/`, cMapUrl: `${PDFJS}cmaps/`, cMapPacked: true,
  });
  const doc = await task.promise;
  try {
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      pages.push(await readPage(await doc.getPage(n), OPS));
      onProgress({ phase: 'reading', done: n, total: doc.numPages });
    }

    // Which kind of PDF it is decides itself: whichever reader finds questions in it.
    const asExport = parseExport(pages, file.name);
    const asBooklet = asExport.questions.length ? { questions: [], warnings: [] } : parseBooklet(pages, file.name);
    const kind = asExport.questions.length >= asBooklet.questions.length ? 'cb' : 'act';
    const { questions: parsed, warnings } = kind === 'cb' ? asExport : asBooklet;
    if (!parsed.length) {
      return { name: file.name, kind: null, questions: [], pictures: new Map(), warnings: warnings.length ? warnings : [`${file.name}: no questions found in this PDF.`] };
    }

    const pictures = new Map();
    const picture = createRenderer(doc, pictures);
    const shared = new Map();
    const questions = [];
    for (const [index, one] of parsed.entries()) {
      try {
        questions.push(kind === 'cb'
          ? await questionFromExport(one, picture)
          : await questionFromBooklet(one, picture, file.name, shared));
      } catch (err) {
        warnings.push(`${file.name}: skipped question ${one.cbId ?? `${one.section} ${one.number}`}: ${err.message}`);
      }
      onProgress({ phase: 'drawing', done: index + 1, total: parsed.length });
    }
    return { name: file.name, kind, questions, pictures, warnings };
  } finally {
    await task.destroy();
  }
}

// Cuts pieces out of the PDF and keeps them as WebP bytes, named by what they contain.
function createRenderer(doc, pictures) {
  const rendered = new Map();

  function renderPage(index) {
    if (!rendered.has(index)) {
      if (rendered.size >= PAGE_CACHE) rendered.delete(rendered.keys().next().value);
      rendered.set(index, (async () => {
        const page = await doc.getPage(index + 1);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Drawn as if for print. Drawing for the screen is spread across animation frames, and a browser
        // stops those in a tab that isn't the one being looked at, so an import would stall half-drawn the
        // moment the student changed tab. Printing draws it in one go instead.
        await page.render({ canvasContext: ctx, canvas, viewport, intent: 'print' }).promise;
        return { canvas, viewport };
      })());
    }
    return rendered.get(index);
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
    const ink = inkBounds(canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, w, h));
    return ink && { canvas, sx: x + ink.x, sy: y + ink.y, w: ink.w, h: ink.h };
  }

  return async function makePicture(spans) {
    const pieces = [];
    for (const span of spans) {
      const piece = await crop(span);
      if (piece) pieces.push(piece);
    }
    if (!pieces.length) throw new Error('part of the question was blank on the page');
    const out = document.createElement('canvas');
    out.width = Math.max(...pieces.map(p => p.w)) + PADDING * 2;
    out.height = pieces.reduce((sum, p) => sum + p.h, 0) + SPAN_GAP * (pieces.length - 1) + PADDING * 2;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    let top = PADDING;
    for (const piece of pieces) {
      ctx.drawImage(piece.canvas, piece.sx, piece.sy, piece.w, piece.h, PADDING, top, piece.w, piece.h);
      top += piece.h + SPAN_GAP;
    }
    const blob = await new Promise(resolve => out.toBlob(resolve, 'image/webp', QUALITY));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const id = await idOf(bytes);
    if (!pictures.has(id)) pictures.set(id, bytes);
    const toCss = px => Math.round((px / RENDER_SCALE) * DISPLAY_SCALE);
    return { id, width: toCss(out.width), height: toCss(out.height) };
  };
}
