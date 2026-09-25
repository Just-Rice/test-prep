import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMS, examOfQuestion, skillsOf } from '../js/exams.js';
import { MCAT_CP_QUESTIONS } from '../js/questions/mcat-cp.js';
import { MCAT_CP_LESSONS } from '../js/lessons/mcat-cp.js';
import { MCAT_CP_PASSAGE_QUESTIONS } from '../js/questions/mcat-cp-passages.js';
import { MCAT_CARS_QUESTIONS } from '../js/questions/mcat-cars.js';
import { MCAT_CARS_LESSONS } from '../js/lessons/mcat-cars.js';
import { MCAT_BB_QUESTIONS } from '../js/questions/mcat-bb.js';
import { MCAT_BB_PASSAGE_QUESTIONS } from '../js/questions/mcat-bb-passages.js';
import { MCAT_BB_LESSONS } from '../js/lessons/mcat-bb.js';
import { MCAT_PS_QUESTIONS } from '../js/questions/mcat-ps.js';
import { MCAT_PS_PASSAGE_QUESTIONS } from '../js/questions/mcat-ps-passages.js';
import { MCAT_PS_LESSONS } from '../js/lessons/mcat-ps.js';

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

// ---- Chem/Phys passage sets ----

const PQ = MCAT_CP_PASSAGE_QUESTIONS;
const pid = q => q.id.replace('mcat-cp-', '');
// "10 : 1" read as the number 10, "1 : 10" as 0.1.
const ratio = text => { const [a, b] = text.split(':').map(Number); return a / b; };

// Shared by every passage set in the MCAT: each question is complete on its own, and a set shares one passage.
function checkPassageSets(questions, section, { perSet }) {
  const skills = new Map(skillsOf(MCAT, section).map(s => [s.name, s]));
  const sets = new Map();
  for (const q of questions) {
    assert.equal(examOfQuestion(q), 'mcat', `${q.id}: belongs to the MCAT`);
    assert.equal(q.section, section, `${q.id}: section`);
    assert.ok(skills.has(q.skill), `${q.id}: unknown skill ${q.skill}`);
    assert.equal(q.domain, MCAT.domains.find(d => d.skills.some(s => s.name === q.skill)).name, `${q.id}: domain`);
    assert.ok(MCAT.levelNames[q.difficulty], `${q.id}: difficulty`);
    assert.deepEqual(q.choices.map(c => c.letter), ['A', 'B', 'C', 'D'], `${q.id}: four lettered choices`);
    assert.equal(new Set(q.choices.map(c => c.text)).size, 4, `${q.id}: choices differ`);
    assert.ok('ABCD'.includes(q.answer) && q.answer.length === 1, `${q.id}: answer is a letter`);
    assert.ok(q.rationale.length > 60, `${q.id}: has a real explanation`);
    assert.ok(q.passage.length > 500, `${q.id}: has its passage`);
    assert.ok(q.stem.length > 20, `${q.id}: has a question`);
    if (!sets.has(q.set)) sets.set(q.set, []);
    sets.get(q.set).push(q);
  }
  for (const [name, members] of sets) {
    assert.equal(new Set(members.map(q => q.passage)).size, 1, `${name}: one passage`);
    assert.equal(members.length, perSet, `${name}: ${perSet} questions`);
  }
  return sets;
}

// How often the right answer is the longest or the shortest choice, among questions answered in words. Chance alone
// makes it either about a quarter of the time each; much more would let a student score by length.
function lengthBias(questions, calculated = () => false) {
  const worded = questions.filter(q => q.choices.some(c => /[a-z]{4}/.test(c.text)) && !calculated(q));
  const text = q => q.choices.find(c => c.letter === q.answer).text;
  const longest = worded.filter(q => text(q).length === Math.max(...q.choices.map(c => c.text.length))).length;
  const shortest = worded.filter(q => text(q).length === Math.min(...q.choices.map(c => c.text.length))).length;
  return { worded: worded.length, longest, shortest };
}

function assertBalanced(questions, { letters, tiers }, calculated) {
  const count = key => questions.reduce((m, q) => m.set(key(q), (m.get(key(q)) || 0) + 1), new Map());
  const byLetter = count(q => q.answer);
  for (const [letter, n] of Object.entries(letters)) assert.equal(byLetter.get(letter) ?? 0, n, `answer ${letter}`);
  const byTier = count(q => q.difficulty);
  for (const [tier, n] of Object.entries(tiers)) assert.equal(byTier.get(tier) ?? 0, n, `tier ${tier}`);
  const { worded, longest, shortest } = lengthBias(questions, calculated);
  assert.ok(longest <= worded * 0.4, `correct choice longest in ${longest} of ${worded}`);
  assert.ok(shortest <= worded * 0.4, `correct choice shortest in ${shortest} of ${worded}`);
}

