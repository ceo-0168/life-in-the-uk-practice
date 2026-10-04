import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isCorrect, optionOrder, deriveCards, counts, daysToTest, intervalDays, streakDays,
  selectQuestions, mergeStates, validateState, normalizeState, emptyState, readiness, verdict, examBreakdown,
  todayCount, activityByDay, MOCK, buildMock, dayKey, shouldShowWelcome,
} from '../js/engine.js';

const bank = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url)));
const Q = bank.questions;
const DAY = 86400000;
const NOW = new Date(2026, 9, 4, 12, 0, 0).getTime();
const att = (q, ok, t, id) => ({ id: id || `${q}-${t}`, q, ok, t, sel: [], mode: 'practice' });
const rnd = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('data: every question has options, a correct answer, and pick matches', () => {
  assert.equal(bank.meta.count, Q.length);
  assert.equal(new Set(Q.map((q) => q.id)).size, Q.length, 'ids unique');
  for (const q of Q) {
    assert.ok(q.text.length > 3, q.id);
    assert.ok(q.options.length >= 2, q.id);
    assert.equal(q.pick, q.options.filter((o) => o.c).length, q.id);
    assert.ok(q.pick >= 1 && q.pick < q.options.length, q.id);
    assert.ok(!/ /.test(q.text + q.ref + q.options.map((o) => o.t).join('')), `${q.id} has nbsp`);
  }
});

test('data: every exam in every question maps back to a real exam; exam sizes are consistent', () => {
  for (const e of bank.meta.exams) {
    const n = Q.filter((q) => q.exams.some((w) => w.exam === e)).length;
    assert.equal(n, bank.meta.examSizes[e]);
  }
});

test('isCorrect needs the exact set of correct options', () => {
  const single = Q.find((q) => q.pick === 1);
  const right = single.options.findIndex((o) => o.c);
  assert.equal(isCorrect(single, [right]), true);
  assert.equal(isCorrect(single, [right === 0 ? 1 : 0]), false);
  assert.equal(isCorrect(single, []), false);
  const multi = Q.find((q) => q.pick === 2);
  const want = multi.options.flatMap((o, i) => (o.c ? [i] : []));
  assert.equal(isCorrect(multi, [...want].reverse()), true);
  assert.equal(isCorrect(multi, [want[0]]), false, 'partial answer is wrong');
  const wrongExtra = multi.options.findIndex((o, i) => !o.c && !want.includes(i));
  assert.equal(isCorrect(multi, [...want, wrongExtra]), false, 'extra answer is wrong');
});

test('optionOrder keeps true/false fixed and shuffles the rest as a permutation', () => {
  const tf = Q.find((q) => q.options.length === 2 && q.options.map((o) => o.t.toLowerCase()).sort().join() === 'false,true');
  for (let i = 0; i < 20; i++) {
    const order = optionOrder(tf, true, rnd(i + 3));
    assert.equal(tf.options[order[0]].t.toLowerCase(), 'true');
    assert.equal(tf.options[order[1]].t.toLowerCase(), 'false');
  }
  const four = Q.find((q) => q.options.length === 4);
  const order = optionOrder(four, true, rnd(7));
  assert.deepEqual([...order].sort(), [0, 1, 2, 3]);
  assert.deepEqual(optionOrder(four, false), [0, 1, 2, 3]);
});

test('deriveCards: streak resets on a wrong answer and drives status', () => {
  const id = Q[0].id;
  const a = [att(id, true, NOW - 5 * DAY), att(id, true, NOW - 4 * DAY), att(id, true, NOW - 3 * DAY)];
  let c = deriveCards(a, Q, {}, NOW).get(id);
  assert.equal(c.status, 'mastered');
  assert.equal(c.streak, 3);
  c = deriveCards([...a, att(id, false, NOW - 2 * DAY)], Q, {}, NOW).get(id);
  assert.equal(c.status, 'wrong');
  assert.equal(c.streak, 0);
  assert.equal(c.seen, 4);
  c = deriveCards([att(id, true, NOW - DAY)], Q, {}, NOW).get(id);
  assert.equal(c.status, 'shaky');
});

