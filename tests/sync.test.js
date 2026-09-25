import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProgress } from '../js/store.js';
import { mergeProgress, periodOf, fromCloud, removeTest, syncProgress, takeBack, toCloud } from '../js/sync-core.js';
import { addMistake, dueMistakes, rateCard, reviewMistake } from '../js/srs.js';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 3, 12);
const answer = (qid, at, correct = true) => ({
  qid, section: 'MATH', domain: 'Algebra', skill: 'Linear functions', b: 0, correct, choice: 'A', ms: 1000, at, source: 'practice',
});
const sameData = (x, y) => assert.deepEqual(toCloud(x), toCloud(y));

// An in-memory stand-in for Firestore that applies a transaction's writes only after it finishes.
function memoryCloud() {
  const docs = new Map();
  const writes = [];
  return {
    docs,
    writes,
    backend: {
      async readAll() {
        return { main: docs.get('main') ?? null, chunks: Object.fromEntries([...docs].filter(([path]) => path !== 'main')) };
      },
      async transact(fn) {
        const pending = [];
        const result = await fn({ get: async path => docs.get(path) ?? null, set: (path, json) => pending.push([path, json]), del: path => pending.push([path, null]) });
        for (const [path, json] of pending) {
          writes.push(path);
          if (json === null) docs.delete(path);
          else docs.set(path, json);
        }
        return result;
      },
    },
  };
}

test('merging combines answers and tests from both devices without duplicates', () => {
  const a = { ...defaultProgress(), responses: [answer('q1', T0), answer('q2', T0 + 1)], tests: [{ id: 't1', at: T0 }] };
  const b = { ...defaultProgress(), responses: [answer('q2', T0 + 1), answer('q3', T0 + 2)], tests: [{ id: 't1', at: T0 }, { id: 't2', at: T0 + 5 }] };
  const merged = mergeProgress(a, b);
  assert.deepEqual(merged.responses.map(r => r.qid), ['q1', 'q2', 'q3']);
  assert.deepEqual(merged.tests.map(t => t.id), ['t1', 't2']);
  sameData(merged, mergeProgress(b, a));
  sameData(merged, mergeProgress(merged, b));
});

test('settings and mistake-log entries keep the most recent change', () => {
  const a = { ...defaultProgress(), plan: { testDate: null, target: 1400, dailyGoal: 20 } };
  a.stamps = { ...a.stamps, plan: T0 };
  const b = { ...defaultProgress(), plan: { testDate: '2026-11-01', target: 1500, dailyGoal: 30 } };
  b.stamps = { ...b.stamps, plan: T0 + 1 };
  addMistake(a.mistakes, 'q1', 'Guessed', T0);
  addMistake(b.mistakes, 'q1', 'Guessed', T0);
  reviewMistake(b.mistakes, 'q1', true, T0 + 2 * DAY);
  addMistake(a.mistakes, 'q2', null, T0);
  b.mistakes.q2 = structuredClone(a.mistakes.q2);
  for (let k = 0; k < 5; k++) reviewMistake(b.mistakes, 'q2', true, T0 + (k + 1) * 40 * DAY);

  const merged = mergeProgress(a, b);
  assert.equal(merged.plan.target, 1500);
  assert.equal(merged.stamps.plan, T0 + 1);
  assert.equal(merged.mistakes.q1.box, 1);
  assert.ok(merged.mistakes.q2.graduated, 'a graduated question stays graduated');
  assert.deepEqual(dueMistakes(merged.mistakes, T0 + 400 * DAY), ['q1']);
});

test('a reset on one device clears older progress everywhere', () => {
  const a = { ...defaultProgress(), profile: { mode: 'grade', grade: 10 }, responses: [answer('q1', T0)] };
  a.stamps = { ...a.stamps, profile: T0 };
  addMistake(a.mistakes, 'q1', null, T0);
  const resetTime = T0 + DAY;
  const b = { ...defaultProgress(), resetAt: resetTime, stamps: { profile: resetTime, placement: resetTime, plan: resetTime }, responses: [answer('q9', T0 + 2 * DAY)] };
  const merged = mergeProgress(a, b);
  assert.deepEqual(merged.responses.map(r => r.qid), ['q9']);
  assert.deepEqual(merged.mistakes, {});
  assert.equal(merged.profile.mode, null);
});

