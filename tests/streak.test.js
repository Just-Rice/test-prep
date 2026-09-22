import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentStreak, dayKey, longestStreak } from '../js/streak.js';

// Noon on a given day, local time.
const at = (y, m, d, hour = 12) => new Date(y, m - 1, d, hour).getTime();
const daysOf = (...times) => new Set(times.map(dayKey));

test('practising every day builds a streak', () => {
  const days = daysOf(at(2026, 9, 18), at(2026, 9, 19), at(2026, 9, 20), at(2026, 9, 21));
  assert.equal(currentStreak(days, at(2026, 9, 21)), 4);
});

test('a streak survives until the end of today', () => {
  // Practised the last three days but not yet today: the streak is still there to keep.
  const days = daysOf(at(2026, 9, 18), at(2026, 9, 19), at(2026, 9, 20));
  assert.equal(currentStreak(days, at(2026, 9, 21, 9)), 3);
});

test('a day with no practice ends the streak', () => {
  // Practised Friday and Saturday, nothing on Sunday, and it is now Monday.
  const days = daysOf(at(2026, 9, 18), at(2026, 9, 19));
  assert.equal(currentStreak(days, at(2026, 9, 21)), 0);
});

test('after a missed day, practising again starts a new streak at one', () => {
  const days = daysOf(at(2026, 9, 18), at(2026, 9, 19), at(2026, 9, 21));
  assert.equal(currentStreak(days, at(2026, 9, 21)), 1);
});

test('nothing answered at all is no streak', () => {
  assert.equal(currentStreak(new Set(), at(2026, 9, 21)), 0);
  assert.equal(longestStreak(new Set()), 0);
});

test('late at night and early in the morning are different days', () => {
  const days = daysOf(at(2026, 9, 20, 23), at(2026, 9, 21, 0));
  assert.equal(currentStreak(days, at(2026, 9, 21, 8)), 2);
});

test('the days the clocks change are counted once each', () => {
  // US clocks change on 8 March and 1 November 2026; in any time zone these runs have no gaps.
  const spring = daysOf(at(2026, 3, 7), at(2026, 3, 8), at(2026, 3, 9));
  assert.equal(currentStreak(spring, at(2026, 3, 9)), 3);
  const autumn = daysOf(at(2026, 10, 31), at(2026, 11, 1), at(2026, 11, 2));
  assert.equal(currentStreak(autumn, at(2026, 11, 2)), 3);
});

test('the best streak is the longest run, whenever it was', () => {
  const days = daysOf(at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 10), at(2026, 9, 20), at(2026, 9, 21));
  assert.equal(longestStreak(days), 3);
  assert.equal(currentStreak(days, at(2026, 9, 21)), 2);
});

test('a streak runs across the end of a month and a year', () => {
  assert.equal(currentStreak(daysOf(at(2026, 8, 31), at(2026, 9, 1)), at(2026, 9, 1)), 2);
  assert.equal(longestStreak(daysOf(at(2026, 12, 31), at(2027, 1, 1), at(2027, 1, 2))), 3);
});