test('deriveCards ignores attempts for questions no longer in the bank and is order-independent', () => {
  const id = Q[1].id;
  const x = [att('gone', true, NOW), att(id, false, NOW - 2 * DAY), att(id, true, NOW - DAY)];
  const forward = deriveCards(x, Q, {}, NOW).get(id);
  const reversed = deriveCards([...x].reverse(), Q, {}, NOW).get(id);
  assert.deepEqual(forward, reversed);
  assert.equal(forward.status, 'shaky');
});

test('spaced repetition: wrong answers are due now, correct ones wait', () => {
  const [w, r] = [Q[2].id, Q[3].id];
  const cards = deriveCards([att(w, false, NOW - 1000), att(r, true, NOW - 1000)], Q, {}, NOW);
  assert.equal(cards.get(w).due <= NOW, true);
  assert.equal(cards.get(r).due > NOW, true);
  const later = NOW + 2 * DAY;
  assert.equal(deriveCards([att(r, true, NOW - 1000)], Q, {}, later).get(r).due <= later, true);
});

test('test date compresses review intervals', () => {
  assert.equal(intervalDays(5, null), 30);
  assert.equal(intervalDays(5, 14), 6);
  assert.equal(intervalDays(5, 2), 1);
  assert.equal(intervalDays(0, 14), 0);
  assert.equal(daysToTest('2026-10-14', NOW), 10);
  assert.equal(daysToTest('2026-10-04', NOW), 0);
  assert.equal(daysToTest('2026-09-01', NOW), null);
  assert.equal(daysToTest('', NOW), null);
});

test('counts partitions the whole bank', () => {
  const cards = deriveCards([att(Q[0].id, true, NOW - 1), att(Q[1].id, false, NOW - 1)], Q, {}, NOW);
  const c = counts(cards, NOW);
  assert.equal(c.unseen + c.wrong + c.shaky + c.mastered, c.total);
  assert.equal(c.total, Q.length);
  assert.equal(c.seen, 2);
  assert.equal(c.due, 1);
});

test('selectQuestions: new, due, weak, exam, today', () => {
  const attempts = [att(Q[0].id, false, NOW - DAY), att(Q[1].id, true, NOW - 1000), att(Q[2].id, true, NOW - DAY / 2)];
  const cards = deriveCards(attempts, Q, {}, NOW);
  const args = { questions: Q, cards, now: NOW, rnd: rnd(5), limit: 0 };
  const fresh = selectQuestions('new', args);
  assert.equal(fresh.length, Q.length - 3);
  assert.ok(!fresh.includes(Q[0].id));
  assert.deepEqual(selectQuestions('due', args), [Q[0].id]);
  assert.deepEqual(selectQuestions('weak', args), [Q[0].id]);
  const exam = selectQuestions('exam', { ...args, exam: 4 });
  assert.equal(exam.length, bank.meta.examSizes[4]);
  const today = selectQuestions('today', { ...args, limit: 10 });
  assert.equal(today.length, 10);
  assert.ok(today.includes(Q[0].id), 'due review comes first');
  assert.equal(new Set(today).size, 10);
  assert.equal(selectQuestions('random', { ...args, limit: 24 }).length, 24);
  assert.equal(selectQuestions('bookmarked', { ...args, meta: { [Q[5].id]: { bm: true } } })[0], Q[5].id);
});

test('buildMock returns 24 unique questions', () => {
  const m = buildMock(Q, rnd(11));
  assert.equal(m.length, MOCK.questions);
  assert.equal(new Set(m).size, 24);
});

test('streakDays counts consecutive days, allowing a not-yet-practised today', () => {
  const t = (n) => NOW - n * DAY;
  assert.equal(streakDays([att('a', true, t(0)), att('a', true, t(1)), att('a', true, t(2))], NOW), 3);
  assert.equal(streakDays([att('a', true, t(1)), att('a', true, t(2))], NOW), 2);
  assert.equal(streakDays([att('a', true, t(2))], NOW), 0);
  assert.equal(streakDays([], NOW), 0);
});

test('activity helpers', () => {
  const a = [att('a', true, NOW), att('b', true, NOW - 1000), att('c', true, NOW - DAY)];
  assert.equal(todayCount(a, NOW), 2);
  const days = activityByDay(a, 7, NOW);
  assert.equal(days.length, 7);
  assert.equal(days.at(-1).n, 2);
  assert.equal(days.at(-1).key, dayKey(NOW));
  assert.equal(days.at(-2).n, 1);
});

