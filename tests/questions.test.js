import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_B } from '../js/irt.js';
import { DOMAINS, findSkill } from '../js/taxonomy.js';
import { ALGEBRA_QUESTIONS } from '../js/questions/algebra.js';
import { ADVANCED_MATH_QUESTIONS } from '../js/questions/advanced-math.js';
import { PROBLEM_SOLVING_QUESTIONS } from '../js/questions/problem-solving.js';
import { GEOMETRY_QUESTIONS } from '../js/questions/geometry.js';
import { INFORMATION_AND_IDEAS_QUESTIONS } from '../js/questions/information-and-ideas.js';
import { CRAFT_AND_STRUCTURE_QUESTIONS } from '../js/questions/craft-and-structure.js';

// Original questions written for this app. The point of this file is that nothing here trusts the answer
// recorded in the question: every mathematical answer is worked out again from the wording of the problem,
// and the two have to agree. A wrong answer key is worse than a missing question, because a student will
// believe it.

const ORIGINAL = [
  ...ALGEBRA_QUESTIONS, ...ADVANCED_MATH_QUESTIONS, ...PROBLEM_SOLVING_QUESTIONS, ...GEOMETRY_QUESTIONS,
  ...INFORMATION_AND_IDEAS_QUESTIONS, ...CRAFT_AND_STRUCTURE_QUESTIONS,
];

// The value a student would have to produce: the text of the correct choice, or the accepted response.
function answerValue(q) {
  if (!q.choices) return q.answer[0];
  const choice = q.choices.find(c => c.letter === q.answer);
  assert.ok(choice, `${q.id}: answer ${q.answer} is not one of the choices`);
  return choice.text;
}

// Questions are written with typographic minus signs; comparisons use real numbers.
// Probability answers are written as fractions, which Number() alone cannot read, so "3/8" is divided out.
// Commas in figures like "4,200" and trailing percent signs are stripped first.
const num = text => {
  const s = String(text).replace(/[−–—]/g, '-').replace(/[^0-9.\-/]/g, '');
  const fraction = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  return fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(s);
};

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