test('an answer taken back stays gone, even from a device that still has it', async () => {
  const cloud = memoryCloud();
  const knownA = {};
  const knownB = {};
  const mine = answer('q1', T0);
  const slip = answer('q2', T0 + 1, false);
  let a = { ...defaultProgress(), responses: [mine, slip] };
  addMistake(a.mistakes, 'q2', null, T0 + 1);
  a = await syncProgress(cloud.backend, a, knownA, { full: true });
  let b = await syncProgress(cloud.backend, defaultProgress(), knownB, { full: true });
  assert.equal(b.responses.length, 2, 'the other device has the answer too');

  a = await syncProgress(cloud.backend, takeBack(a, [slip], T0 + DAY), knownA);
  assert.deepEqual(a.responses.map(r => r.qid), ['q1']);
  assert.deepEqual(dueMistakes(a.mistakes, T0 + 400 * DAY), [], 'the question leaves review');

  // Device B still holds q2 in its own copy and syncs a new answer on top of it.
  b = await syncProgress(cloud.backend, { ...b, responses: [...b.responses, answer('q3', T0 + 2 * DAY)] }, knownB);
  assert.deepEqual(b.responses.map(r => r.qid), ['q1', 'q3']);
  assert.deepEqual(dueMistakes(b.mistakes, T0 + 400 * DAY), []);
  a = await syncProgress(cloud.backend, a, knownA, { full: true });
  sameData(a, b);
  assert.deepEqual(JSON.parse(cloud.docs.get(periodOf(T0))).map(r => r.qid), ['q1', 'q3']);
});

test('a question stays in review while a wrong answer to it is left', () => {
  const first = answer('q1', T0, false);
  const second = answer('q1', T0 + DAY, false);
  const p = { ...defaultProgress(), responses: [first, second] };
  addMistake(p.mistakes, 'q1', null, T0);
  addMistake(p.mistakes, 'q1', null, T0 + DAY);
  const next = takeBack(p, [second], T0 + 2 * DAY);
  assert.ok(!next.mistakes.q1.removed);
  assert.equal(next.mistakes.q1.lapses, 2);
  assert.equal(p.responses.length, 2, 'the progress passed in is left as it was');
});

test('missing a question again after taking the miss back puts it back in review', () => {
  const slip = answer('q1', T0, false);
  let p = { ...defaultProgress(), responses: [slip] };
  addMistake(p.mistakes, 'q1', null, T0);
  const elsewhere = structuredClone(p);   // another device's older copy
  p = takeBack(p, [slip], T0 + DAY);
  p.responses.push(answer('q1', T0 + 2 * DAY, false));
  addMistake(p.mistakes, 'q1', null, T0 + 2 * DAY);
  const merged = mergeProgress(p, elsewhere);
  assert.equal(merged.responses.length, 1);
  assert.deepEqual(dueMistakes(merged.mistakes, T0 + 4 * DAY), ['q1']);
});

test('progress with nothing taken back is stored exactly as before', () => {
  const p = { ...defaultProgress(), responses: [answer('q1', T0)] };
  assert.ok(!JSON.parse(toCloud(p).main).removed);
  assert.ok(!('cards' in JSON.parse(toCloud(p).main)), 'nor does a test without flashcards gain a cards field');
});

test('a test removed from the history stays gone, even from a device that still has it', async () => {
  const cloud = memoryCloud();
  const knownA = {};
  const knownB = {};
  const official = { id: 'official-1', at: T0, takenAt: T0 - DAY, official: true, kind: 'Bluebook practice test', summary: {}, total: { low: 1350, mid: 1350, high: 1350 }, qids: [] };
  let a = await syncProgress(cloud.backend, { ...defaultProgress(), tests: [official] }, knownA, { full: true });
  let b = await syncProgress(cloud.backend, defaultProgress(), knownB, { full: true });
  assert.equal(b.tests.length, 1, 'the other device has the test too');

  a = await syncProgress(cloud.backend, removeTest(a, 'official-1'), knownA);
  assert.deepEqual(a.tests, []);
  // Device B still holds the test and pushes something else on top of it.
  b = await syncProgress(cloud.backend, { ...b, responses: [answer('q1', T0 + DAY)] }, knownB);
  assert.deepEqual(b.tests, [], 'the removal reaches the device that still had it');
  a = await syncProgress(cloud.backend, a, knownA, { full: true });
  sameData(a, b);
  assert.equal(removeTest(a, 'nothing-here').tests.length, 0);
});

