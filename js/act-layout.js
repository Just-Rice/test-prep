// Parses ACT practice test booklets into questions. These are the free PDFs ACT publishes itself —
// "Preparing for the ACT Test" and the practice forms that share its design — which the student
// downloads and drops into exports/act/. Nothing here fetches anything.
//
// A booklet is laid out quite differently from a College Board export. There is no per-question
// metadata block: the booklet prints the questions, and a scoring key at the back gives every
// question's correct letter and its reporting category. So the key is read first, and each question
// is then matched to it by number.
//
// The page geometry that matters:
//   * English and Reading, and the Science passages, are set in two columns. The gutter is found per
//     page rather than assumed, because the columns are not in the same place in every section.
//   * English prints the passage in the left column and the questions in the right. The part of the
//     passage a question asks about is underlined with a drawn rule, and the question's number is
//     printed just below that rule — which is how an underline is matched to its question here.
//   * Math prints one column of questions with a "DO YOUR FIGURING HERE" scratch column beside it,
//     which is discarded.
//   * Reading and Science alternate: a passage page, then a page of questions about it.
//
// Anything drawn rather than typed — figures, graphs, tables, stacked fractions and radicals — has no
// text behind it, so those regions are marked to be cut from the page as images, exactly as the
// College Board reader does. Input is page layout from cb-pdf.js; nothing here touches PDF.js or the
// DOM, so it runs in Node tests.

import { ACT_DOMAINS } from './taxonomy-act.js';

const SECTION_TITLES = [
  { section: 'ENG', title: 'ENGLISH TEST' },
  { section: 'MATH', title: 'MATHEMATICS TEST' },
  { section: 'READ', title: 'READING TEST' },
  { section: 'SCI', title: 'SCIENCE TEST' },
];
const KEY_SECTIONS = { English: 'ENG', Mathematics: 'MATH', Reading: 'READ', Science: 'SCI' };

// Odd-numbered questions are lettered A-E, even-numbered ones F-K, so a letter also checks that a
// question was matched to the right row of the key.
const ODD_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const EVEN_LETTERS = ['F', 'G', 'H', 'J', 'K'];
const lettersFor = number => (number % 2 ? ODD_LETTERS : EVEN_LETTERS);
const CHOICES = 4;   // the enhanced ACT offers four answers to every question, in all four sections

const WORD_GAP = 1.6;            // pieces of one word sit within this; a space is 2.25pt or wider
const ROW_TOLERANCE = 2;         // words on one baseline vary by this much
const GUTTER_SEARCH = [280, 340];// the column gutter always falls inside this band
const COLUMN_MIN = 8;            // tokens each side before a page counts as two columns
const UNDERLINE_DROP = 3.5;      // a rule is drawn this far below the baseline it underlines
const MARKER_DROP = 12;          // the question number sits within this far below its rule
const TIGHT_LINES = 8.5;         // lines closer than this are stacked math, not prose
const QUESTION_GAP = 26;         // questions stand this much further apart than their own lines do
const PARAGRAPH_GAP = 16;        // English passage lines are 20pt apart; Reading prose is tighter
const PAD = 3;

const SKILLS = new Map();
for (const domain of ACT_DOMAINS) {
  for (const skill of domain.skills) {
    SKILLS.set(`${domain.section}:${skill.code}`, { domain: domain.name, skill: skill.name });
  }
}

export function parseBooklet(pages, sourceName = 'booklet') {
  const warnings = [];
  const sheets = pages.map((page, index) => buildSheet(page, index));
  const keys = readScoringKeys(sheets, warnings, sourceName);
  const questions = [];

  if (!Object.keys(keys).length) {
    warnings.push(`${sourceName}: no scoring key found. Is this an ACT practice test booklet, including its answer key?`);
    return { questions, warnings };
  }

  for (const { section, title } of SECTION_TITLES) {
    const range = findSection(sheets, title);
    if (!range) continue;
    // Science prints its passage as figures, tables and graphs interleaved with the questions about
    // them, with no reliable boundary between one passage and the next. Reading those as text
    // produces questions attached to the wrong data, which is worse than not having them, so the
    // section is left out until its figures can be cut out as images.
    if (section === 'SCI') {
      warnings.push(`${sourceName}: the science test was skipped. Its questions depend on figures and tables that this reader cannot cut out yet.`);
      continue;
    }
    if (!keys[section]) {
      warnings.push(`${sourceName}: the ${title.toLowerCase()} has no scoring key, so its questions were skipped.`);
      continue;
    }
    try {
      questions.push(...readSection({ sheets, range, section, key: keys[section], sourceName, warnings }));
    } catch (err) {
      warnings.push(`${sourceName}: could not read the ${title.toLowerCase()} (${err.message}).`);
    }
  }
  if (!questions.length && !warnings.length) warnings.push(`${sourceName}: no questions found.`);
  return { questions, warnings };
}