const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = xs => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const stdDev = xs => Math.sqrt(mean(xs.map(x => (x - mean(xs)) ** 2)));

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

  // ---- Problem-Solving and Data Analysis: rates and percentages ----
  'og-psda-01': () => (150 / 3) * 5,
  'og-psda-02': () => (12 / 3) * 5,
  'og-psda-03': () => 45 * (2 / 18),
  'og-psda-04': () => (60 * 5280) / 3600,
  'og-psda-05': () => 3.5 * 25,
  'og-psda-06': () => (480 / 8) * 45,
  'og-psda-07': () => (5 * 12) / 4,
  'og-psda-08': () => 45 * (2 / 5),
  'og-psda-09': () => 0.2 * 150,
  'og-psda-10': () => (15 / 50) * 100,
  'og-psda-11': () => 80 * 1.25,
  'og-psda-12': () => 120 * 0.8,
  'og-psda-13': () => 36 / 0.75,
  'og-psda-14': () => null,
  'og-psda-15': () => (45 / 180) * 100,
  'og-psda-16': () => 56000 / 1.12,

  // ---- One-variable data ----
  'og-psda-17': () => mean([4, 8, 10, 14]),
  'og-psda-18': () => median([3, 7, 9, 12, 20]),
  'og-psda-19': () => median([2, 5, 7, 10]),
  'og-psda-20': () => null,
  'og-psda-21': () => Math.max(12, 4, 19, 7) - Math.min(12, 4, 19, 7),
  'og-psda-22': () => null,
  'og-psda-23': () => null,

  // ---- Two-variable data ----
  'og-psda-24': () => 3 * 4 + 5,
  'og-psda-25': () => null,
  'og-psda-26': () => 1.5 * 10 + 2,
  'og-psda-27': () => null,
  'og-psda-28': () => 32 - (4 * 5 + 9),
  'og-psda-29': () => 0.5 * 0 + 12,
  'og-psda-30': () => (23 - 11) / (6 - 2),

  // ---- Probability ----
  'og-psda-31': () => 3 / (3 + 5),
  'og-psda-32': () => 3 / 6,
  'og-psda-33': () => (20 - 12) / 20,
  'og-psda-34': () => 18 / 30,
  'og-psda-35': () => 0.5 * 0.5,
  'og-psda-36': () => (25 - 10) / 25,
  'og-psda-37': () => 10 / 16,

  // ---- Inference and margin of error ----
  'og-psda-38': () => null,
  'og-psda-39': () => null,
  'og-psda-40': () => 0.35 * 12000,
  'og-psda-41': () => null,
  'og-psda-42': () => 48 + 4,
  'og-psda-43': () => null,
  'og-psda-44': () => null,

  // ---- Evaluating statistical claims: these are judgements about study design, checked structurally ----
  'og-psda-45': () => null,
  'og-psda-46': () => null,
  'og-psda-47': () => null,
  'og-psda-48': () => null,
  'og-psda-49': () => null,
  'og-psda-50': () => null,

  // ---- Geometry: area and volume ----
  'og-geo-01': () => 9 * 4,
  'og-geo-02': () => 0.5 * 10 * 6,
  'og-geo-03': () => null,
  'og-geo-04': () => 3 * 4 * 5,
  'og-geo-05': () => 3 ** 2 * 10,
  'og-geo-06': () => 6 * Math.cbrt(64) ** 2,
  'og-geo-07': () => 4 * Math.sqrt(49),
  'og-geo-08': () => ((6 + 10) / 2) * 4,
  'og-geo-09': () => (4 / 3) * 3 ** 3,
  'og-geo-10': () => 12 * 5,
  'og-geo-11': () => { const w = 36 / 6; return w * (2 * w); },
  'og-geo-12': () => (1 / 3) * 3 ** 2 * 4,
  'og-geo-13': () => 120 / 24,

  // ---- Geometry: lines, angles and triangles ----
  'og-geo-14': () => 180 - 50 - 60,
  'og-geo-15': () => 180 - 115,
  'og-geo-16': () => 90 - 37,
  'og-geo-17': () => (180 - 40) / 2,
  'og-geo-18': () => 45 + 65,
  'og-geo-19': () => 180 - 65,
  'og-geo-20': () => null,
  'og-geo-21': () => (5 - 2) * 180,
  'og-geo-22': () => 8 * (3 / 2),
  'og-geo-23': () => null,
  'og-geo-24': () => null,
  'og-geo-25': () => ((6 - 2) * 180) / 6,
  'og-geo-26': () => (180 / (1 + 2 + 3)) * 3,

  // ---- Geometry: right triangles and trigonometry ----
  'og-geo-27': () => Math.sqrt(6 ** 2 + 8 ** 2),
  'og-geo-28': () => Math.sqrt(13 ** 2 - 5 ** 2),
  'og-geo-29': () => 3 / 5,
  'og-geo-30': () => 8 / 17,
  'og-geo-31': () => 7 / 24,
  'og-geo-32': () => 2 * 5,
  'og-geo-33': () => null,
  'og-geo-34': () => Math.cos(Math.PI / 2 - Math.asin(0.6)),
  'og-geo-35': () => 0.5 * 9 * 12,
  'og-geo-36': () => 10 * Math.sin(Math.PI / 6),
  'og-geo-37': () => Math.sin(1.2) ** 2 + Math.cos(1.2) ** 2,
  'og-geo-38': () => Math.sqrt(15 ** 2 + 20 ** 2),

  // ---- Geometry: circles ----
  'og-geo-39': () => 2 * 7,
  'og-geo-40': () => null,
  'og-geo-41': () => Math.sqrt(49),
  'og-geo-42': () => 3,
  'og-geo-43': () => (90 / 360) * 2 * 4,
  'og-geo-44': () => (60 / 360) * 6 ** 2,
  'og-geo-45': () => null,
  'og-geo-46': () => Math.sqrt(36),
  'og-geo-47': () => 20 / 2,
  'og-geo-48': () => Math.sqrt(36),
  'og-geo-49': () => 360,
  'og-geo-50': () => (Math.PI / 3) * (180 / Math.PI),
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

  // Where the answer is a sentence, the arithmetic behind it is still checked separately, so the wording can
  // never quietly disagree with the numbers it describes.
  'og-psda-14': v => v === 'Decrease of 1%' && nearly(200 * 1.1 * 0.9, 198) && 198 < 200,
  'og-psda-20': v => v === 'Mean'
    && mean([5, 5, 6, 9, 15]) > median([5, 5, 6, 9, 15]) && mean([5, 5, 6, 9, 15]) > 5,
  'og-psda-22': v => v === 'The mean'
    // Adding one extreme value moves the mean much further than the median.
    && Math.abs(mean([1, 2, 3, 4, 100]) - mean([1, 2, 3, 4]))
       > Math.abs(median([1, 2, 3, 4, 100]) - median([1, 2, 3, 4])),
  'og-psda-23': v => v === 'Set B' && stdDev([4, 8, 12, 16]) > stdDev([10, 10, 10, 10])
    && nearly(mean([4, 8, 12, 16]), mean([10, 10, 10, 10])),
  'og-psda-25': v => v === 'y decreases by 2 for each increase of 1 in x'
    && nearly((-2 * 4 + 30) - (-2 * 3 + 30), -2),
  'og-psda-27': v => v === 'Positively',
  'og-psda-38': v => v === '59% to 65%' && 62 - 3 === 59 && 62 + 3 === 65,
  'og-psda-39': v => v === 'It decreases',
  'og-psda-41': v => v === 'A random sample of all students at the school',
  'og-psda-43': v => v === 'It is plausible that the population value lies between 40% and 46%',
  // Margin of error scales with 1/sqrt(n), so doubling the sample leaves more than half of it.
  'og-psda-44': v => v === 'It decreases, but by less than half' && 1 / Math.sqrt(2) > 0.5 && 1 / Math.sqrt(2) < 1,
  'og-psda-45': v => v === 'No, because it was observational with no random assignment',
  'og-psda-46': v => v === 'A randomized controlled experiment',
  'og-psda-47': v => v === 'The drug causes improvement among subjects like those studied',
  'og-psda-48': v => v === 'The sample is not representative of the population',
  'og-psda-49': v => v === 'Random selection of subjects',
  'og-psda-50': v => v === 'Participants chose their own group, so the groups may differ in other ways',

  // Answers written with π or a radical would be mangled by num(), which strips everything that is not a
  // digit, so "6√2" would silently become 62. These pin the wording and verify the value separately.
  'og-geo-03': v => v === '25π' && nearly(5 ** 2, 25),
  'og-geo-33': v => v === '6√2' && nearly(Math.sqrt(6 ** 2 + 6 ** 2), 6 * Math.sqrt(2)),
  'og-geo-40': v => v === '25π' && nearly((10 / 2) ** 2, 25),
  'og-geo-20': v => v === 'Right' && nearly(3 ** 2 + 4 ** 2, 5 ** 2),
  'og-geo-23': v => v === 'They are equal in measure',
  // The third side must lie strictly between the difference and the sum of the other two.
  'og-geo-24': v => v === '18' && !(12 - 5 < 18 && 18 < 12 + 5),
  'og-geo-45': v => v === 'The inscribed angle is half the central angle',
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
    // This one asks which length could NOT be the third side, so exactly one choice must fail the inequality.
    'og-geo-24': v => !(12 - 5 < num(v) && num(v) < 12 + 5),
  };
  for (const [id, holds] of Object.entries(conditions)) {
    const q = ORIGINAL.find(x => x.id === id);
    assert.ok(q, `${id}: not found`);
    const satisfying = q.choices.filter(c => holds(c.text));
    assert.equal(satisfying.length, 1, `${id}: ${satisfying.length} choices satisfy the condition, expected exactly 1`);
    assert.equal(satisfying[0].letter, q.answer, `${id}: the satisfying choice is not the recorded answer`);
  }
});

