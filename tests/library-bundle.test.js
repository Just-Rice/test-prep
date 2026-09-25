import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeLibrary, encodeLibrary, PICTURE_KEYS, pictureIds, picturesOf } from '../js/library-bundle.js';

const QUESTIONS = [
  {
    id: 'q1', section: 'MATH', answer: 'B',
    promptImage: { id: 'aaaa1111bbbb2222cccc', width: 200, height: 90 },
    rationaleImage: { id: 'dddd3333eeee4444ffff', width: 300, height: 120 },
    choices: [
      { letter: 'A', text: 'Six' },
      { letter: 'B', image: { id: 'aaaa1111bbbb2222cccc', width: 40, height: 20 } },   // the same picture twice
    ],
  },
  { id: 'q2', section: 'RW', passage: 'A short passage.', stem: 'Which choice is clearest?', answer: 'C', choices: [{ letter: 'A', text: 'No Change' }] },
];

test('a library carries its questions back unchanged', async () => {
  const bytes = await encodeLibrary({ questions: QUESTIONS, builtAt: '2026-01-01T00:00:00.000Z', packedAt: '2026-01-02T03:04:05.000Z' });
  const library = await decodeLibrary(bytes);
  assert.deepEqual(library.questions, QUESTIONS);
  assert.equal(library.packedAt, '2026-01-02T03:04:05.000Z');
  assert.equal(library.builtAt, '2026-01-01T00:00:00.000Z');
});

test('the questions travel compressed', async () => {
  const many = Array.from({ length: 300 }, (_, i) => ({ ...QUESTIONS[1], id: `q${i}` }));
  const bytes = await encodeLibrary({ questions: many });
  assert.ok(bytes.length < JSON.stringify(many).length / 5, `${bytes.length} bytes for ${JSON.stringify(many).length} of JSON`);
});

test('every picture a question uses is found, each once', () => {
  assert.equal(picturesOf(QUESTIONS[0]).length, 3);
  assert.deepEqual([...pictureIds(QUESTIONS)].sort(), ['aaaa1111bbbb2222cccc', 'dddd3333eeee4444ffff']);
  assert.equal(pictureIds([QUESTIONS[1]]).size, 0, 'a text-only question uses none');
});

// The science reader added q.passageImage and nothing else learned about it, so the build script pruned
// every passage picture as unused and the packer shipped the questions pointing at files that no longer
// existed. PICTURE_KEYS is now the one list all three read; this checks nothing has drifted from it again.
test('every picture the question builder makes is in the one list', () => {
  const builder = readFileSync(fileURLToPath(new URL('../js/question-builder.js', import.meta.url)), 'utf8');
  const assigned = [...builder.matchAll(/\bq\.(\w*[Ii]mage)\s*=/g)].map(m => m[1]);
  assert.ok(assigned.length >= 4, `expected to find the assignments, found ${assigned.length}`);
  for (const key of new Set(assigned)) {
    assert.ok(PICTURE_KEYS.includes(key), `q.${key} is a picture the build script would prune and the packer would not name`);
  }
});

test('a damaged library is reported rather than half-read', async () => {
  const bytes = await encodeLibrary({ questions: QUESTIONS });
  await assert.rejects(decodeLibrary(bytes.subarray(0, bytes.length - 20)), /damaged/);
  await assert.rejects(decodeLibrary(new Uint8Array([1, 2, 3])), /damaged/);
});

test('a library packed by another version is refused by name', async () => {
  const other = new Uint8Array(await new Response(
    new Blob([JSON.stringify({ v: 99, questions: [] })]).stream().pipeThrough(new CompressionStream('gzip')),
  ).arrayBuffer());
  await assert.rejects(decodeLibrary(other), /different version \(99\)/);
});