// ---------- lines and columns ----------

function buildSheet(page, index) {
  const rows = [];
  for (const word of page.words) {
    let row = rows.find(r => Math.abs(r.y - word.y) <= ROW_TOLERANCE);
    if (!row) rows.push(row = { y: word.y, words: [] });
    row.words.push(word);
  }
  const lines = rows.sort((a, b) => b.y - a.y).map(row => {
    const tokens = [];
    for (const word of row.words.sort((a, b) => a.x - b.x)) {
      const last = tokens[tokens.length - 1];
      if (last && word.x - last.xEnd <= WORD_GAP) {
        last.text += word.str;
        last.xEnd = Math.max(last.xEnd, word.x + word.w);
      } else {
        tokens.push({ text: word.str, x: word.x, xEnd: word.x + word.w });
      }
    }
    const h = Math.max(6, ...row.words.map(w => w.h));
    // The words are kept alongside the merged tokens because an underline can cover part of a line,
    // and often part of a single word, so marking one up needs finer positions than tokens carry.
    return { page: index, y: row.y, top: row.y + h, words: row.words, tokens: tokens.filter(t => t.text.trim()) };
  }).filter(l => l.tokens.length);
  return { page: index, view: [...page.view], boxes: page.boxes, lines, gutter: findGutter(lines) };
}

// The x where a two-column page divides, or null for a single column: the position that the fewest
// pieces of text cross. Looking for a blank band instead would fail on most pages that have one,
// because the section headings ("ENGLISH TEST", "35 Minutes—50 Questions") are centred across it.
function findGutter(lines) {
  const tokens = lines.flatMap(l => l.tokens);
  let best = null;
  for (let x = GUTTER_SEARCH[0]; x <= GUTTER_SEARCH[1]; x++) {
    let straddling = 0;
    let leftOf = 0;
    let rightOf = 0;
    for (const token of tokens) {
      if (token.x < x && token.xEnd > x) straddling++;
      else if (token.xEnd <= x) leftOf++;
      else rightOf++;
    }
    if (leftOf < COLUMN_MIN || rightOf < COLUMN_MIN) continue;
    if (!best || straddling < best.straddling) best = { x, straddling };
  }
  return best ? best.x : null;
}

// Printing that belongs to the page rather than to any question. Left in, it ends up read as the
// tail of whichever question sits last on the page.
const FURNITURE = [
  /^GO ON TO THE NEXT PAGE\.?$/i,
  /^©\s*\d{4}\s+by ACT/i,
  /^END OF TEST\b/i,
  /^(DO NOT RETURN|STOP!)/i,
  /^DO YOUR FIGURING HERE\.?$/i,
];
const isFurniture = (line, view) =>
  FURNITURE.some(re => re.test(textOf(line)))
  || (line.y > view[3] - 80 && /^\d( \d)*$/.test(textOf(line)));   // the running section number

// Lines of one column, in reading order. A line that straddles the gutter (a heading spanning the
// page) is kept with the left column only, so it is never read twice.
function column(sheet, side) {
  const lines = sheet.lines.filter(l => !isFurniture(l, sheet.view));
  if (sheet.gutter === null) return side === 'left' ? lines : [];
  return lines
    .map(line => ({ ...line, tokens: line.tokens.filter(t => (side === 'left' ? t.x < sheet.gutter : t.x >= sheet.gutter)) }))
    .filter(l => l.tokens.length);
}

const columnsOf = sheet => (sheet.gutter === null ? [column(sheet, 'left')] : [column(sheet, 'left'), column(sheet, 'right')]);

const textOf = line => line.tokens.map(t => t.text).join(' ').replace(/\s+/g, ' ').trim();

// ---------- the scoring key ----------

