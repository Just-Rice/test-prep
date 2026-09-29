import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// A stand-in for the browser's storage, where the used-up models are remembered.
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
const { MODELS, modelProblem, withModels } = await import('../js/explain.js');
beforeEach(() => store.clear());

const DAILY = new Error('[429 ] You exceeded your current quota: GenerateRequestsPerDayPerProjectPerModel-FreeTier');
const MINUTE = new Error('[429 ] RESOURCE_EXHAUSTED: GenerateRequestsPerMinutePerProjectPerModel-FreeTier');

test('a model’s failure is read as used up for the day, busy for the minute, missing, or a real failure', () => {
  assert.equal(modelProblem(DAILY), 'day');
  assert.equal(modelProblem(MINUTE), 'minute');
  assert.equal(modelProblem(new Error('[404 ] models/gemini-x is not found for API version v1beta')), 'missing');
  assert.equal(modelProblem(new Error('[401 ] Firebase App Check token is invalid')), null);
});

test('when a model’s daily allowance runs out, the next one answers, and the used-up one is skipped all day', async () => {
  const tried = [];
  const answer = await withModels('site', async name => { tried.push(name); if (name === MODELS[0]) throw DAILY; return `from ${name}`; });
  assert.equal(answer, `from ${MODELS[1]}`);
  tried.length = 0;
  await withModels('site', async name => { tried.push(name); return 'ok'; });
  assert.deepEqual(tried, [MODELS[1]], 'the used-up model is not asked again today');
  // A student's own key is another project, with its own allowance.
  tried.length = 0;
  await withModels('own', async name => { tried.push(name); return 'ok'; });
  assert.deepEqual(tried, [MODELS[0]]);
});

test('a model busy for the minute is tried again a minute later', async () => {
  let now = Date.UTC(2026, 8, 28, 18);
  await withModels('site', async name => { if (name === MODELS[0]) throw MINUTE; return 'ok'; }, { now: () => now });
  const first = [];
  await withModels('site', async name => { first.push(name); return 'ok'; }, { now: () => now + 30 * 1000 });
  assert.equal(first[0], MODELS[1], 'still skipped after 30 seconds');
  const later = [];
  await withModels('site', async name => { later.push(name); return 'ok'; }, { now: () => now + 61 * 1000 });
  assert.equal(later[0], MODELS[0], 'back after a minute');
});

test('a real failure is reported at once rather than tried on every model', async () => {
  const tried = [];
  await assert.rejects(withModels('site', async name => { tried.push(name); throw new Error('[401 ] Firebase App Check token is invalid'); }), /App Check/);
  assert.equal(tried.length, 1);
});

test('when every model is used up, the last model’s error is reported', async () => {
  await assert.rejects(withModels('site', async () => { throw DAILY; }), /quota/);
  const tried = [];
  await assert.rejects(withModels('site', async name => { tried.push(name); return 'ok'; }), /used up/);
  assert.equal(tried.length, 0, 'nothing is asked while all are known to be used up');
});
