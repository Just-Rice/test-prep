// Spaced review for missed questions, Leitner-style: each correct review moves a question to a longer
// interval, and a miss sends it back to the start. A question graduates after the last box; its entry is
// kept as a marker so cloud sync doesn't bring back an older copy from another device.

const INTERVAL_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

export function addMistake(mistakes, qid, reason, now = Date.now()) {
  mistakes[qid] = { box: 0, due: now + INTERVAL_DAYS[0] * DAY_MS, reason, missedAt: now, updatedAt: now, lapses: (mistakes[qid]?.lapses || 0) + 1 };
  return mistakes;
}

export function reviewMistake(mistakes, qid, correct, now = Date.now()) {
  const entry = mistakes[qid];
  if (!entry || entry.graduated) return mistakes;
  if (!correct) return addMistake(mistakes, qid, entry.reason, now);
  const box = entry.box + 1;
  if (box >= INTERVAL_DAYS.length) mistakes[qid] = { graduated: true, updatedAt: now, lapses: entry.lapses };
  else mistakes[qid] = { ...entry, box, due: now + INTERVAL_DAYS[box] * DAY_MS, updatedAt: now };
  return mistakes;
}

// For a question whose every miss was taken back (see takeBack in sync-core.js). Like a graduated entry it
// is kept as a marker, so another device's older copy can't put the question back into review; unlike one,
// it isn't something the student learned, so nothing lists it. Missing the question again replaces it.
export function removeMistake(mistakes, qid, now = Date.now()) {
  mistakes[qid] = { removed: true, updatedAt: now };
  return mistakes;
}

export function dueMistakes(mistakes, now = Date.now()) {
  return Object.entries(mistakes)
    .filter(([, m]) => !m.graduated && !m.removed && m.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([qid]) => qid);
}
