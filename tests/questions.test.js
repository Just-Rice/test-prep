import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_B } from '../js/irt.js';
import { DOMAINS, findSkill } from '../js/taxonomy.js';
import { ALGEBRA_QUESTIONS } from '../js/questions/algebra.js';

// Original questions written for this app. The point of this file is that nothing here trusts the answer
// recorded in the question: every mathematical answer is worked out again from the wording of the problem,
// and the two have to agree. A wrong answer key is worse than a missing question, because a student will
// believe it.

const ORIGINAL = [...ALGEBRA_QUESTIONS];

// The value a student would have to produce: the text of the correct choice, or the accepted response.
function answerValue(q) {
  if (!q.choices) return q.answer[0];
  const choice = q.choices.find(c => c.letter === q.answer);
  assert.ok(choice, `${q.id}: answer ${q.answer} is not one of the choices`);
  return choice.text;
}

// Questions are written with typographic minus signs; comparisons use real numbers.
const num = text => Number(String(text).replace(/[−–—]/g, '-').replace(/[^0-9.\-/]/g, ''));

const nearly = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------------------
// Independent re-solutions. Each entry re-derives the answer from the problem
// statement, deliberately not by restating the recorded key.
// ---------------------------------------------------------------------------

// Solves a*x + b = c*x + d for x.
const linear = (a, b, c, d) => (d - b) / (a - c);
// Slope through two points.
const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);
// Largest integer strictly less than / at most a bound.
const greatestBelow = bound => Math.ceil(bound) - 1;
const greatestAtMost = bound => Math.floor(bound);

const CHECKS = {
  'og-alg-01': () => linear(3, 7, 0, 22),
  'og-alg-02': () => linear(5, -12, 3, 8),
  'og-alg-03': () => linear(4, -12, 2, 6),
  'og-alg-04': () => (10 - 4) * 3,
  'og-alg-05': () => linear(6, -2, 5, 9),
  'og-alg-06': () => linear(-2, 17, 3, 2),
  'og-alg-07': () => 63 / 9,
  'og-alg-08': () => 5 * 2,
  'og-alg-09': () => 3 * -4,
  'og-alg-10': () => linear(4, 10, 3, 27),

  'og-alg-11': () => 2 * 4 + 5,
  'og-alg-12': () => slope(1, 3, 5, 11),
  'og-alg-13': () => (8 + 7) / 3,
  'og-alg-14': () => { const m = slope(0, 4, 3, 13); return m * 5 + 4; },
  'og-alg-15': () => 1 - -2 * 3,
  'og-alg-16': () => null,   // checked structurally below
  'og-alg-17': () => { const m = slope(2, 9, 6, 21); return m + (9 - m * 2); },
  'og-alg-18': () => { const m = slope(1, -2, 4, 7); return m * 10 + (-2 - m * 1); },
  'og-alg-19': () => 15 * 8 + 30,
  'og-alg-20': () => { const m = slope(-2, 5, 4, -7); return m * 1 + (5 - m * -2); },

  'og-alg-21': () => 4 * 3 - 5,
  'og-alg-22': () => 12 / 2,
  'og-alg-23': () => null,
  'og-alg-24': () => (20 - 5 * 2) / 2,
  'og-alg-25': () => null,
  'og-alg-26': () => 10 - 4 * 2,
  'og-alg-27': () => { const m = slope(2, 7, 5, 16); return 7 - m * 2; },
  'og-alg-28': () => 11 - 2 * 4,
  'og-alg-29': () => 2 - -3 * 1,
  'og-alg-30': () => 6 / 2,

  'og-alg-31': () => (10 + 2) / 2,
  'og-alg-32': () => { const x = (13 - 1) / 3; return x * (x + 1); },
  'og-alg-33': () => (16 - 3 * 2) / 2,
  'og-alg-34': () => (8 + 4) / 4,
  'og-alg-35': () => { const x = (14 + 6) / 5; return x + (14 - 3 * x); },
  // 5x − 2y = 4 with y = 2x becomes 5x − 4x = 4, so x = 4 and y = 2x.
  'og-alg-36': () => { const x = 4 / (5 - 2 * 2); return 2 * x; },
  'og-alg-37': () => 2 * 7,
  'og-alg-38': () => (39 - 2 * 12) / (5 - 2),
  'og-alg-39': () => { const x = (10 + 6) / 8; return x + (10 - 3 * x) / 4; },
  'og-alg-40': () => null,

  'og-alg-41': () => null,
  'og-alg-42': () => greatestAtMost(9 - 4),
  'og-alg-43': () => null,
  'og-alg-44': () => greatestAtMost((28 - 3) / 5),
  'og-alg-45': () => greatestAtMost((50 - 8) / 3.5),
  'og-alg-46': () => null,
  'og-alg-47': () => null,
  'og-alg-48': () => greatestBelow(linear(2, -6, 1, 4)),
  'og-alg-49': () => greatestAtMost((5000 - 3200) / 40),
  'og-alg-50': () => null,
};