function readScoringKeys(sheets, warnings, sourceName) {
  const keys = {};
  for (const sheet of sheets) {
    // In some booklets this heading shares a baseline with the one beside it, so it is matched
    // anywhere in the line rather than at the end of it.
    const heading = sheet.lines.map(l => /(English|Mathematics|Reading|Science) Scoring Key/.exec(textOf(l))).find(Boolean);
    if (!heading) continue;
    const name = heading[1];
    const section = KEY_SECTIONS[name];
    if (!section || keys[section]) continue;
    const gutter = sheet.gutter ?? 300;
    const key = new Map();
    for (const line of sheet.lines) {
      // The key's rows sit in the left column; the scale-score table beside them shares their
      // baselines, so anything past the gutter is dropped before the row is read.
      const row = line.tokens.filter(t => t.x < gutter).map(t => t.text).join('').replace(/\s+/g, '');
      const match = /^(\d{1,3})([A-K])(.+)$/.exec(row);
      if (!match) continue;
      const [, number, letter, rest] = match;
      if (/^NotScored/i.test(rest)) continue;   // field-test questions, which ACT does not score
      const code = rest.replace(/[^A-Z]/gi, '').toUpperCase();
      const skill = SKILLS.get(`${section}:${code}`);
      if (!skill) {
        warnings.push(`${sourceName}: the ${name.toLowerCase()} key gives question ${number} an unrecognized reporting category "${code}".`);
        continue;
      }
      if (!lettersFor(Number(number)).includes(letter)) {
        warnings.push(`${sourceName}: the ${name.toLowerCase()} key gives question ${number} the answer "${letter}", which is not one of its letters.`);
        continue;
      }
      key.set(Number(number), { letter, ...skill });
    }
    if (key.size) keys[section] = key;
  }
  return keys;
}

// ---------- sections ----------

function findSection(sheets, title) {
  const start = sheets.findIndex(s => s.lines.some(l => textOf(l) === title));
  if (start < 0) return null;
  const end = sheets.findIndex((s, i) => i >= start && s.lines.some(l => /^END OF TEST \d/.test(textOf(l))));
  return { start, end: end < 0 ? sheets.length - 1 : end };
}

// ---------- questions ----------

const questionStart = (line, left) => {
  const first = line.tokens[0];
  const match = /^(\d{1,3})\.(.*)$/.exec(first.text);
  return match && first.x <= left + 20 ? { number: Number(match[1]), rest: match[2] } : null;
};

// A line holding nothing but a fraction bar or the arm of a radical.
const isBar = line => /^[_—–‾-]+$/.test(textOf(line));

const choiceStart = line => {
  const match = /^([A-K])\.(.*)$/.exec(line.tokens[0].text);
  return match ? { letter: match[1], rest: match[2] } : null;
};

// Where a question stops. The last question in a column has no question below it to bound it, and a
// question whose neighbour went unrecognised has none either, so its last answer choice would
// otherwise run to the foot of the page and take whatever is printed there with it. Once the answer
// choices have started, a gap much wider than the question's own line spacing ends it.
function trimToQuestion(lines) {
  // Only once every choice has been seen, because a choice drawn as a graph stands well clear of the
  // one before it, and cutting at that gap would throw the rest of the choices away.
  const choices = lines.flatMap((line, i) => (i > 0 && choiceStart(line) ? [i] : []));
  if (choices.length < CHOICES) return lines;
  for (let i = choices[CHOICES - 1] + 1; i < lines.length; i++) {
    if (lines[i - 1].y - lines[i].y > QUESTION_GAP) return lines.slice(0, i);
  }
  return lines;
}

// Where each question in a column begins. A figure's own labelling can look like a question number,
// so a start only counts if the numbers keep climbing and answer choices actually follow it.
// Questions ACT does not score are still boundaries here, or the question above one would swallow
// it; they are dropped later, when the scoring key turns out to have no row for them.
function questionStarts(lines, left) {
  const candidates = [];
  for (const [index, line] of lines.entries()) {
    const start = questionStart(line, left);
    if (!start) continue;
    if (candidates.length && start.number <= candidates[candidates.length - 1].number) continue;
    candidates.push({ index, number: start.number });
  }
  // Answer choices following a number confirm it is a question. A question whose choices are all
  // drawn has none to find, though, so a number that simply continues the numbering counts too —
  // otherwise the question above it would swallow it whole.
  const hasChoices = (from, to) => trimToQuestion(lines.slice(from, to)).slice(1).filter(choiceStart).length >= 2;
  const kept = [];
  for (const [k, c] of candidates.entries()) {
    const consecutive = kept.length && c.number === kept[kept.length - 1].number + 1;
    if (hasChoices(c.index, candidates[k + 1]?.index ?? lines.length) || consecutive) kept.push(c);
  }
  return kept;
}

