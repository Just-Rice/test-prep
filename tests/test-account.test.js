import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeTestAccountPasscode, initSync, signInOrCreate, syncState } from '../js/sync.js';

// A stand-in for Firebase Authentication: accounts by address, each with a passcode.
function fakeAuth(accounts = new Map()) {
  const calls = [];
  const fail = code => Object.assign(new Error(code), { code });
  const auth = {
    calls,
    accounts,
    async signInWithEmailAndPassword(instance, email, passcode) {
      calls.push(['signIn', email]);
      if (instance.blocked) throw fail('auth/too-many-requests');
      if (accounts.get(email) !== passcode) throw fail('auth/invalid-credential');
      instance.currentUser = { email };
      instance.onChange?.(instance.currentUser);
      return { user: instance.currentUser };
    },
    async createUserWithEmailAndPassword(instance, email, passcode) {
      calls.push(['create', email]);
      if (accounts.has(email)) throw fail('auth/email-already-in-use');
      accounts.set(email, passcode);
      instance.currentUser = { email };
      instance.onChange?.(instance.currentUser);
      return { user: instance.currentUser };
    },
    async updatePassword(user, passcode) {
      calls.push(['update', user.email]);
      accounts.set(user.email, passcode);
    },
    async signOut(instance) { calls.push(['signOut']); instance.currentUser = null; },
    initializeAuth: () => ({}),
    inMemoryPersistence: {},
    getAuth: () => auth.main,
    onAuthStateChanged: (instance, fn) => { instance.onChange = fn; fn(null); },
    main: {},
  };
  return auth;
}

test('the personal link signs in to the test account, making it the first time', async () => {
  const auth = fakeAuth();
  const instance = {};
  await signInOrCreate(auth, instance, 'test+abcd2345@users.sat-prep.invalid', 'passcode-one-two');
  assert.deepEqual(auth.calls.map(c => c[0]), ['signIn', 'create'], 'no account yet, so it is made');
  auth.calls.length = 0;
  await signInOrCreate(auth, {}, 'test+abcd2345@users.sat-prep.invalid', 'passcode-one-two');
  assert.deepEqual(auth.calls.map(c => c[0]), ['signIn'], 'every later browser just signs in');
});

test('an old personal link is refused rather than making a second account', async () => {
  const auth = fakeAuth(new Map([['test+abcd2345@users.sat-prep.invalid', 'the-new-passcode']]));
  await assert.rejects(signInOrCreate(auth, {}, 'test+abcd2345@users.sat-prep.invalid', 'the-old-passcode'), /doesn’t work any more/);
  assert.equal(auth.accounts.get('test+abcd2345@users.sat-prep.invalid'), 'the-new-passcode', 'the account is untouched');
});

test('a sign-in problem other than a wrong passcode is reported, and nothing is made', async () => {
  const auth = fakeAuth();
  await assert.rejects(signInOrCreate(auth, { blocked: true }, 'test+abcd2345@users.sat-prep.invalid', 'passcode-one-two'), /Too many attempts/);
  assert.deepEqual(auth.calls.map(c => c[0]), ['signIn']);
});

test('changing the link gives the test account a new passcode without touching this browser’s sign-in', async () => {
  const email = 'test+abcd2345@users.sat-prep.invalid';
  const auth = fakeAuth(new Map([[email, 'the-old-passcode']]));
  const apps = [];
  const app = {
    initializeApp: (config, name) => { const made = { name }; apps.push(made); return made; },
    deleteApp: async made => { made.deleted = true; },
  };
  const firestore = { getFirestore: () => ({}) };
  await initSync({ exams: [], getProgress: () => null, setProgress: () => {}, onChange: () => {} }, { loadSdk: async () => ({ app, auth, firestore }) });
  assert.equal(syncState().account, null);

  await changeTestAccountPasscode('abcd2345', 'the-old-passcode', 'the-new-passcode');
  assert.equal(auth.accounts.get(email), 'the-new-passcode');
  assert.deepEqual(auth.calls.map(c => c[0]), ['signIn', 'update', 'signOut']);
  assert.ok(apps.at(-1).name.startsWith('test-account-') && apps.at(-1).deleted, 'the second connection is closed');
  assert.equal(syncState().account, null, 'the main sign-in is not changed');

  // Nobody has opened the link yet: the account is made with the new passcode.
  auth.calls.length = 0;
  await changeTestAccountPasscode('zzzz2345', 'never-used-passcode', 'a-fresh-passcode');
  assert.deepEqual(auth.calls.map(c => c[0]), ['signIn', 'create', 'signOut']);
  assert.equal(auth.accounts.get('test+zzzz2345@users.sat-prep.invalid'), 'a-fresh-passcode');

  // The saved link and the account disagree: nothing is changed, and it says so.
  await assert.rejects(changeTestAccountPasscode('abcd2345', 'not-the-passcode', 'another-passcode'), /doesn’t match/);
  assert.equal(auth.accounts.get(email), 'the-new-passcode');
  const seconds = apps.filter(made => made.name?.startsWith('test-account-'));
  assert.equal(seconds.length, 3);
  assert.ok(seconds.every(made => made.deleted), 'every second connection is closed, even after a failure');
  assert.ok(!apps[0].deleted, 'the main connection stays open');
});

test('the test account is named as such, and nobody else is', async () => {
  const auth = fakeAuth(new Map([['test+abcd2345@users.sat-prep.invalid', 'passcode-one-two']]));
  const seen = [];
  await initSync({ exams: [], getProgress: () => null, setProgress: () => {}, onChange: state => seen.push(state) },
    { loadSdk: async () => ({ app: { initializeApp: () => ({}) }, auth, firestore: { getFirestore: () => ({}) } }) });
  await auth.signInWithEmailAndPassword(auth.main, 'test+abcd2345@users.sat-prep.invalid', 'passcode-one-two');
  assert.equal(syncState().account, 'Test account');
  assert.equal(syncState().testAccount, 'abcd2345');
  auth.main.onChange({ email: 'rishi@users.sat-prep.invalid' });
  assert.equal(syncState().account, 'rishi');
  assert.equal(syncState().testAccount, null);
});