const PASSAGE_SOLVE = {
  'p1-1': () => 2.5 * 760,
  'p1-2': () => 0.003 * 1700,
  'p1-4': () => Math.log2(40 / 5) * (90 - 30),
  'p2-2': () => -(0.0592 / 2) * Math.log10(0.010 / 1.0),
  'p2-4': () => -2 * 96500 * 0.0592 / 1000,
  'p3-1': () => (2.34 + 9.60) / 2,
  'p3-4': () => (20 * 0.10) / 0.10,
  'p4-1': () => 1 / -0.50,
  'p4-2': () => 1 / 0.25 + 1 / -1.00,
  'p4-4': () => Math.asin(Math.sin(60 * Math.PI / 180) / 1.376) * 180 / Math.PI,
  'p5-1': () => 13.8 + -30.5,
  'p5-3': () => (-30500 + 8.314 * 310 * Math.log((0.00090 * 0.0080) / 0.0080)) / 1000,
};

test('the Chem/Phys passage sets are well formed, balanced and hold together', () => {
  const ids = new Set([...QS, ...PQ].map(q => q.id));
  assert.equal(ids.size, QS.length + PQ.length, 'ids are unique across the MCAT questions');
  const sets = checkPassageSets(PQ, 'CP', { perSet: 4 });
  assert.equal(sets.size, 5);
  assertBalanced(PQ, { letters: { A: 5, B: 5, C: 5, D: 5 }, tiers: { Easy: 7, Medium: 7, Hard: 6 } },
    q => Boolean(PASSAGE_SOLVE[pid(q)]));
});

test('every calculated answer in the Chem/Phys passages is right, and only one choice is', () => {
  const correct = q => q.choices.find(c => c.letter === q.answer).text;
  for (const [id, solve] of Object.entries(PASSAGE_SOLVE)) {
    const q = PQ.find(x => pid(x) === id);
    assert.ok(q, `${id}: exists`);
    const want = solve();
    assert.ok(close(num(correct(q)), want), `${id}: key says ${correct(q)}, working gives ${want}`);
    for (const c of q.choices.filter(x => x.letter !== q.answer)) assert.ok(!close(num(c.text), want), `${id}: ${c.letter} (${c.text}) also fits`);
  }
  // A ratio, read as a ratio rather than as its first number.
  const p33 = PQ.find(x => pid(x) === 'p3-3');
  const want = 10 ** (3.34 - 2.34);
  assert.ok(close(ratio(correct(p33)), want), 'p3-3: Henderson–Hasselbalch ratio');
  for (const c of p33.choices.filter(x => x.letter !== p33.answer)) assert.ok(!close(ratio(c.text), want), `p3-3: ${c.letter}`);
  // A tenfold rise in a product adds RT ln 10 to ΔG: a direction and a size.
  const p54 = PQ.find(x => pid(x) === 'p5-4');
  const shift = 8.314 * 310 * Math.log(10) / 1000;
  assert.equal(correct(p54), `become less negative, by about ${shift.toFixed(1)} kJ/mol`);
  // Three halvings take 40% to 5%: the count behind p1-4.
  assert.equal(40 / 2 ** 3, 5);
});

// ---- CARS ----

const words = text => text.split(/\s+/).filter(Boolean).length;

test('the CARS passages are well formed, balanced like the real section, and of real length', () => {
  const Q = MCAT_CARS_QUESTIONS;
  const sets = checkPassageSets(Q, 'CARS', { perSet: 6 });
  // Nine passages, like the real section, and enough questions (54) for a full-length section of 53.
  assert.equal(sets.size, 9);
  assert.ok(Q.length >= MCAT.sections.find(s => s.id === 'CARS').perModule);
  assertBalanced(Q, { letters: { A: 14, B: 13, C: 14, D: 13 }, tiers: { Easy: 18, Medium: 18, Hard: 18 } });
  // The AAMC's split: about 30% comprehension, 30% reasoning within the text, 40% reasoning beyond it.
  const bySkill = code => Q.filter(q => q.skill.startsWith(code)).length;
  assert.deepEqual([bySkill('C1'), bySkill('C2'), bySkill('C3')], [16, 16, 22]);
  // Real CARS passages run to about 500–600 words; none here is a stub.
  for (const [name, members] of sets) {
    const n = words(members[0].passage);
    assert.ok(n >= 450 && n <= 650, `${name}: ${n} words`);
  }
  // Each set mixes the three skills, as a real passage's questions do.
  for (const [name, members] of sets) assert.equal(new Set(members.map(q => q.skill)).size, 3, `${name}: all three skills`);
});

