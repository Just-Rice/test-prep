import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooklet } from '../js/act-layout.js';
import { readPage } from '../js/cb-pdf.js';
import { ACT_DOMAINS } from '../js/taxonomy-act.js';

// ---- synthetic pages laid out like an ACT booklet (original text, not ACT content) ----

const CHAR_W = 4.6;
const SPACE = 2.5;

// Words of `text` starting at x on baseline y, as separate positioned items, the way the booklets
// set justified prose. Returns the items and where the line ends.
function words(x, y, text, h = 9) {
  const out = [];
  let cx = x;
  for (const word of text.split(' ')) {
    out.push({ str: word, x: cx, y, w: word.length * CHAR_W, h });
    cx += word.length * CHAR_W + SPACE;
  }
  return out;
}

// Where a phrase inside a line starts and ends, so a rule can be drawn under exactly those words.
function span(x, text, phrase) {
  const before = text.slice(0, text.indexOf(phrase));
  const width = t => (t ? t.length * CHAR_W + t.split(' ').length * SPACE - SPACE : 0);
  const x0 = x + (before ? width(before) : 0);
  return { x0, x1: x0 + width(phrase) };
}

const page = (lines, boxes = []) => ({ view: [0, 0, 612, 792], words: lines.flat(), boxes });
const rule = ({ x0, x1 }, y) => ({ x0, x1, y0: y - 3.5, y1: y - 3.5 });

// Short enough to sit inside the left column, as the booklets set them.
const PASSAGE_1 = 'Marbled paper was made by floating pigment';
const PASSAGE_2 = 'on water thickened with seaweed extract.';

// English: passage in the left column, questions in the right, an underline under part of a line.
function englishPages() {
  const underlined = 'floating pigment';
  const marked = span(63, PASSAGE_1, underlined);   // the first line of a paragraph is indented
  const first = page([
    // The booklets set this centred heading as one piece of text spanning both columns.
    [{ str: 'ENGLISH TEST', x: 262, y: 702, w: 88, h: 11 }],
    words(42, 506, 'PASSAGE I'),
    words(94, 486, 'A Short History of Marbled Paper'),
    words(63, 466, PASSAGE_1),
    [{ str: '1', x: marked.x0 + 8, y: 456, w: 4, h: 6 }],
    words(42, 446, PASSAGE_2),
    words(324, 466, '1.'), words(336, 466, 'Which choice is clearest in context?'),
    words(336, 442, 'A.'), words(354, 442, 'No Change'),
    words(336, 432, 'B.'), words(354, 432, 'water that had been thickened'),
    words(336, 422, 'C.'), words(354, 422, 'sized water'),
    words(336, 412, 'D.'), words(354, 412, 'water, thickened,'),
    words(324, 386, '2.'), words(336, 386, 'Which choice best ends the paragraph?'),
    words(336, 362, 'F.'), words(354, 362, 'No Change'),
    words(336, 352, 'G.'), words(354, 352, 'and the pattern is kept'),
    words(336, 342, 'H.'), words(354, 342, 'so the pattern lifts away'),
    words(336, 332, 'J.'), words(354, 332, 'DELETE the underlined portion.'),
    words(406, 42, 'GO ON TO THE NEXT PAGE.'),
  ], [rule(marked, 466)]);
  const last = page([words(250, 400, 'END OF TEST 1')]);
  return [first, last];
}

// The scoring key: number, answer and reporting category, one row each.
function keyPage(title, rows) {
  const lines = [words(41, 732, title)];
  rows.forEach(([number, letter, category], i) => {
    const y = 687 - i * 13;
    lines.push(
      [{ str: String(number), x: 66, y, w: 6, h: 9 }],
      [{ str: letter, x: 115, y, w: 6, h: 9 }],
      ...category.split(' ').map((part, k) => [{ str: part, x: 224 + k * 30, y, w: 20, h: 9 }]),
    );
  });
  return page(lines);
}

const booklet = () => [...englishPages(), keyPage('English Scoring Key', [[1, 'C', 'KLA'], [2, 'J', 'POW']])];

test('reads an English question, its answer and its reporting category', () => {
  const { questions, warnings } = parseBooklet(booklet());
  assert.deepEqual(warnings, []);
  assert.equal(questions.length, 2);
  const [q] = questions;
  assert.equal(q.number, 1);
  assert.equal(q.section, 'ENG');
  assert.equal(q.domain, 'Knowledge of Language');
  assert.equal(q.skill, 'Knowledge of Language');
  assert.equal(q.answer, 'C');
  assert.equal(q.stem.needsImage, false);
  assert.deepEqual(q.stem.paragraphs, ['Which choice is clearest in context?']);
  assert.deepEqual(q.choices.map(c => c.letter), ['A', 'B', 'C', 'D']);
  assert.deepEqual(q.choices.map(c => c.paragraphs.join(' ')), [
    'No Change', 'water that had been thickened', 'sized water', 'water, thickened,',
  ]);
});

