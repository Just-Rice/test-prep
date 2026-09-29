import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Most of js/app.js runs only in a browser, so no other test loads it; a syntax error there (a name declared twice,
// say) would pass every test and then stop the live site from loading at all. Every script must at least parse.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const scripts = dir => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? scripts(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);

test('every script in the app parses', () => {
  for (const file of [...scripts('js'), ...scripts('scripts'), 'server.js']) {
    const run = spawnSync(process.execPath, ['--check', join(ROOT, file)], { encoding: 'utf8' });
    assert.equal(run.status, 0, `${file}: ${run.stderr.split('\n').slice(0, 5).join('\n')}`);
  }
});