function readSection({ sheets, range, section, key, sourceName, warnings }) {
  const questions = [];
  const passages = section === 'ENG' ? englishPassages(sheets, range) : proseFirstPassages(sheets, range, section);

  for (let p = range.start; p <= range.end; p++) {
    const sheet = sheets[p];
    for (const lines of columnsOf(sheet)) {
      if (!lines.length) continue;
      // Math's scratch column and the Reading passage columns hold no questions; a column is only
      // read if something in it is numbered like a question.
      const left = Math.min(...lines.map(l => l.tokens[0].x));
      const starts = questionStarts(lines, left);
      if (!starts.length) continue;
      starts.forEach(({ index: startIdx, number }, k) => {
        const endIdx = starts[k + 1]?.index ?? lines.length;
        const entry = key.get(number);
        if (!entry) return;   // a question ACT does not score, or a number that is not a question
        try {
          questions.push(buildQuestion({
            sheet, lines: trimToQuestion(lines.slice(startIdx, endIdx)), number, entry, section,
            passage: passageFor(passages, sheet.page, lines[startIdx].y),
          }));
        } catch (err) {
          warnings.push(`${sourceName}: skipped ${section} question ${number}: ${err.message}`);
        }
      });
    }
  }

  const seen = new Set();
  return questions.filter(q => !seen.has(q.number) && seen.add(q.number)).sort((a, b) => a.number - b.number);
}

function buildQuestion({ sheet, lines, number, entry, section, passage }) {
  const left = Math.min(...lines.map(l => l.tokens[0].x));
  const right = columnRight(sheet, lines);
  const choiceIdx = lines.flatMap((line, i) => (i > 0 && choiceStart(line) ? [i] : []));
  if (!choiceIdx.length) throw new Error('no answer choices found');
  // A fraction bar or radical is drawn on its own line above the line carrying the choice letter, so
  // each choice starts at the first of those bars rather than at its letter. Otherwise the bar is
  // read as the tail of the choice above, which then looks like stacked maths while the choice it
  // belongs to looks like plain text.
  const starts = choiceIdx.map((i, k) => {
    const floor = k ? choiceIdx[k - 1] + 1 : 1;
    let from = i;
    while (from > floor && (isBar(lines[from - 1]) || lines[from - 1].y - lines[from].y < TIGHT_LINES)) from--;
    return from;
  });

  const letters = lettersFor(number);
  const found = choiceIdx.map(i => choiceStart(lines[i]).letter);
  const wanted = letters.slice(0, found.length);
  if (found.join('') !== wanted.join('')) {
    throw new Error(`answer choices read as ${found.join('')} but should be ${letters.slice(0, 4).join('')}`);
  }
  if (!found.includes(entry.letter)) throw new Error(`the key's answer "${entry.letter}" is not among its choices`);

  const stem = region(sheet, lines.slice(0, starts[0]), left, right, { strip: /^\d{1,3}\.\s*/ });
  if (stem.empty) throw new Error('the question text is empty');

  const choices = choiceIdx.map((i, k) => {
    const end = starts[k + 1] ?? lines.length;
    const part = region(sheet, lines.slice(starts[k], end), lines[i].tokens[0].x, right, { strip: /^[A-K]\.\s*/ });
    if (part.empty) throw new Error(`answer choice ${found[k]} is empty`);
    return { letter: found[k], ...part };
  });

  return {
    number, section, domain: entry.domain, skill: entry.skill, answer: entry.letter,
    stem, choices,
    passage: passage ? { text: passage.text, underline: underlineFor(passage, number) } : null,
    // The question exactly as the booklet prints it, kept so a student can check anything the text
    // above lost against the page it came from.
    original: { spans: spansBetween(sheet, lines[0].top + PAD, lines[lines.length - 1].y - PAD, left - 2, right) },
  };
}