test('flashcards keep the most recent rating from any device, and a reset clears them', () => {
  const a = defaultProgress();
  const b = defaultProgress();
  rateCard(a.cards, '4a:torque', 'knew', T0);
  rateCard(b.cards, '4a:torque', 'knew', T0);
  rateCard(b.cards, '4a:torque', 'missed', T0 + DAY);
  rateCard(a.cards, '4a:work', 'knew', T0 + 2 * DAY);
  const merged = mergeProgress(a, b);
  assert.equal(merged.cards['4a:torque'].box, 0, 'the later miss wins');
  assert.equal(merged.cards['4a:work'].box, 1);
  sameData(merged, mergeProgress(b, a));
  assert.deepEqual(JSON.parse(toCloud(merged).main).cards, merged.cards, 'cards travel with the main document');
  assert.deepEqual(fromCloud(toCloud(merged).main, {}).cards, merged.cards);
  const reset = mergeProgress(merged, { ...defaultProgress(), resetAt: T0 + 3 * DAY });
  assert.deepEqual(reset.cards, {});
});

test('answers are stored in half-month chunks and survive a round trip', () => {
  assert.equal(periodOf(Date.UTC(2026, 8, 15, 23, 59)), '2026-09-1');
  assert.equal(periodOf(Date.UTC(2026, 8, 16)), '2026-09-2');
  const progress = { ...defaultProgress(), responses: [answer('q1', T0), answer('q2', T0 + 20 * DAY)] };
  const cloud = toCloud(progress);
  assert.deepEqual(Object.keys(cloud.chunks).sort(), ['2026-09-1', '2026-09-2']);
  sameData(fromCloud(cloud.main, cloud.chunks), progress);
});

test('two devices syncing through the cloud converge', async () => {
  const cloud = memoryCloud();
  const knownA = {};
  const knownB = {};
  let a = { ...defaultProgress(), profile: { mode: 'grade', grade: 11 }, responses: [answer('q1', T0), answer('q2', T0 + 1)] };
  a.stamps = { ...a.stamps, profile: T0 };
  let b = { ...defaultProgress(), responses: [answer('q3', T0 + 2)] };

  a = await syncProgress(cloud.backend, a, knownA, { full: true });
  b = await syncProgress(cloud.backend, b, knownB, { full: true });
  assert.equal(b.responses.length, 3);
  assert.equal(b.profile.grade, 11, "a new device picks up the other device's settings");

  a = { ...a, responses: [...a.responses, answer('q4', T0 + 3)] };
  a = await syncProgress(cloud.backend, a, knownA);
  b = await syncProgress(cloud.backend, b, knownB, { full: true });
  a = await syncProgress(cloud.backend, a, knownA, { full: true });
  assert.equal(b.responses.length, 4);
  sameData(a, b);
});

test('a push merges writes another device made since the last sync', async () => {
  const cloud = memoryCloud();
  const knownA = {};
  const knownB = {};
  let a = await syncProgress(cloud.backend, { ...defaultProgress(), responses: [answer('q1', T0)] }, knownA, { full: true });
  let b = await syncProgress(cloud.backend, defaultProgress(), knownB, { full: true });

  b = await syncProgress(cloud.backend, { ...b, responses: [...b.responses, answer('q2', T0 + 1)] }, knownB);
  // Device A hasn't seen q2 and pushes an answer to the same chunk.
  a = await syncProgress(cloud.backend, { ...a, responses: [...a.responses, answer('q3', T0 + 2)] }, knownA);
  assert.deepEqual(a.responses.map(r => r.qid), ['q1', 'q2', 'q3']);
  assert.deepEqual(JSON.parse(cloud.docs.get(periodOf(T0))).map(r => r.qid), ['q1', 'q2', 'q3']);
});

test('a routine push writes only the documents that changed', async () => {
  const cloud = memoryCloud();
  const known = {};
  let progress = { ...defaultProgress(), responses: [answer('q1', T0), answer('q2', T0 + 20 * DAY)] };
  progress = await syncProgress(cloud.backend, progress, known, { full: true });
  cloud.writes.length = 0;

  progress = await syncProgress(cloud.backend, { ...progress, responses: [...progress.responses, answer('q3', T0 + 21 * DAY)] }, known);
  assert.deepEqual(cloud.writes, [periodOf(T0 + 21 * DAY)]);
  cloud.writes.length = 0;
  await syncProgress(cloud.backend, progress, known);
  assert.deepEqual(cloud.writes, [], 'nothing to write when nothing changed');
});

test('a test nobody has used is never written to the cloud', async () => {
  const cloud = memoryCloud();
  const progress = await syncProgress(cloud.backend, defaultProgress(), {}, { full: true });
  assert.equal(cloud.writes.length, 0);
  assert.deepEqual(progress.responses, []);
  await syncProgress(cloud.backend, { ...progress, responses: [answer('q1', T0)] }, {}, { full: true });
  assert.ok(cloud.docs.has('main'), 'the first real answer creates the documents');
});
