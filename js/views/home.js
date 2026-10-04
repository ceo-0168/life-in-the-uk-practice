import { counts, readiness, verdict, daysToTest, streakDays, todayCount, selectQuestions, isDue, MOCK } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon, pct, stackedBar, timeAgo } from '../ui.js';

export function planFor(state, cs) {
  const goal = state.settings.dailyGoal;
  const done = todayCount(state.attempts);
  const size = done >= goal ? goal : goal - done;
  const qids = selectQuestions('today', { questions: bank.questions, cards: cs, limit: Math.max(5, size) });
  const reviews = qids.filter((id) => isDue(cs.get(id))).length;
  const fresh = qids.filter((id) => cs.get(id).seen === 0).length;
  return { qids, reviews, fresh, other: qids.length - reviews - fresh, goal, done };
}

export function renderHome(root) {
  const state = store.getState();
  const cs = cards();
  const c = counts(cs);
  const ready = readiness(cs);
  const mocks = state.sessions.filter((s) => s.mode === 'mock');
  const v = verdict(c, ready, mocks);
  const left = daysToTest(state.settings.testDate);
  const streak = streakDays(state.attempts);
  const plan = planFor(state, cs);
  const active = store.getActive();
  const health = store.getHealth();

  const banners = [];
  if (!health.ok) banners.push(h('div', { class: 'banner banner-bad', role: 'alert' }, icon('alert', 18), health.message));
  if (health.notice) banners.push(h('div', { class: 'banner banner-warn', role: 'status' }, icon('alert', 18), health.notice));
  const daysSinceExport = state.lastExportAt ? (Date.now() - state.lastExportAt) / 86400000 : Infinity;
  if (state.attempts.length >= 20 && (state.unsaved >= 60 || daysSinceExport > 7)) {
    banners.push(h('a', { class: 'banner banner-warn', href: '#/settings' }, icon('download', 18),
      state.lastExportAt ? `Last backup ${timeAgo(state.lastExportAt)}. Back up your progress.` : 'No backup yet. Back up your progress so it can never be lost.', icon('right', 16)));
  }
  if (active) {
    const done = Object.keys(active.mode === 'mock' ? active.answers : active.checked).length;
    banners.push(h('a', { class: 'banner banner-info', href: '#/session' }, icon('play', 18),
      `Resume ${active.mode === 'mock' ? 'mock test' : active.label.toLowerCase()} — ${done}/${active.qids.length} done`, icon('right', 16)));
  }

  const goalPct = Math.min(100, pct(plan.done, plan.goal));
  const hero = h('section', { class: 'card hero' },
    h('div', { class: 'hero-top' },
      h('div', null,
        h('div', { class: 'eyebrow' }, left == null ? 'Today' : left === 0 ? 'Test day' : `${left} day${left === 1 ? '' : 's'} to your test`),
        h('h2', null, plan.done >= plan.goal ? 'Daily goal reached' : `${plan.done}/${plan.goal} answered today`)),
      streak ? h('div', { class: 'streak', title: 'Consecutive days practised' }, icon('flame', 18), `${streak}`) : null),
    h('div', { class: 'progress goal' }, h('span', { style: `width:${goalPct}%` })),
    h('p', { class: 'muted' }, plan.qids.length
      ? `Today's session: ${plan.reviews} review${plan.reviews === 1 ? '' : 's'} + ${plan.fresh} new question${plan.fresh === 1 ? '' : 's'}${plan.other ? ` + ${plan.other} more to practise` : ''}`
      : 'Nothing due — pick a topic below.'),
    h('button', {
      class: 'btn btn-primary btn-lg btn-block',
      onClick: () => startSession({ mode: 'practice', kind: 'today', label: "Today's session", qids: plan.qids }),
    }, icon('play', 18), plan.done >= plan.goal ? 'Keep going' : "Start today's session"));

  const enough = c.seen >= 20;
  const need = Math.round(ready * MOCK.questions);
  const readyCard = h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h3', null, 'Test readiness'),
      enough ? h('span', { class: `chip chip-${v.level}` }, v.text) : null),
    h('div', { class: 'ready-row' },
      h('div', { class: 'ready-num' }, enough ? `${need}` : '–', h('span', null, `/${MOCK.questions}`)),
      h('p', { class: 'muted' }, enough
        ? `Estimated score on a real test (pass mark ${MOCK.passMark}), from how well you know the questions you've seen and how many you haven't yet.`
        : 'Answer 20 questions to get an estimated test score.')),
    stackedBar([
      { n: c.mastered, cls: 'seg-mastered', label: 'Mastered' },
      { n: c.shaky, cls: 'seg-shaky', label: 'Learning' },
      { n: c.wrong, cls: 'seg-wrong', label: 'Missed last time' },
      { n: c.unseen, cls: 'seg-unseen', label: 'Not seen' },
    ], c.total),
    h('ul', { class: 'legend' },
      legend('seg-mastered', 'Mastered', c.mastered, 'Right 3 times in a row'),
      legend('seg-shaky', 'Learning', c.shaky, 'Right last time'),
      legend('seg-wrong', 'Missed', c.wrong, 'Wrong last time'),
      legend('seg-unseen', 'Not seen', c.unseen, 'Not attempted yet')));

  const tile = (n, label, sub, onClick, disabled) =>
    h('button', { class: 'tile', disabled, onClick }, h('div', { class: 'tile-n' }, String(n)), h('div', { class: 'tile-l' }, label), h('div', { class: 'tile-s' }, sub));
  const weakCount = selectQuestions('weak', { questions: bank.questions, cards: cs, limit: 0 }).length;
  const bmCount = Object.values(state.meta).filter((m) => m.bm).length;
  const go = (kind, label, mode = 'practice') => () => {
    const qids = selectQuestions(kind, { questions: bank.questions, cards: cs, meta: state.meta, limit: state.settings.sessionLength ?? 20 });
    startSession({ mode, kind, label, qids });
  };
  const quick = h('section', null,
    h('div', { class: 'section-head' }, h('h3', null, 'Quick practice'), h('a', { class: 'link', href: '#/practice' }, 'All options')),
    h('div', { class: 'tiles' },
      tile(c.due, 'Due for review', 'Spaced repetition', go('due', 'Review'), c.due === 0),
      tile(weakCount, 'Weak spots', 'Missed or under 60%', go('weak', 'Weak spots'), weakCount === 0),
      tile(c.unseen, 'New questions', 'Not seen yet', go('new', 'New questions'), c.unseen === 0),
      tile(bmCount, 'Saved', 'Starred questions', go('bookmarked', 'Saved questions'), bmCount === 0)));

  const mockCard = h('section', { class: 'card mock-promo' },
    h('div', null,
      h('h3', null, 'Mock test'),
      h('p', { class: 'muted' }, `${MOCK.questions} questions · ${MOCK.minutes} minutes · pass at ${MOCK.passMark}. No feedback until the end.`),
      mocks.length ? h('p', { class: 'muted' }, `Last: ${mocks.at(-1).correct}/${mocks.at(-1).total} ${mocks.at(-1).passed ? '— passed' : '— not yet'}`) : null),
    h('a', { class: 'btn', href: '#/practice' }, 'Take a mock', icon('right', 18)));

  root.replaceChildren(h('div', { class: 'stack-v' }, ...banners, hero, readyCard, quick, mockCard));
  return () => {};
}

function legend(cls, name, n, title) {
  return h('li', { title }, h('span', { class: `dot ${cls}` }), `${name} `, h('strong', null, String(n)));
}
