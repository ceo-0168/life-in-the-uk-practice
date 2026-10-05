import { counts, readiness, verdict, daysToTest, streakDays, todayCount, selectQuestions, isDue, shouldShowWelcome, MOCK } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon, pct, stackedBar, timeAgo, sessionLabel } from '../ui.js';
import { t, tn } from '../i18n.js';
import { renderWelcome } from './welcome.js';
import { supportCard } from './support.js';

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
  if (shouldShowWelcome(state)) return renderWelcome(root, { redraw: () => renderHome(root) });
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
      state.lastExportAt ? t('home.banner.lastBackup', { when: timeAgo(state.lastExportAt) }) : t('home.banner.noBackup'), icon('right', 16)));
  }
  if (active) {
    const done = Object.keys(active.mode === 'mock' ? active.answers : active.checked).length;
    banners.push(h('a', { class: 'banner banner-info', href: '#/session' }, icon('play', 18),
      t('home.banner.resume', { label: sessionLabel(active.mode === 'mock' ? 'Mock test' : active.label), done, total: active.qids.length }), icon('right', 16)));
  }

  const goalPct = Math.min(100, pct(plan.done, plan.goal));
  const planText = plan.qids.length
    ? t('home.plan', { reviews: tn('count.reviews', plan.reviews), fresh: tn('count.newQuestions', plan.fresh) })
      + (plan.other ? t('home.planExtra', { n: plan.other }) : '')
    : t('home.nothingDue');
  const hero = h('section', { class: 'card hero' },
    h('div', { class: 'hero-top' },
      h('div', null,
        h('div', { class: 'eyebrow' }, left == null ? t('home.today') : left === 0 ? t('home.testDay') : tn('home.daysToTest', left)),
        h('h2', null, plan.done >= plan.goal ? t('home.goalReached') : t('home.answeredToday', { done: plan.done, goal: plan.goal }))),
      streak ? h('div', { class: 'streak', title: t('home.streakTitle') }, icon('flame', 18), `${streak}`) : null),
    h('div', { class: 'progress goal' }, h('span', { style: `width:${goalPct}%` })),
    h('p', { class: 'muted' }, planText),
    h('button', {
      class: 'btn btn-primary btn-lg btn-block',
      onClick: () => startSession({ mode: 'practice', kind: 'today', label: "Today's session", qids: plan.qids }),
    }, icon('play', 18), plan.done >= plan.goal ? t('home.keepGoing') : t('home.startToday')));

  const enough = c.seen >= 20;
  const need = Math.round(ready * MOCK.questions);
  const readyCard = h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h3', null, t('home.readiness')),
      enough ? h('span', { class: `chip chip-${v.level}` }, t(`verdict.${v.level}`)) : null),
    h('div', { class: 'ready-row' },
      h('div', { class: 'ready-num' }, enough ? `${need}` : '–', h('span', null, `/${MOCK.questions}`)),
      h('p', { class: 'muted' }, enough ? t('home.readinessEstimate', { pass: MOCK.passMark }) : t('home.readinessNeedMore'))),
    stackedBar([
      { n: c.mastered, cls: 'seg-mastered', label: t('status.mastered') },
      { n: c.shaky, cls: 'seg-shaky', label: t('status.learning') },
      { n: c.wrong, cls: 'seg-wrong', label: t('status.missedLast') },
      { n: c.unseen, cls: 'seg-unseen', label: t('status.notSeen') },
    ], c.total),
    h('ul', { class: 'legend' },
      legend('seg-mastered', t('status.mastered'), c.mastered, t('legend.mastered')),
      legend('seg-shaky', t('status.learning'), c.shaky, t('legend.learning')),
      legend('seg-wrong', t('status.missed'), c.wrong, t('legend.missed')),
      legend('seg-unseen', t('status.notSeen'), c.unseen, t('legend.notSeen'))));

  const tile = (n, label, sub, onClick, disabled) =>
    h('button', { class: 'tile', disabled, onClick }, h('div', { class: 'tile-n' }, String(n)), h('div', { class: 'tile-l' }, label), h('div', { class: 'tile-s' }, sub));
  const weakCount = selectQuestions('weak', { questions: bank.questions, cards: cs, limit: 0 }).length;
  const bmCount = Object.values(state.meta).filter((m) => m.bm).length;
  const go = (kind, label, mode = 'practice') => () => {
    const qids = selectQuestions(kind, { questions: bank.questions, cards: cs, meta: state.meta, limit: state.settings.sessionLength ?? 20 });
    startSession({ mode, kind, label, qids });
  };
  const quick = h('section', null,
    h('div', { class: 'section-head' }, h('h3', null, t('home.quick')), h('a', { class: 'link', href: '#/practice' }, t('home.allOptions'))),
    h('div', { class: 'tiles' },
      tile(c.due, t('tile.due'), t('tile.dueSub'), go('due', 'Review'), c.due === 0),
      tile(weakCount, t('tile.weak'), t('tile.weakSub'), go('weak', 'Weak spots'), weakCount === 0),
      tile(c.unseen, t('tile.new'), t('tile.newSub'), go('new', 'New questions'), c.unseen === 0),
      tile(bmCount, t('tile.saved'), t('tile.savedSub'), go('bookmarked', 'Saved questions'), bmCount === 0)));

  const last = mocks.at(-1);
  const mockCard = h('section', { class: 'card mock-promo' },
    h('div', null,
      h('h3', null, t('home.mock.title')),
      h('p', { class: 'muted' }, t('home.mock.desc', { q: MOCK.questions, m: MOCK.minutes, pass: MOCK.passMark })),
      last ? h('p', { class: 'muted' }, t('home.mock.last', { c: last.correct, t: last.total, result: last.passed ? t('home.mock.passed') : t('home.mock.notYet') })) : null),
    h('a', { class: 'btn', href: '#/practice' }, t('home.mock.take'), icon('right', 18)));

  root.replaceChildren(h('div', { class: 'stack-v' }, ...banners, hero, readyCard, quick, mockCard, supportCard('home')));
  return () => {};
}

function legend(cls, name, n, title) {
  return h('li', { title }, h('span', { class: `dot ${cls}` }), `${name} `, h('strong', null, String(n)));
}