// The right edge of the column a question sits in: the gutter when the page has two columns, else
// the page's own margin.
function columnRight(sheet, lines) {
  const widest = Math.max(...lines.flatMap(l => l.tokens.map(t => t.xEnd)));
  if (sheet.gutter !== null && widest < sheet.gutter) return sheet.gutter - 2;
  return sheet.view[2] - 36;
}

// ---------- regions: text where it is text, an image where it is drawn ----------

function spansBetween(sheet, top, bottom, left, right) {
  return [{ page: sheet.page, left, right, top, bottom }].filter(s => s.top > s.bottom);
}

const overlaps = (b, s) => b.x1 > s.left + 0.5 && b.x0 < s.right - 0.5 && b.y1 > s.bottom + 0.5 && b.y0 < s.top - 0.5;

// A rule drawn under the passage is an underline, not a picture; it must not force an image.
const isRule = box => box.y1 - box.y0 < 1.2;

function region(sheet, lines, left, right, { strip } = {}) {
  if (!lines.length) return { spans: [], needsImage: false, empty: true, paragraphs: null };
  const top = lines[0].top + PAD;
  const bottom = lines[lines.length - 1].y - PAD;
  const spans = spansBetween(sheet, top, bottom, left - 2, right);
  const graphics = sheet.boxes.some(b => !isRule(b) && spans.some(s => overlaps(b, s)));
  // Stacked fractions and radicals are typeset as several tightly spaced lines rather than prose,
  // and the bar between a fraction's halves is a line of its own.
  const stacked = lines.some(isBar) || lines.some((line, i) => i > 0 && lines[i - 1].y - line.y < TIGHT_LINES);
  const needsImage = graphics || stacked;
  return {
    spans, needsImage, empty: false,
    paragraphs: needsImage ? null : paragraphs(lines, strip),
  };
}

