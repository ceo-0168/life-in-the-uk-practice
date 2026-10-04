// Offline-cache and data-pipeline consistency: things that silently break after a deploy if forgotten.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const sw = read('sw.js');
const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');

const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const rel = join(dir, f);
  return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
});

test('every file the service worker caches exists', () => {
  for (const p of shell) assert.ok(existsSync(join(root, p)), `${p} is listed in sw.js but missing`);
});

test('every runtime file is cached for offline use (nothing forgotten)', () => {
  const runtime = [
    'index.html', 'manifest.webmanifest', 'data/questions.json',
    ...walk('js'), ...walk('css'), ...walk('icons'),
  ].map((p) => p.replace(/\\/g, '/'));
  for (const p of runtime) assert.ok(shell.includes(p), `${p} is part of the app but not in sw.js SHELL, so it would be missing offline`);
});

test('sw.js VERSION is stamped from the current file contents (run `npm run stamp` if this fails)', () => {
  const h = createHash('sha1');
  for (const p of [...shell].sort()) h.update(`${p}\n${createHash('sha1').update(readFileSync(join(root, p))).digest('hex')}\n`);
  const expected = h.digest('hex').slice(0, 12);
  const actual = sw.match(/const VERSION = '([^']+)'/)[1];
  assert.equal(actual, expected, 'the app changed but sw.js was not re-stamped, so installed copies would never update');
});

test('the service worker never mixes versions: no per-file background refresh or in-place cache.put', () => {
  assert.ok(!/cache\.put\(/.test(sw), 'cache.put would let files drift out of sync with each other');
  assert.ok(/cache: 'reload'/.test(sw), 'install must bypass the HTTP cache');
  assert.ok(/skipWaiting/.test(sw) && /clients\.claim/.test(sw));
});

test('manifest icons exist and index.html points at real files', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), i.src);
  const html = read('index.html');
  for (const [, href] of html.matchAll(/(?:href|src)="([^":]+\.[a-z]+)"/g)) assert.ok(existsSync(join(root, href)), href);
});

test('all paths are relative, so the app works from a GitHub Pages sub-folder', () => {
  for (const f of ['index.html', ...walk('js'), 'sw.js', 'manifest.webmanifest']) {
    const text = read(f);
    assert.ok(!/(?:href|src|fetch\(|import[^'"]*from\s*)\s*=?\s*['"]\/[a-z]/i.test(text.replace(/'\/\/'/g, '')), `${f} has a root-absolute path`);
  }
});

test('data/questions.json and the ID manifest are exactly what the sources + corrections build', () => {
  const out = execFileSync('python3', ['scripts/build_data.py', '--check'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /up to date/);
});

test('corrections are real: every correction targets a question and the guards pass', () => {
  const corr = JSON.parse(read('source/corrections.json'));
  const data = JSON.parse(read('data/questions.json'));
  const ids = new Set(data.questions.map((q) => q.id));
  for (const id of Object.keys(corr)) assert.ok(ids.has(id), id);
  assert.equal(data.meta.corrections, Object.keys(corr).length);
});

test('known defects stay fixed', () => {
  const data = JSON.parse(read('data/questions.json'));
  const all = data.questions.map((q) => [q.text, q.ref, ...q.options.map((o) => o.t)].join('\n')).join('\n');
  for (const bad of ['Mo Farat', 'Hannukah', 'Normands', 'The Carta Magna', 'Elizebeth', 'Wilmer', 'Cockrell', 'MacBeth', 'invated', 'Roger Banister', 'telecasted', 'Incorrect To apply', "Prime Minister\\'s"]) {
    assert.ok(!all.includes(bad), `"${bad}" is back`);
  }
  const by = Object.fromEntries(data.questions.map((q) => [q.id, q]));
  assert.match(by.e16q14.ref, /£5,000 in Scotland and Northern Ireland/, 'explanation agrees with the key');
  assert.match(by.e12q03.options.find((o) => o.c).t, /90/);
  assert.equal(by.e14q02.ref.includes('108'), false);
  assert.ok(data.questions.filter((q) => q.exams[0].exam === 18).every((q) => q.ref.length > 20), 'Exam 18 questions all have an explanation');
});

test('the answer keys the handbook audit confirmed have not moved', () => {
  const data = JSON.parse(read('data/questions.json'));
  const key = (id) => data.questions.find((q) => q.id === id).options.filter((o) => o.c).map((o) => o.t);
  assert.deepEqual(key('e12q03'), ['90']);
  assert.deepEqual(key('e16q14'), ['£5,000']);
  assert.deepEqual(key('e10q10'), ['60']);
  assert.deepEqual(key('e08q20'), ['Every 4 years']);
  assert.deepEqual(key('e06q12'), ['False']);
  assert.deepEqual(key('e09q03'), ['False']);
});

test('the donation link points to the owner\'s page and opens safely', () => {
  const src = read('js/views/support.js');
  assert.match(src, /SUPPORT_URL = 'https:\/\/buymeacoffee\.com\/ryanchan'/);
  assert.match(src, /rel: 'noopener noreferrer'/);
  assert.match(src, /target: '_blank'/);
});

test('support prompts never appear in the question screens or the welcome screen', () => {
  const session = read('js/session.js');
  const draw = session.slice(session.indexOf('export function renderSession'), session.indexOf('// ---------- results'));
  assert.ok(!/supportCard|coffeeButton/.test(draw), 'no donation UI while answering');
  assert.ok(!/supportCard|coffeeButton/.test(read('js/views/welcome.js')), 'none on the welcome screen');
});