test('mergeStates unions attempts/sessions and takes the newest note', () => {
  const a = emptyState(), b = emptyState();
  a.attempts = [att('x', true, 1, 'a1'), att('x', false, 2, 'a2')];
  b.attempts = [att('x', false, 2, 'a2'), att('y', true, 3, 'b3')];
  a.meta = { x: { bm: true, note: 'old', u: 10 } };
  b.meta = { x: { bm: false, note: 'new', u: 20 }, y: { bm: true, u: 5 } };
  a.sessions = [{ id: 's1', t: 1 }];
  b.sessions = [{ id: 's1', t: 1 }, { id: 's2', t: 2 }];
  const m = mergeStates(a, b);
  assert.deepEqual(m.attempts.map((x) => x.id), ['a1', 'a2', 'b3']);
  assert.equal(m.meta.x.note, 'new');
  assert.equal(m.meta.y.bm, true);
  assert.equal(m.sessions.length, 2);
  assert.deepEqual(mergeStates(m, b).attempts, m.attempts, 'idempotent');
});

test('validateState is structural; normalizeState drops bad entries and coerces the rest', () => {
  assert.equal(validateState(emptyState()), null);
  assert.ok(validateState(null));
  assert.ok(validateState([]));
  assert.ok(validateState({}));
  assert.ok(validateState({ attempts: [], sessions: 'x' }));
  const { state, dropped } = normalizeState({
    attempts: [{ id: 'a', q: 'x', t: 1, ok: true, sel: [0, 'z', 1.5] }, { id: 1 }, null, { id: 'a', q: 'x', t: 2, ok: false }, { id: 'b', q: 'x', t: NaN, ok: true }],
    sessions: [null, { id: 's' }, { id: 's2', t: 1, total: 2, correct: 1, res: {} }],
    meta: [], settings: { testDate: 12345, dailyGoal: 'lots', theme: 'neon', shuffleOptions: 'yes' },
    epoch: 'nope', lastExportAt: 'x', unsaved: -4,
  });
  assert.equal(state.attempts.length, 1, 'duplicate id, malformed and NaN-time attempts dropped');
  assert.deepEqual(state.attempts[0].sel, [0], 'selection indices coerced to integers');
  assert.deepEqual(dropped, { attempts: 4, sessions: 2 });
  assert.equal(state.sessions.length, 1);
  assert.deepEqual(state.meta, {});
  assert.deepEqual(state.settings, { ...emptyState().settings });
  assert.equal(state.unsaved, 0);
  assert.equal(state.epoch.id, 'e0');
  const m = normalizeState({ attempts: [], sessions: [], meta: { q: { bm: 1, note: 5 }, bad: 'x' } }).state.meta;
  assert.deepEqual(m, { q: { bm: true, rep: false, note: '', u: 0 } });
});

test('daysToTest tolerates garbage', () => {
  for (const bad of [12345, {}, [], null, undefined, 'abc', '2026-13', '--']) assert.equal(daysToTest(bad, NOW), null);
});

test('readiness and verdict', () => {
  const none = deriveCards([], Q, {}, NOW);
  assert.ok(readiness(none) < 0.5);
  const all = deriveCards(Q.flatMap((q) => [1, 2, 3].map((i) => att(q.id, true, NOW - i * 1000))), Q, {}, NOW);
  assert.ok(readiness(all) > 0.9);
  const passed = [{ passed: true }, { passed: true }];
  assert.equal(verdict(counts(all, NOW), readiness(all), passed).level, 'ready');
  assert.equal(verdict(counts(all, NOW), readiness(all), []).level, 'close');
  assert.equal(verdict(counts(none, NOW), readiness(none), []).level, 'building');
});

test('examBreakdown totals', () => {
  const cards = deriveCards([att(Q[0].id, true, NOW)], Q, {}, NOW);
  const rows = examBreakdown(cards, Q, bank.meta.exams);
  assert.equal(rows.length, 18);
  assert.equal(rows.find((r) => r.exam === 1).seen, 1);
});

