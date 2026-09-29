import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markActive, markArabicStatements } from '../scripts/build-questions.js';

// College Board's "Exclude Active Questions" export of a bank leaves out the questions on its official practice
// tests, so a question in the bank but missing from that export is one of them.
const q = (cbId, assessment, section, extra = {}) => ({ id: `cb-${cbId}`, cbId, assessment, section, ...extra });

test('a question left out of its bank’s "exclude active" export is marked, and only then', () => {
  const questions = [
    q('aaaa0001', 'SAT', 'MATH'),                      // in the export: not active
    q('aaaa0002', 'SAT', 'MATH'),                      // left out: active
    q('aaaa0003', 'SAT', 'RW'),                        // no export for SAT RW: left alone
    q('aaaa0004', 'PSAT 8/9', 'MATH', { active: true }), // no export for its bank any more: mark removed
    q('aaaa0005', 'PSAT 8/9', 'MATH', { assessments: ['PSAT 8/9', 'SAT'] }), // shared, left out of SAT's export
    { id: 'og-1', section: 'MATH' },                   // written for the app: never marked
  ];
  const excluded = [{ assessment: 'SAT', section: 'MATH', ids: new Set(['aaaa0001']) }];
  assert.equal(markActive(questions, excluded), 2);
  assert.deepEqual(questions.filter(x => x.active).map(x => x.cbId), ['aaaa0002', 'aaaa0005']);
});

// C21: some College Board pictures number a question's statements 1, 2, 3 while its choices say I, II, III.

test('a question gets the numbering note only when its picture uses 1, 2, 3 and its answers use I, II, III', () => {
  const roman = ['I only', 'II only', 'I and II only', 'Neither I nor II'].map((text, i) => ({ letter: 'ABCD'[i], text }));
  const words = ['It rose', 'It fell', 'It stayed the same', 'It cannot be known'].map((text, i) => ({ letter: 'ABCD'[i], text }));
  const questions = [
    { cbId: 'aaaa0001', choices: roman },                              // numbered 1, 2, 3: noted
    { cbId: 'aaaa0002', choices: roman },                              // numbered I, II, III already: no note
    { cbId: 'aaaa0003', choices: words },                              // a numbered list, but ordinary answers: no note
    { cbId: 'aaaa0004', choices: roman, arabicStatements: true },      // noted before, no longer found: note removed
  ];
  assert.equal(markArabicStatements(questions, new Set(['aaaa0001', 'aaaa0003'])), 1);
  assert.deepEqual(questions.filter(q => q.arabicStatements).map(q => q.cbId), ['aaaa0001']);
});
