// "Explain this question" and hints, answered by Gemini through Firebase AI Logic.
//
// Firebase AI Logic's Gemini Developer API backend has a free tier that works on Firebase's no-cost Spark
// plan, so no billing account is needed, and the model is reached through Firebase's proxy so no API key ever
// appears in this code. Nothing loads until js/firebase-config.js is filled in, and the student can turn the
// whole feature off in Settings, in which case nothing here is ever called and no question ever leaves the
// device. The Firebase AI SDK itself is only downloaded the first time a hint or explanation is asked for.
//
// Many exported questions are pictures of maths rather than text (the export draws equations and graphs as
// graphics), so the question image is sent alongside whatever text there is.
//
// App Check is enforced now, not at some future date. Enabling AI Logic switches it on, and an unregistered
// client is refused outright: the endpoint answers 401 "Firebase App Check token is invalid" rather than
// producing a hint. So RECAPTCHA_SITE_KEY in js/firebase-config.js is required, not optional.

import { FIREBASE_CONFIG, RECAPTCHA_SITE_KEY } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
const MODEL = 'gemini-3.8-flash';   // free tier on the Gemini Developer API
const LIMIT = 900;                  // characters of question text sent, so one question can't become a huge prompt

export const explainConfigured = Boolean(FIREBASE_CONFIG);

let model = null;
let loading = null;
// One answer per question is enough: asking twice costs another call and says the same thing.
const answers = new Map();

// Firebase enforces App Check for AI Logic, so the app has to prove it is this site before Gemini will answer.
// Registration happens once, before the first request; afterwards the SDK refreshes the token on its own.
//
// On localhost there is no reCAPTCHA domain to attest against, so a debug token is used instead. Set one by
// running `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in the console once, then registering the token it
// prints under App Check -> Apps -> Manage debug tokens in the Firebase console.
let appCheckStarted = false;