test('an even-numbered question is lettered F to J', () => {
  const q = parseBooklet(booklet()).questions[1];
  assert.deepEqual(q.choices.map(c => c.letter), ['F', 'G', 'H', 'J']);
  assert.equal(q.answer, 'J');
});

test('the passage is the left column, and excludes the numbers printed under the rules', () => {
  const [q] = parseBooklet(booklet()).questions;
  assert.equal(q.passage.text, `A Short History of Marbled Paper\n\n${PASSAGE_1} ${PASSAGE_2}`);
  assert.doesNotMatch(q.passage.text, /\bENGLISH TEST\b/);
});

test('an underline marks only the words the rule runs under, and those words are in the passage', () => {
  const [q] = parseBooklet(booklet()).questions;
  assert.deepEqual(q.passage.underline, ['floating pigment']);
  assert.ok(q.passage.text.includes(q.passage.underline[0]));
});

test('a question with no rule of its own has no underline', () => {
  const q = parseBooklet(booklet()).questions[1];
  assert.equal(q.passage.underline, null);
});

test('questions ACT does not score are left out, but still end the question above them', () => {
  // The key scores question 1 but not question 2, as it does for its field-test questions.
  const { questions, warnings } = parseBooklet([...englishPages(), keyPage('English Scoring Key', [[1, 'C', 'KLA']])]);
  assert.deepEqual(warnings, []);
  assert.deepEqual(questions.map(q => q.number), [1]);
  // Without question 2 as a boundary, question 1 would have run on and found eight answer choices.
  assert.deepEqual(questions[0].choices.map(c => c.letter), ['A', 'B', 'C', 'D']);
});

test('a drawing inside a choice makes that choice an image, leaving the others as text', () => {
  const [pages, last, key] = [...booklet()];
  // Choices sit 10pt apart and each region is padded, so they overlap slightly; this band belongs
  // to choice B alone.
  pages.boxes = [...pages.boxes, { x0: 354, y0: 435, x1: 420, y1: 438 }];
  const [q] = parseBooklet([pages, last, key]).questions;
  assert.deepEqual(q.choices.map(c => c.needsImage), [false, true, false, false]);
  assert.equal(q.choices[1].paragraphs, null);
  assert.ok(q.choices[1].spans.length);
});

// ---- science: the passage is tables and diagrams, so it travels as a picture ----

// A passage page: a heading, prose in both columns, and a table drawn between them.
const sciencePages = () => [
  page([[{ str: 'SCIENCE TEST', x: 262, y: 702, w: 88, h: 11 }], words(180, 660, 'DIRECTIONS: There are several passages in this test.')]),
  page([
    words(42, 542, 'Passage I'),
    words(42, 522, 'Two groups measured how quickly water drained'),
    words(42, 508, 'through three soils, shown in Table 1 below.'),
    words(336, 542, 'Table 2 lists the same soils by grain size, which'),
    words(336, 528, 'the groups measured with a set of sieves.'),
  ], [{ x0: 60, y0: 300, x1: 280, y1: 470 }]),
  page([
    words(48, 702, '1.'), words(60, 702, 'According to Table 1, which soil drained fastest?'),
    words(60, 678, 'A.'), words(78, 678, 'Sand'),
    words(60, 658, 'B.'), words(78, 658, 'Silt'),
    words(60, 638, 'C.'), words(78, 638, 'Clay'),
    words(60, 618, 'D.'), words(78, 618, 'They drained at the same rate'),
    words(48, 560, '2.'), words(60, 560, 'Based on Table 2, the largest grains were in which soil?'),
    words(60, 536, 'F.'), words(78, 536, 'Sand'),
    words(60, 516, 'G.'), words(78, 516, 'Silt'),
    words(60, 496, 'H.'), words(78, 496, 'Clay'),
    words(60, 476, 'J.'), words(78, 476, 'Cannot be determined'),
  ]),
  page([words(250, 400, 'END OF TEST 4')]),
  keyPage('Science Scoring Key', [[1, 'A', 'IOD'], [2, 'F', 'SIN']]),
];

test('a science question carries a picture of its passage, not the text of it', () => {
  const { questions, warnings } = parseBooklet(sciencePages());
  assert.deepEqual(warnings, []);
  assert.deepEqual(questions.map(q => q.number), [1, 2]);
  const [q] = questions;
  assert.equal(q.section, 'SCI');
  assert.equal(q.domain, 'Interpretation of Data');
  assert.equal(q.passage.text, null, 'tables and diagrams are not read as text');
  assert.ok(q.passage.spans.length >= 1, 'the passage is a picture');
  for (const span of q.passage.spans) {
    assert.equal(span.page, 1, 'cut from the passage page');
    assert.ok(span.top > span.bottom && span.top <= 555, 'starts at the passage heading and runs down the page');
  }
  assert.deepEqual(q.stem.paragraphs, ['According to Table 1, which soil drained fastest?']);
  assert.deepEqual(q.choices.map(c => c.paragraphs.join(' ')), ['Sand', 'Silt', 'Clay', 'They drained at the same rate']);
});

