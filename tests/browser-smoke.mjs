// Opens the app in a real browser at a phone size and a desktop size and fails on any console error, any uncaught
// exception, or a page wider than the screen: `npm run test:browser`.
//
// It needs Playwright and a Chromium, which the other tests don't, so it is not named *.test.js and the deploy
// workflow doesn't run it. Install it once with `npm i --no-save playwright && npx playwright install chromium`;
// a Playwright installed globally (npm i -g playwright) is found too.
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VIEWPORTS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1280, height: 800 } },
];
const ROUTES = ['start', 'home', 'practice', 'test', 'review', 'scores', 'plan', 'library', 'resources', 'settings', 'account', 'learn'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

// The pages are served from this checkout at the live site's own address, so the app behaves exactly as it does
// on GitHub Pages (where, for one, it has no built question library to fetch).
const SITE = 'https://just-rice.github.io/test-prep/';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const global = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(join(global, 'noop.js'))('playwright');
  }
}

async function serve(route) {
  const path = normalize(decodeURIComponent(new URL(route.request().url()).pathname.slice(new URL(SITE).pathname.length)));
  const file = join(ROOT, path === '.' || path.endsWith('/') ? `${path}/index.html` : path);
  try {
    await route.fulfill({ body: await readFile(file), contentType: TYPES[extname(file)] || 'application/octet-stream' });
  } catch {
    await route.fulfill({ status: 404, body: '' });
  }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const failures = [];
try {
  for (const { name, ...options } of VIEWPORTS) {
    const context = await browser.newContext(options);
    // Fonts, Firebase and pdf.js come from other sites, so a test run doesn't depend on reaching them; the app has
    // to cope without them anyway (cloud sync says it couldn't load).
    await context.route(url => !url.href.startsWith(SITE), route => route.abort());
    await context.route(url => url.href.startsWith(SITE), serve);
    // A student who has picked a level, so every page opens instead of sending them to Get started.
    await context.addInitScript(() => {
      if (!localStorage.getItem('satprep.progress.v1')) {
        localStorage.setItem('satprep.progress.v1', JSON.stringify({ profile: { mode: 'grade', grade: 11 } }));
      }
    });
    const page = await context.newPage();
    let route = '';
    page.on('pageerror', err => failures.push(`${name} #/${route}: ${err.message}`));
    page.on('console', msg => {
      const url = msg.location().url || '';
      if (msg.type() !== 'error' || (url && !url.startsWith(SITE))) return;
      failures.push(`${name} #/${route}: ${msg.text()} (${url})`);
    });
    for (route of ROUTES) {
      await page.goto(`${SITE}#/${route}`);
      await page.reload();   // a hash change alone doesn't reload, and every page should load on its own
      await page.waitForSelector('#view:not([data-loading])');
      await page.waitForTimeout(300);
      const { scrollWidth, clientWidth } = await page.evaluate(() => {
        const { scrollWidth, clientWidth } = document.documentElement;
        return { scrollWidth, clientWidth };
      });
      if (scrollWidth > clientWidth) failures.push(`${name} #/${route}: page scrolls sideways (${scrollWidth}px wide in ${clientWidth}px)`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`${failures.length} problem(s):\n${failures.map(f => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`${ROUTES.length} pages loaded at ${VIEWPORTS.map(v => v.name).join(' and ')} size with no console errors.`);
