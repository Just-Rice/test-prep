import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markActive } from '../scripts/build-questions.js';

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
