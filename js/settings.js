// How the app looks and moves — theme, accent colour, text size, contrast and animation — plus two choices
// about what it offers: AI help, and whether the questions written for this app are mixed in with the
// official ones. These stay on the device and are deliberately not part of cloud sync; a phone and a
// laptop can reasonably want different settings.
//
// Each setting becomes a data- attribute on <html>, which css/app.css styles. index.html applies the saved
// values before the first paint so the page never flashes the wrong theme or size.

const KEY = 'satprep.settings.v1';

export const DEFAULTS = { theme: 'system', accent: 'pencil', textsize: 'medium', contrast: 'normal', motion: 'full', explain: 'on', originals: 'on' };

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
  // Turning this off means nothing is ever sent to Gemini, and the AI code is never even downloaded.
  explain: [
    ['on', 'On', 'Ask for a hint before answering, or an explanation afterwards.'],
    ['off', 'Off', 'No AI help, and nothing about your questions leaves this device.'],
  ],
  // The 400 questions written for this app, as opposed to the official ones from College Board and ACT.
  // Leaving them out never leaves a test with nothing: see choosePool in app.js.
  originals: [
    ['on', 'Included', 'Practise with them alongside the official questions, so there are far more to go round.'],
    ['off', 'Official only', 'Only College Board and ACT questions. Fewer of them, so they come round again sooner.'],
  ],
};

export const KEYS = Object.keys(DEFAULTS);

const valid = (key, value) => CHOICES[key].some(([id]) => id === value);

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
}

// True when the student, or their device, has asked for less movement.
export function motionIsReduced(settings) {
  return settings.motion === 'reduced'
    || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
