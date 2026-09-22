// The study streak: every day in a row with at least one answered question, on any test.
//
// A day is the student's own calendar day, in their own time zone. Today counts once they answer something
// today; until then a streak that ran up to yesterday is still shown, because the day isn't over and they
// can still keep it. A day with nothing answered at all ends it.
//
// Days are handled as "YYYY-MM-DD" strings and stepped with the calendar rather than by adding 24 hours, so
// the days on which clocks change are neither skipped nor counted twice.

export const dayKey = t => new Date(t).toLocaleDateString('en-CA');

function previousDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1, 12));
}

// How long the streak is now. `days` is a set of day keys with at least one answer.
export function currentStreak(days, now = Date.now()) {
  let day = dayKey(now);
  if (!days.has(day)) day = previousDay(day);   // today isn't over yet
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = previousDay(day);
  }
  return streak;
}

// The longest run of consecutive days ever.
export function longestStreak(days) {
  let best = 0;
  for (const day of days) {
    if (days.has(previousDay(day))) continue;   // only count each run once, from its first day
    let run = 0;
    let [y, m, d] = day.split('-').map(Number);
    while (days.has(dayKey(new Date(y, m - 1, d + run, 12)))) run++;
    best = Math.max(best, run);
  }
  return best;
}