test('every question about one passage points at the same picture of it', () => {
  const [first, second] = parseBooklet(sciencePages()).questions;
  assert.equal(first.passage.id, second.passage.id);
  assert.deepEqual(first.passage.spans, second.passage.spans);
});

test('a PDF with no scoring key produces a clear warning rather than questions', () => {
  const { questions, warnings } = parseBooklet([page([words(42, 700, 'Weekly newsletter')])], 'news.pdf');
  assert.equal(questions.length, 0);
  assert.match(warnings[0], /news\.pdf: no scoring key found/);
});

test('an unrecognized reporting category is reported and that question skipped', () => {
  const { questions, warnings } = parseBooklet(
    [...englishPages(), keyPage('English Scoring Key', [[1, 'C', 'ZZZ'], [2, 'J', 'POW']])], 'odd.pdf');
  assert.deepEqual(questions.map(q => q.number), [2]);
  assert.match(warnings[0], /question 1 an unrecognized reporting category "ZZZ"/);
});

test('an answer letter the question cannot have is reported, not trusted', () => {
  const { warnings } = parseBooklet(
    [...englishPages(), keyPage('English Scoring Key', [[1, 'J', 'KLA']])], 'odd.pdf');
  assert.match(warnings[0], /question 1 the answer "J", which is not one of its letters/);
});

// ---- the real booklets, if any are present locally (exports/ is never committed) ----

const bookletsDir = fileURLToPath(new URL('../exports/act/', import.meta.url));
const samples = existsSync(bookletsDir) ? readdirSync(bookletsDir).filter(f => f.toLowerCase().endsWith('.pdf')) : [];

const SKILLS = new Set(ACT_DOMAINS.flatMap(d => d.skills.map(s => `${d.section}|${d.name}|${s.name}`)));

test('parses the local ACT booklets cleanly', { skip: samples.length ? false : 'no PDFs in exports/act/' }, async t => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  for (const file of samples) {
    const loading = pdfjs.getDocument({ data: new Uint8Array(readFileSync(join(bookletsDir, file))), verbosity: 0 });
    const doc = await loading.promise;
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) pages.push(await readPage(await doc.getPage(n), pdfjs.OPS));
    const { questions, warnings } = parseBooklet(pages, file);

    // A question that starts at the foot of a page keeps the rest of its choices on the next one, and this
    // reader works a page and a column at a time, so it is skipped by name rather than half-read. Nothing
    // else may go wrong silently.
    assert.deepEqual(warnings.filter(w => !/the rest are on the page after this one/.test(w)), [], `${file} produced warnings`);
    assert.ok(questions.length > 80, `${file} produced only ${questions.length} questions`);

    const seen = new Set();
    const tally = { text: 0, image: 0, underlined: 0 };
    for (const q of questions) {
      const at = `${file} ${q.section} ${q.number}`;
      assert.ok(!seen.has(`${q.section}|${q.number}`), `${at}: appears twice`);
      seen.add(`${q.section}|${q.number}`);
      assert.ok(SKILLS.has(`${q.section}|${q.domain}|${q.skill}`), `${at}: ${q.domain} / ${q.skill}`);
      assert.deepEqual(q.choices.map(c => c.letter), q.number % 2 ? ['A', 'B', 'C', 'D'] : ['F', 'G', 'H', 'J'], `${at}: choices`);
      assert.ok(q.choices.some(c => c.letter === q.answer), `${at}: answer ${q.answer} is not a choice`);
      assert.ok(q.original.spans.length, `${at}: no printed region`);

      // English and reading passages are prose; a science passage is a picture of its page.
      if (q.section === 'ENG' || q.section === 'READ') assert.ok(q.passage?.text.length > 200, `${at}: passage is missing or too short`);
      if (q.section === 'SCI') {
        assert.ok(q.passage?.spans.length, `${at}: the picture of its passage is missing`);
        assert.ok(q.passage.spans.every(s => s.top - s.bottom > 40), `${at}: the picture of its passage is a sliver`);
      }
      if (q.passage?.underline) {
        tally.underlined++;
        assert.ok(q.passage.text.includes(q.passage.underline[0]),
          `${at}: underlined "${q.passage.underline[0]}" is not in its passage`);
      }
      for (const part of [q.stem, ...q.choices]) {
        assert.ok(part.spans.length, `${at}: part has no area`);
        tally[part.needsImage ? 'image' : 'text']++;
        for (const p of part.paragraphs || []) {
          // A fraction bar or radical read as text leaves an underscore or a stranded operator
          // behind, and page furniture leaves the words below.
          assert.doesNotMatch(p, /[_‾]|\s{2}|GO ON TO|©/, `${at}: text looks incomplete: "${p}"`);
        }
      }
    }
    t.diagnostic(`${file}: ${questions.length} questions; ${tally.text} text parts, ${tally.image} image parts, ${tally.underlined} underlined`);
    await loading.destroy();
  }
});