test('the CARS lessons cover the three skills, and each worked example answers its own question', () => {
  assert.deepEqual(MCAT_CARS_LESSONS.map(l => l.skill), skillsOf(MCAT, 'CARS').map(s => s.name));
  for (const lesson of MCAT_CARS_LESSONS) {
    assert.ok(lesson.body.length >= 3 && lesson.terms.length >= 5, `${lesson.id}: substantial`);
    assert.ok(lesson.links.every(l => /^https:\/\/www\.khanacademy\.org\//.test(l.url)), `${lesson.id}: links`);
    const [, letter, text] = lesson.example.answer.match(/^\(([A-D])\) (.+)$/);
    assert.ok(lesson.example.problem.includes(`(${letter}) ${text.replace(/\.$/, '')}`), `${lesson.id}: the answer is one of the example's choices`);
    assert.ok(lesson.example.steps.length >= 3, `${lesson.id}: worked through`);
  }
});

// ---- Bio/Biochem ----

const BB = MCAT_BB_QUESTIONS;
const bid = q => q.id.replace('mcat-bb-', '');
const correctOf = q => q.choices.find(c => c.letter === q.answer).text;

// Stand-alone questions: the same checks as the Chem/Phys ones, for any section.
function checkStandalone(questions, section, { perSkill = 6 } = {}) {
  const skills = new Map(skillsOf(MCAT, section).map(s => [s.name, s]));
  for (const q of questions) {
    assert.equal(examOfQuestion(q), 'mcat', `${q.id}: belongs to the MCAT`);
    assert.equal(q.section, section, `${q.id}: section`);
    assert.ok(skills.has(q.skill), `${q.id}: unknown skill ${q.skill}`);
    assert.equal(q.domain, MCAT.domains.find(d => d.skills.some(s => s.name === q.skill)).name, `${q.id}: domain`);
    assert.ok(MCAT.levelNames[q.difficulty], `${q.id}: difficulty`);
    assert.deepEqual(q.choices.map(c => c.letter), ['A', 'B', 'C', 'D'], `${q.id}: four lettered choices`);
    assert.equal(new Set(q.choices.map(c => c.text)).size, 4, `${q.id}: choices differ`);
    assert.ok(q.rationale.length > 60, `${q.id}: has a real explanation`);
    assert.ok(!q.passage, `${q.id}: stand-alone`);
  }
  // The same number in every category, with every tier represented; with six, exactly two at each tier.
  for (const s of skillsOf(MCAT, section)) {
    const mine = questions.filter(q => q.skill === s.name);
    assert.equal(mine.length, perSkill, s.name);
    for (const tier of ['Easy', 'Medium', 'Hard']) {
      const n = mine.filter(q => q.difficulty === tier).length;
      if (perSkill === 6) assert.equal(n, 2, `${s.name}: ${tier}`);
      else assert.ok(n >= 1, `${s.name}: has ${tier} questions`);
    }
  }
}

// Re-solved from the wording of each question, not read off the key.
const BB_SOLVE = {
  '1a-1': () => 12 - 1,
  '1a-3': () => (2.1 + 3.9) / 2,
  '1b-1': () => (100 - 2 * 30) / 2,
  '1b-3': () => 1203 / 3 - 1,
  '1c-1': () => 0.5 * 0.5,
  '1c-4': () => 0,
  '1c-5': () => (85 + 65) / 1000 * 100,
  '1c-6': () => 3 / 4 * 1 / 2,
  '1d-3': () => 100 * 6 / (2 + 6),
  '1d-5': () => 2 + 2 + 3 * 2,
  '1d-6': () => 300 * 4 + 80 * 9 + 70 * 4,
  '2a-3': () => (3 / 2) / 3,
  '2b-2': () => 2 ** (120 / 20),
  '2b-5': () => 90 / Math.log2(1.6e6 / 2e5),
  '2c-1': () => 46 * 2,
  '3b-1': () => 70 * 70 / 1000,
  '3b-3': () => (500 - 150) * 12 / 1000,
  '3b-5': () => 250 * 1 / 2,
};

// Net charge of a peptide at a pH, from each ionizable group's pKa (Henderson–Hasselbalch).
const netCharge = (pH, bases, acids) => bases.reduce((s, pKa) => s + 1 / (1 + 10 ** (pH - pKa)), 0)
  - acids.reduce((s, pKa) => s + 1 / (1 + 10 ** (pKa - pH)), 0);

test('the Bio/Biochem questions are well formed and balanced: every category, every tier, every letter', () => {
  checkStandalone(BB, 'BB');
  assertBalanced(BB, { letters: { A: 14, B: 13, C: 14, D: 13 }, tiers: { Easy: 18, Medium: 18, Hard: 18 } }, q => Boolean(BB_SOLVE[bid(q)]));
  const ids = new Set([...QS, ...PQ, ...MCAT_CARS_QUESTIONS, ...BB, ...MCAT_BB_PASSAGE_QUESTIONS].map(q => q.id));
  assert.equal(ids.size, QS.length + PQ.length + MCAT_CARS_QUESTIONS.length + BB.length + MCAT_BB_PASSAGE_QUESTIONS.length, 'ids are unique');
});

// Counts are whole numbers, so a count must match exactly: 399 amino acids is not "within 1%" of 400.
const COUNTS = new Set(['1a-1', '1b-1', '1b-3', '1d-5', '2b-2', '2c-1']);

test('every calculated Bio/Biochem answer is right, and only one choice is', () => {
  for (const [id, solve] of Object.entries(BB_SOLVE)) {
    const q = BB.find(x => bid(x) === id);
    assert.ok(q, `${id}: exists`);
    const want = solve();
    const same = COUNTS.has(id) ? (a, b) => a === b : close;
    assert.ok(same(num(correctOf(q)), want), `${id}: key says ${correctOf(q)}, working gives ${want}`);
    for (const c of q.choices.filter(x => x.letter !== q.answer)) assert.ok(!same(num(c.text), want), `${id}: ${c.letter} (${c.text}) also fits`);
  }
  // 1a-5: Lys–Gly–Asp at pH 7.4 has the N-terminal amine and lysine's side chain as bases, and aspartate's side
  // chain and the C-terminal carboxyl as acids.
  const charge = netCharge(7.4, [9, 10.5], [3.9, 2]);
  assert.equal(correctOf(BB.find(x => bid(x) === '1a-5')), String(Math.round(charge) || 0));
  // 1a-6: the active (deprotonated) share is 1 / (1 + 10^(pKa − pH)), about 9.1%; "9%" must be the nearest choice.
  const active = 100 / (1 + 10 ** (6.0 - 5.0));
  const a16 = BB.find(x => bid(x) === '1a-6');
  const nearestTo = (qq, value, read) => [...qq.choices].sort((a, b) => Math.abs(read(a.text) - value) - Math.abs(read(b.text) - value))[0].letter;
  assert.equal(nearestTo(a16, active, num), a16.answer, '1a-6: the nearest choice to the active share');
  // 1c-3: carriers are 2pq; "1 in 50" must be the nearest choice to it.
  const q = Math.sqrt(1 / 10000);
  const carriers = 2 * (1 - q) * q;
  const oneIn = text => 1 / Number(text.replace(/^1 in /, '').replace(/,/g, ''));
  const c13 = BB.find(x => bid(x) === '1c-3');
  const nearest = [...c13.choices].sort((a, b) => Math.abs(Math.log(oneIn(a.text) / carriers)) - Math.abs(Math.log(oneIn(b.text) / carriers)))[0];
  assert.equal(nearest.letter, c13.answer, '1c-3: the nearest choice to 2pq');
  // 1b-5: transcribe the template (complement, then read 5′ to 3′) and translate with the codons in the question.
  const template = 'TACGGATTC';
  const mrna = [...template].map(b => ({ A: 'U', T: 'A', G: 'C', C: 'G' })[b]).join('');
  const table = { AUG: 'Met', CCU: 'Pro', AAG: 'Lys', UAC: 'Tyr', GGA: 'Gly', UUC: 'Phe' };
  const protein = mrna.match(/.../g).map(c => table[c]).join('–');
  assert.equal(correctOf(BB.find(x => bid(x) === '1b-5')), protein);
  // 2a-4: CaCl₂ gives three ions, so 0.15 M is hypertonic to 300 mOsm/L, and the cell shrinks.
  assert.ok(0.15 * 3 * 1000 > 300);
  assert.equal(correctOf(BB.find(x => bid(x) === '2a-4')), 'It shrinks.');
  // 2a-6: doubling area and thickness together leaves area ÷ thickness unchanged.
  assert.equal((2 * 1) / (2 * 1), 1);
  assert.equal(correctOf(BB.find(x => bid(x) === '2a-6')), 'stays the same');
});

test('the Bio/Biochem passage sets are well formed, balanced, and their data are consistent', () => {
  const P = MCAT_BB_PASSAGE_QUESTIONS;
  const sets = checkPassageSets(P, 'BB', { perSet: 4 });
  assert.equal(sets.size, 3);
  assertBalanced(P, { letters: { A: 3, B: 3, C: 3, D: 3 }, tiers: { Easy: 4, Medium: 4, Hard: 4 } });
  const answer = id => correctOf(P.find(q => q.id === `mcat-bb-${id}`));

  // The inhibitor table: every rate fits Vmax = 100 with Km = 2.0 mM, or with the apparent Km of 4.0 mM under I.
  const table = P.find(q => q.set === 'mcat-bb-p1').passage;
  const rows = [...table.matchAll(/\[S\] = ([\d.]+) mM: ([\d.]+) without I, ([\d.]+) with I/g)].map(m => m.slice(1).map(Number));
  assert.equal(rows.length, 5);
  const rate = (s, km) => 100 * s / (km + s);
  for (const [s, without, withI] of rows) {
    assert.ok(Math.abs(rate(s, 2.0) - without) < 0.06, `rate at ${s} mM without I`);
    assert.ok(Math.abs(rate(s, 4.0) - withI) < 0.06, `rate at ${s} mM with I`);
  }
  assert.equal(num(answer('p1-1')), 2.0);
  // Apparent Km = Km(1 + [I]/Ki): 4.0 = 2.0(1 + 5.0/Ki).
  assert.equal(num(answer('p1-4')), 5.0 / (4.0 / 2.0 - 1));

  // The reading-frame rule, from the exon lengths in the passage.
  const dmd = P.find(q => q.set === 'mcat-bb-p2').passage;
  const exon = n => Number(dmd.match(new RegExp(`Exon ${n}: (\\d+) nucleotides`))[1]);
  assert.notEqual(exon(52) % 3, 0, 'deleting exon 52 shifts the frame');
  assert.match(answer('p2-2'), /^Duchenne/);
  assert.equal((exon(50) + exon(51)) % 3, 0, 'skipping 51 restores a deletion of 50');
  assert.notEqual((exon(50) + exon(49)) % 3, 0, 'skipping 49 does not');
  assert.equal(answer('p2-4'), 'Exon 51');
  assert.equal(answer('p2-1'), '1/2');
});

test('every Bio/Biochem content category has a lesson, and each worked example is right', () => {
  assert.deepEqual(MCAT_BB_LESSONS.map(l => l.skill).sort(), skillsOf(MCAT, 'BB').map(s => s.name).sort());
  for (const lesson of MCAT_BB_LESSONS) {
    assert.ok(lesson.body.length >= 3 && lesson.terms.length >= 5, `${lesson.id}: substantial`);
    assert.ok(lesson.links.every(l => /^https:\/\/(openstax\.org\/books\/biology-2e\/pages|www\.khanacademy\.org\/test-prep\/mcat)\//.test(l.url)), `${lesson.id}: links`);
  }
  const answer = id => MCAT_BB_LESSONS.find(l => l.id === id).example.answer;
  const tidy = x => String(Math.round(x * 1000) / 1000);
  const shows = (id, value) => assert.ok(answer(id).includes(value), `${id}: example answer ${answer(id)} should show ${value}`);
  shows('1a', tidy((9.0 + 10.5) / 2));
  shows('1b', tidy((100 - 2 * 22) / 2));
  shows('1c', tidy(2 * (1 - Math.sqrt(0.16)) * Math.sqrt(0.16)));
  shows('1d', tidy(0.8 * 4 / (1 - 0.8)));
  shows('2a', tidy(0.2 * 2));
  shows('2b', (1000 * 2 ** (180 / 30)).toLocaleString('en-US'));
  shows('2c', `${8 / 2} chromosomes, ${8 / 2 * 2} chromatids`);
  shows('3b', String(Math.round(80 + (120 - 80) / 3)));
});

test('no key term is defined twice across the MCAT lessons, so no flashcard repeats', () => {
  const all = [...MCAT_CP_LESSONS, ...MCAT_CARS_LESSONS, ...MCAT_BB_LESSONS, ...MCAT_PS_LESSONS].flatMap(l => l.terms.map(([term]) => term.toLowerCase()));
  const repeated = all.filter((t, i) => all.indexOf(t) !== i);
  assert.deepEqual(repeated, []);
});

// ---- Psych/Soc ----

const PSQ = MCAT_PS_QUESTIONS;
const sid = q => q.id.replace('mcat-ps-', '');
const PS_SOLVE = {
  '6a-3': () => (105 - 100) / 100 * 400,
  '9b-2': () => 70 / 2,
  '9b-4': () => (12000 + 6000) / 30000 * 100,
};

test('the Psych/Soc questions are well formed and balanced: every category, every tier, every letter', () => {
  checkStandalone(PSQ, 'PS', { perSkill: 5 });
  assertBalanced(PSQ, { letters: { A: 15, B: 15, C: 15, D: 15 }, tiers: { Easy: 20, Medium: 20, Hard: 20 } }, q => Boolean(PS_SOLVE[sid(q)]));
  const all = [...QS, ...PQ, ...MCAT_CARS_QUESTIONS, ...BB, ...MCAT_BB_PASSAGE_QUESTIONS, ...PSQ, ...MCAT_PS_PASSAGE_QUESTIONS];
  assert.equal(new Set(all.map(q => q.id)).size, all.length, 'ids are unique across every MCAT question');
});

test('every calculated Psych/Soc answer is right, and only one choice is', () => {
  for (const [id, solve] of Object.entries(PS_SOLVE)) {
    const q = PSQ.find(x => sid(x) === id);
    assert.ok(q, `${id}: exists`);
    const want = solve();
    assert.ok(close(num(correctOf(q)), want), `${id}: key says ${correctOf(q)}, working gives ${want}`);
    for (const c of q.choices.filter(x => x.letter !== q.answer)) assert.ok(!close(num(c.text), want), `${id}: ${c.letter} (${c.text}) also fits`);
  }
});

test('the Psych/Soc passage sets are well formed and balanced', () => {
  const P = MCAT_PS_PASSAGE_QUESTIONS;
  const sets = checkPassageSets(P, 'PS', { perSet: 4 });
  assert.equal(sets.size, 3);
  assertBalanced(P, { letters: { A: 3, B: 3, C: 3, D: 3 }, tiers: { Easy: 4, Medium: 4, Hard: 4 } });
  // The passage's own figures agree with what its questions say about them.
  const sleep = P.find(q => q.set === 'mcat-ps-p1').passage;
  const [g1, g2, g3] = sleep.match(/(\d+) in group 1, (\d+) in group 2 and (\d+) in group 3/).slice(1).map(Number);
  assert.ok(g1 > g2 && g3 > g2 && g1 - g3 < g1 - g2, 'sleep helps, and losing REM costs little');
  const help = P.find(q => q.set === 'mcat-ps-p3').passage;
  const rates = help.match(/(\d+)% when alone, (\d+)% with one other person present and (\d+)% with four others/).slice(1).map(Number);
  assert.deepEqual([...rates].sort((a, b) => b - a), rates, 'helping falls as bystanders are added');
});

test('every Psych/Soc content category has a lesson, and each worked example is right', () => {
  assert.deepEqual(MCAT_PS_LESSONS.map(l => l.skill).sort(), skillsOf(MCAT, 'PS').map(s => s.name).sort());
  for (const lesson of MCAT_PS_LESSONS) {
    assert.ok(lesson.body.length >= 3 && lesson.terms.length >= 5, `${lesson.id}: substantial`);
    assert.ok(lesson.links.every(l => /^https:\/\/(openstax\.org\/books\/(psychology-2e|introduction-sociology-3e)\/pages|www\.khanacademy\.org\/test-prep\/mcat)\//.test(l.url)), `${lesson.id}: links`);
  }
  const answer = id => MCAT_PS_LESSONS.find(l => l.id === id).example.answer;
  const shows = (id, value) => assert.ok(answer(id).includes(value), `${id}: example answer ${answer(id)} should show ${value}`);
  shows('6a', String(200 + 200 * (52 - 50) / 50));
  shows('9b', String((8 + 4) / 20 * 100));
});
