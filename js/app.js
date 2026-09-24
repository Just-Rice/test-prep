import * as store from './store.js';
import { DIFFICULTY_B, estimateAbility, pCorrect, projectSectionScore } from './irt.js';
import {
  buildModule, isCorrect, nextPlacementQuestion, nextPracticeQuestion, PLACEMENT, routeFor, sectionAbility, skillAbilities,
} from './adaptive.js';
import { EXAMS, EXAM_IDS, NATIONAL_MERIT, examsOfQuestion, scoredSections, sectionOf, selectionIndex, skillsOf, totalScore } from './exams.js';
import { addMistake, dueMistakes, reviewMistake } from './srs.js';
import { applySettings, CHOICES, loadSettings, saveSettings } from './settings.js';
import { answeredBefore, checkOwnKey, explainConfigured, explainKey, explainQuestion, hintFor, hintKey, ownKey, setOwnKey } from './explain.js';
import { DEMO_QUESTIONS } from './demo-questions.js';
import { ORIGINAL_QUESTIONS } from './questions/index.js';
import { MCAT_CP_LESSONS } from './lessons/mcat-cp.js';
import { mountCalculator } from './calc.js';
import { currentStreak, dayKey, longestStreak } from './streak.js';
import {
  initSync, schedulePush, signInWithGoogle, signInWithUsername, signOutOfSync, syncConfigured, syncState,
} from './sync.js';
import {
  joinWithCode, libraryAccess, listTesters, loadCloudQuestions, MIN_CODE, pictureUrl, plainCode, publishLibrary,
  readInviteCode, removeTester, saveInviteCode,
} from './library-cloud.js';
import { decodeLibrary, pictureIds } from './library-bundle.js';
import { importPdf } from './import-pdf.js';
import {
  hasPicture as haveImportedPicture, importedPictureUrl, importedQuestions as readImportedQuestions,
  importsSupported, listImports, removeImport, saveImport,
} from './imported-library.js';

const APP_NAME = 'Test Prep';
const view = document.getElementById('view');
const side = document.getElementById('side');
const topbar = document.getElementById('topbar');
const tabs = document.getElementById('tabs');
const more = document.getElementById('more');
const shell = document.querySelector('.shell');
const SIDEBAR_KEY = 'satprep.sidebarCollapsed';
try { shell.classList.toggle('collapsed', localStorage.getItem(SIDEBAR_KEY) === '1'); } catch { /* storage unavailable */ }
const DAY_MS = 24 * 60 * 60 * 1000;
const MISTAKE_REASONS = ['Careless slip', "Didn't know the concept", 'Misread the question', 'Ran out of time', 'Guessed'];

// Each test (SAT, PSAT/NMSQT, PSAT 8/9, ACT) keeps its own progress; `progress` is the current test's.
let examId = store.loadExam(EXAM_IDS);
let exam = EXAMS[examId];
const progressByExam = Object.fromEntries(EXAM_IDS.map(id => [id, store.loadProgress(id)]));
let progress = progressByExam[examId];
let allQuestions = [];
let pool = [];          // the questions the current test practices with
let byId = new Map();
let library = { source: 'demo', files: 0, warnings: [], own: 0, borrowed: false };
// The questions this device built or ships with, and the shared library downloaded after signing in.
let baseQuestions = [];
let cloudQuestions = [];
let ownQuestions = [];        // questions the student imported from their own PDFs
let imports = [];             // what those files were
let cloudLibrary = { status: 'idle', access: null };
let session = null;     // the active placement, practice or review session
let test = null;        // the timed practice test, kept separately so browsing other pages doesn't end it

// A timed test in progress is kept on the device as it goes, so a reload, a closed tab or a browser that
// discards the page doesn't lose it. Questions are kept by id and found again when it is restored; the clock
// is an end time, so it keeps running while the page is closed, as it would on test day.
const TEST_KEY = 'satprep.test.v1';
const LAST_ACCOUNT_KEY = 'satprep.lastAccount';
function saveTest() {
  try {
    if (!test || test.finished) { localStorage.removeItem(TEST_KEY); return; }
    const s = test;
    localStorage.setItem(TEST_KEY, JSON.stringify({
      exam: s.exam, sections: s.sections, sIdx: s.sIdx, module: s.module, route: s.route, results: s.results,
      used: [...s.used], seenBefore: [...s.seenBefore], panel: s.panel, hideTimer: s.hideTimer,
      section: s.section, questions: s.questions.map(q => q.id), idx: s.idx, answers: s.answers, flags: [...s.flags],
      eliminated: Object.fromEntries(Object.entries(s.eliminated).map(([id, set]) => [id, [...set]])),
      highlights: s.highlights, times: s.times, reviewScreen: s.reviewScreen, onBreak: Boolean(s.onBreak), endsAt: s.endsAt,
    }));
  } catch {
    // Storage full or turned off: the test carries on, it just can't survive a reload.
  }
}
function restoreTest() {
  if (test) return;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(TEST_KEY)); } catch { /* unreadable: nothing to restore */ }
  if (!saved) return;
  const known = new Map(allQuestions.map(q => [q.id, q]));
  const questions = saved.questions.map(id => known.get(id));
  // Drawn from the shared library, which arrives a moment after sign-in: tried again once it has.
  if (questions.some(q => !q)) return;
  test = {
    ...saved, questions, used: new Set(saved.used), seenBefore: new Set(saved.seenBefore), flags: new Set(saved.flags),
    eliminated: Object.fromEntries(Object.entries(saved.eliminated).map(([id, list]) => [id, new Set(list)])),
    gridOpen: false, highlightMode: false,
  };
  toast('Your timed test was restored. Its timer kept running while the page was closed.');
}
// Where the student is in a question (time spent, highlights) is otherwise saved only on moving on, so it is
// saved as the page goes away too.
window.addEventListener('pagehide', () => {
  if (!test || test.finished || test.onBreak || currentRoute !== 'test' || test.exam !== examId) return;
  leaveQuestion();
  test.shownAt = Date.now();
  saveTest();
});
let currentRoute = null;
let ticker = null;
let settings = loadSettings();
applySettings(settings);

// ---------- helpers ----------

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const para = t => esc(t).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const inline = t => esc(t).replace(/\n/g, '<br>');

// Reading questions often ask about an underlined word, phrase or sentence. Question text is stored as plain
// text, so each question carries the exact strings that were underlined and they are marked up again here.
function underline(html, parts) {
  for (const part of parts || []) {
    const needle = esc(part).replace(/\n/g, '<br>');
    const at = needle ? html.indexOf(needle) : -1;
    if (at >= 0) html = `${html.slice(0, at)}<u class="ul">${needle}</u>${html.slice(at + needle.length)}`;
  }
  return html;
}
const $ = sel => view.querySelector(sel);
const on = (sel, event, fn) => view.querySelectorAll(sel).forEach(el => el.addEventListener(event, fn));
const plural = (n, word) => `${typeof n === 'number' ? n.toLocaleString() : n} ${word}${n === 1 ? '' : 's'}`;
const sectionName = id => sectionOf(exam, id)?.name ?? id;
const sectionShort = id => sectionOf(exam, id)?.short ?? id;
const range = s => `${s.low}–${s.high}`;

const save = () => {
  progressByExam[examId] = progress;
  store.saveProgress(progress, examId);
  schedulePush(examId);
};

// Replaces a test's progress wholesale (a reset, signing out, or a merge from another device).
function replaceProgress(id, next, { push = false } = {}) {
  progressByExam[id] = next;
  if (id === examId) progress = next;
  store.saveProgress(next, id);
  if (push) schedulePush(id);
}

// Records when a synced setting changed, so the newest edit wins across devices (see sync-core.js).
const touch = (...keys) => { for (const key of keys) progress.stamps = { ...progress.stamps, [key]: Date.now() }; };

function go(path) {
  if (location.hash === `#/${path}`) render();
  else location.hash = `#/${path}`;
}

// Each test practices with its own questions. The PSATs share the SAT's skills, so until PSAT exports are added
// they practice with the SAT's questions.
// Two exports can contain the same question, and the same question can be reprinted under a different id.
// Keeping one copy of each is what stops a repeat turning up in a practice run or a timed test.
const contentKey = q => (q.cbId ? `cb:${q.cbId}` : [q.section, q.passage, q.stem, q.promptImage?.src,
  (q.choices || []).map(c => c.text ?? c.image?.src).join('|')].join('¦').replace(/\s+/g, ' ').trim().toLowerCase());

function dedupe(questions) {
  const byKey = new Map();
  for (const q of questions) {
    const key = contentKey(q);
    if (!byKey.has(key)) byKey.set(key, q);
  }
  return [...byKey.values()];
}

const isOfficial = q => q.source === 'cb-export' || q.source === 'act-export';

// Whether the questions written for this app are mixed in with the official ones. Until someone chooses,
// their account decides: anyone invited to the shared library has the official questions and practises with
// those alone, and everyone else gets the written ones, which are all they have.
const invitedToLibrary = () => cloudLibrary.access === 'admin' || cloudLibrary.access === 'tester';
const includesWritten = () => (settings.questions === 'auto' ? !invitedToLibrary() : settings.questions === 'on');

// The questions a test practises with, worked out for any test so the sidebar can say what each one has.
function poolFor(id) {
  const own = allQuestions.filter(q => examsOfQuestion(q).includes(id));
  const borrow = !own.length && EXAMS[id].source === 'cb';
  const candidates = borrow ? allQuestions.filter(q => examsOfQuestion(q).includes('sat')) : own;
  // "Official only" leaves out the questions written for this app. A test with no official questions
  // yet keeps them anyway: switching it off there would leave nothing to practise at all, which helps
  // nobody, and the Library page says that is what happened.
  const official = candidates.filter(isOfficial);
  const wantsOfficial = !includesWritten();
  return { own, borrow, candidates, official, wantsOfficial, questions: dedupe(wantsOfficial && official.length ? official : candidates) };
}

let poolSizes = {};   // questions per test, for the test switcher

function choosePool() {
  const pools = Object.fromEntries(EXAM_IDS.map(id => [id, poolFor(id)]));
  poolSizes = Object.fromEntries(EXAM_IDS.map(id => [id, { count: pools[id].questions.length, borrowed: pools[id].borrow }]));
  const { own, borrow, candidates, official, wantsOfficial } = pools[examId];
  pool = pools[examId].questions;
  byId = new Map(pool.map(q => [q.id, q]));
  library = {
    ...library, own: own.length, borrowed: borrow && pool.length > 0,
    originalsHidden: wantsOfficial && official.length > 0,
    originalsKept: wantsOfficial && !official.length && candidates.length > 0,
  };
}

function setExam(id) {
  if (!EXAMS[id] || id === examId) return;
  examId = id;
  exam = EXAMS[id];
  progress = progressByExam[id];
  store.saveExam(id);
  session = null;
  choosePool();
  toast(`Switched to ${exam.long}`);
  render();
}

const sectionCount = section => pool.filter(q => q.section === section).length;
const allResponses = () => EXAM_IDS.flatMap(id => progressByExam[id].responses);

// The streak and today's count include study on any test.
function answeredToday() {
  const today = dayKey(Date.now());
  return allResponses().filter(r => dayKey(r.at) === today).length;
}

const streakDays = () => currentStreak(studyDays());

// The streak and today's count depend on the date, so the page catches up when the day changes: left open
// overnight it would otherwise go on showing yesterday's streak until something else redrew it.
let shownDay = dayKey(Date.now());
function catchUpWithTheDate() {
  const today = dayKey(Date.now());
  if (today === shownDay) return;
  shownDay = today;
  if (!session && ['home', 'scores', 'plan'].includes(currentRoute)) render({ quiet: true });
  else renderNav(currentRoute);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) catchUpWithTheDate(); });
setInterval(catchUpWithTheDate, 60 * 1000);

function daysUntilTest() {
  if (!progress.plan.testDate) return null;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${progress.plan.testDate}T00:00`) - start) / DAY_MS);
}

function sectionEstimate(section) {
  const answered = progress.responses.filter(r => r.section === section).length;
  if (!progress.placement?.[section] && answered < 5) return null;
  return projectSectionScore(sectionAbility(progress, section, exam), exam.scale);
}

function projectedTotal() {
  return totalScore(exam, Object.fromEntries(scoredSections(exam).map(s => [s.id, sectionEstimate(s.id)])));
}

const totalLabel = () => exam.total.label ?? 'Estimated total';
// Scored sections with no questions at all yet (the MCAT's, bar Chem/Phys, while they are being written). A
// total needs every section, so until they arrive the pages say that rather than asking for answers there.
const sectionsWithout = () => scoredSections(exam).filter(s => !sectionCount(s.id));
const listNames = names => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
function totalWaitingNote() {
  const missing = sectionsWithout();
  if (!missing.length) return null;
  // Test names are read letter by letter, so the article follows the sound of the first letter: an MCAT, a PSAT.
  const article = /^[AEFHILMNORSX]/.test(exam.name) ? 'An' : 'A';
  return `${article} ${exam.name} total needs all ${scoredSections(exam).length} sections, and ${listNames(missing.map(s => s.short))} questions are still being written. Until then, each section with questions gets its own estimate.`;
}
const masteryClass = p => (p < 0.45 ? 'low' : p < 0.7 ? 'mid' : 'high');
const masteryName = p => (p < 0.45 ? 'Needs work' : p < 0.7 ? 'Building' : 'Strong');

function clock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

// A one-line title for a question in a list, which has to stay useful when fifty of them sit in a column.
//
// Most stems are boilerplate: 55 questions in the current library begin "Which choice completes the text so
// that it conforms to the conventions of Standard English", and 23 are pure diagrams with no text at all.
// Titling by stem alone produced pages of identical rows. So the passage, which is what actually differs
// between questions, is preferred over the stem, and anything still ambiguous is qualified by its skill.
// An answer choice is never used: out of context "shrimp cocktail for meal B." reads as nonsense.
const BOILERPLATE = /^which choice (completes|best|most)|^which finding|^which quotation|^based on the texts/i;

function snippet(q) {
  const passage = q.passage?.replace(/\s+/g, ' ').trim();
  const stem = q.stem?.replace(/\s+/g, ' ').trim();
  const text = passage || (stem && !BOILERPLATE.test(stem) ? stem : null);
  if (!text) {
    // Nothing distinctive to show, so name what the question is about instead of repeating its boilerplate.
    const kind = q.promptImage ? 'Diagram or equation' : 'Question';
    return `${kind} · ${skillLabel(q.skill)}${q.difficulty ? ` · ${levelName(q.difficulty)}` : ''}`;
  }
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

// Questions built from exports keep math, graphs and tables as images (see scripts/build-questions.js).
// A question from the shared library names its picture by id instead, and the picture is fetched when it is
// first drawn (see showPictures); its width and height hold its place meanwhile, so nothing jumps.
function imgHtml(image, alt) {
  if (!image?.src && !image?.id) return '';
  const source = image.src ? `src="${esc(image.src)}" loading="lazy"` : `data-picture="${esc(image.id)}"`;
  return `<img class="qimg" ${source} alt="${esc(alt)}" width="${image.width}" height="${image.height}" style="--w:${Number(image.width) || 0}px">`;
}

// Fills in shared-library pictures wherever they are drawn — a question, a review, a finished test — and
// only as each comes near the screen. A finished test lists every question, answer and worked solution in
// folded sections; fetching all of those at once would spend hundreds of the free plan's reads on pictures
// nobody unfolds. A folded section takes no space on screen, so its pictures wait until it is opened.
const PICTURE = 'img[data-picture]:not([src])';

function loadPicture(img) {
  const id = img.dataset.picture;
  (haveImportedPicture(id) ? importedPictureUrl(id) : pictureUrl(id))
    .then(url => { img.src = url; })
    .catch(() => {
      img.alt = `${img.alt} (this picture could not load; check your connection and reload to try again)`;
      img.classList.add('qimg-missing');
    });
}

const nearScreen = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      nearScreen.unobserve(entry.target);
      loadPicture(entry.target);
    }
  }, { rootMargin: '600px 0px' })
  : null;

function showPictures(root) {
  const pictures = root.matches?.(PICTURE) ? [root] : root.querySelectorAll?.(PICTURE) ?? [];
  for (const img of pictures) nearScreen ? nearScreen.observe(img) : loadPicture(img);
}
new MutationObserver(changes => {
  for (const change of changes) for (const node of change.addedNodes) if (node.nodeType === 1) showPictures(node);
}).observe(document.body, { childList: true, subtree: true });

// A typed-in answer drawn as math in the export can't be checked automatically; the student compares
// their answer with the image and marks it. Placement and timed tests only use gradable questions.
const gradable = q => q.answer != null;
const answerText = q => (Array.isArray(q.answer) ? q.answer.join(' or ') : q.answer);

// A button that needs a second click within a few seconds, instead of a blocking confirm() dialog.
function confirmButton(sel, armedLabel, action) {
  on(sel, 'click', e => {
    const b = e.currentTarget;
    if (b.dataset.armed) return action();
    const original = b.textContent;
    b.dataset.armed = '1';
    b.textContent = armedLabel;
    setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = original; } }, 4000);
  });
}

// A short confirmation at the bottom of the screen ("Saved", "Synced").
let toastTimer = null;
function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---------- routing ----------

const ROUTES = {
  home: [viewHome, 'Dashboard'], scores: [viewScores, 'Scores'], start: [viewStart, 'Get started'],
  placement: [viewPlacement, 'Placement test'], placed: [viewPlaced, 'Placement results'], practice: [viewPractice, 'Practice'],
  test: [viewTest, 'Practice test'], review: [viewReview, 'Review'], mistakes: [viewMistakes, 'Mistakes'],
  plan: [viewPlan, 'Study plan'], library: [viewLibrary, 'Library'], resources: [viewResources, 'Resources'],
  settings: [viewSettings, 'Settings'], account: [viewAccount, 'Account'], import: [viewImport, 'Your own questions'],
  learn: [viewLearn, 'Lessons'],
};

// quiet: this redraw is not a reader's own navigation but the page catching up with something that
// arrived on its own, so it appears without the entry animation. Replaying that animation over a page
// somebody is already reading looks like the screen glitching.
function render({ quiet = false } = {}) {
  clearInterval(ticker);
  view.removeAttribute('data-loading'); // the app started, so index.html's load-error fallback stands down
  view.toggleAttribute('data-quiet', quiet);
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const route = ROUTES[name] ? name : 'home';
  // Leaving a running test keeps its clock going; bank the time spent and highlights on the open question.
  if (currentRoute === 'test' && route !== 'test' && test && !test.finished && !test.onBreak && $('#tq')) leaveQuestion();
  currentRoute = route;
  setMore(false);
  closePalette();
  if (!pool.length && ['practice', 'test', 'placement', 'placed'].includes(route)) return go('library');
  if (!progress.profile.mode && !['library', 'resources', 'settings', 'start', 'placement', 'placed', 'account', 'learn'].includes(route)) return go('start');
  if (session && !sessionBelongsTo(route)) session = null;
  document.title = `${ROUTES[route][1]} · ${exam.name} · ${APP_NAME}`;
  renderNav(route);
  if (!quiet) window.scrollTo(0, 0);   // a quiet redraw must not throw away where somebody was reading
  ROUTES[route][0](arg);
  // The attribute stays until the next render, which sets it again for what that render is. Taking it
  // off any earlier is what starts the animation: giving an element back an `animation` property runs
  // it, so clearing the flag a frame later made the page fade in a frame late instead of not at all.
}

// Draw one view again without the entry animation, for the same reason render's `quiet` exists. The
// flag is left set for render to clear, for the reason given there.
function quietly(draw) {
  view.toggleAttribute('data-quiet', true);
  draw();
}

function sessionBelongsTo(route) {
  return { placement: 'placement', practice: 'practice', review: 'review', mistakes: 'mistakes' }[route] === session.kind;
}

const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  scores: '<path d="M5 20v-8M12 20V5M19 20v-5"/><path d="M3 20h18"/>',
  practice: '<path d="M5 19l1-4L16.5 4.5l3 3L9 18z"/><path d="m14.5 6.5 3 3"/>',
  test: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.5 1.5M9.5 3h5"/>',
  review: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5V9H9"/>',
  plan: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  library: '<path d="M4 5h4v14H4zM9.5 5h4v14h-4z"/><path d="m15.2 5.8 3.4-.9 2.9 13.4-3.4.9z"/>',
  resources: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  chevron: '<path d="m14.5 6-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-2.9 1.9-5 3.6-6.8.6 2 1.8 3 3 3.4-.5-3.1.9-6 3.4-8 .4 3 2 4.6 3.3 6.3 1 1.4 1.7 3 1.7 5.1 0 3.8-3.1 6.6-7 6.6z"/>',
  more: '<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>',
  mistakes: '<path d="M12 4.5 20.5 19.5H3.5z"/><path d="M12 10v4M12 17h.01"/>',
  learn: '<path d="M4 5.5c2.7-1.1 5.3-.8 8 1 2.7-1.8 5.3-2.1 8-1V19c-2.7-1.1-5.3-.8-8 1-2.7-1.8-5.3-2.1-8-1z"/><path d="M12 6.5V20"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6"/>',
};
const icon = name => `<svg class="icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// The streak counts every day in a row with at least one answered question, on any test, with no upper limit.
// Progress toward today's question goal sits underneath it as a small bar.
function streakWidget(streak, today, goal, withTooltip = false) {
  const title = streak ? `${streak}-day streak` : 'No streak yet';
  const label = `${title}. ${today} of ${goal} questions today.`;
  const done = Math.min(100, Math.round((today / Math.max(1, goal)) * 100));
  return `<div class="streak${streak ? ' on' : ''}" role="img" aria-label="${label}"${withTooltip ? ` title="${label}"` : ''}>
      <span class="streak-count">${streak}</span>
      <span class="label"><strong>${title}</strong><span>${today >= goal ? `Goal met · ${today} today` : `${today} of ${goal} today`}</span><i class="goal-bar"><i style="width:${done}%"></i></i></span>
    </div>`;
}

// Every page opens with the same header: an eyebrow, the title, then the test switch, "Jump to" and page actions.
function pageHead(title, { eyebrow = '', actions = '' } = {}) {
  return `<header class="page-head">
      <div class="page-title">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${title}</h1></div>
      <div class="page-tools">
        <div class="exam-switch" role="group" aria-label="Test">${EXAM_IDS.map(id => `<button type="button" data-exam="${id}" aria-pressed="${id === examId}"${id === examId ? ' class="on"' : ''} title="${esc(EXAMS[id].long)}">${EXAMS[id].name}</button>`).join('')}</div>
        <button type="button" class="jump" data-palette>${icon('search')}<span>Jump to…</span><kbd>⌘K</kbd></button>
        ${actions}
      </div>
    </header>`;
}

// Which test is being studied, at the top of the sidebar, since the pages below it depend on it: the MCAT has
// Lessons, the PSAT/NMSQT a National Merit estimate, and so on. Opening it shows what each test has to offer.
// Collapsed, it shrinks to the test's short code, as the pages shrink to icons.
const TEST_CODES = { sat: 'SAT', psat: 'PSAT', psat89: '8/9', act: 'ACT', mcat: 'MCAT' };
let testMenuOpen = false;

function testSummary(id) {
  const size = poolSizes[id];
  if (!size) return '';
  const parts = [size.count ? `${size.count.toLocaleString()} questions` : 'no questions yet'];
  if (size.borrowed) parts[0] += ', borrowed from the SAT';
  if (LESSONS[id]?.length) parts.push('lessons');
  return parts.join(' · ');
}

function testPickerHtml(collapsed) {
  const tip = text => (collapsed ? ` title="${esc(text)}"` : '');
  return `<div class="test-picker${testMenuOpen ? ' open' : ''}">
      <button type="button" class="test-current" id="test-toggle" aria-expanded="${testMenuOpen}" aria-controls="test-menu"
        aria-label="Studying for ${esc(exam.long)}. Change test"${tip(`Studying for ${exam.long}`)}>
        <span class="test-code">${TEST_CODES[examId]}</span>
        <span class="label"><small>Studying for</small><strong>${esc(exam.long)}</strong></span>
        <svg class="icon test-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg>
      </button>
      <div class="test-menu" id="test-menu" role="group" aria-label="Tests"${testMenuOpen ? '' : ' hidden'}>
        ${EXAM_IDS.map(id => `<button type="button" data-exam="${id}" aria-pressed="${id === examId}"${id === examId ? ' class="on"' : ''}${tip(EXAMS[id].long)}>
          <span class="test-code">${TEST_CODES[id]}</span>
          <span class="label"><strong>${esc(EXAMS[id].long)}</strong><small>${testSummary(id)}</small></span>
        </button>`).join('')}
      </div>
    </div>`;
}

function setTestMenu(open) {
  testMenuOpen = open;
  const picker = side.querySelector('.test-picker');
  if (!picker) return;
  picker.classList.toggle('open', open);
  picker.querySelector('#test-toggle').setAttribute('aria-expanded', String(open));
  picker.querySelector('#test-menu').hidden = !open;
}

side.addEventListener('click', e => {
  if (e.target.closest('#test-toggle')) setTestMenu(!testMenuOpen);
  else if (e.target.closest('.test-menu [data-exam]')) testMenuOpen = false;   // the switch redraws the sidebar closed
});
document.addEventListener('click', e => { if (testMenuOpen && !e.target.closest('.test-picker')) setTestMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && testMenuOpen) { setTestMenu(false); side.querySelector('#test-toggle')?.focus(); }
});