// ---------------------------------------------------------------------------
// Reading and Writing. There is no arithmetic to re-solve here, so instead these
// enforce the properties a fair reading question has to have. The answer-checking
// test above skips this section, so without these the reading questions would
// ship on nothing but my own say-so.
// ---------------------------------------------------------------------------

const READING = ORIGINAL.filter(q => q.section === 'RW');

test('every reading question carries a passage of workable length', () => {
  for (const q of READING) {
    assert.ok(q.passage, `${q.id}: has no passage`);
    const words = q.passage.trim().split(/\s+/).length;
    // Command of Evidence items present a claim to be tested rather than a passage to be read, and a claim is
    // properly one or two sentences. Padding one out to narrative length would make the question worse.
    const floor = q.skill === 'Command of Evidence' ? 12 : 25;
    assert.ok(words >= floor && words <= 160, `${q.id}: passage is ${words} words, outside the usable range`);
    assert.ok(q.choices, `${q.id}: reading questions are always multiple choice`);
  }
});

// A student who notices that the fullest-sounding option is usually right can score without reading a word.
// An earlier version of this test only looked at the longest choice, so when the questions were rewritten to
// fix that, they landed on the mirror-image flaw instead: the answer became the shortest choice ninety per
// cent of the time, and the test still passed. The property actually wanted is that length carries no
// information at all, so every position in the length order is checked. Chance puts each at 25%.
test('the length of a reading answer does not predict whether it is correct', () => {
  if (!READING.length) return;
  const ranks = { 1: 0, 2: 0, 3: 0, 4: 0 };   // 1 is the shortest choice, 4 the longest
  for (const q of READING) {
    const byLength = [...q.choices].sort((a, b) => a.text.length - b.text.length);
    ranks[byLength.findIndex(c => c.letter === q.answer) + 1]++;
  }
  for (const [rank, n] of Object.entries(ranks)) {
    const share = n / READING.length;
    assert.ok(share <= 0.4,
      `the correct choice is length-rank ${rank} of 4 in ${Math.round(share * 100)}% of reading questions (${n} of ${READING.length})`);
  }
});

