// Persistence tests. A fake localStorage is shared by several instances of the store module
// (loaded with different query strings) to behave like several tabs of one browser.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class FakeStorage {
  constructor() { this.m = new Map(); this.failWrites = false; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { if (this.failWrites) throw new Error('QuotaExceededError'); this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
const tab = async () => {
  const s = await import(`../js/store.js?tab=${n++}`);
  s.init();
  return s;
};
const raw = (k) => JSON.parse(globalThis.localStorage.getItem(k));
const attempt = (store, q, ok = true, extra = {}) => store.recordAttempt({ q, ok, sel: [0], ms: 10, mode: 'practice', s: 's1', ...extra });

beforeEach(() => { globalThis.localStorage = new FakeStorage(); });

test('two tabs never overwrite each other: every answer from both survives', async () => {
  const A = await tab(), B = await tab();
  for (let i = 0; i < 10; i++) attempt(A, `qa${i}`);
  attempt(B, 'qb0');                       // B was opened before A's answers existed
  assert.equal(raw('litukp:state:v1').attempts.length, 11, 'storage has all 11');
  attempt(A, 'qa10');
  assert.equal(raw('litukp:state:v1').attempts.length, 12);
  assert.equal(A.getState().attempts.length, 12);
});

test('a stale tab\'s import-merge does not wipe newer answers made elsewhere', async () => {
  const A = await tab(), B = await tab();
  for (let i = 0; i < 5; i++) attempt(A, `q${i}`);
  const backup = { app: 'life-in-the-uk-practice', state: { attempts: [{ id: 'other', q: 'zz', t: 5, ok: true, sel: [] }], sessions: [], meta: {} } };
  const res = B.importData(backup, 'merge');
  assert.equal(res.ok, true);
  assert.equal(raw('litukp:state:v1').attempts.length, 6, '5 from tab A + 1 imported');
});

test('recordAttempt with an id is idempotent; addSession upserts', async () => {
  const S = await tab();
  attempt(S, 'q1', true, { id: 'sess:q1' });
  attempt(S, 'q1', true, { id: 'sess:q1' });
  assert.equal(S.getState().attempts.length, 1);
  S.addSession({ id: 's', t: 1, total: 1, correct: 1, res: { q1: 'r' }, mode: 'practice' });
  S.addSession({ id: 's', t: 1, total: 1, correct: 1, res: { q1: 'r' }, mode: 'practice' });
  assert.equal(S.getState().sessions.length, 1);
  assert.equal(raw('litukp:state:v1').sessions.length, 1);
});

test('after a device clock that ran ahead, new answers are still ordered after old ones', async () => {
  const S = await tab();
  attempt(S, 'q1', false, { t: Date.now() + 3 * 86400000 });
  const next = attempt(S, 'q1', true);
  assert.ok(next.t > S.getState().attempts[0].t);
});

test('bookmarks and notes: clearing leaves a tombstone, so a merge from an older backup cannot bring them back', async () => {
  const S = await tab();
  S.setMeta('q1', { bm: true, note: 'hello' });
  const oldCopy = JSON.parse(JSON.stringify(S.exportData()));
  await new Promise((r) => setTimeout(r, 5));
  S.setMeta('q1', { bm: false, note: '' });
  assert.equal(S.getState().meta.q1.bm, false);
  S.importData(oldCopy, 'merge');
  assert.equal(S.getState().meta.q1.bm, false, 'still cleared');
  assert.equal(S.getState().meta.q1.note, '');
});

test('hostile or partial imports cannot break the app', async () => {
  const S = await tab();
  attempt(S, 'q1');
  const bad = [
    { attempts: [], meta: null, sessions: [] },
    { attempts: [], meta: [], sessions: [null, 5, { id: 1 }] },
    { attempts: [null, { id: 'x' }], meta: {}, sessions: [], settings: { testDate: 12345, theme: {} } },
  ];
  for (const b of bad) {
    const res = S.importData(b, 'merge');
    assert.equal(typeof res.ok, 'boolean');
    S.setMeta('q1', { bm: true });                 // would throw if meta were null
    assert.equal(typeof S.getState().settings.testDate, 'string');
  }
  assert.equal(S.importData({ attempts: [{ id: 1 }], sessions: [] }, 'merge').ok, false, 'nothing readable is refused');
  assert.equal(S.importData('nonsense', 'merge').ok, false);
  assert.equal(S.getState().attempts.length, 1, 'existing answers untouched');
});

test('replace-import keeps the old data as a previous copy that can be restored', async () => {
  const S = await tab();
  for (let i = 0; i < 5; i++) attempt(S, `q${i}`);
  const res = S.importData({ attempts: [], sessions: [], meta: {} }, 'replace');
  assert.equal(res.ok, true);
  assert.equal(S.getState().attempts.length, 0);
  const prev = S.listPrev();
  assert.equal(prev.length, 1);
  assert.equal(prev[0].answers, 5);
  // a later "launch" must not destroy it
  const next = await tab();
  assert.equal(next.listPrev().length, 1);
  assert.equal(next.restorePrev(0).ok, true);
  assert.equal(next.getState().attempts.length, 5);
  assert.equal(next.listPrev().length, 1, 'restoring an empty state does not add a pointless copy');
});

test('erase keeps a restorable copy, and other open tabs adopt the erase instead of resurrecting data', async () => {
  const A = await tab(), B = await tab();
  for (let i = 0; i < 4; i++) attempt(A, `q${i}`);
  attempt(B, 'qb');                                   // B syncs to 5
  await sleep(5);                                     // (a real erase involves a confirmation dialog)
  assert.equal(A.resetAll().ok, true);
  assert.equal(raw('litukp:state:v1').attempts.length, 0);
  await sleep(5);
  attempt(B, 'after-erase-in-B');                     // stale tab writes
  const stored = raw('litukp:state:v1');
  assert.equal(stored.attempts.length, 1, 'only the answer made after the erase');
  assert.equal(stored.attempts[0].q, 'after-erase-in-B');
  const relaunch = await tab();
  const copies = relaunch.listPrev();
  assert.equal(copies[0].answers, 5, 'the pre-erase copy survived a relaunch');
  assert.equal(relaunch.restorePrev(0).ok, true);
  assert.equal(relaunch.getState().attempts.length, 5);
});

test('unreadable main data: restored from the snapshot, raw copy set aside, notice shown', async () => {
  const S = await tab();
  for (let i = 0; i < 40; i++) attempt(S, `q${i}`);     // the snapshot refreshes every 25 answers
  globalThis.localStorage.setItem('litukp:state:v1', '{"v":1,"attempts":[{"id":"x"');
  const R = await tab();
  const got = R.getState().attempts.length;
  assert.ok(got >= 15 && got <= 40, `restored ${got} of 40 answers (at most 25 recent ones can be lost)`);
  assert.match(R.getHealth().notice, /restored from the automatic backup/);
  assert.ok(globalThis.localStorage.getItem('litukp:corrupt:v1').startsWith('{"v":1'));
  assert.equal(raw('litukp:state:v1').attempts.length, got, 'good data written back straight away');
});

test('the snapshot never shrinks within an epoch', async () => {
  const S = await tab();
  for (let i = 0; i < 30; i++) attempt(S, `q${i}`);
  const held = raw('litukp:snapshot:v1').state.attempts.length;
  assert.ok(held >= 26);
  globalThis.localStorage.setItem('litukp:state:v1', JSON.stringify({ ...raw('litukp:state:v1'), attempts: raw('litukp:state:v1').attempts.slice(0, 1) }));
  await tab();                                         // a launch that sees a (wrongly) small main document
  assert.equal(raw('litukp:snapshot:v1').state.attempts.length, held, 'snapshot still holds the full history');
});

test('storage full: the failure is reported, not hidden', async () => {
  const S = await tab();
  const errors = [];
  S.setErrorHandler((m) => errors.push(m));
  globalThis.localStorage.failWrites = true;
  attempt(S, 'q1');
  assert.equal(S.getHealth().ok, false);
  assert.equal(errors.length, 1);
  globalThis.localStorage.failWrites = false;
  attempt(S, 'q2');
  assert.equal(S.getHealth().ok, true, 'recovers once writes work again');
});

test('a destructive action is refused when the safety copy cannot be saved', async () => {
  const S = await tab();
  attempt(S, 'q1');
  globalThis.localStorage.failWrites = true;
  const res = S.resetAll();
  assert.equal(res.ok, false);
  assert.equal(S.getState().attempts.length, 1, 'nothing was erased');
});

test('export is clean: no pending-change counter, and re-importing it as a merge adds nothing', async () => {
  const S = await tab();
  attempt(S, 'q1'); attempt(S, 'q2');
  const exp = JSON.parse(JSON.stringify(S.exportData()));
  assert.equal(exp.state.unsaved, 0);
  assert.ok(exp.state.lastExportAt > 0);
  assert.match(S.importData(exp, 'merge').message, /0 new answers/);
});