test('clock skew: a future-dated attempt cannot pin a card or push its due date out', () => {
  const id = Q[0].id;
  // device clock was 3 days ahead when the wrong answer was recorded; later answers were recorded in order
  const a = [att(id, false, NOW + 3 * DAY, 'w'), att(id, true, NOW + 3 * DAY + 1, 'r1'), att(id, true, NOW + 3 * DAY + 2, 'r2')];
  const c = deriveCards(a, Q, {}, NOW).get(id);
  assert.equal(c.streak, 2);
  assert.equal(c.status, 'shaky');
  assert.ok(c.due <= NOW + 3 * DAY, 'due date is computed from min(lastT, now)');
  const wrongOnly = deriveCards([att(id, false, NOW + 3 * DAY)], Q, {}, NOW).get(id);
  assert.ok(wrongOnly.due <= NOW, 'a wrong answer is due now even if its timestamp is in the future');
});

test('daily plan: due reviews first, then new, never duplicates, always fills the goal', () => {
  const answered = Q.slice(0, 200).map((q, i) => att(q.id, false, NOW - DAY * 2 - i)); // 200 overdue
  const cards = deriveCards(answered, Q, {}, NOW);
  const plan = selectQuestions('today', { questions: Q, cards, now: NOW, rnd: rnd(9), limit: 20 });
  assert.equal(plan.length, 20);
  assert.equal(new Set(plan).size, 20);
  const due = plan.filter((id) => cards.get(id).seen > 0).length;
  const fresh = plan.filter((id) => cards.get(id).seen === 0).length;
  assert.equal(due, 12, '60% of the goal is reviews');
  assert.equal(fresh, 8);
  // with no unseen questions left, the remaining slots are still due reviews rather than random cards
  const all = deriveCards(Q.map((q, i) => att(q.id, false, NOW - DAY * 2 - i)), Q, {}, NOW);
  const plan2 = selectQuestions('today', { questions: Q, cards: all, now: NOW, rnd: rnd(3), limit: 20 });
  assert.equal(plan2.filter((id) => all.get(id).due <= NOW).length, 20);
});

test('mergeStates: settings and counters follow the newest edit', () => {
  const a = emptyState(), b = emptyState();
  a.settings.testDate = '2026-11-01'; a.settingsAt = 10; a.unsaved = 3;
  b.settings.testDate = '2026-12-01'; b.settingsAt = 20; b.lastExportAt = 99; b.unsaved = 1;
  const m = mergeStates(a, b);
  assert.equal(m.settings.testDate, '2026-12-01');
  assert.equal(m.settingsAt, 20);
  assert.equal(m.lastExportAt, 99);
  assert.equal(m.unsaved, 3);
  assert.equal(mergeStates(b, a).settings.testDate, '2026-12-01', 'order does not matter');
});

test('merge never changes what the cards say about answers both sides already have', () => {
  const x = [att(Q[0].id, true, 1000, 'p'), att(Q[0].id, false, 2000, 'q')];
  const y = [att(Q[0].id, false, 2000, 'q'), att(Q[1].id, true, 3000, 'r')];
  const A = { ...emptyState(), attempts: x }, B = { ...emptyState(), attempts: y };
  const ab = deriveCards(mergeStates(A, B).attempts, Q, {}, NOW);
  const ba = deriveCards(mergeStates(B, A).attempts, Q, {}, NOW);
  assert.deepEqual([...ab], [...ba], 'commutative');
});

test('the welcome screen is only for brand-new visitors', () => {
  const fresh = emptyState();
  assert.equal(shouldShowWelcome(fresh), true);
  assert.equal(shouldShowWelcome({ ...fresh, settings: { ...fresh.settings, welcomed: true } }), false, 'dismissed');
  assert.equal(shouldShowWelcome({ ...fresh, attempts: [att(Q[0].id, true, NOW)] }), false, 'has answers');
  assert.equal(shouldShowWelcome({ ...fresh, sessions: [{ id: 's' }] }), false, 'has history');
  // an imported backup or an existing user's saved data (which has no "welcomed" field) never triggers it
  const legacy = normalizeState({ attempts: [{ id: 'a', q: 'x', t: 1, ok: true }], sessions: [], meta: {}, settings: {} }).state;
  assert.equal(shouldShowWelcome(legacy), false);
  assert.equal(normalizeState({ attempts: [], sessions: [], settings: { welcomed: 'yes' } }).state.settings.welcomed, false, 'non-boolean is ignored');
});