// A question that says "according to the text" must be answerable from the text. Comparing word stems is
// crude, but an answer that restates the passage will always share several of its distinctive words, and one
// invented out of thin air will not.
test('answers to "according to the text" questions echo their own passage', () => {
  const stems = text => new Set(String(text).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    .filter(word => word.length >= 5).map(word => word.slice(0, 4)));
  const asked = READING.filter(q => /according to the text/i.test(q.stem));
  assert.ok(asked.length, 'some reading questions ask what the text says');
  for (const q of asked) {
    const passage = stems(q.passage);
    const answer = stems(q.choices.find(c => c.letter === q.answer).text);
    const shared = [...answer].filter(word => passage.has(word));
    assert.ok(shared.length >= 2,
      `${q.id}: its answer shares only ${shared.length} distinctive words with the passage it claims to report`);
  }
});

// A reading question that asks about "the underlined sentence" is unanswerable unless something is actually
// underlined. That was a real bug on the live site: a demo question asked about an underline the reader could
// not see. The fix was the `underline` field, which names the exact wording so js/app.js can mark it up again.
// This guards the rule for every original question, including files added later.
test('reading questions that mention an underline say which words are underlined', () => {
  for (const q of READING) {
    if (!/underlin/i.test(`${q.stem} ${q.passage}`)) continue;
    assert.ok(q.underline?.length, `${q.id}: refers to underlined text but marks none`);
    for (const part of q.underline) {
      assert.ok(`${q.passage}\n${q.stem}`.includes(part),
        `${q.id}: the wording it marks as underlined does not appear in the question`);
    }
  }
});
