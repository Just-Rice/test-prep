import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachImages, decodeBundle, encodeBundle, imageNames } from '../js/library-bundle.js';

const bytes = (...values) => new Uint8Array(values);

const QUESTIONS = [
  {
    id: 'q1', section: 'MATH', answer: 'B',
    promptImage: { src: 'data/img/q1-prompt.webp', width: 200, height: 90 },
    choices: [
      { letter: 'A', text: 'Six' },
      { letter: 'B', image: { src: 'data/img/q1-choice-B.webp', width: 40, height: 20 } },
    ],
  },
  { id: 'q2', section: 'ENG', stem: 'Which choice is clearest?', answer: 'C', choices: [{ letter: 'A', text: 'No Change' }] },
];

const IMAGES = new Map([
  ['q1-prompt.webp', bytes(82, 73, 70, 70, 1, 2, 3, 4, 87, 69, 66, 80)],
  ['q1-choice-B.webp', bytes(9, 8, 7)],
]);

test('a bundle carries its questions and its images back unchanged', () => {
  const { questions, images, packedAt } = decodeBundle(encodeBundle({ questions: QUESTIONS, images: IMAGES, packedAt: '2026-01-02T03:04:05.000Z' }));
  assert.deepEqual(questions, QUESTIONS);
  assert.equal(packedAt, '2026-01-02T03:04:05.000Z');
  assert.deepEqual([...images.keys()].sort(), ['q1-choice-B.webp', 'q1-prompt.webp']);
  for (const [name, original] of IMAGES) assert.deepEqual([...images.get(name)], [...original], name);
});

test('an empty library is still a valid bundle', () => {
  const { questions, images } = decodeBundle(encodeBundle({ questions: [], images: new Map() }));
  assert.deepEqual(questions, []);
  assert.equal(images.size, 0);
});

test('images keep their own bytes when one of them is empty', () => {
  const withEmpty = new Map([['a.webp', bytes()], ['b.webp', bytes(5, 6)]]);
  const { images } = decodeBundle(encodeBundle({ questions: [], images: withEmpty }));
  assert.equal(images.get('a.webp').length, 0);
  assert.deepEqual([...images.get('b.webp')], [5, 6]);
});

test('a truncated bundle is reported rather than half-read', () => {
  const full = encodeBundle({ questions: QUESTIONS, images: IMAGES });
  assert.throws(() => decodeBundle(full.subarray(0, full.length - 4)), /missing some images/);
  assert.throws(() => decodeBundle(bytes(1, 2)), /empty|damaged/);
});

test('a bundle whose header is not readable is reported', () => {
  const broken = encodeBundle({ questions: [], images: new Map() });
  broken[4] = 0;   // the first byte of the header's JSON
  assert.throws(() => decodeBundle(broken), /damaged/);
});

test('a bundle packed by a newer version is refused by name', () => {
  const header = new TextEncoder().encode(JSON.stringify({ v: 99, questions: [], images: [] }));
  const out = new Uint8Array(4 + header.length);
  new DataView(out.buffer).setUint32(0, header.length, true);
  out.set(header, 4);
  assert.throws(() => decodeBundle(out), /different version \(99\)/);
});

test('every image a question refers to is listed', () => {
  assert.deepEqual([...imageNames(QUESTIONS)].sort(), ['q1-choice-B.webp', 'q1-prompt.webp']);
});

test('questions are pointed at the images that travelled with them', () => {
  const { questions, images } = decodeBundle(encodeBundle({ questions: QUESTIONS, images: IMAGES }));
  const linked = attachImages(questions, images, (b, name) => `blob:${name}:${b.length}`);
  assert.equal(linked[0].promptImage.src, 'blob:q1-prompt.webp:12');
  assert.equal(linked[0].promptImage.width, 200, 'the displayed size is kept');
  assert.equal(linked[0].choices[1].image.src, 'blob:q1-choice-B.webp:3');
  assert.equal(linked[0].choices[0].text, 'Six', 'text choices are untouched');
  assert.equal(linked[1].stem, 'Which choice is clearest?');
});

test('one URL is made per image however many questions use it', () => {
  const shared = [QUESTIONS[0], { ...QUESTIONS[0], id: 'q3' }];
  let made = 0;
  attachImages(shared, IMAGES, () => `blob:${made++}`);
  assert.equal(made, 2, 'two distinct images, not four');
});

test('a question whose image did not travel loses the image, not the question', () => {
  const linked = attachImages(QUESTIONS, new Map(), () => 'blob:x');
  assert.equal(linked[0].promptImage, null);
  assert.equal(linked[0].choices[1].image, null);
  assert.equal(linked[0].id, 'q1');
});
