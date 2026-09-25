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
  // A miss always puts the question back at the start, even one already learned: drilling learned questions from
  // the Mistakes page and getting one wrong means it needs reviewing again.
  if (!correct) return addMistake(mistakes, qid, entry?.reason ?? null, now);
  if (!entry || entry.graduated || entry.removed) return mistakes;
  const box = entry.box + 1;
  if (box >= INTERVAL_DAYS.length) mistakes[qid] = { graduated: true, updatedAt: now, lapses: entry.lapses };
  else mistakes[qid] = { ...entry, box, due: now + INTERVAL_DAYS[box] * DAY_MS, updatedAt: now };
  return mistakes;
}

// A right answer the student said was a guess. They don't know it yet, so it is scheduled like a miss, back to the
// start and due tomorrow, but it isn't counted as one: the number of misses stays as it was.
export function markGuessed(mistakes, qid, now = Date.now()) {
  const entry = mistakes[qid];
  const live = entry && !entry.graduated && !entry.removed;
  mistakes[qid] = {
    box: 0, due: now + INTERVAL_DAYS[0] * DAY_MS, reason: 'Guessed', missedAt: live ? entry.missedAt : now, updatedAt: now,
    lapses: entry?.lapses || 0,
  };
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

// ---------- flashcards ----------
//
// The key terms from each lesson, one card each, spaced the same way as mistakes but never finished with: a term
// known for two months comes back every two months. A new card the student already knows skips the first day.
// How a card went, each time it is rated:
//   'knew'       known first time in this session: on to the next, longer gap
//   'missed'     not known: back to the start, due tomorrow (it comes round again in the session as well)
//   'relearned'  known after being missed earlier in the same session: due tomorrow, without counting another miss

const CARD_DAYS = [1, 3, 7, 14, 30, 60];
export const NEW_CARDS_A_DAY = 10;

export function rateCard(cards, id, result, now = Date.now()) {
  const entry = cards[id];
  const box = result === 'knew' ? Math.min(entry ? entry.box + 1 : 1, CARD_DAYS.length - 1) : 0;
  cards[id] = {
    box, due: now + CARD_DAYS[box] * DAY_MS, startedAt: entry?.startedAt ?? now, updatedAt: now,
    lapses: (entry?.lapses || 0) + (result === 'missed' ? 1 : 0),
  };
  return cards;
}

// Cards already started that are due, soonest first. ids: the deck, in lesson order.
export function dueCards(cards, ids, now = Date.now()) {
  return ids.filter(id => cards[id] && cards[id].due <= now).sort((a, b) => cards[a].due - cards[b].due);
}

// Cards not started yet, in lesson order, up to what is left of the day's allowance of new ones.
export function newCards(cards, ids, startedToday) {
  return ids.filter(id => !cards[id]).slice(0, Math.max(0, NEW_CARDS_A_DAY - startedToday));
}
