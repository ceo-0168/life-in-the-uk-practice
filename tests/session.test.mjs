// The finish logic of sessions, without a browser. These guard the "mock finished twice" bugs.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class FakeStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
globalThis.localStorage = new FakeStorage();

const store = await import('../js/store.js');
const { byId } = await import('../js/ctx.js');
const { completeMock, completePractice, sanitizeActive } = await import('../js/session.js');
const { MOCK, isCorrect } = await import('../js/engine.js');

const bank = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url)));
for (const q of bank.questions) byId.set(q.id, q);
const Q = bank.questions;
const correctSel = (q) => q.options.flatMap((o, i) => (o.c ? [i] : []));
const wrongSel = (q) => { const i = q.options.findIndex((o) => !o.c); return [i]; };

const newMock = (nRight, nWrong, nSkipped = 0) => {
  const qids = Q.slice(0, MOCK.questions).map((q) => q.id);
  const a = {
    id: 'mock1', mode: 'mock', kind: 'mock', label: 'Mock test', qids, i: 0,
    startedAt: Date.now() - 600000, deadline: Date.now() + 1200000,
    orders: {}, answers: {}, checked: {}, results: {}, spent: {}, flags: {},
  };
  qids.forEach((id, i) => {
    const q = byId.get(id);
    if (i < nRight) a.answers[id] = correctSel(q);
    else if (i < nRight + nWrong) a.answers[id] = wrongSel(q);
  });
  return a;
};

beforeEach(() => { globalThis.localStorage = new FakeStorage(); store.init(); });

test('marking a mock twice records every answer and the session exactly once', () => {
  const a = newMock(20, 2, 2);
  const first = completeMock(a, false);
  const again = completeMock(a, true);                // double tap, timer + dialog race, or a second tab
  const st = store.getState();
  assert.equal(st.attempts.length, 22, '22 answered questions, recorded once');
  assert.equal(st.sessions.length, 1);
  assert.equal(first.correct, 20);
  assert.equal(again.correct, 20, 'same score both times');
  assert.equal(st.sessions[0].mode, 'mock');
});

test('pass mark is exactly 18/24; unanswered counts as wrong', () => {
  assert.equal(completeMock({ ...newMock(18, 0, 6), id: 'a' }, false).passed, true);
  assert.equal(completeMock({ ...newMock(17, 1, 6), id: 'b' }, false).passed, false);
  const s = completeMock({ ...newMock(18, 3, 3), id: 'c' }, false);
  assert.deepEqual([s.correct, s.total, s.passed], [18, 24, true]);
  assert.equal(Object.values(s.res).filter((r) => r === 'u').length, 3);
});

test('a partly answered "choose two" question is scored wrong, not skipped', () => {
  const a = newMock(0, 0, 24);
  const two = Q.find((q) => q.pick === 2);
  a.qids[0] = two.id;
  a.answers[two.id] = [correctSel(two)[0]];            // only one of the two
  const s = completeMock(a, false);
  assert.equal(s.res[two.id], 'w');
  assert.equal(store.getState().attempts[0].ok, false);
});

test('a mock found expired is stamped with the time it ended, not the time it was reopened', () => {
  const a = newMock(5, 0, 19);
  a.deadline = Date.now() - 3 * 3600000;               // ran out three hours ago
  a.startedAt = a.deadline - 45 * 60000;
  const s = completeMock(a, true);
  assert.equal(s.timedOut, true);
  assert.equal(s.ms, 45 * 60000, 'duration capped at the time limit');
  assert.ok(store.getState().attempts.every((x) => x.t === a.deadline), 'answers dated to when time ran out');
});

test('scoring in a finished mock agrees with isCorrect', () => {
  const a = newMock(10, 10, 4);
  const s = completeMock(a, false);
  for (const [id, r] of Object.entries(s.res)) {
    if (r === 'u') continue;
    assert.equal(r === 'r', isCorrect(byId.get(id), a.answers[id]));
  }
});

test('finishing a practice session twice also records one session', () => {
  const qids = Q.slice(0, 3).map((q) => q.id);
  const a = { id: 'p1', mode: 'practice', kind: 'new', label: 'New', qids, startedAt: Date.now() - 1000, checked: { [qids[0]]: true, [qids[1]]: true }, results: { [qids[0]]: 'r', [qids[1]]: 'w' } };
  completePractice(a); completePractice(a);
  assert.equal(store.getState().sessions.length, 1);
  assert.equal(store.getState().sessions[0].total, 2);
  assert.equal(completePractice({ ...a, id: 'p2', checked: {} }), null, 'nothing answered → no session');
});

test('resuming against a changed question bank: missing questions are dropped, bad data discarded', () => {
  const ids = Q.slice(0, 5).map((q) => q.id);
  const a = {
    id: 's', mode: 'mock', qids: [...ids, 'gone1', 'gone2'], i: 5,
    orders: { [ids[0]]: [3, 2, 1, 0], [ids[1]]: [0, 1] /* wrong length */, [ids[2]]: [0, 0, 1, 2] /* not a permutation */ },
    answers: { [ids[0]]: [99, 1, -1, 'x'], [ids[3]]: [0], gone1: [0] },
    checked: {}, results: {}, spent: {}, flags: {},
  };
  const s = sanitizeActive(a);
  assert.deepEqual(s.qids, ids);
  assert.ok(s.i >= 0 && s.i < ids.length, 'position clamped into range');
  assert.deepEqual(s.orders[ids[0]], [3, 2, 1, 0], 'valid order kept');
  assert.equal(s.orders[ids[1]], undefined);
  assert.equal(s.orders[ids[2]], undefined);
  assert.deepEqual(s.answers[ids[0]], [1], 'only in-range integer selections kept');
  assert.deepEqual(s.answers[ids[3]], [0]);
  assert.equal(sanitizeActive({ qids: ['gone1'] }), null, 'nothing left → no session');
  assert.equal(sanitizeActive(null), null);
  assert.equal(sanitizeActive({ qids: 'nope' }), null);
});
