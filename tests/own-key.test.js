import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAfterSignIn } from '../js/explain.js';

// Where a student's own Gemini key ends up when an account signs in. The key is a secret with its own quota
// behind it, so the cases that matter most are the ones where it must not stay: another account's key, and a
// key removed from the account on another device.

test('the key saved with the account comes to this device', () => {
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: 'KEY-A', here: '', hereAccount: '' }), { key: 'KEY-A', account: 'a', upload: false });
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: 'KEY-A', here: 'OLD', hereAccount: 'a' }), { key: 'KEY-A', account: 'a', upload: false });
});

test('a key added here while signed out joins the account', () => {
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: null, here: 'MINE', hereAccount: '' }), { key: 'MINE', account: 'a', upload: true });
});

test('the account key wins over one added here while signed out', () => {
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: 'KEY-A', here: 'MINE', hereAccount: '' }), { key: 'KEY-A', account: 'a', upload: false });
});

test('a key removed from the account on another device goes from this one too', () => {
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: null, here: 'KEY-A', hereAccount: 'a' }), { key: '', account: '', upload: false });
});

test('another account\u2019s key never stays or joins this account', () => {
  const next = keyAfterSignIn({ uid: 'b', inAccount: null, here: 'KEY-A', hereAccount: 'a' });
  assert.equal(next.key, '');
  assert.equal(next.upload, false);
});

test('no key anywhere stays no key', () => {
  assert.deepEqual(keyAfterSignIn({ uid: 'a', inAccount: null, here: '', hereAccount: '' }), { key: '', account: '', upload: false });
});
