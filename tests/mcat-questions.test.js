import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMS, examOfQuestion, skillsOf } from '../js/exams.js';
import { MCAT_CP_QUESTIONS } from '../js/questions/mcat-cp.js';
import { MCAT_CP_LESSONS } from '../js/lessons/mcat-cp.js';

// The MCAT questions and lessons written for this app. As with the SAT originals, nothing here trusts the key
// recorded in a question: every calculated answer is worked out again below from the numbers in the question,
// and it has to match the choice marked correct and no other.

const MCAT = EXAMS.mcat;
const QS = MCAT_CP_QUESTIONS;

// Reads a number out of a choice such as "2,500 Pa", "−212 kJ/mol", "1/16" or "2.26 × 10⁸ m/s".
const SUPER = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
function num(text) {
  const t = String(text).replace(/[−–]/g, '-').replace(/,(?=\d{3})/g, '');
  const sci = t.match(/(-?\d+(?:\.\d+)?)\s*×\s*10([⁻]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
  if (sci) return Number(sci[1]) * 10 ** ((sci[2] ? -1 : 1) * Number([...sci[3]].map(c => SUPER[c]).join('')));
  const frac = t.match(/^(-?\d+)\/(\d+)/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const plain = t.match(/-?\d+(?:\.\d+)?/);
  return plain ? Number(plain[0]) : NaN;
}
// Choices are rounded to about three figures, so agreement within 1% counts. Relative, not absolute: a photon's
// energy is around 10⁻¹⁹ J, where any fixed margin would accept every choice.
const close = (a, b) => (b === 0 ? a === 0 : Math.abs(a - b) <= Math.abs(b) * 0.01);

// Independent re-solutions, from the physics and chemistry rather than from the key.
const G = 10;
const SOLVE = {
  '4a-1': () => Math.sqrt(2 * 20 / G),
  '4a-2': () => 30 / 6,
  '4a-3': () => 60 * G * 0.5,
  '4a-4': () => 0.5 * 20 * 8,
  '4a-5': () => 12 ** 2 / (2 * G),
  '4a-6': () => 20 * 35 / 5,
  '4b-1': () => 50 / 0.02,
  '4b-3': () => 1000 * G * 2.0,
  '4b-4': () => 1 / 0.5 ** 4,
  '4b-5': () => 0.004 * 800 / 1000,
  '4b-6': () => 0.21 * 500,
  '4c-1': () => 9 / 3,
  '4c-2': () => 2 + 4,
  '4c-3': () => 1 / (1 / 6 + 1 / 3),
  '4c-5': () => 0.5 * 10e-6 * 100 ** 2,
  '4c-6': () => -2 * 96500 * 1.10 / 1000,
  '4d-1': () => 340 / 170,
  '4d-3': () => 10 ** ((60 - 40) / 10),
  '4d-4': () => 3.00e8 / 1.33,
  '4d-5': () => 1 / (1 / 20 - 1 / 60),
  '4e-2': () => 0.5 ** 5,
  '4e-5': () => 6.63e-34 * 3.00e8 / 500e-9,
  '5a-1': () => -Math.log10(0.001),
  '5a-2': () => 14 - -Math.log10(1e-5),
  '5a-3': () => 10 ** (7.8 - 6.8),
  '5a-5': () => 2 * 0.15 * 0.0821 * 310,
  '5a-6': () => Math.sqrt(1.8e-10),
  '5b-3': () => 2 ** 2,
  '5c-1': () => 4 / 10,
  '5c-6': () => 100 / 4,
  '5d-1': () => 3 - 1,
  '5e-3': () => 200 * 4.18 * (35 - 25),
};

// A temperature threshold is a number and a direction. ΔG = ΔH − TΔS changes sign at T = ΔH/ΔS; which side is
// spontaneous follows from the signs: with both positive, the −TΔS term wins at high temperature.
const THRESHOLD = {
  '5e-6': (dH, dS) => `${dH > 0 && dS > 0 ? 'Above' : 'Below'} ${dH / dS} K`,
};

// Nuclear bookkeeping, done on (A, Z) rather than read off the answer.
const decay = ([a, z], steps) => steps.reduce(([A, Z], s) => (s === 'alpha' ? [A - 4, Z - 2] : [A, Z + 1]), [a, z]);
const NUCLEAR = {
  '4e-1': decay([238, 92], ['alpha']),
  '4e-3': decay([14, 6], ['beta']),
  '4e-6': decay([232, 90], ['alpha', 'beta', 'beta']),
};

const idOf = q => q.id.replace('mcat-cp-', '');
const correctText = q => q.choices.find(c => c.letter === q.answer).text;

test('every MCAT question is well formed and filed under a real content category', () => {
  const skills = new Map(skillsOf(MCAT, 'CP').map(s => [s.name, s]));
  const ids = new Set();
  for (const q of QS) {
    assert.ok(!ids.has(q.id), `${q.id}: duplicate id`);
    ids.add(q.id);
    assert.equal(examOfQuestion(q), 'mcat', `${q.id}: belongs to the MCAT`);
    assert.ok(skills.has(q.skill), `${q.id}: unknown skill ${q.skill}`);
    assert.equal(q.domain, MCAT.domains.find(d => d.skills.some(s => s.name === q.skill)).name, `${q.id}: domain`);
    assert.ok(MCAT.levelNames[q.difficulty], `${q.id}: difficulty`);
    assert.deepEqual(q.choices.map(c => c.letter), ['A', 'B', 'C', 'D'], `${q.id}: four lettered choices`);
    assert.equal(new Set(q.choices.map(c => c.text)).size, 4, `${q.id}: choices differ`);
    assert.ok(q.rationale.length > 40, `${q.id}: has a real explanation`);
  }
});

test('the set is balanced: every category, every tier, every answer letter', () => {
  assert.equal(QS.length, 60);
  const count = key => QS.reduce((m, q) => m.set(key(q), (m.get(key(q)) || 0) + 1), new Map());
  for (const s of skillsOf(MCAT, 'CP')) assert.equal(count(q => q.skill).get(s.name), 6, s.name);
  for (const level of ['Easy', 'Medium', 'Hard']) assert.equal(count(q => q.difficulty).get(level), 20, level);
  for (const letter of 'ABCD') assert.equal(count(q => q.answer).get(letter), 15, `answer ${letter}`);
  // The correct choice must not give itself away by length, which would let a student score without knowing the
  // material. Chance alone makes it the longest about a quarter of the time.
  const worded = QS.filter(q => q.choices.some(c => /[a-z]{4}/.test(c.text)) && !SOLVE[idOf(q)]);
  const longest = worded.filter(q => correctText(q).length === Math.max(...q.choices.map(c => c.text.length))).length;
  const shortest = worded.filter(q => correctText(q).length === Math.min(...q.choices.map(c => c.text.length))).length;
  assert.ok(longest <= worded.length * 0.4, `correct choice longest in ${longest} of ${worded.length}`);
  assert.ok(shortest <= worded.length * 0.4, `correct choice shortest in ${shortest} of ${worded.length}`);
});

test('every calculated answer is right, and only one choice is', () => {
  for (const [id, solve] of Object.entries(SOLVE)) {
    const q = QS.find(x => idOf(x) === id);
    assert.ok(q, `${id}: exists`);
    const want = solve();
    assert.ok(close(num(correctText(q)), want), `${id}: key says ${correctText(q)}, working gives ${want}`);
    for (const c of q.choices.filter(x => x.letter !== q.answer)) {
      assert.ok(!close(num(c.text), want), `${id}: choice ${c.letter} (${c.text}) is also correct`);
    }
  }
  const q56 = QS.find(x => idOf(x) === '5e-6');
  assert.equal(correctText(q56), THRESHOLD['5e-6'](30000, 120), '5e-6: threshold and direction');
  for (const [id, [a, z]] of Object.entries(NUCLEAR)) {
    const q = QS.find(x => idOf(x) === id);
    const read = text => text.match(/-(\d+) \(Z = (\d+)\)/).slice(1).map(Number);
    assert.deepEqual(read(correctText(q)), [a, z], `${id}: nuclide`);
    for (const c of q.choices.filter(x => x.letter !== q.answer)) assert.notDeepEqual(read(c.text), [a, z], `${id}: ${c.letter}`);
  }
});

test('every Chem/Phys content category has a lesson, and each worked example is right', () => {
  const skills = skillsOf(MCAT, 'CP').map(s => s.name);
  assert.deepEqual(MCAT_CP_LESSONS.map(l => l.skill).sort(), [...skills].sort());
  for (const lesson of MCAT_CP_LESSONS) {
    assert.ok(lesson.body.length >= 2 && lesson.terms.length >= 5, `${lesson.id}: substantial`);
    assert.ok(lesson.links.every(l => /^https:\/\/(openstax\.org\/books|www\.khanacademy\.org)\//.test(l.url)), `${lesson.id}: links`);
  }
  const answer = id => MCAT_CP_LESSONS.find(l => l.id === id).example.answer;
  const tidy = x => String(Math.round(x * 1000) / 1000);   // 1/(1/10 − 1/30) is 14.999… in floating point
  const shows = (id, value) => assert.ok(answer(id).includes(value), `${id}: example answer ${answer(id)} should show ${value}`);
  shows('4a', tidy(70 * 10 * 3 / 5));
  shows('4b', `1/${2 ** 4}`);
  shows('4c', `${tidy(12 / (1 / (1 / 6 + 1 / 6)))} A`);
  shows('4c', `${tidy(12 * 12 / 3)} W`);
  shows('4d', `${tidy(1 / (1 / 10 - 1 / 30))} cm`);
  shows('4e', `${tidy(80 * 0.5 ** (18 / 6))} mg`);
  shows('5a', tidy(4.76 + Math.log10(10)));
  shows('5b', String(2 ** 3));
  shows('5c', tidy(3.0 / 8.0));
  shows('5d', String(5 - 1));
  shows('5e', tidy(40000 / 100));
});