// The sidebar on wide screens; a top bar, bottom tabs and a "More" sheet on phones.
function renderNav(active) {
  const due = dueMistakes(progress.mistakes).filter(id => byId.has(id)).length;
  const today = answeredToday();
  const goal = progress.plan.dailyGoal;
  const testRunning = test && !test.finished;
  const sync = syncConfigured ? syncState() : null;
  const syncText = !sync ? '' : !sync.account ? 'Sign in to sync' : sync.phase === 'error' ? 'Sync problem' : sync.lastSynced ? 'Synced' : 'Syncing…';
  const syncDot = !sync?.account ? '' : sync.phase === 'error' ? 'bad' : 'ok';
  const current = r => (r === active ? ' class="on" aria-current="page"' : '');
  const badge = r => (r === 'review' && due ? `<span class="badge">${due}</span>`
    : r === 'test' && testRunning ? '<span class="badge live">In progress</span>' : '');

  const links = [['home', 'Dashboard'], ['scores', 'Scores'], ['practice', 'Practice'], ...(lessonsHere().length ? [['learn', 'Lessons']] : []), ['test', 'Practice test'],
    ['review', 'Review'], ['mistakes', 'Mistakes'], ['plan', 'Study plan'], ['library', 'Library'],
    ['resources', 'Resources'], ['settings', 'Settings']];
  // Collapsed, the sidebar is a strip of icons; names move into tooltips and accessible labels.
  const collapsed = shell.classList.contains('collapsed');
  const tip = text => (collapsed ? ` title="${esc(text)}"` : '');
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const streak = streakDays();
  side.innerHTML = `
    <div class="side-head">
      <a class="brand" href="#/home">${APP_NAME}</a>
      <button type="button" class="collapse" id="collapse" aria-label="${toggleLabel}" title="${toggleLabel}" aria-expanded="${!collapsed}">${icon('chevron')}</button>
    </div>
    ${testPickerHtml(collapsed)}
    <nav class="side-nav" aria-label="Main">${links.map(([r, label]) => {
      const name = r === 'review' && due ? `${label}, ${due} due` : r === 'test' && testRunning ? `${label}, in progress` : label;
      return `<a href="#/${r}"${current(r)} aria-label="${name}"${tip(name)}>${icon(r)}<span class="label">${label}</span>${badge(r)}</a>`;
    }).join('')}</nav>
    ${streakWidget(streak, today, goal, collapsed)}
    ${sync ? `<a class="sync${active === 'account' ? ' on' : ''}" href="#/account" aria-label="${syncText}${sync.account ? `: ${esc(sync.account)}` : ''}"${tip(syncText)}><i class="dot ${syncDot}"></i><span class="label">${syncText}${sync.account ? `<small title="${esc(sync.account)}">${esc(sync.account)}</small>` : ''}</span></a>` : ''}`;

  topbar.innerHTML = `
    <a class="brand" href="#/home">${APP_NAME}</a>
    <a class="top-streak${streak ? ' on' : ''}" href="#/home" aria-label="${streak ? `${streak}-day streak` : 'No streak yet'}, ${today} of ${goal} questions today">${icon('flame')}<span>${streak}</span></a>
    ${sync ? `<a class="top-sync" href="#/account" aria-label="${syncText}"><i class="dot ${syncDot}"></i></a>` : ''}`;

  const tabLinks = [['home', 'Home'], ['practice', 'Practice'], ['test', 'Test'], ['review', 'Review']];
  const moreLinks = [['scores', 'Scores'], ...(lessonsHere().length ? [['learn', 'Lessons']] : []), ['mistakes', 'Mistakes'], ['plan', 'Study plan'], ['library', 'Library'],
    ['resources', 'Resources'], ['settings', 'Settings'], ...(sync ? [['account', sync.account ? 'Account' : 'Sign in']] : [])];
  const inMore = moreLinks.some(([r]) => r === active);
  tabs.innerHTML = `${tabLinks.map(([r, label]) => `<a href="#/${r}"${current(r)}>${icon(r)}<span>${label}</span>${badge(r)}</a>`).join('')}
    <button type="button" id="more-toggle"${inMore ? ' class="on"' : ''} aria-expanded="${!more.hidden}" aria-controls="more">${icon('more')}<span>More</span></button>`;
  more.innerHTML = moreLinks.map(([r, label]) => `<a href="#/${r}"${current(r)}>${label}<span aria-hidden="true">›</span></a>`).join('');
}

function toggleSidebar() {
  testMenuOpen = false;   // the chooser folds away with the sidebar, rather than staying open as a column of codes
  const collapsed = shell.classList.toggle('collapsed');
  try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  renderNav(currentRoute);
  document.getElementById('collapse')?.focus();
}

function setMore(open) {
  more.hidden = !open;
  document.getElementById('more-toggle')?.setAttribute('aria-expanded', String(open));
}

// "Jump to": search pages, the current test's skills, and the other tests.
function paletteItems() {
  const pages = [['home', 'Dashboard'], ['scores', 'Scores'], ['practice', 'Practice'], ...(lessonsHere().length ? [['learn', 'Lessons']] : []), ['test', 'Practice test'],
    ['review', 'Review'], ['mistakes', 'Mistakes'], ['plan', 'Study plan'], ['library', 'Library'],
    ['resources', 'Resources'], ['settings', 'Settings'], ...(syncConfigured ? [['account', 'Account']] : [])]
    .map(([route, label]) => ({ label, hint: 'Page', href: `#/${route}` }));
  const skills = exam.sections.flatMap(s => skillsOf(exam, s.id)
    .filter(k => pool.some(q => q.section === s.id && q.skill === k.name))
    .map(k => ({ label: skillLabel(k.name), hint: `Practice · ${s.name}`, skill: k.name, section: s.id })));
  const tests = EXAM_IDS.filter(id => id !== examId).map(id => ({ label: `Switch to ${EXAMS[id].long}`, hint: 'Test', exam: id }));
  return [...pages, ...skills, ...tests];
}

function openPalette() {
  let dialog = document.getElementById('palette');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'palette';
    dialog.className = 'palette';
    dialog.setAttribute('aria-label', 'Jump to');
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  if (dialog.open) return;
  const items = paletteItems();
  dialog.innerHTML = `<div class="palette-box">
      <input id="palette-input" type="search" placeholder="Jump to a page, skill or test" aria-label="Jump to" aria-controls="palette-list" autocomplete="off" spellcheck="false">
      <ul id="palette-list" role="listbox" aria-label="Results"></ul>
    </div>`;
  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ul');
  let active = 0;
  let shown = items;
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    shown = items.filter(i => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q)).slice(0, 12);
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((i, k) => `<li role="option" id="pal-${k}" data-k="${k}" aria-selected="${k === active}"><span>${esc(i.label)}</span><small>${esc(i.hint)}</small></li>`).join('')
      : '<li class="palette-empty">No matches</li>';
    if (shown.length) input.setAttribute('aria-activedescendant', `pal-${active}`);
    else input.removeAttribute('aria-activedescendant');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };
  const choose = item => {
    dialog.close();
    if (!item) return;
    if (item.exam) return setExam(item.exam);
    if (item.skill) {
      session = { kind: 'practice', section: item.section, skill: item.skill, done: 0, correct: 0, q: null };
      return go(`practice/${item.section}`);
    }
    location.hash = item.href;
  };
  input.addEventListener('input', () => { active = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { active = Math.min(shown.length - 1, active + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(shown[active]); }
  });
  list.addEventListener('click', e => {
    const li = e.target.closest('[data-k]');
    if (li) choose(shown[Number(li.dataset.k)]);
  });
  draw();
  dialog.showModal();
  input.focus();
}

function closePalette() {
  const dialog = document.getElementById('palette');
  if (dialog?.open) dialog.close();
}

document.addEventListener('click', e => {
  if (e.target.closest('#collapse')) return toggleSidebar();
  if (e.target.closest('#more-toggle')) return setMore(more.hidden);
  const examButton = e.target.closest('[data-exam]');
  if (examButton) return setExam(examButton.dataset.exam);
  if (e.target.closest('[data-palette]')) return openPalette();
  if (!more.hidden && (!e.target.closest('#more') || e.target.closest('#more a'))) setMore(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !more.hidden) setMore(false);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openPalette();
  }
});

// ---------- shared question rendering ----------

// A passage or figure goes in its own reading column, beside the question on wide screens like the real test.
function questionHtml(q, st = {}) {
  // An ACT science passage is tables and diagrams rather than prose, so it comes as a picture of the page.
  // It is built outside the branch below because those questions can themselves be a picture, and the
  // passage would be dropped along with the stem.
  const passagePicture = q.passageImage ? `<div class="passage-image">${imgHtml(q.passageImage, 'The passage, as printed in the booklet')}</div>` : '';
  const passage = q.passage || st.passageHtml
    ? `<div class="passage">${st.passageHtml ?? underline(para(q.passage), q.underline)}</div>` : '';
  const figures = (q.figures || []).map(src => `<img class="figure" src="${esc(src)}" alt="Figure for this question">`).join('');
  const reading = passagePicture || passage || figures ? `<div class="q-read">${passagePicture}${passage}${figures}</div>` : '';
  const prompt = q.promptImage
    ? `<div class="prompt-image">${imgHtml(q.promptImage, 'The question, as shown in the official export')}</div>`
    : `<div class="stem">${underline(para(q.stem), q.underline)}</div>`;
  let answer;
  if (q.choices) {
    answer = `<ol class="choices">${q.choices.map(c => {
      const cls = [
        st.selected === c.letter && 'selected',
        st.eliminated?.has(c.letter) && 'eliminated',
        st.revealed && c.letter === q.answer && 'correct',
        st.revealed && st.selected === c.letter && c.letter !== q.answer && 'wrong',
      ].filter(Boolean).join(' ');
      const tag = !st.revealed ? ''
        : c.letter === q.answer ? '<span class="tag ok">✓ Correct answer</span>'
        : st.selected === c.letter ? '<span class="tag bad">✗ Your answer</span>' : '';
      return `<li class="${cls}" data-letter="${c.letter}">
        <button class="choice-btn" data-choice="${c.letter}" ${st.revealed ? 'disabled' : ''}><span class="letter">${c.letter}</span>${c.image ? imgHtml(c.image, `Choice ${c.letter}`) : `<span>${inline(c.text)}</span>`}${tag}</button>
        ${st.tools ? `<button class="strike" data-strike="${c.letter}" title="Cross out choice ${c.letter}" aria-label="Cross out choice ${c.letter}">✕</button>` : ''}
      </li>`;
    }).join('')}</ol>`;
  } else {
    answer = `<label class="spr">Your answer
      <input data-spr value="${esc(st.selected ?? '')}" ${st.revealed ? 'disabled' : ''} autocomplete="off" spellcheck="false" placeholder="e.g. 12, 3/4, -2.5">
    </label>`;
  }
  let feedback = '';
  if (st.revealed) {
    const key = gradable(q)
      ? `The answer is ${esc(answerText(q))}.`
      : `<div class="answer-image">The correct answer: ${imgHtml(q.answerImage, 'The correct answer')}</div>`;
    const rationale = q.rationaleImage ? imgHtml(q.rationaleImage, 'Explanation') : q.rationale ? para(q.rationale) : '';
    feedback = st.correct == null
      ? `<div class="feedback pending"><strong>Compare your answer.</strong> ${key}
          <div class="actions"><button class="primary" data-self="1">I got it right</button><button data-self="0">I got it wrong</button></div></div>`
      : `<div class="feedback ${st.correct ? 'ok' : 'bad'}"><strong>${st.correct ? '✓ Correct.' : '✗ Not quite.'}</strong> ${key}
          ${rationale ? `<div class="rationale">${rationale}</div>` : ''}</div>`;
  }
  const original = st.revealed && q.original
    ? `<details class="original"><summary>View the original from the export</summary>${imgHtml(q.original, 'The original question')}</details>` : '';
  const meta = st.hideMeta ? '' : `<div class="meta">${esc(q.domain)} · ${esc(skillLabel(q.skill))}${q.difficulty ? ` · ${esc(levelName(q.difficulty))}` : ''}${q.source === 'demo' ? ' · demo' : ''}</div>`;
  return `<article class="question${reading ? ' split' : ''}">${meta}${reading}<div class="q-work">${prompt}${answer}${feedback}${original}</div></article>`;
}

// Wires up choice selection, crossing out and typed answers without re-rendering (so highlights survive).
function bindAnswerInputs(onChange, eliminated) {
  view.querySelectorAll('.choice-btn').forEach(btn => btn.addEventListener('click', () => {
    const letter = btn.dataset.choice;
    if (eliminated?.has(letter)) {
      eliminated.delete(letter);
      btn.closest('li').classList.remove('eliminated');
    }
    view.querySelectorAll('.choices li').forEach(li => li.classList.toggle('selected', li.dataset.letter === letter));
    onChange(letter);
  }));
  view.querySelectorAll('[data-strike]').forEach(b => b.addEventListener('click', () => {
    const letter = b.dataset.strike;
    const li = b.closest('li');
    if (eliminated.has(letter)) eliminated.delete(letter); else eliminated.add(letter);
    li.classList.toggle('eliminated', eliminated.has(letter));
    if (eliminated.has(letter) && li.classList.contains('selected')) {
      li.classList.remove('selected');
      onChange(null);
    }
  }));
  const input = view.querySelector('[data-spr]');
  if (input) {
    input.addEventListener('input', () => onChange(input.value.trim() || null));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') view.querySelector('.actions .primary:not(:disabled)')?.click(); });
  }
}

function record(q, choice, source, ms, selfMarked) {
  const correct = selfMarked ?? isCorrect(q, choice);
  progress.responses.push({
    qid: q.id, section: q.section, domain: q.domain, skill: q.skill, b: DIFFICULTY_B[q.difficulty] ?? 0,
    correct, choice: choice ?? null, ms, at: Date.now(), source,
  });
  if (source === 'review') reviewMistake(progress.mistakes, q.id, correct);
  else if (!correct) addMistake(progress.mistakes, q.id, progress.mistakes[q.id]?.reason ?? null);
  save();
  return correct;
}

