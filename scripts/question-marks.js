// Marks added to built questions from what the exports say about them, kept apart from the builder (which needs
// PDF.js and a canvas) so they can be tested anywhere, including on GitHub before the site is published.

// Answer choices made only of Roman numerals and joining words: "I only", "I and II only", "Neither I nor II".
const ROMAN_WORDS = new Set(['only', 'and', 'nor', 'neither', 'none', 'or', 'both', 'of', 'the', 'above', 'i', 'ii', 'iii', 'iv']);
const romanChoice = text => {
  const words = String(text ?? '').match(/[A-Za-z]+/g) ?? [];
  return words.length > 0 && words.every(w => ROMAN_WORDS.has(w.toLowerCase())) && /\b(I|II|III)\b/.test(text);
};

export function markArabicStatements(questions, numberedIds) {
  let marked = 0;
  for (const q of questions) {
    const romanAnswers = (q.choices ?? []).filter(c => romanChoice(c.text)).length >= 3;
    if (q.cbId && numberedIds.has(q.cbId) && romanAnswers) { q.arabicStatements = true; marked++; } else delete q.arabicStatements;
  }
  return marked;
}

// A question is active when a bank it belongs to has an "exclude active" export and the export leaves it out.
export function markActive(questions, excluded) {
  let marked = 0;
  for (const q of questions) {
    if (!q.cbId) continue;
    const banks = q.assessments ?? [q.assessment];
    const active = excluded.some(e => e.section === q.section && banks.includes(e.assessment) && !e.ids.has(q.cbId));
    if (active) { q.active = true; marked++; } else delete q.active;
  }
  return marked;
}
