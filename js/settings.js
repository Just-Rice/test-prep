// How the app looks and moves — theme, accent colour, text size, contrast and animation — extra time on timed
// tests, and two choices about what it offers: AI help, and whether the questions written for this app are mixed in
// with the official ones. These stay on the device and are deliberately not part of cloud sync; a phone and a
// laptop can reasonably want different settings.
//
// Each setting becomes a data- attribute on <html>, which css/app.css styles. index.html applies the saved
// values before the first paint so the page never flashes the wrong theme or size.

const KEY = 'satprep.settings.v1';

export const DEFAULTS = { theme: 'system', accent: 'pencil', textsize: 'medium', contrast: 'normal', motion: 'full', time: 'standard', explain: 'on', questions: 'auto', level: 'adaptive' };

// [value, label, description] for each setting, in the order the Settings page shows them.
export const CHOICES = {
  theme: [
    ['system', 'Match my device', 'Follows your system’s light or dark setting.'],
    ['light', 'Light', 'Always light, whatever your device is set to.'],
    ['dark', 'Dark', 'Always dark, whatever your device is set to.'],
  ],
  accent: [
    ['pencil', 'Pencil', 'Yellow, like a #2 pencil.'],
    ['ocean', 'Ocean', 'Blue.'],
    ['forest', 'Forest', 'Green.'],
    ['grape', 'Grape', 'Purple.'],
    ['ember', 'Ember', 'Warm orange-red.'],
  ],
  textsize: [
    ['small', 'Small', ''],
    ['medium', 'Medium', ''],
    ['large', 'Large', ''],
    ['xlarge', 'Extra large', ''],
  ],
  contrast: [
    ['normal', 'Normal', 'The standard palette.'],
    ['high', 'High contrast', 'Stronger borders and darker text, for easier reading.'],
  ],
  motion: [
    ['full', 'Full', 'Pages, cards and answers animate as they appear.'],
    ['reduced', 'Reduced', 'Almost no movement. Turned on automatically if your device asks for reduced motion.'],
  ],
  // Extra time on timed practice tests, for a student approved for it on test day: College Board, ACT and the AAMC
  // all grant time and a half and double time. Only timed tests change; placement and practice aren't timed.
  time: [
    ['standard', 'Standard time', 'The time everyone gets on test day.'],
    ['1.5', 'Time and a half', '50% more time for every section and module.'],
    ['2', 'Double time', 'Twice the time for every section and module.'],
  ],
  // Turning this off means nothing is ever sent to Gemini, and the AI code is never even downloaded.
  explain: [
    ['on', 'On', 'Ask for a hint before answering, or an explanation afterwards.'],
    ['off', 'Off', 'No AI help, and nothing about your questions leaves this device.'],
  ],
  // Whether the 400 questions written for this app are mixed in with the official College Board and ACT ones.
  // Until someone picks, it is 'auto' and follows their account: official questions only for anyone invited to
  // the shared library, since they have those, and the written ones included for everyone else, for whom they
  // are all there is (see includesWritten in app.js). Leaving them out never leaves a test with nothing: see
  // choosePool. This setting was once called "originals"; the new name means a value saved under the old one,
  // which saving any other setting also wrote, doesn't count as a choice.
  questions: [
    ['on', 'Included', 'Practise with them alongside the official questions, so there are far more to go round.'],
    ['off', 'Official only', 'Only College Board and ACT questions. Fewer of them, so they come round again sooner.'],
  ],
  // How hard practice questions are. Chosen on the Practice page itself, where it matters, and kept here
  // so it stays chosen. Timed tests and the placement test keep their own mix regardless.
  level: [
    ['adaptive', 'Matched to me', 'Questions at the level you are likely to get about 70% of right, moving as you improve.'],
    ['Easy', 'Easy', ''],
    ['Medium', 'Medium', ''],
    ['Hard', 'Hard', ''],
  ],
};

export const KEYS = Object.keys(DEFAULTS);

// A default that isn't one of the offered choices, like 'auto', is valid too: it means nothing has been picked.
const valid = (key, value) => value === DEFAULTS[key] || CHOICES[key].some(([id]) => id === value);

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return Object.fromEntries(KEYS.map(key => [key, valid(key, saved[key]) ? saved[key] : DEFAULTS[key]]));
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save settings', err);
  }
}

export function applySettings(settings) {
  const root = document.documentElement;
  for (const key of KEYS) root.setAttribute(`data-${key}`, settings[key]);
  matchBrowserBar();
}

// On a phone the browser's own bar sits directly above the app's top bar, so it takes the same colour and
// follows the theme with it, including when the device itself switches between light and dark.
function matchBrowserBar() {
  const colour = getComputedStyle(document.documentElement).getPropertyValue('--side').trim();
  if (colour) for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = colour;
}
globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', matchBrowserBar);

// True when the student, or their device, has asked for less movement.
export function motionIsReduced(settings) {
  return settings.motion === 'reduced'
    || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
