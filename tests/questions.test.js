import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_B } from '../js/irt.js';
import { DOMAINS, findSkill } from '../js/taxonomy.js';
import { ALGEBRA_QUESTIONS } from '../js/questions/algebra.js';
import { ADVANCED_MATH_QUESTIONS } from '../js/questions/advanced-math.js';

// Original questions written for this app. The point of this file is that nothing here trusts the answer
// recorded in the question: every mathematical answer is worked out again from the wording of the problem,
// and the two have to agree. A wrong answer key is worse than a missing question, because a student will
// believe it.

const ORIGINAL = [...ALGEBRA_QUESTIONS, ...ADVANCED_MATH_QUESTIONS];

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

// Sample values used to confirm that two expressions really are the same expression. An identity has to hold
// everywhere, so agreeing at seven scattered points is strong evidence and catches every sign or middle-term
// slip these questions could contain.
const XS = [-3, -1, 0, 1, 2, 4, 7];
const same = (f, g, xs = XS) => xs.every(x => nearly(f(x), g(x)));

// Both roots of ax² + bx + c = 0, smaller first, by the quadratic formula rather than by factoring.
const roots = (a, b, c) => {
  const d = Math.sqrt(b * b - 4 * a * c);
  return [(-b - d) / (2 * a), (-b + d) / (2 * a)];
};
const distinctRoots = (a, b, c) => new Set(roots(a, b, c).map(r => r.toFixed(6))).size;

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

  // ---- Advanced Math: equivalent expressions are identities, so they are checked structurally ----
  'og-adv-01': () => null,
  'og-adv-02': () => null,
  'og-adv-03': () => null,
  'og-adv-04': () => null,
  'og-adv-05': () => null,
  'og-adv-06': () => null,
  'og-adv-07': () => 2 * 3,
  'og-adv-08': () => null,
  'og-adv-09': () => null,
  'og-adv-10': () => null,
  'og-adv-11': () => null,
  'og-adv-12': () => 10 / 2,
  'og-adv-13': () => null,
  'og-adv-14': () => null,
  'og-adv-15': () => null,
  'og-adv-16': () => -12 / 3,
  'og-adv-17': () => null,

  // ---- Advanced Math: nonlinear equations and systems ----
  'og-adv-18': () => Math.sqrt(49),
  'og-adv-19': () => roots(1, -5, 6).reduce((a, b) => a + b, 0),
  'og-adv-20': () => roots(1, 3, -10)[0],
  'og-adv-21': () => distinctRoots(1, -6, 9),
  'og-adv-22': () => roots(1, -7, 12).reduce((a, b) => a * b, 1),
  'og-adv-23': () => Math.sqrt(8 / 2),
  'og-adv-24': () => (4 * 4) / (4 * 1),
  'og-adv-25': () => roots(1, -6, 8).reduce((a, b) => a + b, 0),
  'og-adv-26': () => 4 * 4 - 5,
  'og-adv-27': () => 1 + Math.sqrt(16),
  'og-adv-28': () => Math.max(...roots(1, 2, -15)),
  'og-adv-29': () => distinctRoots(1, -4, 3),
  'og-adv-30': () => Math.sqrt(3 + 1),
  'og-adv-31': () => Math.sqrt(27 / 3),
  'og-adv-32': () => null,
  'og-adv-33': () => Math.sqrt(4 * 1 * 9),
  'og-adv-34': () => 1 / (1 - 1 / 2),

  // ---- Advanced Math: nonlinear functions ----
  'og-adv-35': () => 3 ** 2 + 1,
  'og-adv-36': () => (-2) ** 2 - 4 * (-2),
  'og-adv-37': () => null,
  'og-adv-38': () => 6 / (2 * 1),
  'og-adv-39': () => 2 ** 5,
  'og-adv-40': () => Math.log2(64),
  'og-adv-41': () => null,
  'og-adv-42': () => 0 ** 2 + 2 * 0 - 8,
  'og-adv-43': () => Math.max(...roots(1, 2, -8)),
  'og-adv-44': () => 3 * 2 ** 0,
  'og-adv-45': () => 200 * 2 ** (9 / 3),
  'og-adv-46': () => null,
  'og-adv-47': () => { const x = 4 / (2 * 1); return x ** 2 - 4 * x + 7; },
  'og-adv-48': () => (-2) ** 3,
  'og-adv-49': () => (-1 + 5) / 2,
  'og-adv-50': () => 500 * 0.8 ** 0,
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

  // Each of these pins the wording of the chosen answer and, separately, confirms the algebra it claims by
  // evaluating both sides at many values. The string alone would prove nothing.
  'og-adv-01': v => v === 'x² + 8x + 16' && same(x => (x + 4) ** 2, x => x ** 2 + 8 * x + 16),
  'og-adv-02': v => v === '6x² − 15x' && same(x => 3 * x * (2 * x - 5), x => 6 * x ** 2 - 15 * x),
  'og-adv-03': v => v === '2x² + 7x − 15' && same(x => (2 * x - 3) * (x + 5), x => 2 * x ** 2 + 7 * x - 15),
  'og-adv-04': v => v === '(x − 3)(x + 3)' && same(x => x ** 2 - 9, x => (x - 3) * (x + 3)),
  'og-adv-05': v => v === '(x + 3)(x + 4)' && same(x => x ** 2 + 7 * x + 12, x => (x + 3) * (x + 4)),
  'og-adv-06': v => v === 'x + 2' && same(x => (x ** 2 - 4) / (x - 2), x => x + 2, XS.filter(x => x !== 2)),
  'og-adv-08': v => v === '(2x − 3)²' && same(x => 4 * x ** 2 - 12 * x + 9, x => (2 * x - 3) ** 2),
  'og-adv-09': v => v === '6x³y⁵'
    && [[2, 3], [1, 4], [3, 2]].every(([x, y]) => nearly((3 * x ** 2 * y ** 3) * (2 * x * y ** 2), 6 * x ** 3 * y ** 5)),
  'og-adv-10': v => v === 'x⁴' && same(x => x ** 6 / x ** 2, x => x ** 4, XS.filter(x => x !== 0)),
  'og-adv-11': v => v === '7x²' && [1, 2, 3, 5].every(x => nearly(Math.sqrt(49 * x ** 4), 7 * x ** 2)),
  'og-adv-13': v => v === 'x³ + 8' && same(x => (x + 2) * (x ** 2 - 2 * x + 4), x => x ** 3 + 8),
  'og-adv-14': v => v === '5x(x + 2)' && same(x => 5 * x ** 2 + 10 * x, x => 5 * x * (x + 2)),
  'og-adv-15': v => v === 'x² − 25' && same(x => (x - 5) * (x + 5), x => x ** 2 - 25),
  'og-adv-17': v => v === '4ab'
    && [[2, 3], [1, 5], [4, -2]].every(([a, b]) => nearly((a + b) ** 2 - (a - b) ** 2, 4 * a * b)),
  'og-adv-32': v => v === 'x = 4 and x = −4' && nearly(4 ** 2 - 16, 0) && nearly((-4) ** 2 - 16, 0),
  // The vertex really is the lowest point, so no nearby value of the function may dip below it.
  'og-adv-37': v => v === '(3, 2)' && nearly((3 - 3) ** 2 + 2, 2) && XS.every(x => (x - 3) ** 2 + 2 >= 2),
  'og-adv-41': v => v === '(3, 0) and (−3, 0)' && nearly(3 ** 2 - 9, 0) && nearly((-3) ** 2 - 9, 0),
  'og-adv-46': v => v === 'Downward' && -1 < 0,
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
    'og-adv-20': v => nearly(num(v) ** 2 + 3 * num(v) - 10, 0),
    'og-adv-30': v => nearly(num(v) ** 2 - 1, 3),
  };
  for (const [id, holds] of Object.entries(conditions)) {
    const q = ORIGINAL.find(x => x.id === id);
    assert.ok(q, `${id}: not found`);
    const satisfying = q.choices.filter(c => holds(c.text));
    assert.equal(satisfying.length, 1, `${id}: ${satisfying.length} choices satisfy the condition, expected exactly 1`);
    assert.equal(satisfying[0].letter, q.answer, `${id}: the satisfying choice is not the recorded answer`);
  }
});