async function registerAppCheck(firebaseApp) {
  if (appCheckStarted || !RECAPTCHA_SITE_KEY) return;
  appCheckStarted = true;
  // reCAPTCHA Enterprise, the provider App Check has registered for this app. Firebase's own token exchange
  // has refused it with FAILED_PRECONDITION although every condition it names is met (reported to Firebase
  // support). Classic reCAPTCHA v3 was tried as a way round and Firebase no longer lets a v3 key be added.
  // Until that is resolved, App Check is set to monitor rather than enforce for AI Logic, so requests are
  // answered either way; the token is still sent, so the App Check page shows the moment it starts passing.
  // Firebase will enforce App Check for AI Logic permanently from 2 November 2026.
  const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(`${SDK}/firebase-app-check.js`);
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

async function getModel() {
  if (model) return model;
  loading ||= (async () => {
    const [app, ai] = await Promise.all([import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-ai.js`)]);
    // Cloud sync may already have started the same Firebase app; reuse it rather than starting a second.
    const firebaseApp = app.getApps().length ? app.getApp() : app.initializeApp(FIREBASE_CONFIG);
    await registerAppCheck(firebaseApp);
    const backend = ai.getAI(firebaseApp, { backend: new ai.GoogleAIBackend() });
    model = ai.getGenerativeModel(backend, {
      model: MODEL,
      generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
    });
    return model;
  })();
  return loading;
}

// The built library stores images as files under data/img, so they are fetched and inlined as base64.
async function imagePart(image) {
  if (!image?.src) return null;
  try {
    const res = await fetch(image.src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return data ? { inlineData: { mimeType: blob.type || 'image/webp', data } } : null;
  } catch {
    return null;
  }
}

const clip = text => (text && text.length > LIMIT ? `${text.slice(0, LIMIT)}…` : text || '');

// Everything the model needs to see: the passage and question as text where there is text, and the question
// image where the export drew it instead.
async function questionParts(q) {
  const parts = [];
  const text = [
    q.passage ? `Passage:\n${clip(q.passage)}` : '',
    q.stem ? `Question:\n${clip(q.stem)}` : '',
    q.choices?.some(c => c.text) ? `Answer choices:\n${q.choices.map(c => `${c.letter}. ${c.text ?? '(shown as an image)'}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
  if (text) parts.push(text);
  const image = await imagePart(q.promptImage);
  if (image) {
    parts.push(image);
    if (!text) parts.push('The question is the image above.');
  }
  for (const choice of q.choices || []) {
    const picture = await imagePart(choice.image);
    if (picture) {
      parts.push(`Answer choice ${choice.letter}:`);
      parts.push(picture);
    }
  }
  return parts;
}

const answerText = q => (Array.isArray(q.answer) ? q.answer.join(' or ') : q.answer);

async function ask(instruction, q) {
  const generative = await getModel();
  const result = await generative.generateContent([instruction, ...(await questionParts(q))]);
  const text = result.response.text().trim();
  if (!text) throw new Error('empty response');
  return text;
}

function describeError(err) {
  const message = String(err?.message || err);
  // Firebase AI Logic has to be switched on once per project before any call works.
  if (/enabled?\b/i.test(message) && /\bai\b|vertexai|ailogic/i.test(message)) {
    return 'Gemini isn’t switched on for this Firebase project yet. In the Firebase console open AI Logic, click “Get started”, then try again in a few minutes.';
  }
  if (/quota|429|exhausted/i.test(message)) return 'Gemini’s free daily limit has been reached. Try again tomorrow.';
  // App Check must be tested before the network branch. A rejected token arrives as code "fetch-error" with
  // "Error fetching from ..." in the message, so the network test below swallowed it and told the student to
  // check their internet connection while the real cause was a 401 for a missing App Check token.
  if (/app.?check/i.test(message)) {
    return 'This copy of the app isn’t registered with Firebase App Check, so Gemini refused the request. It needs an App Check site key adding.';
  }
  if (/network|offline|failed to fetch/i.test(message)) return 'Could not reach Gemini. Check your internet connection.';
  if (/api.?key|not.?found|404/i.test(message)) return 'Gemini is not set up for this project yet. Enable Firebase AI Logic in the Firebase console.';
  return `Gemini could not answer: ${message}`;
}

// A full explanation, shown after the student has answered and seen the correct answer.
const NO_APP_CHECK = 'Gemini needs an App Check site key before it can answer. See RECAPTCHA_SITE_KEY in js/firebase-config.js.';

export async function explainQuestion(q, { chosen, correct, examName = 'SAT' } = {}) {
  if (!RECAPTCHA_SITE_KEY) throw new Error(NO_APP_CHECK);
  const key = `explain|${q.id}|${chosen ?? ''}`;
  if (answers.has(key)) return answers.get(key);
  const key2 = answerText(q);
  const instruction = [
    `You are a patient ${examName} tutor helping a high-school student.`,
    key2 ? `The correct answer is ${key2}.` : 'The correct answer is shown in the image provided.',
    chosen == null ? 'The student left this question blank.'
      : correct ? `The student answered ${chosen}, which is correct.`
      : `The student answered ${chosen}, which is wrong.`,
    'Explain in at most 150 words how to get to the correct answer, in clear steps.',
    correct === false && chosen != null ? 'Also say in one sentence what mistake the student’s answer most likely came from.' : '',
    'Write plain prose for a student. No markdown, no headings, no bullet points, no restating the question.',
  ].filter(Boolean).join(' ');
  try {
    const text = await ask(instruction, q);
    answers.set(key, text);
    return text;
  } catch (err) {
    throw new Error(describeError(err));
  }
}

// A nudge before answering. The answer is deliberately withheld from the prompt so it cannot leak.
export async function hintFor(q, { examName = 'SAT' } = {}) {
  if (!RECAPTCHA_SITE_KEY) throw new Error(NO_APP_CHECK);
  const key = `hint|${q.id}`;
  if (answers.has(key)) return answers.get(key);
  const instruction = [
    `You are a patient ${examName} tutor helping a high-school student who is stuck.`,
    'Give ONE short hint, at most 35 words, pointing at the method or the first step to take.',
    'Do NOT reveal or state the answer, do not name a correct answer choice, and do not work through the whole solution.',
    'Write one plain sentence. No markdown.',
  ].join(' ');
  try {
    const text = await ask(instruction, q);
    answers.set(key, text);
    return text;
  } catch (err) {
    throw new Error(describeError(err));
  }
}