function paragraphs(lines, strip) {
  const out = [];
  let prev = null;
  for (const line of lines) {
    let text = textOf(line);
    if (!prev && strip) text = text.replace(strip, '');
    if (!text) continue;
    if (!prev || prev.y - line.y > PARAGRAPH_GAP) out.push(text);
    else out[out.length - 1] += /-$/.test(out[out.length - 1]) ? text.replace(/^-/, '') : ` ${text}`;
    prev = line;
  }
  // ACT justifies its prose, so a word broken across lines keeps its hyphen; join those back up.
  return out.map(p => p.replace(/(\w)-\s(\w)/g, '$1$2').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// ---------- passages ----------

const ROMAN = /^PASSAGE\s+([IVX]+)/i;

// English prints its passages in the left column, interleaved with the questions about them.
function englishPassages(sheets, range) {
  const found = [];
  for (let p = range.start; p <= range.end; p++) {
    const sheet = sheets[p];
    const lines = column(sheet, 'left');
    const headingIdx = lines.findIndex(l => ROMAN.test(textOf(l)));
    const from = headingIdx < 0 ? 0 : headingIdx + 1;
    if (headingIdx >= 0 || found.length) {
      if (headingIdx >= 0) found.push({ pages: [], rules: [] });
      const current = found[found.length - 1];
      if (!current) continue;
      current.pages.push({ sheet, lines: lines.slice(from) });
      current.rules.push(...underlinesOn(sheet, lines));
      current.start ??= { page: sheet.page, y: lines[from]?.top ?? sheet.view[3] };
    }
  }
  return found.map(passage => ({
    start: passage.start,
    rules: passage.rules,
    text: passage.pages.flatMap(({ lines }) => lines)
      .filter(l => !/^\d{1,3}$/.test(textOf(l)))   // the small numbers printed under the rules
      .reduce((acc, line, i, all) => {
        const prev = all[i - 1];
        const text = textOf(line);
        if (!prev || line.tokens[0].x > Math.min(...all.map(l => l.tokens[0].x)) + 8) acc.push(text);
        else acc[acc.length - 1] += ` ${text}`;
        return acc;
      }, [])
      .join('\n\n').replace(/(\w)-\s(\w)/g, '$1$2').replace(/[ \t]+/g, ' ').trim(),
  }));
}

// Reading and Science print a passage, then the questions about it on the pages that follow.
function proseFirstPassages(sheets, range, section) {
  const found = [];
  for (let p = range.start; p <= range.end; p++) {
    const sheet = sheets[p];
    const heading = sheet.lines.find(l => /^Passage\s+[IVX]+/i.test(textOf(l)));
    if (!heading) continue;
    found.push({
      start: { page: sheet.page, y: heading.top },
      rules: [],
      // The passage runs from its own heading down through both columns. Starting at the heading is
      // what leaves the test's directions out: they are printed above it on the first passage page.
      // The previous passage's last question or two often spill onto the foot of a column here, so
      // each column also stops where its first question begins.
      text: columnsOf(sheet).flatMap(lines => {
        const above = lines.filter(l => l.y <= heading.y);
        const left = above.length ? Math.min(...above.map(l => l.tokens[0].x)) : 0;
        const question = questionStarts(above, left)[0];
        return question ? above.slice(0, question.index) : above;
      })
        .map(l => textOf(l).replace(/^\d{1,3}(?=[A-Z"'“])/, ''))   // line numbers printed in the margin
        .filter(text => text && !/^\d+$/.test(text))
        .join(' ').replace(/(\w)-\s(\w)/g, '$1$2').replace(/\s+/g, ' ').trim(),
    });
  }
  return found;
}

function passageFor(passages, page, y) {
  let current = null;
  for (const passage of passages) {
    if (passage.start.page < page || (passage.start.page === page && passage.start.y >= y)) current = passage;
  }
  return current ?? passages[0] ?? null;
}

// An English question's underlined words: the rule drawn under them carries the question's number
// just below it, so the number identifies which rule belongs to which question.
function underlinesOn(sheet, lines) {
  const rules = [];
  for (const box of sheet.boxes) {
    if (!isRule(box)) continue;
    if (sheet.gutter !== null && box.x0 >= sheet.gutter) continue;
    const marker = lines.find(l => l.y < box.y0 && l.y > box.y0 - MARKER_DROP
      && l.tokens.some(t => /^\d{1,3}$/.test(t.text) && t.x >= box.x0 - 6 && t.xEnd <= box.x1 + 6));
    const number = marker && Number(marker.tokens.find(t => /^\d{1,3}$/.test(t.text)).text);
    const line = lines.find(l => Math.abs(l.y - (box.y0 + UNDERLINE_DROP)) <= ROW_TOLERANCE);
    if (!line) continue;
    const text = textUnder(line, box.x0, box.x1);
    if (text) rules.push({ number: number || null, text });
  }
  // A rule that wrapped onto a second line has no number under its first part; it belongs to the
  // numbered rule that follows it.
  const out = [];
  let pending = [];
  for (const rule of rules) {
    pending.push(rule.text);
    if (rule.number) {
      out.push({ number: rule.number, text: pending.join(' ') });
      pending = [];
    }
  }
  return out;
}

// The words of one line that a rule runs beneath. A rule usually starts or stops partway through a
// word, because the underlined portion is a phrase rather than whole words as the typesetter set
// them, so a word the rule only partly covers is cut at the character the rule reaches.
function textUnder(line, x0, x1) {
  let out = '';
  let previous = null;
  for (const word of [...line.words].sort((a, b) => a.x - b.x)) {
    const end = word.x + word.w;
    if (end <= x0 + 1 || word.x >= x1 - 1) continue;
    let str = word.str;
    if (word.x < x0 - 0.5 || end > x1 + 0.5) {
      const perChar = word.w / Math.max(1, str.length);
      let from = Math.min(str.length, Math.max(0, Math.round((x0 - word.x) / perChar)));
      let to = Math.max(from, Math.min(str.length, Math.round((x1 - word.x) / perChar)));
      // Character positions are estimated from the word's average width, so a proportional font
      // lands a character or so out. ACT underlines whole words, so each end is nudged out to the
      // nearest space; a cut that already sits on one stays put.
      while (from > 0 && !/\s/.test(str[from - 1]) && !/\s/.test(str[from] ?? ' ')) from--;
      while (to < str.length && !/\s/.test(str[to - 1] ?? ' ') && !/\s/.test(str[to])) to++;
      str = str.slice(from, to);
    }
    if (previous && word.x - previous > WORD_GAP && !/\s$/.test(out) && !/^\s/.test(str)) out += ' ';
    out += str;
    previous = end;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const underlineFor = (passage, number) => {
  const rule = passage.rules?.find(r => r.number === number);
  return rule ? [rule.text] : null;
};