function reasonPicker(qid) {
  const current = progress.mistakes[qid]?.reason;
  return `<div class="reasons"><span>Why did you miss it?</span>${MISTAKE_REASONS.map(r =>
    `<button class="chip ${r === current ? 'active' : ''}" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div>`;
}

function bindReasonPicker(qid) {
  on('[data-reason]', 'click', e => {
    if (!progress.mistakes[qid]) return;
    progress.mistakes[qid].reason = e.currentTarget.dataset.reason;
    progress.mistakes[qid].updatedAt = Date.now();
    save();
    view.querySelectorAll('[data-reason]').forEach(b => b.classList.toggle('active', b === e.currentTarget));
  });
}

// ---------- hints and explanations from Gemini ----------

// Available only when Firebase is configured and the student hasn't turned it off in Settings.
// Gemini answers signed-in students only: Firebase AI Logic's authenticated-users mode is enforced, so a request
// from someone signed out is refused. Rather than a button that can only fail, they get a link to sign in.
const signedIn = () => syncConfigured && Boolean(syncState().account);
// A student with their own Gemini key (Settings) uses their own allowance, so needs neither signing in nor the cap.
const aiReady = () => settings.explain === 'on' && (Boolean(ownKey()) || (explainConfigured && signedIn()));
const aiNeedsSignIn = () => explainConfigured && settings.explain === 'on' && syncConfigured && !signedIn() && !ownKey();

const aiNoteHtml = () => (aiReady() ? '<div class="ai-note" hidden></div>' : '');

// Gemini's free tier gives the whole site 20 requests a day (and 5 a minute) for the model the app uses, shared by
// every student, so each student gets a fair share of it a day. A hint or explanation already given is shown again
// from memory and costs nothing. Counted per account on each device; it resets at midnight.
const AI_DAILY_LIMIT = 5;
const aiCountKey = () => `satprep.ai.${syncState().uid ?? 'signed-out'}`;
function aiUsedToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(aiCountKey()));
    return saved?.day === dayKey(Date.now()) ? saved.used : 0;
  } catch {
    return 0;
  }
}
function countAiUse() {
  try { localStorage.setItem(aiCountKey(), JSON.stringify({ day: dayKey(Date.now()), used: aiUsedToday() + 1 })); } catch { /* storage unavailable */ }
}
const aiLeft = () => (ownKey() ? Infinity : Math.max(0, AI_DAILY_LIMIT - aiUsedToday()));
const aiLabel = (base, key) => (ownKey() || answeredBefore(key) ? base : aiLeft() ? `${base} · ${aiLeft()} left today` : `${base} · none left today`);
// A hint or explain button, labelled with what is left today and switched off once it has run out.
function aiButton(base, key, attrs) {
  const out = !aiLeft() && !answeredBefore(key);
  return `<button type="button" class="ghost small" ${attrs} data-base="${esc(base)}" data-key="${esc(key)}"${out ? ` disabled title="Gemini’s free allowance is shared by everyone, so each student gets ${AI_DAILY_LIMIT} a day. More tomorrow."` : ''}>${esc(aiLabel(base, key))}</button>`;
}

// Runs one request and shows the answer under the question. The button stays put and reports its own progress,
// so a slow reply never looks like nothing happened.
async function showAi(button, note, run, label) {
  const { base, key } = button.dataset;
  const free = key && answeredBefore(key);
  if (!free && !aiLeft()) {
    note.hidden = false;
    note.className = 'ai-note bad';
    note.textContent = `That’s today’s ${AI_DAILY_LIMIT} AI hints and explanations used. Gemini’s free allowance is shared by everyone, so they come back tomorrow.`;
    return;
  }
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Thinking…';
  note.hidden = false;
  note.className = 'ai-note thinking';
  note.textContent = 'Asking Gemini…';
  try {
    const text = await run();
    if (!free && !ownKey()) countAiUse();
    if (!note.isConnected) return;
    note.className = 'ai-note';
    note.innerHTML = `<strong>${esc(label)}</strong>${para(text)}<small>Written by Gemini, so it can be wrong — check it against the explanation.</small>`;
  } catch (err) {
    if (!note.isConnected) return;
    note.className = 'ai-note bad';
    note.textContent = err.message;
  } finally {
    if (button.isConnected) {
      button.textContent = base ? aiLabel(base, key) : original;
      button.disabled = Boolean(base) && !aiLeft() && !answeredBefore(key);
    }
  }
}

const newDrillState = () => ({ selected: null, eliminated: new Set(), revealed: false, correct: null, shownAt: Date.now() });

// One-question-at-a-time flow with instant feedback, shared by practice and review.
function renderDrill(headerHtml, source, rerender) {
  const { q, st } = session;
  const awaitingSelfMark = st.revealed && st.correct == null;
  view.innerHTML = `${headerHtml}
    ${questionHtml(q, { ...st, tools: !st.revealed })}
    ${st.correct === false ? reasonPicker(q.id) : ''}
    <div class="actions">${awaitingSelfMark ? ''
      : st.revealed ? '<button class="primary" id="next">Next question</button>'
      : `<button class="primary" id="check" ${st.selected == null ? 'disabled' : ''}>Check answer</button>`}
      ${aiReady() && !st.revealed ? aiButton('Give me a hint', hintKey(q), 'id="hint"') : ''}
      ${aiNeedsSignIn() && !st.revealed ? '<a class="small hint-signin" href="#/account">Sign in for hints</a>' : ''}
      ${aiReady() && st.revealed && st.correct != null ? aiButton('Explain this', explainKey(q, st.selected), 'id="explain"') : ''}
    </div>
    ${aiNoteHtml()}`;

  if (aiReady()) {
    on('#hint', 'click', e => showAi(e.currentTarget, $('.ai-note'), () => hintFor(q, { examName: exam.name }), 'Hint'));
    on('#explain', 'click', e => showAi(e.currentTarget, $('.ai-note'),
      () => explainQuestion(q, { chosen: st.selected, correct: st.correct, examName: exam.name }), 'Explanation'));
  }

  const finish = correct => {
    st.correct = record(q, st.selected, source, Date.now() - st.shownAt, correct);
    session.done++;
    if (st.correct) session.correct++;
  };

  if (!st.revealed) {
    bindAnswerInputs(v => { st.selected = v; $('#check').disabled = v == null; }, st.eliminated);
    on('#check', 'click', () => {
      st.revealed = true;
      if (gradable(q)) finish();
      rerender();
    });
  } else if (awaitingSelfMark) {
    on('[data-self]', 'click', e => { finish(e.currentTarget.dataset.self === '1'); rerender(); });
  } else {
    bindReasonPicker(q.id);
    on('#next', 'click', () => { session.q = null; rerender(); window.scrollTo(0, 0); });
    $('#next').focus({ preventScroll: true }); // keep the marked choices in view
  }
}

// ---------- start: placement or grade ----------

const importLink = '<a href="#/import">add question PDFs of your own</a>';

// How a difficulty and a starting year read on this test: the MCAT calls its tiers Foundation, Intermediate and
// Exam-level, and is taken in college rather than a school grade.
const levelName = level => exam.levelNames?.[level] ?? level;
// A skill's short name where it has one (the MCAT's official titles are too long to list); the full name
// stays the key that questions are filed under.
const SKILL_LABELS = new Map(EXAM_IDS.flatMap(id => EXAMS[id].domains.flatMap(d => d.skills.filter(k => k.short).map(k => [k.name, k.short]))));
const skillLabel = name => SKILL_LABELS.get(name) ?? name;
const gradeName = grade => exam.gradeNames?.[grade] ?? `Grade ${grade}`;
// A section's name where there is room for it; the MCAT's run to fifty characters, too long for a tab.
const sectionTab = s => (s.name.length > 30 ? s.short : s.name);

function addQuestionsHint() {
  // ACT questions come from ACT's own practice test booklets, which carry a scoring key at the back;
  // without that key a booklet has no answers and no reporting categories, so it cannot be read.
  if (exam.id === 'mcat') return 'MCAT questions are written for this app a section at a time, and more are on the way';
  return exam.source === 'act'
    ? `${importLink}, or save ACT practice test booklets, with the scoring keys at the back, in the <code>exports/act</code> folder and restart the app`
    : `${importLink}, or save ${exam.long} exports from the College Board Question Bank in the <code>exports</code> folder and restart the app`;
}

function viewStart() {
  // Only sections with questions can be placed; the rest are passed over (see finishPlacement), so they aren't
  // offered. For the MCAT that is, for now, Chem/Phys alone.
  const placementSections = scoredSections(exam).filter(s => sectionCount(s.id));
  const small = placementSections.some(s => sectionCount(s.id) < 15);
  view.innerHTML = `
    ${pageHead('How should we find your level?', { eyebrow: exam.long })}
    <p class="muted">Either way, practice keeps adapting to how you actually do. You can change this later.</p>
    ${syncConfigured && !syncState().account ? '<p class="note">Already studying on another device? <a href="#/account">Sign in</a> to bring your progress here.</p>' : ''}
    <div class="cards">
      <div class="card">
        <h2>Take the placement test</h2>
        <p>About ${PLACEMENT.minItems}–${PLACEMENT.maxItems} questions in each of ${placementSections.map(s => s.name).join(', ')}. Questions get harder or easier as you answer, and you'll get an estimated score range and a skill breakdown. Answers aren't shown during the test; any misses go to your Review list.</p>
        <button class="primary" id="placement" ${pool.length ? '' : 'disabled'}>Start placement test</button>
      </div>
      <div class="card">
        <h2>${exam.gradeNames ? 'Choose your year' : 'Choose your grade'}</h2>
        <p>${exam.gradeNames
          ? `Start at a typical level for where you are in college. Every topic is open from the start, because the ${exam.name} assumes the introductory science courses.`
          : 'Start at a typical level for your grade. Skills usually taught in later courses are held back until you take the placement test.'}</p>
        <div class="actions">
          <select id="grade" aria-label="${exam.gradeNames ? 'Year' : 'Grade'}">${exam.grades.map(g => `<option value="${g}" ${progress.profile.grade === g ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</select>
          <button id="use-grade">${exam.gradeNames ? 'Use this year' : 'Use this grade'}</button>
        </div>
      </div>
    </div>
    ${!pool.length ? `<p class="note">There are no ${exam.name} questions yet. To add them, ${addQuestionsHint()}.</p>`
      : library.borrowed ? `<p class="note">No ${exam.long} questions have been added yet, so practice uses SAT questions, which cover the same skills. To add ${exam.name} questions, ${addQuestionsHint()}.</p>`
      : small ? `<p class="note">Your ${exam.name} library is small (${placementSections.map(s => `${sectionCount(s.id)} ${s.name}`).join(', ')}), so placement results will be rough until you add more questions.</p>` : ''}`;
  on('#placement', 'click', () => {
    progress.profile.mode = 'placement';
    progress.placement = {};
    touch('profile', 'placement');
    save();
    session = null;
    go(`placement/${placementSections[0].id}`);
  });
  on('#use-grade', 'click', () => {
    progress.profile = { mode: 'grade', grade: Number($('#grade').value) };
    progress.placement = {};
    touch('profile', 'placement');
    save();
    toast('Saved');
    go('home');
  });
}

function viewPlacement(arg) {
  const sections = scoredSections(exam);
  const section = sections.some(s => s.id === arg) ? arg : sections[0].id;
  if (session?.kind !== 'placement' || session.section !== section) {
    session = { kind: 'placement', section, answered: [], q: null };
  }
  if (!session.q) {
    const step = nextPlacementQuestion(pool.filter(gradable), session.answered, section);
    if (step.done) return finishPlacement(section, step.estimate);
    session.q = step.question;
    session.st = newDrillState();
  }
  const { q, st } = session;
  view.innerHTML = `
    <header class="bar">
      <div><div class="eyebrow">Placement test · ${exam.name} · ${sectionName(section)}</div>
      <strong>Question ${session.answered.length + 1}</strong> <span class="muted">of at most ${PLACEMENT.maxItems}</span></div>
      <button class="ghost small" id="skip">${session.answered.length ? 'Finish this section now' : 'Skip this section'}</button>
    </header>
    ${questionHtml(q, { ...st, tools: true, hideMeta: true })}
    <div class="actions"><button class="primary" id="submit" disabled>Next</button></div>`;
  bindAnswerInputs(v => { st.selected = v; $('#submit').disabled = v == null; }, st.eliminated);
  on('#submit', 'click', () => {
    const correct = record(q, st.selected, 'placement', Date.now() - st.shownAt);
    session.answered.push({ qid: q.id, domain: q.domain, b: DIFFICULTY_B[q.difficulty] ?? 0, correct });
    session.q = null;
    viewPlacement(section);
    window.scrollTo(0, 0);
  });
  on('#skip', 'click', () => finishPlacement(section, session.answered.length ? estimateAbility(session.answered) : null));
}

function finishPlacement(section, estimate) {
  if (estimate && session.answered.length) {
    progress.placement = { ...progress.placement, [section]: { theta: estimate.theta, se: estimate.se, items: session.answered.length, finishedAt: Date.now() } };
    touch('placement');
    save();
  }
  session = null;
  const sections = scoredSections(exam).map(s => s.id);
  const next = sections[sections.indexOf(section) + 1];
  go(next ? `placement/${next}` : 'placed');
}

function viewPlaced() {
  const sections = scoredSections(exam);
  const placed = sections.filter(s => progress.placement?.[s.id]);
  if (!placed.length) {
    view.innerHTML = `${pageHead('Placement results', { eyebrow: exam.long })}<div class="empty"><h2>No placement results</h2><p>Every section was skipped. Choose a grade instead, or retake the placement test.</p><a class="button primary" href="#/start">Back</a></div>`;
    return;
  }
  const answers = placed.flatMap(s => progress.responses
    .filter(r => r.source === 'placement' && r.section === s.id).slice(-progress.placement[s.id].items));
  const byDomain = exam.domains.map(d => {
    const rs = answers.filter(r => r.domain === d.name);
    return { d, correct: rs.filter(r => r.correct).length, total: rs.length };
  }).filter(x => x.total);
  const scores = Object.fromEntries(placed.map(s => [s.id, projectSectionScore(progress.placement[s.id], exam.scale)]));
  const total = totalScore(exam, scores);
  view.innerHTML = `
    ${pageHead('Placement results', { eyebrow: exam.long })}
    <div class="cards">
      ${sections.map(s => `<div class="card"><div class="eyebrow">${s.name}</div>
        ${scores[s.id] ? `<div class="big">${scores[s.id].mid}</div><div class="range">likely ${range(scores[s.id])} · ${plural(progress.placement[s.id].items, 'question')}</div>` : '<p class="muted">Skipped</p>'}</div>`).join('')}
      ${total ? `<div class="card"><div class="eyebrow">${totalLabel()}</div><div class="big">${total.mid}</div><div class="range">likely ${range(total)}</div></div>` : ''}
    </div>
    <div class="card">
      <h2>By domain</h2>
      <div class="table-wrap"><table><thead><tr><th>Domain</th><th class="num">Correct</th></tr></thead>
      <tbody>${byDomain.map(x => `<tr><td>${esc(x.d.name)}</td><td class="num">${x.correct} / ${x.total}</td></tr>`).join('')}</tbody></table></div>
    </div>
    <p class="note">These ranges are estimates based on your answers and each question's difficulty. They are not official ${exam.maker} scores, and they get sharper as you keep practicing.</p>
    <div class="actions"><a class="button primary" href="#/practice">Start practicing</a><a class="button" href="#/home">Go to dashboard</a></div>`;
}

// ---------- practice ----------

// Every question available is served once before any of them comes round again, and the question just answered
// is never the next one, so practice never repeats itself while unseen questions are still waiting.
function pickPracticeQuestion(section) {
  session.served ||= new Set();
  const options = { skill: session.skill || undefined, exam, difficulty: settings.level === 'adaptive' ? undefined : settings.level };
  let q = nextPracticeQuestion(pool, progress, section, { ...options, exclude: session.served });
  if (!q && session.served.size) {
    session.served = new Set(session.lastId ? [session.lastId] : []);
    q = nextPracticeQuestion(pool, progress, section, { ...options, exclude: session.served });
  }
  if (q) {
    session.served.add(q.id);
    session.lastId = q.id;
  }
  return q;
}

function viewPractice(arg) {
  const section = sectionOf(exam, arg) ? arg : session?.kind === 'practice' ? session.section : exam.sections[0].id;
  if (session?.kind !== 'practice' || session.section !== section) {
    session = { kind: 'practice', section, skill: '', done: 0, correct: 0, q: null };
  }
  if (!session.q) {
    session.q = pickPracticeQuestion(section);
    session.st = newDrillState();
  }
  const skills = skillsOf(exam, section).filter(s => pool.some(q => q.section === section && q.skill === s.name));
  // Offered only where there is a real choice: every ACT question is "Medium", because ACT does not
  // publish difficulties, so picking a level there would change nothing.
  const levels = new Set(pool.filter(q => q.section === section).map(q => q.difficulty));
  const levelPicker = levels.size > 1 ? `
      <select id="level" aria-label="Difficulty">
        ${CHOICES.level.map(([value, label]) => `<option value="${value}" ${settings.level === value ? 'selected' : ''}>${value === 'adaptive' ? `Difficulty: ${label.toLowerCase()}` : levelName(value)}</option>`).join('')}
      </select>` : '';
  const header = `
    ${pageHead('Practice', { eyebrow: `${exam.long} · ${settings.level === 'adaptive' || levels.size < 2 ? 'adaptive practice' : `${levelName(settings.level).toLowerCase()} questions`}` })}
    <div class="bar">
      <div class="seg">${exam.sections.map(s => `<a href="#/practice/${s.id}" class="${s.id === section ? 'active' : ''}">${sectionTab(s)}</a>`).join('')}</div>
      <select id="skill" aria-label="Skill">
        <option value="">Adaptive: focus on weak spots</option>
        ${skills.map(s => `<option value="${esc(s.name)}" ${s.name === session.skill ? 'selected' : ''}>${esc(skillLabel(s.name))}</option>`).join('')}
      </select>${levelPicker}
      <span class="tally">${session.correct}/${session.done} this session · ${answeredToday()}/${progress.plan.dailyGoal} today</span>
    </div>`;
  if (!session.q) {
    view.innerHTML = `${header}<div class="empty"><h2>No ${sectionName(section)} questions available</h2><p>To add some, ${addQuestionsHint()}${progress.profile.mode === 'grade' ? ', or take the placement test to unlock skills beyond your grade' : ''}.</p><a class="button primary" href="#/library">Open Library</a></div>`;
  } else {
    renderDrill(header, 'practice', () => viewPractice(section));
  }
  on('#skill', 'change', e => {
    Object.assign(session, { skill: e.target.value, q: null, served: new Set(), lastId: null });
    viewPractice(section);
  });
  on('#level', 'change', e => {
    settings = { ...settings, level: e.target.value };
    saveSettings(settings);
    // The question on screen was chosen for the old level, so a new one is picked for the new level.
    Object.assign(session, { q: null, served: new Set(), lastId: null });
    viewPractice(section);
  });
}

// ---------- review ----------

function viewReview(arg) {
  if (arg === 'go') return reviewSession();
  session = null;
  const entries = Object.entries(progress.mistakes).filter(([id, m]) => byId.has(id) && !m.graduated && !m.removed).sort((a, b) => a[1].due - b[1].due);
  const due = entries.filter(([, m]) => m.due <= Date.now()).length;
  const reasons = {};
  for (const [, m] of entries) reasons[m.reason || 'Not tagged'] = (reasons[m.reason || 'Not tagged'] || 0) + 1;
  const maxReason = Math.max(1, ...Object.values(reasons));
  view.innerHTML = `
    ${pageHead('Review', { eyebrow: `${exam.long} · mistake log`, actions: `<button class="primary" id="go" ${due ? '' : 'disabled'}>Review ${plural(due, 'question')}</button>` })}
    <div class="cards">
      <div class="card"><div class="big">${due}</div><div class="muted">due now</div></div>
      <div class="card"><div class="big">${entries.length}</div><div class="muted">in your mistake log. Each one comes back after 1, 3, 7, 14 and 30 days until you've answered it right five times in a row.</div></div>
      <div class="card"><h3>Why you miss questions</h3>
        ${entries.length ? Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `
          <div class="skill-row"><span class="name">${esc(r)}</span><div class="track"><div class="fill" style="width:${(n / maxReason) * 100}%"></div></div><span class="pct">${n}</span></div>`).join('')
          : '<p class="muted">Nothing yet.</p>'}
      </div>
    </div>
    ${entries.length ? `<div class="card"><h2>Mistake log</h2><div class="table-wrap"><table class="stack">
      <thead><tr><th>Question</th><th>Skill</th><th>Difficulty</th><th>Reason</th><th>Next review</th></tr></thead>
      <tbody>${entries.map(([id, m]) => {
        const q = byId.get(id);
        return `<tr><td>${esc(snippet(q))}</td><td data-label="Skill">${esc(skillLabel(q.skill))}</td><td data-label="Difficulty">${esc(q.difficulty ? levelName(q.difficulty) : '—')}</td><td data-label="Reason">${esc(m.reason || '—')}</td><td data-label="Next review">${m.due <= Date.now() ? 'Now' : new Date(m.due).toLocaleDateString()}</td></tr>`;
      }).join('')}</tbody></table></div></div>` : ''}`;
  on('#go', 'click', () => go('review/go'));
}

function reviewSession() {
  if (session?.kind !== 'review') {
    session = { kind: 'review', queue: dueMistakes(progress.mistakes).filter(id => byId.has(id)), done: 0, correct: 0, q: null };
  }
  if (!session.q) {
    const id = session.queue.shift();
    if (!id) {
      view.innerHTML = `${pageHead('Review', { eyebrow: exam.long })}<div class="empty"><h2>Review complete</h2><p>${session.correct} of ${session.done} correct. Questions you got right come back later; misses return tomorrow.</p><a class="button primary" href="#/home">Back to dashboard</a></div>`;
      session = null;
      renderNav('review');
      return;
    }
    session.q = byId.get(id);
    session.st = newDrillState();
  }
  const header = `<header class="bar"><div><div class="eyebrow">Review · ${exam.name}</div><strong>${plural(session.queue.length + 1, 'question')} left</strong></div><span class="tally">${session.correct}/${session.done} correct</span></header>`;
  renderDrill(header, 'review', reviewSession);
}

// ---------- mistakes: everything you have ever missed ----------

// Review is the spaced-repetition queue: it decides what to bring back and when. This is the collection behind
// it — every question ever missed, kept so it can be looked through, read again, and drilled whenever the
// student feels like it rather than only when something is due.

const MISTAKE_FILTERS = [['all', 'All'], ['due', 'Due now'], ['learning', 'Still learning'], ['graduated', 'Learned']];
let mistakeView = { filter: 'all', section: 'all' };

const lastMiss = qid => [...progress.responses].reverse().find(r => r.qid === qid && !r.correct) ?? null;

function mistakeEntries() {
  return Object.entries(progress.mistakes)
    .filter(([id, m]) => byId.has(id) && !m.removed)
    .map(([id, m]) => ({ id, m, q: byId.get(id) }))
    .sort((a, b) => (a.m.graduated ? 1 : 0) - (b.m.graduated ? 1 : 0) || (a.m.due ?? 0) - (b.m.due ?? 0));
}

const matchesFilter = ({ m }) => (mistakeView.filter === 'all' ? true
  : mistakeView.filter === 'due' ? !m.graduated && m.due <= Date.now()
  : mistakeView.filter === 'learning' ? !m.graduated
  : Boolean(m.graduated));

function viewMistakes(arg) {
  if (arg === 'go') return mistakeDrill();
  session = null;
  const all = mistakeEntries();
  const sections = exam.sections.filter(s => all.some(e => e.q.section === s.id));
  if (!sections.some(s => s.id === mistakeView.section)) mistakeView.section = 'all';
  const shown = all.filter(e => matchesFilter(e) && (mistakeView.section === 'all' || e.q.section === mistakeView.section));
  const due = all.filter(e => !e.m.graduated && e.m.due <= Date.now()).length;
  const learning = all.filter(e => !e.m.graduated).length;
  const graduated = all.length - learning;
  const lapses = all.reduce((sum, e) => sum + (e.m.lapses || 0), 0);

  view.innerHTML = `
    ${pageHead('Mistakes', {
      eyebrow: `${exam.long} · everything you have missed`,
      actions: `<button class="primary" id="drill" ${shown.length ? '' : 'disabled'}>Practice ${plural(Math.min(shown.length, 20), 'question')}</button>`,
    })}
    <div class="kpis">
      <div class="kpi"><span class="eyebrow">Collected</span><strong>${all.length}</strong><span class="muted">${all.length === 1 ? 'question' : 'questions'} missed at least once</span></div>
      <div class="kpi"><span class="eyebrow">Still learning</span><strong>${learning}</strong><span class="muted">${due ? `${due} due now` : 'nothing due right now'}</span></div>
      <div class="kpi"><span class="eyebrow">Learned</span><strong>${graduated}</strong><span class="muted">answered right five times running</span></div>
      <div class="kpi"><span class="eyebrow">Total misses</span><strong>${lapses}</strong><span class="muted">including repeats of the same question</span></div>
    </div>
    ${all.length ? `
      <div class="filter-bar">
        <div class="chips" role="group" aria-label="Show">${MISTAKE_FILTERS.map(([id, label]) =>
          `<button type="button" class="chip${mistakeView.filter === id ? ' active' : ''}" data-mfilter="${id}" aria-pressed="${mistakeView.filter === id}">${label}</button>`).join('')}</div>
        ${sections.length > 1 ? `<div class="chips" role="group" aria-label="Section">${[['all', 'Both sections'], ...sections.map(s => [s.id, s.short])].map(([id, label]) =>
          `<button type="button" class="chip${mistakeView.section === id ? ' active' : ''}" data-msection="${id}" aria-pressed="${mistakeView.section === id}">${esc(label)}</button>`).join('')}</div>` : ''}
      </div>
      ${shown.length ? `<ol class="mistake-list">${shown.map(({ id, m, q }) => {
        const missed = lastMiss(id);
        const state = m.graduated ? '<span class="pill good">Learned</span>'
          : m.due <= Date.now() ? '<span class="pill due">Due now</span>'
          : `<span class="pill">Back ${new Date(m.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>`;
        return `<li>
          <details class="mistake">
            <summary>
              <span class="mistake-head">
                <span class="mistake-title">${esc(snippet(q))}</span>
                <span class="mistake-meta">${esc(skillLabel(q.skill))}${q.difficulty ? ` · ${esc(levelName(q.difficulty))}` : ''}${m.lapses > 1 ? ` · missed ${plural(m.lapses, 'time')}` : ''}${m.reason ? ` · ${esc(m.reason)}` : ''}</span>
              </span>
              ${state}
            </summary>
            <div class="mistake-body" data-qid="${esc(id)}">
              ${questionHtml(q, { selected: missed?.choice ?? null, revealed: true, correct: false, hideMeta: true })}
              ${reasonPicker(id)}
              <div class="actions"><button class="small" data-practice-skill="${esc(q.skill)}" data-practice-section="${q.section}">Practice this skill</button>${aiReady() ? aiButton('Explain this', explainKey(q, lastMiss(q.id)?.choice ?? null), 'data-explain') : ''}</div>
              ${aiNoteHtml()}
            </div>
          </details>
        </li>`;
      }).join('')}</ol>`
        : `<div class="empty"><h2>Nothing here</h2><p>No mistakes match that filter.</p></div>`}`
      : `<div class="empty"><h2>No mistakes yet</h2><p>Questions you get wrong in practice and on timed tests are collected here, so you can look back at them and drill them whenever you like.</p><a class="button primary" href="#/practice">Start practicing</a></div>`}`;

  on('[data-mfilter]', 'click', e => { mistakeView = { ...mistakeView, filter: e.currentTarget.dataset.mfilter }; viewMistakes(); });
  on('[data-msection]', 'click', e => { mistakeView = { ...mistakeView, section: e.currentTarget.dataset.msection }; viewMistakes(); });
  on('[data-practice-skill]', 'click', e => practiceSkill(e.currentTarget.dataset.practiceSection, e.currentTarget.dataset.practiceSkill));
  // Every open mistake has its own reason buttons, so each one is tagged with the question it belongs to.
  on('.mistake-body [data-reason]', 'click', e => {
    const body = e.currentTarget.closest('.mistake-body');
    const entry = progress.mistakes[body.dataset.qid];
    if (!entry) return;
    entry.reason = e.currentTarget.dataset.reason;
    entry.updatedAt = Date.now();
    save();
    body.querySelectorAll('[data-reason]').forEach(b => b.classList.toggle('active', b === e.currentTarget));
  });
  on('.mistake-body [data-explain]', 'click', e => {
    const body = e.currentTarget.closest('.mistake-body');
    const q = byId.get(body.dataset.qid);
    const missed = lastMiss(body.dataset.qid);
    showAi(e.currentTarget, body.querySelector('.ai-note'),
      () => explainQuestion(q, { chosen: missed?.choice ?? null, correct: false, examName: exam.name }), 'Explanation');
  });
  on('#drill', 'click', () => go('mistakes/go'));
}

// Drilling from here works like Review, except it takes whatever is on screen instead of only what is due.
function mistakeDrill() {
  if (session?.kind !== 'mistakes') {
    const queue = mistakeEntries()
      .filter(e => matchesFilter(e) && (mistakeView.section === 'all' || e.q.section === mistakeView.section))
      .slice(0, 20).map(e => e.id);
    session = { kind: 'mistakes', queue, done: 0, correct: 0, q: null };
  }
  if (!session.q) {
    const id = session.queue.shift();
    if (!id) {
      const { correct, done } = session;
      session = null;
      view.innerHTML = `${pageHead('Mistakes', { eyebrow: exam.long })}
        <div class="empty celebrate"><h2>${done && correct === done ? 'Every one right.' : 'Session complete'}</h2>
        <p>${correct} of ${done} correct. The ones you got right move further down your review schedule; the ones you missed come back tomorrow.</p>
        <div class="actions"><a class="button primary" href="#/mistakes">Back to mistakes</a><a class="button" href="#/home">Dashboard</a></div></div>`;
      renderNav('mistakes');
      return;
    }
    session.q = byId.get(id);
    session.st = newDrillState();
  }
  const header = `<header class="bar"><div><div class="eyebrow">Mistakes · ${exam.name}</div><strong>${plural(session.queue.length + 1, 'question')} left</strong></div><span class="tally">${session.correct}/${session.done} correct</span></header>`;
  renderDrill(header, 'review', mistakeDrill);
}

// ---------- timed practice test ----------

const testableCount = section => pool.filter(q => q.section === section && gradable(q)).length;
const hours = minutes => (minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`);
const sectionMinutes = list => list.reduce((sum, s) => sum + s.minutes * s.modules, 0);

function viewTest() {
  if (test && test.exam !== examId) {
    const other = EXAMS[test.exam];
    view.innerHTML = `
      ${pageHead('Practice test', { eyebrow: exam.long })}
      <div class="empty"><h2>Your ${other.name} practice test is still running</h2>
        <p>Its timer keeps going. Switch back to ${other.long} to finish it, or end it here.</p>
        <div class="actions"><button class="primary" data-exam="${test.exam}">Switch to ${other.name}</button><button id="end-test">End that test</button></div></div>`;
    confirmButton('#end-test', 'Click again to end it', () => { test = null; saveTest(); render(); });
    return;
  }
  if (test) {
    if (test.finished) return testResults();
    if (test.onBreak) return moduleBreak();
    return testScreen();
  }
  const scored = scoredSections(exam);
  const kinds = [
    ['FULL', `Full ${exam.name}`, scored.map(s => s.name).join(', then '), sectionMinutes(scored), scored],
    ...exam.sections.map(s => [s.id, s.name, s.modules > 1 ? 'Two modules' : `${s.perModule} questions${s.optional ? ' · optional' : ''}`, sectionMinutes([s]), [s]]),
  ];
  const intro = exam.adaptive
    ? `Built like the digital ${exam.name}. Each section has two modules. Module 1 mixes easy, medium and hard questions, and how you do on it decides whether module 2 is harder or easier. ${exam.sections.map(s => `${s.name} modules are ${s.perModule} questions in ${s.minutes} minutes`).join('; ')}.`
    : `Built like the ${exam.name}: each section is one timed block, in test-day order. ${exam.sections.map(s => `${s.name} is ${s.perModule} questions in ${s.minutes} minutes`).join('; ')}.${exam.sections.some(s => s.optional) ? ` ${exam.sections.filter(s => s.optional).map(s => s.name).join(' and ')} is optional and isn't part of the ${totalLabel()}.` : ''}`;
  const short = exam.sections.filter(s => testableCount(s.id) < s.perModule * s.modules);
  view.innerHTML = `
    ${pageHead('Timed practice test', { eyebrow: exam.long })}
    <p class="lede">${intro}</p>
    <div class="cards">
      ${kinds.map(([k, title, sub, minutes, list]) => `
        <div class="card"><h2>${title}</h2><p class="muted">${sub} · ${hours(minutes)}</p><button class="primary" data-test="${k}" ${list.every(s => testableCount(s.id)) ? '' : 'disabled'}>Start</button></div>`).join('')}
    </div>
    ${short.length ? `<p class="note">A full-length test needs ${short.map(s => `${s.perModule * s.modules} ${s.name}`).join(', ')} questions that can be scored automatically. You have ${short.map(s => `${testableCount(s.id)} ${s.name}`).join(', ')}, so sections will be shorter until you add more.</p>` : ''}
    ${progress.tests.length ? `<div class="card"><h2>Past tests</h2><div class="table-wrap"><table class="stack">
      <thead><tr><th>Date</th><th>Test</th>${scored.map(s => `<th>${s.name}</th>`).join('')}<th>${totalLabel()}</th></tr></thead>
      <tbody>${[...progress.tests].reverse().map(t => `<tr><td>${new Date(t.at).toLocaleDateString()}</td><td data-label="Test">${esc(t.kind)}</td>
        ${scored.map(s => `<td data-label="${s.name}">${t.summary[s.id] ? `${t.summary[s.id].score.mid}${t.summary[s.id].total ? ` <span class="muted">(${t.summary[s.id].correct}/${t.summary[s.id].total})</span>` : ''}` : '—'}</td>`).join('')}
        <td data-label="${totalLabel()}">${t.total ? t.total.mid : '—'}</td></tr>`).join('')}</tbody>
    </table></div></div>` : ''}`;
  on('[data-test]', 'click', e => startTest(e.currentTarget.dataset.test));
}

function startTest(kind) {
  test = {
    exam: examId,
    sections: kind === 'FULL' ? scoredSections(exam).map(s => s.id) : [kind], sIdx: 0, module: 1, route: null, used: new Set(), results: [],
    panel: null, hideTimer: false, seenBefore: new Set(progress.responses.map(r => r.qid)),
  };
  startModule();
  beginModule();
}

function startModule() {
  const s = test;
  const section = s.sections[s.sIdx];
  const format = sectionOf(exam, section);
  const usable = pool.filter(q => q.section === section && gradable(q));
  // A small library is split between a section's modules, so an adaptive module 2 still has questions to route to.
  const size = Math.min(format.perModule, Math.ceil(usable.length / format.modules));
  // Prefer questions not seen before this test, decided the same way for every module.
  const unseen = usable.filter(q => !s.seenBefore.has(q.id));
  const source = unseen.length >= size * format.modules ? unseen : usable;
  const questions = buildModule(source, section, s.module === 1 ? null : s.route, s.used, size, exam);
  questions.forEach(q => s.used.add(q.id));
  Object.assign(s, { section, questions, idx: 0, answers: {}, eliminated: {}, flags: new Set(), highlights: {}, times: {}, reviewScreen: false, gridOpen: false, highlightMode: false });
}

function beginModule() {
  const s = test;
  s.onBreak = false;
  s.endsAt = Date.now() + sectionOf(exam, s.section).minutes * 60 * 1000;
  saveTest();
  renderNav('test');
  testScreen();
}

function testScreen() {
  const s = test;
  const format = sectionOf(exam, s.section);
  const short = s.questions.length < format.perModule;
  const toolButton = (tool, label, attrs) => (format.tools.includes(tool) ? `<button class="ghost small ${attrs.active ? 'active' : ''}" ${attrs.html}>${label}</button>` : '');
  view.innerHTML = `
    <div class="test ${s.highlightMode ? 'highlighting' : ''}">
      <header class="test-bar">
        <div><strong>${format.name}</strong>${format.modules > 1 ? ` · Module ${s.module}` : ''}${short ? ` <span class="muted">(${plural(s.questions.length, 'question')})</span>` : ''}</div>
        <div><span id="timer" class="timer ${s.hideTimer ? 'concealed' : ''}"></span><button class="ghost small" id="toggle-timer">${s.hideTimer ? 'Show timer' : 'Hide'}</button></div>
        <div class="tools">
          ${toolButton('highlighter', 'Highlighter', { active: s.highlightMode, html: 'id="hl"' })}
          ${toolButton('calculator', 'Calculator', { active: s.panel === 'calc', html: 'data-panel="calc"' })}
          ${toolButton('reference', 'Reference', { active: s.panel === 'ref', html: 'data-panel="ref"' })}
        </div>
      </header>
      <div class="test-body ${s.panel ? 'with-panel' : ''}">
        <div id="tq"></div>
        <aside class="panel" id="panel" ${s.panel ? '' : 'hidden'}></aside>
      </div>
    </div>`;
  on('#toggle-timer', 'click', e => {
    s.hideTimer = !s.hideTimer;
    $('#timer').classList.toggle('concealed', s.hideTimer);
    e.currentTarget.textContent = s.hideTimer ? 'Show timer' : 'Hide';
  });
  on('#hl', 'click', e => {
    s.highlightMode = !s.highlightMode;
    e.currentTarget.classList.toggle('active', s.highlightMode);
    view.querySelector('.test').classList.toggle('highlighting', s.highlightMode);
  });
  on('[data-panel]', 'click', e => {
    const which = e.currentTarget.dataset.panel;
    s.panel = s.panel === which ? null : which;
    view.querySelectorAll('[data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === s.panel));
    view.querySelector('.test-body').classList.toggle('with-panel', !!s.panel);
    drawPanel();
  });
  drawPanel();
  s.shownAt = Date.now();
  drawQuestion();
  // Draw first: if time ran out while the student was on another page, tick submits the module right away.
  ticker = setInterval(tick, 1000);
  tick();
}

function tick() {
  if (!test || test.finished || test.onBreak || test.exam !== examId) return clearInterval(ticker);
  const left = test.endsAt - Date.now();
  const timer = document.getElementById('timer');
  if (timer) {
    timer.textContent = clock(left);
    timer.classList.toggle('warn', left <= 5 * 60 * 1000);
  }
  if (left <= 0) submitModule();
}

function drawPanel() {
  const panel = $('#panel');
  if (!panel) return;
  panel.hidden = !test.panel;
  if (test.panel === 'calc') mountCalculator(panel, () => test?.panel === 'calc' && panel.isConnected);
  else if (test.panel === 'ref') panel.innerHTML = REFERENCE_SHEET;
  else panel.innerHTML = '';
}

function leaveQuestion() {
  const s = test;
  const q = s.questions[s.idx];
  if (s.reviewScreen || !q) return;
  s.times[q.id] = (s.times[q.id] || 0) + Date.now() - s.shownAt;
  const passage = view.querySelector('.passage');
  if (passage) s.highlights[q.id] = passage.innerHTML;
}

function goToQuestion(i) {
  leaveQuestion();
  Object.assign(test, { idx: i, reviewScreen: false, gridOpen: false, shownAt: Date.now() });
  saveTest();
  drawQuestion();
  window.scrollTo(0, 0);
}

function drawQuestion() {
  const s = test;
  const tq = $('#tq');
  const unit = sectionOf(exam, s.section).modules > 1 ? 'module' : 'section';
  if (s.reviewScreen) {
    const unanswered = s.questions.filter(q => s.answers[q.id] == null).length;
    tq.innerHTML = `
      <div class="card">
        <h2>Check your work</h2>
        <p>${unanswered ? `<span class="warn">${plural(unanswered, 'question')} unanswered.</span> ` : 'Every question has an answer. '}${s.flags.size ? `${plural(s.flags.size, 'question')} flagged for review. ` : ''}Pick a question to revisit it, or submit the ${unit}. You can't come back to this ${unit} after submitting.</p>
        ${gridHtml()}
        <div class="actions"><button id="back-to-q">Back to questions</button><button class="primary" id="submit-module">Submit ${unit}</button></div>
      </div>`;
    bindGrid();
    on('#back-to-q', 'click', () => goToQuestion(s.questions.length - 1));
    confirmButton('#submit-module', 'Click again to submit', submitModule);
    return;
  }
  const q = s.questions[s.idx];
  const eliminated = (s.eliminated[q.id] ||= new Set());
  const last = s.idx === s.questions.length - 1;
  tq.innerHTML = `
    <div class="q-top">
      <span class="qnum">${s.idx + 1}</span>
      <button class="ghost small flag ${s.flags.has(q.id) ? 'on' : ''}" id="flag">${s.flags.has(q.id) ? '⚑ Flagged' : '⚐ Flag for review'}</button>
    </div>
    ${questionHtml(q, { selected: s.answers[q.id], eliminated, tools: true, hideMeta: true, passageHtml: s.highlights[q.id] })}
    <div class="test-foot">
      <button id="prev" ${s.idx === 0 ? 'disabled' : ''}>Back</button>
      <button class="ghost" id="grid-toggle">Question ${s.idx + 1} of ${s.questions.length} ${s.gridOpen ? '▾' : '▴'}</button>
      <button class="primary" id="next">${last ? `Review ${unit}` : 'Next'}</button>
    </div>
    ${s.gridOpen ? gridHtml() : ''}`;
  bindAnswerInputs(v => {
    if (v == null) delete s.answers[q.id]; else s.answers[q.id] = v;
    saveTest();
  }, eliminated);
  on('#flag', 'click', e => {
    if (s.flags.has(q.id)) s.flags.delete(q.id); else s.flags.add(q.id);
    saveTest();
    e.currentTarget.classList.toggle('on', s.flags.has(q.id));
    e.currentTarget.textContent = s.flags.has(q.id) ? '⚑ Flagged' : '⚐ Flag for review';
  });
  on('#prev', 'click', () => goToQuestion(s.idx - 1));
  on('#next', 'click', () => {
    if (!last) return goToQuestion(s.idx + 1);
    leaveQuestion();
    s.reviewScreen = true;
    drawQuestion();
  });
  on('#grid-toggle', 'click', () => { leaveQuestion(); s.shownAt = Date.now(); s.gridOpen = !s.gridOpen; drawQuestion(); });
  bindGrid();
  bindHighlighter();
}

function gridHtml() {
  const s = test;
  return `<div class="grid" role="navigation" aria-label="Questions">${s.questions.map((q, i) => {
    const cls = [s.answers[q.id] != null && 'answered', s.flags.has(q.id) && 'flagged', !s.reviewScreen && i === s.idx && 'current'].filter(Boolean).join(' ');
    return `<button class="${cls}" data-goto="${i}">${i + 1}</button>`;
  }).join('')}</div><p class="legend">Shaded: answered · ⚑ flagged</p>`;
}

function bindGrid() {
  on('[data-goto]', 'click', e => goToQuestion(Number(e.currentTarget.dataset.goto)));
}

function bindHighlighter() {
  const passage = view.querySelector('.passage');
  if (!passage) return;
  const highlightSelection = () => {
    if (!test.highlightMode) return;
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const selected = sel.getRangeAt(0);
    if (!passage.contains(selected.commonAncestorContainer)) return;
    try {
      selected.surroundContents(document.createElement('mark'));
    } catch {
      // Selections that cross paragraph boundaries can't be wrapped in a single element.
    }
    sel.removeAllRanges();
  };
  passage.addEventListener('mouseup', highlightSelection);
  // On touch screens the selection is final only once the finger lifts.
  passage.addEventListener('touchend', () => setTimeout(highlightSelection, 0));
  passage.addEventListener('click', e => {
    if (test.highlightMode && e.target.tagName === 'MARK') e.target.replaceWith(...e.target.childNodes);
  });
}

function submitModule() {
  const s = test;
  if (!s || s.finished || s.onBreak) return;
  clearInterval(ticker);
  leaveQuestion();
  const format = sectionOf(exam, s.section);
  const responses = s.questions.map(q => {
    const choice = s.answers[q.id] ?? null;
    const correct = record(q, choice, 'test', s.times[q.id] || 0);
    return { qid: q.id, correct, choice, domain: q.domain, b: DIFFICULTY_B[q.difficulty] ?? 0 };
  });
  s.results.push({ section: s.section, module: s.module, route: s.module === 2 ? s.route : null, responses });
  if (format.modules > 1 && s.module === 1) {
    s.route = routeFor(responses);
    s.module = 2;
  } else {
    s.sIdx++;
    s.module = 1;
    s.route = null;
  }
  if (s.sIdx >= s.sections.length) return finishTest();
  startModule();
  // Too few questions left for this module (a small library): skip straight past it.
  if (!s.questions.length) return submitModule();
  s.onBreak = true;
  saveTest();
  moduleBreak();
}

function moduleBreak() {
  const s = test;
  const format = sectionOf(exam, s.section);
  const newSection = s.module === 1;
  const nextLabel = `${format.name}${format.modules > 1 ? `, module ${s.module}` : ''}`;
  const why = !newSection ? 'Module 2 has been chosen based on your module 1 results.'
    : exam.adaptive ? 'On the real test there is a 10-minute break between sections.'
    : 'On test day the next section follows right after.';
  view.innerHTML = `<div class="empty">
    <h2>${newSection ? 'Section complete' : 'Module 1 complete'}</h2>
    <p>Up next: <strong>${nextLabel}</strong> · ${plural(s.questions.length, 'question')} · ${format.minutes} minutes.</p>
    <p class="muted">${why} The timer starts when you continue.</p>
    <button class="primary" id="continue">Continue</button></div>`;
  on('#continue', 'click', beginModule);
}

function finishTest() {
  const s = test;
  const summary = {};
  for (const section of s.sections) {
    const rs = s.results.filter(r => r.section === section).flatMap(r => r.responses);
    if (!rs.length) continue;
    summary[section] = {
      correct: rs.filter(r => r.correct).length,
      total: rs.length,
      route: s.results.find(r => r.section === section && r.module === 2 && r.responses.length)?.route ?? null,
      score: projectSectionScore(estimateAbility(rs), exam.scale),
    };
  }
  const full = scoredSections(exam).every(sec => s.sections.includes(sec.id));
  s.record = {
    id: `t${Date.now()}`, at: Date.now(), kind: full ? `Full ${exam.name}` : sectionName(s.sections[0]), summary,
    total: full ? totalScore(exam, Object.fromEntries(Object.entries(summary).map(([id, x]) => [id, x.score]))) : null,
    qids: s.results.flatMap(r => r.responses.map(x => x.qid)),
  };
  progress.tests.push(s.record);
  save();
  s.finished = true;
  saveTest();
  renderNav('test');
  testResults();
}

function testResults() {
  const s = test;
  const { summary, total } = s.record;
  const all = s.results.flatMap(r => r.responses.map(x => ({ ...x, section: r.section, module: r.module })));
  const domainRows = exam.domains.map(d => {
    const rs = all.filter(r => r.domain === d.name);
    return rs.length ? `<tr><td>${esc(d.name)}</td><td class="num">${rs.filter(r => r.correct).length} / ${rs.length}</td></tr>` : '';
  }).join('');
  view.innerHTML = `
    ${pageHead('Test results', { eyebrow: `${exam.long} · ${esc(s.record.kind)}` })}
    <div class="cards">
      ${Object.entries(summary).map(([sec, x]) => `<div class="card"><div class="eyebrow">${sectionName(sec)}</div>
        <div class="big">${x.score.mid}</div><div class="range">likely ${range(x.score)}</div>
        <p class="muted">${x.correct} of ${x.total} correct${x.route ? ` · you were routed to the ${x.route === 'hard' ? 'harder' : 'easier'} module 2` : ''}</p></div>`).join('')}
      ${total ? `<div class="card"><div class="eyebrow">${totalLabel()}</div><div class="big">${total.mid}</div><div class="range">likely ${range(total)}</div></div>` : ''}
    </div>
    <div class="card"><h2>By domain</h2><div class="table-wrap"><table><tbody>${domainRows}</tbody></table></div></div>
    <p class="note">Scores are estimates from your answers and question difficulty, not ${exam.maker}'s official scoring. Missed questions have been added to Review.</p>
    <h2>Every question</h2>
    ${all.map((r, i) => {
      const q = byId.get(r.qid);
      if (!q) return '';
      const where = `${sectionShort(r.section)}${sectionOf(exam, r.section).modules > 1 ? ` M${r.module}` : ''}`;
      return `<details class="review-item"><summary><span class="${r.correct ? 'mark-ok' : 'mark-bad'}">${r.correct ? '✓' : '✗'}</span>
        <span>${i + 1}. ${where} · ${esc(skillLabel(q.skill))}${q.difficulty ? ` · ${levelName(q.difficulty)}` : ''}${r.choice == null ? ' · <span class="warn">unanswered</span>' : ''}</span></summary>
        ${questionHtml(q, { selected: r.choice, revealed: true, correct: r.correct, hideMeta: true })}</details>`;
    }).join('')}
    <div class="actions"><button class="primary" id="done">Done</button></div>`;
  on('#done', 'click', () => { test = null; saveTest(); go('scores'); });
}

const REFERENCE_SHEET = `<div class="ref"><h3>Formulas</h3><p class="hint">Modeled on the SAT Suite math reference sheet.</p><dl>
  <dt>Circle</dt><dd>Area A = πr² · Circumference C = 2πr</dd>
  <dd>A circle has 360° of arc, or 2π radians</dd>
  <dt>Rectangle</dt><dd>A = ℓw</dd>
  <dt>Triangle</dt><dd>A = ½bh · angles sum to 180°</dd>
  <dt>Pythagorean theorem</dt><dd>a² + b² = c²</dd>
  <dt>Special right triangles</dt><dd>30°-60°-90°: x, x√3, 2x</dd><dd>45°-45°-90°: s, s, s√2</dd>
  <dt>Volume</dt><dd>Rectangular prism V = ℓwh</dd><dd>Cylinder V = πr²h</dd><dd>Sphere V = (4/3)πr³</dd><dd>Cone V = (1/3)πr²h</dd><dd>Pyramid V = (1/3)ℓwh</dd>
</dl></div>`;

// ---------- dashboard: today's plan, skills table, and an at-a-glance rail ----------

let skillTable = { filter: 'all', sort: 'mastery', dir: 1 };

function weakestSkills(n) {
  return exam.sections.flatMap(sec => skillAbilities(progress, sec.id, exam).filter(s => s.answered >= 2))
    .sort((a, b) => a.theta - b.theta).slice(0, n);
}

const studyDays = () => new Set(allResponses().map(r => dayKey(r.at)));

const bestStreak = () => longestStreak(studyDays());

function practiceSkill(section, skill) {
  session = { kind: 'practice', section, skill, done: 0, correct: 0, q: null };
  go(`practice/${section}`);
}

// Today's plan: due reviews, then the rest of the daily goal split across the two weakest skills, then a timed
// section if none has been taken in the last week.
function todaysPlan() {
  const today = dayKey(Date.now());
  const due = dueMistakes(progress.mistakes).filter(id => byId.has(id)).length;
  const reviewedToday = progress.responses.some(r => r.source === 'review' && dayKey(r.at) === today);
  const goal = progress.plan.dailyGoal;
  const left = Math.max(0, goal - answeredToday());
  const tasks = [];
  if (due || reviewedToday) {
    tasks.push({ label: due ? `Clear ${plural(due, 'review question')}` : 'Clear review questions', minutes: Math.ceil(due * 1.2), done: !due, run: () => go('review/go') });
  }
  const focus = weakestSkills(2);
  if (!left) {
    tasks.push({ label: `${goal} practice questions`, done: true });
  } else if (focus.length) {
    const first = focus.length > 1 ? Math.ceil(left / 2) : left;
    focus.forEach((skill, k) => {
      const count = k === 0 ? first : left - first;
      if (count > 0) tasks.push({ label: `${plural(count, 'question')} · ${skillLabel(skill.name)}`, minutes: Math.ceil(count * 1.2), done: false, run: () => practiceSkill(skill.section, skill.name) });
    });
  } else {
    const section = exam.sections[0];
    tasks.push({ label: `${plural(left, 'practice question')} · ${section.name}`, minutes: Math.ceil(left * 1.2), done: false, run: () => go(`practice/${section.id}`) });
  }
  const lastTest = progress.tests[progress.tests.length - 1];
  if (pool.length && (!lastTest || Date.now() - lastTest.at > 7 * DAY_MS)) {
    const section = scoredSections(exam)[0];
    tasks.push({ label: `Timed ${section.name} section`, minutes: sectionMinutes([section]), done: false, run: () => go('test') });
  }
  return tasks;
}

function viewHome() {
  if (test?.finished) { test = null; saveTest(); }
  const days = daysUntilTest();
  const tasks = todaysPlan();
  const next = tasks.find(t => !t.done);
  const done = tasks.filter(t => t.done).length;
  const minutesLeft = tasks.filter(t => !t.done).reduce((sum, t) => sum + (t.minutes || 0), 0);
  const eyebrow = `${exam.long}${days == null ? '' : days >= 0 ? ` · ${plural(days, 'day')} to test day` : ' · test date passed'}`;
  view.innerHTML = `
    ${pageHead('Dashboard', { eyebrow })}
    <div class="ws-grid">
      <div class="ws-main">
        <section class="plan-card" aria-labelledby="plan-title">
          <div class="plan-top">
            <div>
              <p class="eyebrow">Today’s plan${minutesLeft ? ` · about ${minutesLeft} min left` : ''}</p>
              <h2 id="plan-title">${next ? `${done} of ${tasks.length} done. Next: ${esc(next.label)}` : 'Today’s plan is done. Nice work.'}</h2>
            </div>
            ${next ? `<button class="primary" data-task="${tasks.indexOf(next)}">${done ? 'Continue' : 'Start'}</button>` : '<a class="button" href="#/practice">Practice more</a>'}
          </div>
          <ul class="tasks">${tasks.map((t, k) => `<li class="${t.done ? 'done' : ''}">
            <span class="task-check" aria-hidden="true">${t.done ? '✓' : ''}</span>
            ${t.done || !t.run ? `<span class="task-label">${esc(t.label)}</span>` : `<button type="button" class="task-label link" data-task="${k}">${esc(t.label)}</button>`}
            <small>${t.done ? 'done' : t.minutes ? `${t.minutes} min` : ''}</small>
          </li>`).join('')}</ul>
        </section>
        ${skillsTableHtml()}
        <p class="hint">Mastery is your estimated chance of answering ${levelName('Medium') === 'Medium' ? 'a Medium' : `an ${levelName('Medium')}`} question in that skill correctly. Scores are estimates, not official ${exam.maker} scores. ${progress.profile.mode === 'grade' ? `Starting level: ${gradeName(progress.profile.grade).toLowerCase()}` : 'Starting level: placement test'} · <a href="#/start">change</a></p>
      </div>
      <aside class="ws-rail" aria-label="At a glance">${railHtml(days)}</aside>
    </div>`;
  on('[data-task]', 'click', e => tasks[Number(e.currentTarget.dataset.task)]?.run?.());
  bindSkillsTable();
}

function skillRows() {
  return exam.sections.flatMap(sec => skillAbilities(progress, sec.id, exam)
    .filter(s => s.answered || pool.some(q => q.section === sec.id && q.skill === s.name))
    .map(s => ({
      ...s, sectionShort: sec.short,
      mastery: s.answered ? pCorrect(s.theta, DIFFICULTY_B.Medium) : null,
      accuracy: s.answered ? s.correct / s.answered : null,
    })));
}

function skillsTableHtml() {
  const { filter, sort, dir } = skillTable;
  const showSection = exam.sections.length > 1 && filter === 'all';
  const rows = skillRows().filter(r => filter === 'all' || r.section === filter);
  const value = r => (sort === 'skill' ? r.name : r[sort]);
  rows.sort((a, c) => {
    const x = value(a);
    const y = value(c);
    if (x == null && y == null) return a.name.localeCompare(c.name);
    if (x == null) return 1;
    if (y == null) return -1;
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir;
  });
  const th = (key, label, cls = '') => `<th class="${cls}" aria-sort="${sort === key ? (dir === 1 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sort" data-sort="${key}">${label}<span aria-hidden="true">${sort === key ? (dir === 1 ? ' ↑' : ' ↓') : ''}</span></button></th>`;
  return `<section class="table-card" aria-labelledby="skills-title">
      <div class="table-card-head">
        <h2 id="skills-title">Skills</h2>
        <div class="chips" role="group" aria-label="Show section">${[['all', 'All'], ...exam.sections.map(s => [s.id, s.short])].map(([id, label]) => `<button type="button" class="chip${filter === id ? ' active' : ''}" data-filter="${id}" aria-pressed="${filter === id}">${esc(label)}</button>`).join('')}</div>
      </div>
      <div class="table-wrap"><table class="skills-table stack">
        <thead><tr>${th('skill', 'Skill')}${showSection ? '<th>Section</th>' : ''}${th('mastery', 'Mastery')}${th('accuracy', 'Accuracy', 'num')}${th('answered', 'Answered', 'num')}<th><span class="visually-hidden">Practice</span></th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr>
          <td>${esc(skillLabel(r.name))}</td>
          ${showSection ? `<td data-label="Section">${esc(r.sectionShort)}</td>` : ''}
          <td data-label="Mastery">${r.mastery == null ? '<span class="muted">not started</span>' : `<span class="mastery"><span class="track"><span class="fill ${masteryClass(r.mastery)}" style="width:${Math.round(r.mastery * 100)}%"></span></span><span class="pct">${Math.round(r.mastery * 100)}%</span></span>`}</td>
          <td class="num" data-label="Accuracy">${r.accuracy == null ? '—' : `${Math.round(r.accuracy * 100)}%`}</td>
          <td class="num" data-label="Answered">${r.answered}</td>
          <td class="num"><button type="button" class="small" data-skill="${esc(r.name)}" data-section="${r.section}" aria-label="Practice ${esc(skillLabel(r.name))}">Practice</button></td>
        </tr>`).join('') : '<tr><td colspan="6" class="muted">No skills with questions yet.</td></tr>'}</tbody>
      </table></div>
    </section>`;
}

function bindSkillsTable() {
  on('.table-card [data-filter]', 'click', e => { skillTable = { ...skillTable, filter: e.currentTarget.dataset.filter }; redrawSkillsTable(); });
  on('.table-card [data-sort]', 'click', e => {
    const key = e.currentTarget.dataset.sort;
    const firstDir = key === 'answered' ? -1 : 1;
    skillTable = { ...skillTable, sort: key, dir: skillTable.sort === key ? -skillTable.dir : firstDir };
    redrawSkillsTable(key);
  });
  on('.table-card [data-skill]', 'click', e => practiceSkill(e.currentTarget.dataset.section, e.currentTarget.dataset.skill));
}

function redrawSkillsTable(focusSort) {
  const card = $('.table-card');
  if (!card) return;
  card.outerHTML = skillsTableHtml();
  bindSkillsTable();
  (focusSort ? $(`.table-card [data-sort="${focusSort}"]`) : $('.table-card [data-filter][aria-pressed="true"]'))?.focus();
}

function railHtml(days) {
  const streak = streakDays();
  const studied = studyDays();
  const week = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); return d; });
  const total = projectedTotal();
  const target = progress.plan.target;
  const queue = Object.entries(progress.mistakes).filter(([id, m]) => byId.has(id) && !m.graduated && !m.removed).sort((a, b) => a[1].due - b[1].due).slice(0, 3);
  const dueLabel = at => (at <= Date.now() ? 'now' : new Date(at).toLocaleDateString(undefined, { weekday: 'short' }));
  const testDay = progress.plan.testDate && new Date(`${progress.plan.testDate}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `
    <section class="rail-card">
      <h2 class="rail-label">Streak</h2>
      <p class="rail-big">${plural(streak, 'day')}<small>best ${plural(Math.max(streak, bestStreak()), 'day')}</small></p>
      <ol class="week" aria-label="Days studied this week">${week.map(d => {
        const on = studied.has(dayKey(d));
        return `<li class="${on ? 'on' : ''}"><i></i><span aria-hidden="true">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span><span class="visually-hidden">${d.toLocaleDateString(undefined, { weekday: 'long' })}: ${on ? 'studied' : 'no study'}</span></li>`;
      }).join('')}</ol>
    </section>
    <section class="rail-card">
      <h2 class="rail-label">${totalLabel()}</h2>
      ${total ? `<p class="rail-big">${total.mid}<small>likely ${range(total)}</small></p>
        <p class="hint">${target ? (total.mid >= target ? `At or above your ${target} target` : `${plural(target - total.mid, 'point')} to your ${target} target`) : '<a href="#/plan">Set a target</a>'}</p>`
        : `<p class="hint">${totalWaitingNote() ?? 'Answer a few questions in every section to see an estimate.'}</p>`}
      <a class="rail-link" href="#/scores">See scores</a>
    </section>
    <section class="rail-card">
      <h2 class="rail-label">Review queue</h2>
      ${queue.length ? `<ul class="queue">${queue.map(([id, m]) => `<li><span>${esc(skillLabel(byId.get(id).skill))}</span><span>${dueLabel(m.due)}</span></li>`).join('')}</ul>`
        : '<p class="hint">Nothing to review. Questions you miss land here.</p>'}
    </section>
    <section class="rail-card">
      <h2 class="rail-label">Test day</h2>
      ${testDay ? `<p class="rail-big">${testDay}<small>${days >= 0 ? plural(days, 'day') + ' away' : 'date passed'}</small></p>` : '<p class="hint"><a href="#/plan">Set your test date</a></p>'}
    </section>`;
}

// ---------- scores: the score report ----------

function viewScores() {
  const total = projectedTotal();
  const target = progress.plan.target;
  const history = progress.tests.filter(t => t.total);
  const weekAgo = Date.now() - 7 * DAY_MS;
  const thisWeek = progress.responses.filter(r => r.at > weekAgo).length;
  const lastWeek = progress.responses.filter(r => r.at <= weekAgo && r.at > weekAgo - 7 * DAY_MS).length;
  const recent = progress.responses.slice(-100);
  const accuracy = recent.length ? Math.round((recent.filter(r => r.correct).length / recent.length) * 100) : null;
  const due = dueMistakes(progress.mistakes).filter(id => byId.has(id)).length;
  const streak = streakDays();
  view.innerHTML = `
    ${pageHead('Scores', { eyebrow: exam.long, actions: '<a class="button" href="#/test">Take a timed test</a>' })}
    <section class="score-hero">
      <div>
        <p class="eyebrow">${totalLabel()}</p>
        ${total ? `<p class="hero-score">${total.mid}</p>
          <p class="muted">likely ${range(total)}${target ? ` · ${total.mid >= target ? 'at or above your target' : `${plural(target - total.mid, 'point')} to your ${target} target`}` : ''}</p>
          ${scaleHtml(total, target)}`
          : `<p class="hero-empty">${totalWaitingNote() ? 'Not available yet' : 'Not enough answers yet'}</p><p class="muted">${totalWaitingNote() ?? `Answer at least five questions in each of ${listNames(scoredSections(exam).map(s => s.name))}, or take the placement test, to see an estimate.`}</p>`}
      </div>
      ${trendHtml(history, target)}
    </section>
    <div class="kpis">
      <div class="kpi"><span class="eyebrow">Streak</span><strong>${plural(streak, 'day')}</strong><span class="muted">best ${plural(Math.max(streak, bestStreak()), 'day')}</span></div>
      <div class="kpi"><span class="eyebrow">This week</span><strong>${thisWeek}</strong><span class="muted">${thisWeek === 1 ? 'question' : 'questions'}${thisWeek || lastWeek ? ` · ${thisWeek >= lastWeek ? '▲' : '▼'} ${Math.abs(thisWeek - lastWeek)} vs last week` : ''}</span></div>
      <div class="kpi"><span class="eyebrow">Accuracy</span><strong>${accuracy == null ? '—' : `${accuracy}%`}</strong><span class="muted">${recent.length ? `last ${plural(recent.length, 'answer')}` : 'no answers yet'}</span></div>
      <div class="kpi"><span class="eyebrow">Review due</span><strong>${due}</strong><span class="muted">${due ? `about ${Math.ceil(due * 1.2)} min` : 'all caught up'}</span></div>
    </div>
    <div class="section-scores">${exam.sections.map(s => {
      const estimate = sectionEstimate(s.id);
      return `<div class="kpi"><span class="eyebrow">${sectionTab(s)}${s.optional ? ' · optional' : ''}</span>${estimate ? `<strong>${estimate.mid}</strong><span class="muted">likely ${range(estimate)}</span>` : '<span class="muted">Not enough answers yet</span>'}</div>`;
    }).join('')}</div>
    ${exam.id === 'psat' ? nationalMeritHtml() : ''}
    ${exam.id === 'mcat' ? officialScoresHtml() : ''}
    <div class="skill-lists">${exam.sections.map(sec => {
      const skills = skillAbilities(progress, sec.id, exam).filter(s => s.answered)
        .map(s => ({ ...s, p: pCorrect(s.theta, DIFFICULTY_B.Medium) })).sort((a, b) => a.p - b.p);
      return `<section class="card">
        <header class="card-head"><h2>${sec.name}</h2><span class="muted">weakest first</span></header>
        ${skills.length ? `<ul class="skill-list">${skills.map(s => `<li><span>${esc(skillLabel(s.name))}</span><span class="mastery-chip ${masteryClass(s.p)}"><i aria-hidden="true"></i>${masteryName(s.p)} · ${Math.round(s.p * 100)}%</span><button type="button" class="small ghost" data-skill="${esc(s.name)}" data-section="${sec.id}" aria-label="Practice ${esc(skillLabel(s.name))}">Practice</button></li>`).join('')}</ul>`
          : '<p class="muted">No answers in this section yet.</p>'}
      </section>`;
    }).join('')}</div>
    <p class="hint">Estimates come from your answers and each question's difficulty. They aren't official ${exam.maker} scores.</p>`;
  on('[data-skill]', 'click', e => practiceSkill(e.currentTarget.dataset.section, e.currentTarget.dataset.skill));
  bindTrend(history);
  if (exam.id === 'mcat') bindOfficialScores();
}

// Scores from the AAMC's own practice exams. Their questions can't be brought into the app, but the scores can:
// entered here they join the practice-test history, the trend chart and the study plan like any timed test.
function officialScoresHtml() {
  const logged = progress.tests.filter(t => t.official);
  const scored = scoredSections(exam);
  return `<section class="card official">
      <header class="card-head"><h2>Official AAMC practice exams</h2><span class="muted">${logged.length ? plural(logged.length, 'exam') + ' logged' : 'none logged yet'}</span></header>
      <p class="hint">Took one of the AAMC’s practice exams on its own site? Enter your section scores (${exam.scale.min}–${exam.scale.max}) to track them here.</p>
      <form id="official-form" class="official-form">
        ${scored.map(sec => `<label>${sec.short}<input type="number" id="official-${sec.id}" name="${sec.id}" min="${exam.scale.min}" max="${exam.scale.max}" step="1" required inputmode="numeric"></label>`).join('')}
        <label>Exam<input type="text" id="official-name" name="name" maxlength="40" placeholder="e.g. Sample Test"></label>
        <button type="submit" class="button">Add scores</button>
      </form>
      <p class="warn" id="official-error" role="alert"></p>
      ${logged.length ? `<div class="table-wrap"><table class="stack">
        <thead><tr><th>Date</th><th>Exam</th>${scored.map(sec => `<th class="num">${sec.short}</th>`).join('')}<th class="num">Total</th></tr></thead>
        <tbody>${[...logged].reverse().map(t => `<tr><td>${new Date(t.at).toLocaleDateString()}</td><td data-label="Exam">${esc(t.kind)}</td>
          ${scored.map(sec => `<td class="num" data-label="${sec.short}">${t.summary[sec.id]?.score.mid ?? '—'}</td>`).join('')}
          <td class="num" data-label="Total"><strong>${t.total?.mid ?? '—'}</strong></td></tr>`).join('')}</tbody>
      </table></div>` : ''}
    </section>`;
}

function bindOfficialScores() {
  on('#official-form', 'submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const scored = scoredSections(exam);
    const scores = Object.fromEntries(scored.map(sec => [sec.id, Number(form.get(sec.id))]));
    const bad = scored.find(sec => !Number.isInteger(scores[sec.id]) || scores[sec.id] < exam.scale.min || scores[sec.id] > exam.scale.max);
    if (bad) { $('#official-error').textContent = `${bad.short} must be a whole number from ${exam.scale.min} to ${exam.scale.max}.`; return; }
    const exact = v => ({ low: v, mid: v, high: v });
    const name = String(form.get('name') || '').trim();
    progress.tests.push({
      id: `aamc-${Date.now()}`, at: Date.now(), official: true, kind: name ? `AAMC: ${name}` : 'AAMC practice exam',
      summary: Object.fromEntries(scored.map(sec => [sec.id, { score: exact(scores[sec.id]) }])),
      total: totalScore(exam, Object.fromEntries(scored.map(sec => [sec.id, exact(scores[sec.id])]))),
      qids: [],
    });
    save();
    toast('Scores added');
    render({ quiet: true });
  });
}

// ---------- lessons ----------

// Short lessons, one per content category, for the tests that have them (so far the MCAT's Chem/Phys section).
const LESSONS = { mcat: MCAT_CP_LESSONS.map(lesson => ({ ...lesson, section: 'CP' })) };
const lessonsHere = () => LESSONS[examId] ?? [];

function viewLearn(id) {
  const lesson = lessonsHere().find(l => l.id === id);
  if (lesson) return viewLesson(lesson);
  const lessons = lessonsHere();
  if (!lessons.length) {
    const withLessons = EXAM_IDS.filter(id => LESSONS[id]?.length);
    view.innerHTML = `${pageHead('Lessons', { eyebrow: exam.long })}
      <div class="empty"><h2>No ${exam.name} lessons yet</h2><p>Lessons are written a test at a time, and so far only the ${listNames(withLessons.map(id => EXAMS[id].name))} has them.</p>
        <div class="actions">${withLessons.map(id => `<button class="primary" data-exam="${id}">Switch to ${EXAMS[id].name}</button>`).join('')}<a class="button" href="#/home">Dashboard</a></div></div>`;
    return;
  }
  view.innerHTML = `
    ${pageHead('Lessons', { eyebrow: exam.long })}
    <p class="muted">A short lesson for each topic on the ${exam.name}, with a worked example, then questions to check
      yourself. Each links to free textbooks and videos for more depth.</p>
    ${exam.sections.map(sec => {
      const here = lessons.filter(l => l.section === sec.id);
      const abilities = new Map(skillAbilities(progress, sec.id, exam).map(s => [s.name, s]));
      return `<section class="card lesson-list">
        <header class="card-head"><h2>${sec.name}</h2><span class="muted">${here.length ? plural(here.length, 'lesson') : 'coming soon'}</span></header>
        ${here.length ? `<ul>${here.map(l => {
          const ability = abilities.get(l.skill);
          const p = ability?.answered ? pCorrect(ability.theta, DIFFICULTY_B.Medium) : null;
          return `<li><a href="#/learn/${l.id}"><span class="lesson-code">${esc(l.skill.split(':')[0])}</span><span>${esc(l.title)}</span></a>
            ${p == null ? '<span class="muted">not started</span>' : `<span class="mastery-chip ${masteryClass(p)}"><i aria-hidden="true"></i>${masteryName(p)}</span>`}</li>`;
        }).join('')}</ul>` : '<p class="muted">Lessons for this section are being written.</p>'}
      </section>`;
    }).join('')}`;
}

function viewLesson(lesson) {
  const count = pool.filter(q => q.skill === lesson.skill).length;
  view.innerHTML = `
    ${pageHead(lesson.title, { eyebrow: `${exam.name} · ${sectionTab(sectionOf(exam, lesson.section))} · ${esc(lesson.skill.split(':')[0])}` })}
    <p class="muted"><a href="#/learn">All lessons</a> · ${esc(lesson.skill)}</p>
    <article class="card lesson">
      ${lesson.body.map(p => `<p>${esc(p)}</p>`).join('')}
      <h2>Key terms</h2>
      <dl class="terms">${lesson.terms.map(([term, meaning]) => `<dt>${esc(term)}</dt><dd>${esc(meaning)}</dd>`).join('')}</dl>
      <h2>Worked example</h2>
      <div class="worked">
        <p>${esc(lesson.example.problem)}</p>
        <ol>${lesson.example.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
        <p><strong>Answer:</strong> ${esc(lesson.example.answer)}</p>
      </div>
      <div class="actions">
        ${count ? `<button type="button" class="button primary" id="check">Check yourself: ${plural(count, 'question')}</button>` : ''}
      </div>
      <h2>Go deeper</h2>
      <ul class="links">${lesson.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>
      <p class="hint">OpenStax textbooks are free and openly licensed; Khan Academy’s MCAT course was made with the AAMC.</p>
    </article>`;
  on('#check', 'click', () => practiceSkill(lesson.section, lesson.skill));
}

// Where the estimate puts the student for National Merit, which only the PSAT/NMSQT feeds into.
function nationalMeritHtml() {
  const index = selectionIndex({ RW: sectionEstimate('RW'), MATH: sectionEstimate('MATH') });
  const { commended, semifinalist } = NATIONAL_MERIT;
  const recent = commended.at(-1);
  const lows = commended.map(c => c.index);
  const standing = !index ? ''
    : index.mid >= recent.index ? `<span class="pill good">At or above the class of ${recent.year} Commended cutoff</span>`
    : `<span class="pill">${plural(recent.index - index.mid, 'point')} below the class of ${recent.year} Commended cutoff</span>`;
  return `<section class="card merit">
      <header class="card-head"><h2>National Merit Selection Index</h2>${standing}</header>
      ${index ? `<p class="merit-index"><strong>${index.mid}</strong> <span class="muted">likely ${index.low}–${index.high}, out of 228</span></p>`
        : '<p class="muted">Needs an estimate for both Reading and Writing and Math first.</p>'}
      <p>National Merit ranks students by this index, not the total: twice the Reading and Writing score plus the Math
        score, divided by ten. Commended status has needed ${Math.min(...lows)}–${Math.max(...lows)} in recent years
        (${recent.index} for the class of ${recent.year}), and Semifinalist cutoffs depend on the state, from
        ${semifinalist.low} to ${semifinalist.high} for the class of ${semifinalist.year}.</p>
      <p class="hint">Only the PSAT/NMSQT taken in 11th grade counts; the PSAT 10 does not. Cutoffs change every year.</p>
    </section>`;
}

// The estimate and likely range on the test's real scale, with the target marked.
function scaleHtml(estimate, target) {
  const { min, max } = exam.total;
  const at = v => `${((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100}%`;
  const ticks = exam.total.kind === 'sum' ? [0, 1, 2, 3].map(k => min + (k * (max - min)) / 3) : [min, 12, 24, max];
  return `<div class="scale" role="img" aria-label="Estimate ${estimate.mid}, likely ${range(estimate)}, on a scale of ${min} to ${max}${target ? `, target ${target}` : ''}">
      <div class="scale-track"><span class="scale-band" style="left:${at(estimate.low)};width:calc(${at(estimate.high)} - ${at(estimate.low)})"></span>${target ? `<span class="scale-target" style="left:${at(target)}"></span>` : ''}<span class="scale-dot" style="left:${at(estimate.mid)}"></span></div>
      <div class="scale-ticks" aria-hidden="true">${ticks.map(t => `<span style="left:${at(t)}">${Math.round(t)}</span>`).join('')}</div>
      <div class="scale-legend" aria-hidden="true"><span><i class="key-dot"></i>Estimate</span><span><i class="key-band"></i>Likely range</span>${target ? `<span><i class="key-target"></i>Target ${target}</span>` : ''}</div>
    </div>`;
}

// Totals from the last ten full timed tests: one series on one scale, hover for each test, and a table view.
function trendHtml(history, target) {
  const title = exam.total.kind === 'average' ? `Practice test ${exam.total.label}s` : 'Practice test totals';
  if (history.length < 2) {
    return `<div class="chart chart-empty"><h3>${title}</h3><p class="muted">${history.length ? 'Take one more full timed test' : 'Take two full timed tests'} to see your trend here.</p><a class="button small" href="#/test">Take a timed test</a></div>`;
  }
  const points = history.slice(-10);
  const values = points.map(t => t.total.mid);
  const sum = exam.total.kind === 'sum';
  let step = sum ? 100 : 2;
  const low = Math.min(...values, target ?? Infinity);
  const high = Math.max(...values, target ?? -Infinity);
  if ((high - low) / step > 5) step *= 2;
  const yMin = Math.max(exam.total.min - (exam.total.min % step), Math.floor((low - step / 2) / step) * step);
  const yMax = Math.min(exam.total.max + ((step - (exam.total.max % step)) % step), Math.ceil((high + step / 2) / step) * step);
  const W = 560; const H = 220; const L = 48; const R = 52; const T = 18; const B = 34;
  const x = i => L + (i * (W - L - R)) / (points.length - 1);
  const y = v => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const ticks = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const date = t => new Date(t.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const every = points.length > 6 ? 2 : 1;
  const last = points.length - 1;
  return `<div class="chart" id="trend">
      <h3>${title}</h3><p class="muted">Last ${plural(points.length, 'full timed test')}</p>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}: ${points.map((t, i) => `${date(t)} ${values[i]}`).join(', ')}">
        <g class="chart-grid">${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`).join('')}</g>
        <g class="chart-axis">${ticks.map(v => `<text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join('')}
          ${points.map((t, i) => ((last - i) % every === 0 ? `<text x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${date(t)}</text>` : '')).join('')}</g>
        ${target && target >= yMin && target <= yMax ? `<line class="chart-target" x1="${L}" x2="${W - R}" y1="${y(target).toFixed(1)}" y2="${y(target).toFixed(1)}"/><text class="chart-note" x="${W - R}" y="${(y(target) - 6).toFixed(1)}" text-anchor="end">Target ${target}</text>` : ''}
        <path class="chart-area" d="${line} L${x(last).toFixed(1)} ${H - B} L${L} ${H - B} Z"/>
        <path class="chart-line" d="${line}"/>
        <line class="chart-cross" id="trend-cross" y1="${T}" y2="${H - B}" visibility="hidden"/>
        ${values.map((v, i) => `<circle class="chart-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4.5"/>`).join('')}
        <text class="chart-end" x="${(x(last) + 10).toFixed(1)}" y="${(y(values[last]) + 4).toFixed(1)}">${values[last]}</text>
        <rect id="trend-hit" x="${L - 10}" y="${T}" width="${W - L - R + 20}" height="${H - T - B}" fill="transparent"/>
      </svg>
      <div class="chart-tip" id="trend-tip" hidden></div>
      <details class="chart-table"><summary>View as table</summary>
        <table><thead><tr><th>Test date</th><th>${exam.total.label ?? 'Total'}</th><th>Likely range</th></tr></thead>
        <tbody>${points.map(t => `<tr><td>${date(t)}</td><td class="num">${t.total.mid}</td><td class="num">${range(t.total)}</td></tr>`).join('')}</tbody></table>
      </details>
    </div>`;
}

function bindTrend(history) {
  const box = $('#trend');
  const hit = $('#trend-hit');
  if (!box || !hit) return;
  const svg = box.querySelector('svg');
  const cross = $('#trend-cross');
  const tip = $('#trend-tip');
  const points = history.slice(-10);
  const dots = [...svg.querySelectorAll('.chart-dot')];
  const show = evt => {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / svg.viewBox.baseVal.width;
    const px = (evt.clientX - rect.left) / scale;
    let i = 0;
    dots.forEach((d, k) => { if (Math.abs(d.cx.baseVal.value - px) < Math.abs(dots[i].cx.baseVal.value - px)) i = k; });
    const cx = dots[i].cx.baseVal.value;
    const cy = dots[i].cy.baseVal.value;
    cross.setAttribute('x1', cx);
    cross.setAttribute('x2', cx);
    cross.setAttribute('visibility', 'visible');
    const boxRect = box.getBoundingClientRect();
    tip.hidden = false;
    tip.textContent = `${new Date(points[i].at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${points[i].total.mid} (likely ${range(points[i].total)})`;
    tip.style.left = `${rect.left - boxRect.left + cx * scale}px`;
    tip.style.top = `${rect.top - boxRect.top + cy * scale}px`;
  };
  const hide = () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  hit.addEventListener('pointermove', show);
  hit.addEventListener('pointerdown', show);
  hit.addEventListener('pointerleave', hide);
}

// ---------- study plan ----------

function suggestedDailyGoal(days, gap) {
  // Measure the gap against the size of the test's scale, so an ACT point counts like a proportional SAT gap.
  const span = exam.total.max - exam.total.min;
  const scaledGap = gap == null ? null : (gap / span) * 1200;
  let goal = 20;
  if (scaledGap > 0) goal += scaledGap / 5;
  if (days != null && days <= 14 && scaledGap > 0) goal += 10;
  return Math.max(15, Math.min(60, Math.round(goal / 5) * 5));
}

function testCadence(days) {
  if (days == null) return 'Take a timed practice test every one to two weeks.';
  if (days < 0) return 'Your test date has passed. Set a new one to get a schedule.';
  if (days > 56) return 'Take a full timed practice test every two weeks.';
  if (days > 14) return 'Take a full timed practice test once a week.';
  return 'Take a full timed test now and another 3–4 days before test day, then keep the last two days light.';
}

function viewPlan() {
  const plan = progress.plan;
  const days = daysUntilTest();
  const total = projectedTotal();
  const gap = plan.target && total ? plan.target - total.mid : null;
  const suggestion = suggestedDailyGoal(days, gap);
  const weakest = weakestSkills(5);
  const estimates = scoredSections(exam).map(s => [s, sectionEstimate(s.id)]).filter(([, e]) => e);
  const weakerSection = estimates.length === scoredSections(exam).length && estimates.length > 1
    ? estimates.sort((a, b) => a[1].mid - b[1].mid)[0][0] : null;
  const step = exam.scale.step;

  view.innerHTML = `
    ${pageHead('Study plan', { eyebrow: exam.long })}
    <div class="cards">
      <form class="card" id="plan-form">
        <h2>Your goal</h2>
        <label class="field">Test date <input type="date" name="testDate" value="${esc(plan.testDate || '')}"></label>
        <label class="field">Target ${totalLabel().toLowerCase().replace('estimated ', '')} score <input type="number" name="target" min="${exam.total.min}" max="${exam.total.max}" step="${step}" value="${plan.target || ''}" placeholder="${exam.total.min}–${exam.total.max}"></label>
        <label class="field">Daily question goal <input type="number" name="dailyGoal" min="5" max="150" value="${plan.dailyGoal}"></label>
        <button class="primary">Save</button>
      </form>
      <div class="card">
        <h2>Where you stand</h2>
        <p>${days == null ? 'No test date set.' : days >= 0 ? `<strong>${plural(days, 'day')}</strong> until test day.` : 'Your test date has passed.'}</p>
        <p>${total ? `${totalLabel()} <strong>${total.mid}</strong> (likely ${range(total)}).` : totalWaitingNote() ?? `Practice every section to get an ${totalLabel().toLowerCase()}.`}</p>
        ${gap != null ? `<p>${gap > 0 ? `About <strong>${plural(gap, 'point')}</strong> to your target.` : 'Your estimate is at or above your target. Keep it steady.'}</p>` : ''}
      </div>
    </div>
    <div class="card">
      <h2>Suggested routine</h2>
      <ul>
        <li>Answer <strong>${suggestion} practice questions</strong> a day${weakerSection ? `, leaning toward ${weakerSection.name}` : ''}.${suggestion !== plan.dailyGoal ? ` <button class="small" id="use-suggestion">Use ${suggestion} as my goal</button>` : ''}</li>
        <li>Clear your due Review questions every day before new practice.</li>
        <li>${testCadence(days)}</li>
      </ul>
      <p class="hint">These suggestions are rules of thumb based on your goal and current estimate.</p>
    </div>
    <div class="card">
      <h2>Focus skills</h2>
      ${weakest.length ? weakest.map(s => `<div class="skill-row"><span class="name">${esc(skillLabel(s.name))} <span class="muted">· ${sectionShort(s.section)}</span></span>
        <div class="track"><div class="fill ${masteryClass(pCorrect(s.theta, 0))}" style="width:${Math.round(pCorrect(s.theta, 0) * 100)}%"></div></div>
        <button class="small" data-focus="${esc(s.name)}" data-section="${s.section}">Practice</button></div>`).join('')
        : '<p class="muted">Answer at least two questions in a skill to see where to focus.</p>'}
    </div>`;

  on('#plan-form', 'submit', e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const target = Number(f.get('target')) || null;
    progress.plan = {
      testDate: f.get('testDate') || null,
      target: target && Math.min(exam.total.max, Math.max(exam.total.min, target)),
      dailyGoal: Math.max(5, Number(f.get('dailyGoal')) || 20),
    };
    touch('plan');
    save();
    toast('Saved');
    viewPlan();
  });
  on('#use-suggestion', 'click', () => { progress.plan.dailyGoal = suggestion; touch('plan'); save(); toast('Saved'); viewPlan(); });
  on('[data-focus]', 'click', e => {
    const { focus, section } = e.currentTarget.dataset;
    session = { kind: 'practice', section, skill: focus, done: 0, correct: 0, q: null };
    go(`practice/${section}`);
  });
}

// ---------- library & settings ----------

function viewLibrary() {
  const rows = exam.domains.map(d => {
    const qs = pool.filter(q => q.domain === d.name);
    const n = level => qs.filter(q => q.difficulty === level).length;
    return `<tr><td>${sectionShort(d.section)}</td><td>${esc(d.name)}</td><td class="num">${n('Easy')}</td><td class="num">${n('Medium')}</td><td class="num">${n('Hard')}</td><td class="num"><strong>${qs.length}</strong></td></tr>`;
  }).join('');
  const source = !pool.length
    ? `<p class="note">There are no ${exam.long} questions yet. To add them, ${addQuestionsHint()}.</p>`
    : library.borrowed
      ? `<p class="note">No ${exam.long} questions have been added yet, so ${exam.name} practice uses the ${plural(pool.length, `${library.source === 'demo' ? 'demo' : 'SAT'} question`)}, which cover the same skills. To add ${exam.name} questions, ${addQuestionsHint()}.</p>`
      : library.source === 'demo'
        ? `<p class="note">No official questions are built in yet, so ${plural(pool.length, 'demo question')} are in use. To add real ones, ${addQuestionsHint()}.</p>`
        : `<p class="muted">${plural(pool.length, `${exam.name} question`)}. To add more, ${addQuestionsHint()}.</p>`;

  const chosen = settings.questions !== 'auto';
  const originalsNote = library.originalsHidden
    ? `<p class="hint">Official questions only: the ones written for this app are ${chosen ? 'switched off' : 'left out, because you have the official library'}. Change that in <a href="#/settings">Settings</a>.</p>`
    : library.originalsKept
      ? `<p class="hint">${chosen ? 'You chose official questions only' : 'Official questions only is the choice for your account'}, but there are no official ${exam.name} questions yet, so the ones written for this app are in use. Change it in <a href="#/settings">Settings</a>.</p>`
      : '';

  view.innerHTML = `
    ${pageHead('Question library', { eyebrow: exam.long })}
    ${source}
    ${originalsNote}
    ${['cb', 'act'].includes(exam.source) ? `<p class="hint">Have question PDFs of your own? You can ${importLink} — they are read on this device and stay on it.</p>` : ''}
    ${sharedLibraryCard()}
    ${library.warnings.length ? `<div class="card"><h2>Skipped questions</h2>${library.warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}</div>` : ''}
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Section</th><th>Domain</th><th class="num">${levelName('Easy')}</th><th class="num">${levelName('Medium')}</th><th class="num">${levelName('Hard')}</th><th class="num">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
    <p class="hint">Appearance, text size and resetting your progress live on the <a href="#/settings">Settings</a> page.</p>`;

  bindSharedLibraryCard();
}

// Questions built from official PDFs are never part of the site itself, because the repository is
// public and the PDFs are not ours to publish. Invited accounts get them from the cloud instead.
function sharedLibraryCard() {
  if (!syncConfigured) return '';
  const card = body => `<div class="card" id="shared-library"><h2>Shared library</h2>${body}</div>`;
  if (!syncState().account) {
    return card(`<p class="hint">Questions built from official College Board and ACT PDFs aren’t part of this
      site. If you have been invited to the shared library, <a href="#/account">sign in</a> and it will load here.</p>`);
  }

  const s = cloudLibrary;
  const packed = s.packedAt ? new Date(s.packedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const status = {
    idle: '<p class="hint">Checking…</p>',
    checking: '<p class="hint">Checking whether this account has been invited…</p>',
    'not-invited': `<p class="hint">This account hasn’t been invited to the shared library, so practice uses the
      questions built into the site. If you’ve been given an invite code, enter it here.</p>
      <form class="code-form" id="join-library">
        <label for="invite-code">Invite code</label>
        <input id="invite-code" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" required>
        <button class="primary" type="submit">Join</button>
      </form>`,
    loading: `<p class="hint">Downloading the shared library${s.progress ? ` — piece ${s.progress.done} of ${s.progress.total}` : ''}…</p>`,
    empty: '<p class="hint">You’re invited, but no library has been uploaded yet.</p>',
    ready: `<p class="muted">${plural(s.count, 'question')} from the shared library${packed ? `, packed ${packed}` : ''}.
      ${s.cached ? 'The questions are already saved on this device.' : `Downloaded ${(s.bytes / 1048576).toFixed(1)} MB of questions and saved them on this device.`}
      Pictures download the first time a question shows one, and are kept after that.</p>`,
    error: `<p class="warn">${esc(s.message || 'The shared library could not be loaded.')}</p>`,
  }[s.status] ?? '';

  const admin = s.access === 'admin'
    ? `<div class="actions"><button class="primary" type="button" id="upload-library">Upload this device’s library</button></div>
       <p class="hint">Build it first with <code>npm run build</code>, then <code>npm run pack</code>. Everyone on the
       tester list picks it up the next time they sign in.</p>
       ${testersPanel(s.admin)}`
    : '';
  return card(status + admin);
}

// What only the admin sees: the code testers join with, and who has joined.
function testersPanel(panel) {
  if (!panel) return '<h3>Testers</h3><p class="hint">Loading…</p>';
  if (panel.error) return `<h3>Testers</h3><p class="warn">${esc(panel.error)}</p>`;
  const joined = panel.testers.length
    ? `<ul class="tester-list">${panel.testers.map(t => `
        <li><span>${esc(t.name || 'An account with no name')}</span>
          <span class="hint">${t.joinedAt ? `joined ${new Date(t.joinedAt).toLocaleDateString()}` : 'added by hand'}</span>
          <button type="button" class="link" data-remove-tester="${esc(t.uid)}">Remove</button></li>`).join('')}</ul>`
    : '<p class="hint">Nobody has joined yet.</p>';
  return `<h3>Testers</h3>
    <p class="hint">${panel.code
      ? 'Anyone who signs in and enters this code gets the whole library. Change it to stop new people joining; everyone already in keeps their access.'
      : 'Choose a code to give your testers. Anyone who signs in and enters it gets the whole library.'}</p>
    <form class="code-form" id="invite-form">
      <label for="invite-new">Invite code</label>
      <input id="invite-new" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(panel.code ? readableCode(panel.code) : suggestCode())}">
      <button type="submit">${panel.code ? 'Change code' : 'Save code'}</button>
    </form>
    ${joined}`;
}

// Shown in groups of four so it is easy to read out; it is compared without the dashes, so either works.
const readableCode = code => code.replace(/(.{4})(?=.)/g, '$1-');

// A code that is hard to guess but easy to read aloud: no 0/o, 1/l or i, in groups of four.
function suggestCode() {
  const letters = 'abcdefghjkmnpqrstuvwxyz23456789';
  const picks = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(picks, n => letters[n % letters.length]).join('').replace(/(.{4})(?=.)/g, '$1-');
}

function bindSharedLibraryCard() {
  on('#upload-library', 'click', e => uploadSharedLibrary(e.currentTarget));
  on('#join-library', 'submit', async e => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button');
    const code = $('#invite-code').value;
    if (plainCode(code).length < MIN_CODE) return toast('That invite code is too short. Check it and try again.');
    button.disabled = true;
    try {
      await joinWithCode(syncState().uid, code, syncState().account);
      toast('You’re in. Loading the shared library…');
      cloudLibraryFor = null;          // look again: this account is on the tester list now
      syncCloudLibrary(syncState());
    } catch (err) {
      toast(err.message);
      button.disabled = false;
    }
  });
  on('#invite-form', 'submit', async e => {
    e.preventDefault();
    try {
      const code = await saveInviteCode($('#invite-new').value);
      toast(`Invite code saved: ${readableCode(code)}`);
      loadTestersPanel();
    } catch (err) {
      toast(err.message);
    }
  });
  on('[data-remove-tester]', 'click', async e => {
    const button = e.currentTarget;
    if (button.dataset.confirm !== 'yes') {
      button.dataset.confirm = 'yes';
      button.textContent = 'Click again to remove';
      return;
    }
    try {
      await removeTester(button.dataset.removeTester);
      toast('Removed. The shared library stops loading for them the next time they open the app.');
      loadTestersPanel();
    } catch (err) {
      toast(`Could not remove them: ${err.message}`);
    }
  });
}

async function loadTestersPanel() {
  try {
    const [code, testers] = await Promise.all([readInviteCode(), listTesters()]);
    cloudLibrary = { ...cloudLibrary, admin: { code, testers } };
  } catch {
    cloudLibrary = { ...cloudLibrary, admin: { error: 'The tester list could not be loaded. Check that the latest firestore.rules are published.' } };
  }
  refreshForLibrary();
}

async function uploadSharedLibrary(button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Reading the packed library…';
  try {
    const res = await fetch('data/pack/library.bin', { cache: 'no-store' });
    if (!res.ok) throw new Error('No packed library found. Run npm run build and then npm run pack, then reload this page.');
    const library = new Uint8Array(await res.arrayBuffer());
    const { questions, packedAt } = await decodeLibrary(library);
    const readPicture = async id => {
      const picture = await fetch(`data/pack/images/${id}.webp`, { cache: 'no-store' });
      if (!picture.ok) throw new Error(`Picture ${id} is missing from data/pack. Run npm run pack again, then reload this page.`);
      return new Uint8Array(await picture.arrayBuffer());
    };
    const result = await publishLibrary({
      library, ids: pictureIds(questions), packedAt, questions: questions.length, readPicture,
      onProgress: p => {
        button.textContent = p.phase === 'pictures'
          ? `Uploading pictures — ${p.done} of ${p.total}… keep this tab open`
          : `Uploading questions — piece ${p.done} of ${p.total}…`;
      },
    });
    toast(`Shared library updated: ${plural(result.questions, 'question')}, ${plural(result.sent, 'new picture')}`);
    cloudLibraryFor = null;            // load it back down, so this page shows what testers will get
    syncCloudLibrary(syncState());
  } catch (err) {
    toast(err.message);
    button.textContent = label;
    button.disabled = false;
  }
}

// ---------- questions a student brings themselves ----------

function viewImport() {
  const files = imports.length ? `
    <div class="card">
      <h2>On this device</h2>
      <ul class="tester-list">${imports.map(file => `
        <li><span>${esc(file.name)}</span>
          <span class="hint">${plural(file.questions, 'question')} · ${file.kind === 'act' ? 'ACT booklet' : 'College Board export'} · added ${new Date(file.at).toLocaleDateString()}</span>
          <button type="button" class="link" data-remove-import="${esc(file.id)}">Remove</button></li>`).join('')}
      </ul>
      ${imports.flatMap(f => f.warnings || []).length
        ? `<h3>Skipped questions</h3>${imports.flatMap(f => f.warnings || []).slice(0, 20).map(w => `<p class="warn">${esc(w)}</p>`).join('')}`
        : ''}
    </div>` : '';
  view.innerHTML = `
    ${pageHead('Your own questions', { eyebrow: exam.long })}
    <p class="muted">Practise with question PDFs of your own. They are read here on this device and stay on it:
      the file is never uploaded, and nothing about it is sent anywhere.</p>
    <div class="card">
      <h2>Add a PDF</h2>
      <p class="hint">Two kinds are understood: a <strong>College Board Question Bank export</strong>, from the
        SAT Suite Educator Question Bank, and an <strong>ACT practice test booklet</strong> from act.org, which
        must still have the scoring key at the back — that is where its answers come from.</p>
      ${importsSupported()
        ? `<div class="actions"><label class="button primary" for="pdf-file">Choose a PDF…</label></div>
           <input id="pdf-file" type="file" accept="application/pdf,.pdf" multiple hidden>
           <p class="hint" id="import-progress" hidden></p>`
        : '<p class="warn">This browser will not let the app keep questions on the device, so importing is not available here. Private browsing usually does this.</p>'}
    </div>
    ${files}
    <p class="hint">A long export takes a while to read — a thousand-page one, a few minutes — and the app stays
      on this page while it works.</p>`;
  on('#pdf-file', 'change', e => addPdfs([...e.target.files], e.currentTarget));
  on('[data-remove-import]', 'click', async e => {
    const button = e.currentTarget;
    if (button.dataset.confirm !== 'yes') {
      button.dataset.confirm = 'yes';
      button.textContent = 'Click again to remove';
      return;
    }
    await removeImport(button.dataset.removeImport);
    toast('Removed');
    await refreshImports();
  });
}

async function addPdfs(files, input) {
  const say = text => {
    const line = $('#import-progress');
    if (!line) return;
    line.hidden = false;
    line.textContent = text;
  };
  for (const file of files) {
    try {
      say(`Reading ${file.name}…`);
      const result = await importPdf(file, {
        onProgress: p => say(p.phase === 'reading'
          ? `Reading ${file.name} — page ${p.done} of ${p.total}…`
          : `Cutting out the pictures — ${p.done} of ${plural(p.total, 'question')}…`),
      });
      if (!result.questions.length) {
        toast(result.warnings[0] ?? `No questions found in ${file.name}.`);
        continue;
      }
      await saveImport(result);
      toast(`Added ${plural(result.questions.length, 'question')} from ${file.name}`);
    } catch (err) {
      toast(`Could not read ${file.name}: ${err.message}`);
    }
  }
  if (input) input.value = '';   // so the same file can be chosen again
  await refreshImports();
}

// Questions imported here join the pool the moment they are read, and are there again on the next visit.
async function refreshImports() {
  imports = await listImports();
  ownQuestions = await readImportedQuestions();
  applyLibrary();
  // The import page lists what is already on the device, and reading the device takes a moment, so on a
  // first load the page is drawn before the answer is in. Draw it again, quietly, once it is.
  if (currentRoute === 'import') render({ quiet: true });
  else renderNav(currentRoute);
}

// ---------- settings ----------

const SETTING_GROUPS = [
  ['theme', 'Theme', 'Light, dark, or whatever your device is set to.'],
  ['accent', 'Accent colour', 'Used for the active page, streaks, highlights and charts.'],
  ['textsize', 'Text size', 'Scales the questions, passages and everything else.'],
  ['contrast', 'Contrast', 'Turn this up if text or borders are hard to make out.'],
  ['motion', 'Animation', 'How much the app moves as pages and answers appear.'],
  ['explain', 'Explain with AI', `A hint before you answer, and an explanation afterwards, written by Google’s Gemini. You need to be signed in to use it, and each student gets ${AI_DAILY_LIMIT} a day, since Gemini’s free allowance is shared by everyone. Questions you ask about are sent to Google.`],
  ['questions', 'Questions written for this app', 'Alongside the official College Board and ACT questions there are 400 SAT-style ones written for this app, each answer checked by a test. Your progress on them is kept either way.'],
];

// Bring your own Gemini key: a free key from Google AI Studio gives this student their own allowance, instead of
// a share of the site's. Kept in this browser only (see explain.js).
function ownKeyCardHtml() {
  const has = Boolean(ownKey());
  return `<section class="card own-key">
      <h2 id="own-key-title">Your own Gemini key</h2>
      <p class="hint">${has
        ? 'Hints and explanations use your own key, so they come out of your own free Gemini allowance rather than the shared ' + AI_DAILY_LIMIT + ' a day, and work without signing in.'
        : `Optional. Everyone shares one small free Gemini allowance, so each student gets ${AI_DAILY_LIMIT} hints and explanations a day. With a free key of your own, yours come out of your own allowance instead, and work without signing in.`}
        The key stays in this browser: it is never uploaded or synced to your account.</p>
      <p class="note"><strong>Only for people 18 or older.</strong> Google’s terms for the Gemini API require you to be 18 or over to create or use a key.</p>
      ${has
        ? `<p><strong>A key is saved</strong> <span class="muted">(ending …${esc(ownKey().slice(-4))})</span></p>
           <div class="actions"><button type="button" class="danger" id="own-key-remove">Remove key</button></div>`
        : `<ol class="steps">
             <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio’s API keys page</a> and sign in with a Google account.</li>
             <li>Choose “Create API key” and copy it. It’s free and needs no card.</li>
             <li>Paste it here. It’s checked with one small request before it’s kept.</li>
           </ol>
           <form id="own-key-form" class="own-key-form">
             <label for="own-key">Gemini API key</label>
             <input id="own-key" name="key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your key">
             <button type="submit" class="primary">Check and save</button>
           </form>`}
      <p class="warn" id="own-key-error" role="alert"></p>
    </section>`;
}

function bindOwnKeyCard() {
  on('#own-key-form', 'submit', async e => {
    e.preventDefault();
    const key = String(new FormData(e.currentTarget).get('key') || '').trim();
    const error = $('#own-key-error');
    if (!key) { error.textContent = 'Paste a key first.'; return; }
    const button = e.currentTarget.querySelector('button');
    button.disabled = true;
    button.textContent = 'Checking…';
    const problem = await checkOwnKey(key);
    if (problem) {
      error.textContent = problem;
      button.disabled = false;
      button.textContent = 'Check and save';
      return;
    }
    setOwnKey(key);
    toast('Key saved. Hints now use your own allowance.');
    viewSettings();
  });
  confirmButton('#own-key-remove', 'Click again to remove', () => {
    setOwnKey('');
    toast('Key removed');
    viewSettings();
  });
}

function viewSettings() {
  view.innerHTML = `
    ${pageHead('Settings', { eyebrow: APP_NAME })}
    <p class="muted">These settings belong to this device, not your account, so a phone and a laptop can each be set up the way that suits them.</p>
    <div class="settings-grid">
      ${SETTING_GROUPS.filter(([key]) => (key !== 'explain' || explainConfigured)
        // Without any official questions the written ones are all there is, so the choice would do nothing.
        && (key !== 'questions' || allQuestions.some(isOfficial))).map(([key, title, note]) => {
        // Until one is picked, the choice showing is the one this account gets on its own.
        const current = key === 'questions' ? (includesWritten() ? 'on' : 'off') : settings[key];
        const auto = key === 'questions' && settings.questions === 'auto';
        return `
        <section class="card setting">
          <h2 id="set-${key}">${title}</h2>
          <p class="hint">${note}${auto ? ` Set for your account${invitedToLibrary() ? ', because you have the official library' : ''}; pick one to choose for yourself.` : ''}</p>
          <div class="swatches" role="radiogroup" aria-labelledby="set-${key}">
            ${CHOICES[key].map(([value, label, about]) => `
              <button type="button" class="swatch${current === value ? ' on' : ''}" role="radio"
                aria-checked="${current === value}" data-set="${key}" data-value="${value}" data-preview="${value}">
                ${key === 'accent' ? '<i class="swatch-dot" aria-hidden="true"></i>' : ''}
                <span class="swatch-name"${key === 'textsize' ? ` style="font-size:${{ small: 13, medium: 15, large: 17, xlarge: 19 }[value]}px"` : ''}>${esc(label)}</span>
                ${about ? `<small>${esc(about)}</small>` : ''}
              </button>`).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>
    ${settings.explain === 'on' ? ownKeyCardHtml() : ''}
    <div class="card">
      <h2>Sample</h2>
      <p class="hint">A question the way it will look with these settings.</p>
      <div class="passage">Some critics dismissed the novel as simplistic. <u class="ul">Yet its short sentences, which at first seem plain, gradually build a rhythm that mirrors the narrator’s anxiety.</u></div>
      <div class="sample-row">
        <span class="mastery-chip high"><i aria-hidden="true"></i>Strong · 82%</span>
        <span class="mastery-chip mid"><i aria-hidden="true"></i>Building · 58%</span>
        <span class="mastery-chip low"><i aria-hidden="true"></i>Needs work · 31%</span>
      </div>
    </div>
    <div class="card">
      <h2>Reset progress</h2>
      <p class="hint">This erases your ${exam.name} practice history, mistake log, test results and study plan${syncConfigured ? ' on every device signed in to your account' : ''}. Your other tests aren't affected.</p>
      <div class="actions"><button class="danger" id="reset">Reset ${exam.name} progress</button></div>
    </div>`;

  bindOwnKeyCard();
  on('[data-set]', 'click', e => {
    const { set, value } = e.currentTarget.dataset;
    if (settings[set] === value) return;
    settings = { ...settings, [set]: value };
    saveSettings(settings);
    applySettings(settings);
    if (set === 'questions') {
      // Which questions exist changes, so practice has to start again from the new set.
      session = null;
      choosePool();
      renderNav(currentRoute);
    }
    viewSettings();
    toast(set === 'questions' ? `Saved: ${plural(pool.length, `${exam.name} question`)} now in use` : 'Saved');
  });
  confirmButton('#reset', 'Click again to erase progress', () => {
    // The reset time travels with synced progress, so every signed-in device drops what came before it.
    const now = Date.now();
    replaceProgress(examId, { ...store.defaultProgress(), resetAt: now, stamps: { profile: now, placement: now, plan: now } }, { push: true });
    session = null;
    if (test?.exam === examId) { test = null; saveTest(); }
    toast(`${exam.name} progress reset`);
    go('start');
  });
}

// ---------- resources ----------

const link = (title, url, about) => ({ title, url, about });
const BIGFUTURE = link('BigFuture', 'https://bigfuture.collegeboard.org/', "College Board's free site for exploring colleges, careers and scholarships.");

const RESOURCES = {
  sat: [
    { title: 'Official practice', links: [
      link('Bluebook', 'https://bluebook.collegeboard.org/', "College Board's testing app, where the digital SAT is taken. Its full-length practice tests use the same timing, tools and adaptive modules as test day."),
      link('Download Bluebook', 'https://bluebook.collegeboard.org/students/download-bluebook', 'Install the app on a Mac, Windows PC, iPad or Chromebook.'),
      link('Official SAT practice tests', 'https://satsuite.collegeboard.org/practice/practice-tests', 'Free full-length practice tests, in Bluebook or as PDFs with answer explanations.'),
      link('My Practice', 'https://mypractice.collegeboard.org/', 'Scores, answer explanations and skill breakdowns for the practice tests you take in Bluebook.'),
      link('SAT Suite Question Bank', 'https://satsuiteeducatorquestionbank.collegeboard.org/', "College Board's official question bank. Its PDF exports are what this app's SAT and PSAT library is built from."),
    ] },
    { title: 'Learn and practice', links: [
      link('SAT practice and preparation', 'https://satsuite.collegeboard.org/practice', "College Board's hub for free prep materials, including the official study guide."),
      link('Khan Academy: Digital SAT', 'https://www.khanacademy.org/test-prep/digital-sat', 'Free lessons and practice for each skill on the test.'),
      link('Desmos test calculator', 'https://www.desmos.com/testing/collegeboard/graphing', 'The version of the Desmos graphing calculator used on the digital SAT Suite, to get comfortable with before test day.'),
    ] },
    { title: 'About the test', links: [
      link("What's on the SAT", 'https://satsuite.collegeboard.org/sat/whats-on-the-test', 'How the test is structured and the skills each section covers.'),
      link('Register for the SAT', 'https://satsuite.collegeboard.org/sat/registration', 'Sign up for a test date and find a test center.'),
      link('Test dates and deadlines', 'https://satsuite.collegeboard.org/sat/dates-deadlines', 'Upcoming test dates, registration deadlines and score release dates.'),
      link('SAT scores', 'https://satsuite.collegeboard.org/scores', 'Getting your scores and understanding what they mean.'),
    ] },
    { title: 'Planning for college', links: [BIGFUTURE] },
  ],
  psat: [
    { title: 'Official practice', links: [
      link('SAT Suite Question Bank', 'https://satsuiteeducatorquestionbank.collegeboard.org/', 'Filter by PSAT/NMSQT and PSAT 10 to export official questions for this app.'),
      link('SAT Suite practice and preparation', 'https://satsuite.collegeboard.org/practice', "College Board's free prep materials for the whole SAT Suite, including the PSATs."),
      link('Desmos test calculator', 'https://www.desmos.com/testing/collegeboard/graphing', 'The Desmos graphing calculator used on the digital SAT Suite.'),
    ] },
    { title: 'About the test', links: [
      link("What's on the PSAT/NMSQT", 'https://satsuite.collegeboard.org/in-school-assessments/whats-on-the-test/psat-nmsqt', 'How the test is structured and the skills it covers.'),
      link('SAT Suite scores', 'https://satsuite.collegeboard.org/scores', 'Getting your scores and understanding what they mean.'),
    ] },
    { title: 'Learn and plan', links: [
      link('Khan Academy: Digital SAT', 'https://www.khanacademy.org/test-prep/digital-sat', 'Free lessons for the same skills the PSAT tests.'),
      BIGFUTURE,
    ] },
  ],
  psat89: [
    { title: 'Official practice', links: [
      link('SAT Suite Question Bank', 'https://satsuiteeducatorquestionbank.collegeboard.org/', 'Filter by PSAT 8/9 to export official questions for this app.'),
      link('SAT Suite practice and preparation', 'https://satsuite.collegeboard.org/practice', "College Board's free prep materials for the whole SAT Suite, including the PSATs."),
    ] },
    { title: 'About the test', links: [
      link("What's on the PSAT 8/9", 'https://satsuite.collegeboard.org/in-school-assessments/whats-on-the-test/psat-8-9', 'How the test is structured and the skills it covers.'),
      link('SAT Suite scores', 'https://satsuite.collegeboard.org/scores', 'Getting your scores and understanding what they mean.'),
    ] },
    { title: 'Learn and plan', links: [
      link('Khan Academy: Digital SAT', 'https://www.khanacademy.org/test-prep/digital-sat', 'Free lessons for the same skills the PSAT 8/9 tests.'),
      BIGFUTURE,
    ] },
  ],
  act: [
    { title: 'Official practice', links: [
      link('ACT test prep', 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation.html', "ACT's free official prep page, with full-length practice tests."),
      link('ACT Practice Test 2 (PDF)', 'https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf', 'A complete official practice test with an answer key. Practicing with it inside this app is still being built.'),
      link('Preparing for the ACT (PDF)', 'https://www.act.org/content/dam/act/unsecured/documents/Preparing-for-the-ACT.pdf', 'The official guide booklet, with a full practice test, answer key and scoring tables.'),
      link('The Official ACT Prep Guide', 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/the-official-guide.html', "ACT's official study guide book (paid), with more practice tests."),
    ] },
    { title: 'About the test', links: [
      link('Register for the ACT', 'https://www.act.org/content/act/en/products-and-services/the-act/registration.html', 'Sign up for a test date and find a test center or online option.'),
      link('ACT scores', 'https://www.act.org/content/act/en/products-and-services/the-act/scores.html', 'Getting your scores and understanding the Composite.'),
    ] },
    { title: 'Learn and plan', links: [
      link('Khan Academy: ACT', 'https://www.khanacademy.org/test-prep/act', 'Free lessons and practice for ACT math and reading skills.'),
      BIGFUTURE,
    ] },
  ],
  mcat: [
    { title: 'From the AAMC, which makes the MCAT', links: [
      link('Prepare for the MCAT exam', 'https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam', 'The AAMC’s own prep hub, including its practice exams. Log your scores from those on the Scores page here.'),
      link('Free planning and study resources', 'https://students-residents.aamc.org/prepare-mcat-exam/free-planning-and-study-resources', 'The free official material: sample questions, planning tools and more.'),
      link('What’s on the MCAT exam?', 'https://students-residents.aamc.org/whats-mcat-exam/publication-chapters/whats-mcat-exam', 'The official outline of every section, concept and content category, which this app’s topics follow.'),
      link('Creating your MCAT study plan', 'https://students-residents.aamc.org/prepare-mcat-exam/creating-your-mcat-exam-study-plan', 'The AAMC’s guide to planning your preparation.'),
      link('The MCAT score scale', 'https://students-residents.aamc.org/mcat-scores/mcat-exam-score-scale', 'How the 118–132 section scores and the 472–528 total work.'),
      link('MCAT Essentials for 2026', 'https://students-residents.aamc.org/register-mcat-exam/publication/mcat-essentials-testing-year-2026', 'Registration, test-day rules and scoring for this testing year.'),
    ] },
    { title: 'Learn the science', links: [
      link('Khan Academy: MCAT', 'https://www.khanacademy.org/test-prep/mcat', 'Free videos and questions across all four sections, made with the AAMC.'),
      link('OpenStax science textbooks', 'https://openstax.org/subjects/science', 'Free, openly licensed textbooks in biology, chemistry, physics, psychology and sociology. The lessons here link to their chapters.'),
    ] },
  ],
};

function viewResources() {
  view.innerHTML = `
    ${pageHead('Resources', { eyebrow: exam.long })}
    <p class="muted">Official ${exam.maker} tools and other free places to prepare for the ${exam.long}. Links open in a new tab.</p>
    <div class="cards">${(RESOURCES[examId] ?? []).map(group => `
      <section class="card">
        <h2>${esc(group.title)}</h2>
        <ul class="links">${group.links.map(({ title, url, about }) => {
          // The last word and the arrow wrap together, so the arrow never sits alone on a line.
          const cut = title.lastIndexOf(' ') + 1;
          return `
          <li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(title.slice(0, cut))}<span class="nowrap">${esc(title.slice(cut))}&nbsp;<span aria-hidden="true">↗</span></span></a><span class="hint">${esc(about)}</span></li>`;
        }).join('')}
        </ul>
      </section>`).join('')}
    </div>`;
}

// ---------- account & sync ----------

function viewAccount() {
  if (!syncConfigured) {
    view.innerHTML = `${pageHead('Account')}<p class="note">Cloud sync isn't set up for this copy of ${APP_NAME}, so progress stays on this device.</p>`;
    return;
  }
  const sync = syncState();
  if (sync.phase === 'loading') {
    view.innerHTML = `${pageHead('Account')}<p class="muted">Connecting…</p>`;
    return;
  }
  if (sync.account) {
    const time = sync.lastSynced && new Date(sync.lastSynced).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const status = sync.phase === 'error' ? sync.message : sync.phase === 'synced' ? `Up to date${time ? ` · last synced ${time}` : ''}.` : 'Syncing…';
    view.innerHTML = `
      ${pageHead('Account')}
      <div class="card">
        <p>Signed in as <strong>${esc(sync.account)}</strong>.</p>
        <p class="${sync.phase === 'error' ? 'warn' : 'muted'}">${esc(status)}</p>
        <p class="hint">Progress for every test (${EXAM_IDS.map(id => EXAMS[id].name).join(', ')}) syncs automatically to every device where you sign in. Your changes upload within a few seconds, and changes from your other devices show up on their own.</p>
        <div class="actions">
          ${progress.profile.mode ? '' : '<a class="button primary" href="#/start">Continue</a>'}
          <button id="sign-out">Sign out</button>
          <button class="danger" id="sign-out-clear">Sign out and clear this device</button>
        </div>
        <p class="hint">Signing out keeps a copy of your progress on this device, but it is never added to a different account that signs in here. On a shared computer, “Sign out and clear this device” removes it straight away.</p>
      </div>`;
    on('#sign-out', 'click', () => signOutOfSync());
    confirmButton('#sign-out-clear', 'Click again to sign out and clear', async () => {
      await signOutOfSync();
      EXAM_IDS.forEach(id => replaceProgress(id, store.defaultProgress()));
      session = null;
      test = null;
      saveTest();
      go('start');
    });
    return;
  }

  view.innerHTML = `
    ${pageHead('Sign in to sync')}
    <p class="muted">Keep your progress on every device you study on. Progress already on this device is added to your account.</p>
    <div class="cards">
      <div class="card">
        <h2>Google</h2>
        <p>Sign in with your Google account.</p>
        <button class="primary" id="google">Sign in with Google</button>
      </div>
      <form class="card" id="username-form">
        <h2>Username and passcode</h2>
        <label class="field">Username <input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
        <label class="field">Passcode <input name="passcode" type="password" autocomplete="current-password" required></label>
        <div class="actions"><button class="primary" data-mode="sign-in">Sign in</button><button data-mode="create">Create account</button></div>
        <p class="hint">A forgotten passcode can't be recovered, so keep it somewhere safe.</p>
      </form>
    </div>
    <p class="warn" id="auth-error" role="alert">${esc(sync.phase === 'error' ? sync.message : '')}</p>`;

  const buttons = () => view.querySelectorAll('.card button');
  const attempt = async action => {
    buttons().forEach(b => { b.disabled = true; });
    $('#auth-error').textContent = '';
    try {
      await action(); // on success the sign-in listener re-renders this page
    } catch (err) {
      if (!view.contains($('#auth-error'))) return;
      $('#auth-error').textContent = err.message;
      buttons().forEach(b => { b.disabled = false; });
    }
  };
  on('#google', 'click', () => attempt(signInWithGoogle));
  on('#username-form', 'submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const create = e.submitter?.dataset.mode === 'create';
    attempt(() => signInWithUsername(form.get('username'), form.get('passcode'), { create }));
  });
}

// ---------- boot ----------

// The server builds data/questions.json from exports/ at startup; without it the demo questions are used.
async function loadLibrary() {
  try {
    const res = await fetch('data/questions.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      // Exported questions are added to the originals rather than replacing them. A library of a few dozen is
      // what made practice repeat itself in the first place, and there is no reason to hide 400 usable
      // questions from someone who has also imported their own.
      if (data.questions.length) {
        return {
          source: 'exports', files: data.files, warnings: data.warnings,
          questions: [...data.questions, ...ORIGINAL_QUESTIONS], own: data.questions.length,
        };
      }
    }
  } catch {
    // No built library yet.
  }
  // Nothing built, so the questions written for this app are the library. They ship in the repo, so this is
  // what every visitor who has not imported their own exports actually practises with.
  return { source: 'original', questions: [...ORIGINAL_QUESTIONS, ...DEMO_QUESTIONS], files: 0, warnings: [] };
}

// Earlier versions imported questions into IndexedDB in the browser; that copy is no longer used.
try { indexedDB.deleteDatabase('sat-prep'); } catch { /* storage unavailable */ }

window.addEventListener('hashchange', render);
// The questions in play. A device that built its own library keeps its own copy of a question, which
// has sharper images than the packed one the shared library carries; everything else comes from the
// shared library. Demo questions are only ever a stand-in, so a real library retires them.
function applyLibrary() {
  const byId = new Map();
  for (const q of [...baseQuestions, ...ownQuestions, ...cloudQuestions]) {
    if ((cloudQuestions.length || ownQuestions.length) && q.source === 'demo') continue;
    if (!byId.has(q.id)) byId.set(q.id, q);
  }
  allQuestions = [...byId.values()];
  choosePool();
  restoreTest();
}

// The library arriving changes what practice can serve, so pages that count questions have to catch
// up — but only once the questions themselves have actually changed. While the download is still
// going, the only thing that moves is the status card on the Library page, which is swapped in place
// so the rest of the page is left alone. Nothing is redrawn during a question or a timed test.
function refreshForLibrary({ questionsChanged = false } = {}) {
  const card = view.querySelector('#shared-library');
  if (card) {
    quietly(() => {
      card.outerHTML = sharedLibraryCard();
      bindSharedLibraryCard();
    });
  }
  if (!questionsChanged) return renderNav(currentRoute);
  if (!session && ['home', 'library', 'plan', 'scores'].includes(currentRoute)) render({ quiet: true });
  else renderNav(currentRoute);
}

let cloudLibraryFor = null;   // the uid whose library has been looked up already

async function syncCloudLibrary({ uid }) {
  if (cloudLibraryFor === uid) return;
  cloudLibraryFor = uid;
  const stale = () => cloudLibraryFor !== uid;   // signed out, or switched account, while we asked

  if (!uid) {
    const had = cloudQuestions.length > 0;
    if (had) {
      cloudQuestions = [];
      applyLibrary();
    }
    cloudLibrary = { status: 'idle', access: null };
    return refreshForLibrary({ questionsChanged: had });
  }

  cloudLibrary = { status: 'checking', access: null };
  refreshForLibrary();
  const access = await libraryAccess(uid);
  if (stale()) return;
  if (!access) {
    cloudLibrary = { status: 'not-invited', access: null };
    return refreshForLibrary();
  }

  cloudLibrary = { status: 'loading', access };
  refreshForLibrary();
  if (access === 'admin') loadTestersPanel();
  let questionsChanged = false;
  try {
    const loaded = await loadCloudQuestions({
      onProgress: progress => {
        if (stale()) return;
        cloudLibrary = { ...cloudLibrary, progress };
        refreshForLibrary();
      },
    });
    if (stale()) return;
    if (!loaded) {
      cloudLibrary = { status: 'empty', access, admin: cloudLibrary.admin };
    } else {
      cloudQuestions = loaded.questions;
      cloudLibrary = {
        status: 'ready', access, count: loaded.questions.length,
        packedAt: loaded.packedAt, cached: loaded.cached, bytes: loaded.bytes,
        admin: cloudLibrary.admin,   // the tester list may have arrived while the questions downloaded
      };
      applyLibrary();
      questionsChanged = true;
      if (!loaded.cached) toast(`Added ${plural(loaded.questions.length, 'question')} from the shared library`);
    }
  } catch (err) {
    if (stale()) return;
    cloudLibrary = { status: 'error', access, message: err.message, admin: cloudLibrary.admin };
  }
  refreshForLibrary({ questionsChanged });
}

loadLibrary().then(result => {
  library = { ...library, source: result.source, files: result.files, warnings: result.warnings || [] };
  baseQuestions = result.questions;
  applyLibrary();
  render();
  refreshImports().then(() => {
    if (ownQuestions.length) refreshForLibrary({ questionsChanged: true });
  });
  let lastPhase = null;
  let wasSignedIn = false;
  initSync({
    exams: EXAM_IDS,
    getProgress: id => progressByExam[id],
    setProgress: (id, next) => {
      if (JSON.stringify(next) === JSON.stringify(progressByExam[id])) return;
      const hadProfile = Boolean(progressByExam[id].profile.mode);
      replaceProgress(id, next);
      if (id !== examId) return renderNav(currentRoute);
      if (!hadProfile && progress.profile.mode && currentRoute === 'start') return go('home');
      // Refresh pages that only show progress; never re-render mid-question, mid-test or mid-form.
      // Quietly, because progress arriving from another device is not navigation the reader asked for.
      if (!session && ['home', 'scores', 'review', 'account'].includes(currentRoute)) render({ quiet: true });
      else renderNav(currentRoute);
    },
    // Progress on this device is added to the account that signs in, which is what someone who studied here
    // before signing up wants. But after a plain "Sign out" the device still holds that account's progress, and
    // on a shared computer the next person to sign in would have it merged into theirs. So the device
    // remembers which account it last synced with, and a different one starts from a clean slate.
    onSignIn: uid => {
      let last = null;
      try { last = localStorage.getItem(LAST_ACCOUNT_KEY); } catch { /* storage unavailable */ }
      if (last && last !== uid) {
        EXAM_IDS.forEach(id => replaceProgress(id, store.defaultProgress()));
        session = null;
        test = null;
        saveTest();
      }
      try { localStorage.setItem(LAST_ACCOUNT_KEY, uid); } catch { /* storage unavailable */ }
    },
    onChange: state => {
      if (state.account && state.phase === 'synced' && lastPhase === 'syncing' && !state.lastSyncedToastShown) toast('Synced');
      lastPhase = state.account ? (lastPhase === 'synced' ? 'synced' : state.phase) : null;
      renderNav(currentRoute);
      if (currentRoute === 'account') quietly(viewAccount);
      // Hints are offered only when signed in, and a returning student's sign-in is restored a moment after the
      // first page is drawn, so a question page drawn in that moment offered "Sign in for hints" to someone
      // who was. Draw it again, quietly, whenever signing in or out changes which one it should show.
      const nowSignedIn = Boolean(state.account);
      if (nowSignedIn !== wasSignedIn && ['practice', 'review', 'mistakes'].includes(currentRoute)) render({ quiet: true });
      wasSignedIn = nowSignedIn;
      syncCloudLibrary(state);
    },
  });
});
