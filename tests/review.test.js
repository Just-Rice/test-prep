import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMistake, dueCards, dueMistakes, markGuessed, NEW_CARDS_A_DAY, newCards, rateCard, reviewMistake } from '../js/srs.js';
import { sectionAbility, showsAbility, skillAbilities } from '../js/adaptive.js';
import { EXAMS } from '../js/exams.js';
import { defaultProgress } from '../js/store.js';
import { DEFAULTS, CHOICES } from '../js/settings.js';
import { MCAT_CP_LESSONS } from '../js/lessons/mcat-cp.js';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 3, 12);

test('missing a learned question sends it back into review', () => {
  const m = {};
  addMistake(m, 'q1', 'Careless slip', T0);
  for (let k = 1; k <= 5; k++) reviewMistake(m, 'q1', true, T0 + k * 40 * DAY);
  assert.ok(m.q1.graduated);
  reviewMistake(m, 'q1', true, T0 + 300 * DAY);
  assert.ok(m.q1.graduated, 'answering it right again changes nothing');
  reviewMistake(m, 'q1', false, T0 + 400 * DAY);
  assert.ok(!m.q1.graduated);
  assert.equal(m.q1.box, 0);
  assert.equal(m.q1.lapses, 2, 'the new miss is counted with the first');
  assert.deepEqual(dueMistakes(m, T0 + 401 * DAY), ['q1']);
});

test('a lucky guess goes to review without counting as a miss', () => {
  const m = {};
  markGuessed(m, 'q1', T0);
  assert.deepEqual(dueMistakes(m, T0 + DAY), ['q1']);
  assert.equal(m.q1.reason, 'Guessed');
  assert.equal(m.q1.lapses, 0);
  // A question already missed twice keeps its count, and starts again from the first box.
  addMistake(m, 'q2', null, T0);
  addMistake(m, 'q2', null, T0 + DAY);
  reviewMistake(m, 'q2', true, T0 + 2 * DAY);
  markGuessed(m, 'q2', T0 + 3 * DAY);
  assert.equal(m.q2.lapses, 2);
  assert.equal(m.q2.box, 0);
  assert.equal(m.q2.missedAt, T0 + DAY, 'when it was first missed is kept');
});

test('a right answer marked as a guess doesn’t raise the ability estimate; a wrong one still lowers it', () => {
  const exam = EXAMS.sat;
  const answer = (correct, guessed) => ({ qid: `q${Math.random()}`, section: 'MATH', domain: 'Algebra', skill: 'Linear equations in one variable', b: 0, correct, ...(guessed ? { guessed: true } : {}), at: T0, source: 'practice' });
  const base = defaultProgress();
  const plain = { ...base, responses: Array.from({ length: 6 }, () => answer(true, false)) };
  const guessed = { ...base, responses: Array.from({ length: 6 }, () => answer(true, true)) };
  const wrongGuesses = { ...base, responses: Array.from({ length: 6 }, () => answer(false, true)) };
  assert.ok(sectionAbility(plain, 'MATH', exam).theta > 0.5);
  assert.equal(sectionAbility(guessed, 'MATH', exam).theta, sectionAbility(base, 'MATH', exam).theta, 'lucky guesses change nothing');
  assert.ok(sectionAbility(wrongGuesses, 'MATH', exam).theta < -0.5);
  const skill = skillAbilities(guessed, 'MATH', exam).find(s => s.name === 'Linear equations in one variable');
  assert.equal(skill.answered, 6, 'the answers still count as answered');
  assert.ok(showsAbility({ correct: true }) && !showsAbility({ correct: true, guessed: true }) && showsAbility({ correct: false, guessed: true }));
});

test('flashcards space out as they are known, start again when missed, and bring in a few new ones a day', () => {
  const cards = {};
  rateCard(cards, 'a', 'knew', T0);
  assert.equal(cards.a.box, 1, 'a new card already known skips the first day');
  assert.equal(cards.a.due, T0 + 3 * DAY);
  for (let k = 0; k < 10; k++) rateCard(cards, 'a', 'knew', T0 + k * DAY);
  assert.equal(cards.a.box, 5, 'the gap stops growing at the last box');
  assert.equal(cards.a.due - (T0 + 9 * DAY), 60 * DAY);
  rateCard(cards, 'a', 'missed', T0 + 20 * DAY);
  assert.equal(cards.a.box, 0);
  assert.equal(cards.a.lapses, 1);
  rateCard(cards, 'a', 'relearned', T0 + 20 * DAY);
  assert.equal(cards.a.box, 0, 'known after a miss in the same session: back tomorrow');
  assert.equal(cards.a.lapses, 1, 'without counting a second miss');
  assert.equal(cards.a.startedAt, T0, 'when it was first studied is kept');

  const ids = Array.from({ length: 30 }, (_, k) => `c${k}`);
  assert.deepEqual(newCards({}, ids, 0), ids.slice(0, NEW_CARDS_A_DAY));
  assert.deepEqual(newCards({}, ids, NEW_CARDS_A_DAY - 3), ids.slice(0, 3));
  assert.deepEqual(newCards({}, ids, NEW_CARDS_A_DAY + 5), []);
  const some = {};
  rateCard(some, 'c3', 'missed', T0);
  rateCard(some, 'c1', 'missed', T0 - DAY);
  assert.deepEqual(dueCards(some, ids, T0 + DAY), ['c1', 'c3'], 'soonest first');
  assert.ok(!newCards(some, ids, 0).includes('c1'), 'a started card is never new');
});

test('every MCAT lesson term makes a flashcard with its own id', () => {
  const slug = text => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ids = MCAT_CP_LESSONS.flatMap(lesson => lesson.terms.map(([term]) => `${lesson.id}:${slug(term)}`));
  assert.equal(new Set(ids).size, ids.length, 'no two terms share an id');
  assert.ok(ids.every(id => /^[0-9][a-z]:[a-z0-9-]+$/.test(id)), ids.find(id => !/^[0-9][a-z]:[a-z0-9-]+$/.test(id)));
  assert.ok(ids.length >= 50);
});

test('extended time is a setting with standard time as its default', () => {
  assert.equal(DEFAULTS.time, 'standard');
  assert.deepEqual(CHOICES.time.map(([value]) => value), ['standard', '1.5', '2']);
  assert.deepEqual(CHOICES.time.map(([value]) => Number(value) || 1), [1, 1.5, 2]);
});