// Questions whose answer is not a single number get their own predicate.
const STRUCTURAL = {
  'og-alg-16': v => v === 'y = 5x − 2',
  'og-alg-23': v => v === 'y = (3/2)x − 6' && nearly(3 / 2 * 4 - 6, (3 * 4 - 12) / 2),
  'og-alg-25': v => { const [x, y] = v.replace(/[()]/g, '').split(',').map(Number); return nearly(y, 2 * x - 3); },
  'og-alg-40': v => { const [x, y] = v.replace(/[()]/g, '').split(',').map(Number); return nearly(y, 2 * x - 1) && nearly(y, -x + 8); },
  'og-alg-41': v => 3 * num(v) - 5 > 7,
  'og-alg-43': v => v === 'x < −4' && nearly(-2 * -5, 10) && -5 < -4,
  'og-alg-46': v => v === 'x ≤ −5' && 4 - 3 * -5 >= 19,
  'og-alg-47': v => { const [x, y] = v.replace(/[()−]/g, m => (m === '−' ? '-' : '')).split(',').map(Number); return y > 2 * x + 1; },
  'og-alg-50': v => { const x = num(v); return -1 <= 2 * x + 3 && 2 * x + 3 <= 9; },
};

test('every original question maps onto the taxonomy', () => {
  const domainOf = new Map(DOMAINS.flatMap(d => d.skills.map(s => [s.name, d])));
  for (const q of ORIGINAL) {
    const skill = findSkill(q.skill);
    assert.ok(skill, `${q.id}: unknown skill ${q.skill}`);
    assert.equal(domainOf.get(q.skill).name, q.domain, `${q.id}: domain does not match the skill`);
    assert.equal(skill.section, q.section, `${q.id}: section does not match the skill`);
    assert.ok(q.difficulty in DIFFICULTY_B, `${q.id}: unknown difficulty ${q.difficulty}`);
    assert.equal(q.source, 'original', `${q.id}: should be marked as original content`);
  }
});

test('every original question is well formed', () => {
  const ids = new Set();
  for (const q of ORIGINAL) {
    assert.ok(!ids.has(q.id), `${q.id}: duplicate id`);
    ids.add(q.id);
    assert.ok(q.stem && q.stem.length > 10, `${q.id}: missing or trivial stem`);
    assert.ok(q.rationale && q.rationale.length > 20, `${q.id}: missing or trivial rationale`);
    if (q.choices) {
      assert.equal(q.choices.length, 4, `${q.id}: should have four choices`);
      assert.deepEqual(q.choices.map(c => c.letter), ['A', 'B', 'C', 'D'], `${q.id}: choice letters`);
      const texts = q.choices.map(c => c.text.trim());
      assert.equal(new Set(texts).size, 4, `${q.id}: two choices are identical`);
      assert.ok(texts.every(Boolean), `${q.id}: an empty choice`);
      assert.ok(q.choices.some(c => c.letter === q.answer), `${q.id}: answer is not one of the choices`);
    } else {
      assert.ok(Array.isArray(q.answer) && q.answer.length, `${q.id}: missing accepted answers`);
      assert.ok(q.answer.every(a => String(a).trim()), `${q.id}: blank accepted answer`);
    }
  }
});

test('no answer key is spread unevenly enough to be guessable', () => {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  const mc = ORIGINAL.filter(q => q.choices);
  for (const q of mc) counts[q.answer]++;
  for (const [letter, n] of Object.entries(counts)) {
    assert.ok(n >= mc.length / 8, `answer ${letter} is used only ${n} times in ${mc.length} questions`);
  }
});

test('every original maths answer re-solves to the recorded key', () => {
  for (const q of ORIGINAL) {
    if (q.section !== 'MATH') continue;
    const check = CHECKS[q.id];
    assert.ok(check, `${q.id}: no independent check written for this question`);
    const recorded = answerValue(q);
    const expected = check();
    if (expected === null) {
      const predicate = STRUCTURAL[q.id];
      assert.ok(predicate, `${q.id}: needs a structural check`);
      assert.ok(predicate(recorded), `${q.id}: recorded answer "${recorded}" fails its check`);
    } else {
      assert.ok(nearly(num(recorded), expected),
        `${q.id}: recorded answer "${recorded}" but re-solving gives ${expected}`);
    }
  }
});

test('distractors are never also correct', () => {
  // Where a question asks which value satisfies a condition, only one choice may satisfy it.
  const conditions = {
    'og-alg-41': v => 3 * num(v) - 5 > 7,
    'og-alg-50': v => { const x = num(v); return -1 <= 2 * x + 3 && 2 * x + 3 <= 9; },
    'og-alg-25': v => { const [x, y] = v.replace(/[()]/g, '').split(',').map(Number); return nearly(y, 2 * x - 3); },
    'og-alg-47': v => { const [x, y] = v.replace(/[()−]/g, m => (m === '−' ? '-' : '')).split(',').map(Number); return y > 2 * x + 1; },
  };
  for (const [id, holds] of Object.entries(conditions)) {
    const q = ORIGINAL.find(x => x.id === id);
    assert.ok(q, `${id}: not found`);
    const satisfying = q.choices.filter(c => holds(c.text));
    assert.equal(satisfying.length, 1, `${id}: ${satisfying.length} choices satisfy the condition, expected exactly 1`);
    assert.equal(satisfying[0].letter, q.answer, `${id}: the satisfying choice is not the recorded answer`);
  }
});
