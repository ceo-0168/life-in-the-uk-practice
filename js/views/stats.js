import { accuracy, activityByDay, counts, examBreakdown, dayKey } from '../engine.js';
import * as store from '../store.js';
import { bank, byId, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon, pct, svgEl, fmtDate, fmtDuration } from '../ui.js';
import { t, tn } from '../i18n.js';

export function renderStats(root) {
  const state = store.getState();
  const cs = cards();
  const c = counts(cs);
  const acc = accuracy(state.attempts);
  const mocks = state.sessions.filter((s) => s.mode === 'mock');
  const days = new Set(state.attempts.map((a) => dayKey(a.t))).size;

  if (!state.attempts.length) {
    root.replaceChildren(h('div', { class: 'empty-state card' },
      icon('chart', 32), h('h3', null, t('stats.empty.title')), h('p', { class: 'muted' }, t('stats.empty.body')),
      h('a', { class: 'btn btn-primary', href: '#/practice' }, t('stats.empty.cta'))));
    return () => {};
  }

  const tiles = h('div', { class: 'tiles tiles-4' },
    stat(String(state.attempts.length), t('stats.tile.answers')),
    stat(acc == null ? '–' : `${Math.round(acc * 100)}%`, t('stats.tile.accuracy')),
    stat(`${c.seen}/${c.total}`, t('stats.tile.seen')),
    stat(mocks.length ? `${mocks.filter((m) => m.passed).length}/${mocks.length}` : '–', t('stats.tile.mocks')));

  root.replaceChildren(h('div', { class: 'stack-v' },
    tiles,
    h('section', { class: 'card' }, h('h3', null, t('stats.trend.title')), trendChart(state.sessions)),
    h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, t('stats.activity')), h('span', { class: 'muted' }, tn('stats.daysPracticed', days))),
      heatmap(state.attempts)),
    h('section', { class: 'card' }, h('h3', null, t('stats.byExam')), examTable(cs)),
    mocks.length ? h('section', { class: 'card' }, h('h3', null, t('home.mock.title')), mockList(mocks)) : null,
    mostMissed(cs)));
  return () => {};
}

const stat = (n, label) => h('div', { class: 'tile static' }, h('div', { class: 'tile-n' }, n), h('div', { class: 'tile-l' }, label));

function trendChart(sessions) {
  const data = sessions.slice(-30).map((s) => ({ p: pct(s.correct, s.total), mock: s.mode === 'mock', t: s.t }));
  if (data.length < 2) return h('p', { class: 'muted' }, t('stats.trend.more'));
  const W = 600, H = 190, L = 34, R = 10, T = 12, B = 22;
  const x = (i) => L + (i * (W - L - R)) / (data.length - 1);
  const y = (p) => T + ((100 - p) * (H - T - B)) / 100;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': t('stats.trend.aria', { n: data.length }) });
  for (const g of [0, 50, 100]) {
    svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), class: 'grid' }), svgEl('text', { x: L - 6, y: y(g) + 4, class: 'axis', 'text-anchor': 'end' }, `${g}%`));
  }
  svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(75), y2: y(75), class: 'passline' }), svgEl('text', { x: W - R, y: y(75) - 4, class: 'axis', 'text-anchor': 'end' }, t('stats.trend.pass')));
  svg.append(svgEl('polyline', { points: data.map((d, i) => `${x(i)},${y(d.p)}`).join(' '), class: 'line' }));
  data.forEach((d, i) => {
    const dot = svgEl('circle', { cx: x(i), cy: y(d.p), r: d.mock ? 5 : 3.5, class: d.mock ? 'pt mock' : 'pt' });
    dot.append(svgEl('title', {}, t(d.mock ? 'stats.trend.pointMock' : 'stats.trend.point', { date: fmtDate(d.t), p: d.p })));
    svg.append(dot);
  });
  return h('div', null, svg, h('p', { class: 'chart-note muted' }, t('stats.trend.note')));
}

function heatmap(attempts) {
  const WEEKS = 10;
  const total = WEEKS * 7;
  const days = activityByDay(attempts, total);
  // pad the front so the first day sits on its weekday row (Monday = row 1)
  const firstDow = (new Date(days[0].t).getDay() + 6) % 7;
  const cells = [...Array.from({ length: firstDow }, () => null), ...days];
  const max = Math.max(1, ...days.map((d) => d.n));
  const level = (n) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  return h('div', { class: 'heat', role: 'img', 'aria-label': t('stats.heat.aria') },
    cells.map((d) => (d
      ? h('span', { class: `heat-cell l${level(d.n)}`, title: `${fmtDate(d.t)}: ${tn('stats.heat.answers', d.n)}` })
      : h('span', { class: 'heat-cell pad' }))));
}

function examTable(cs) {
  const rows = examBreakdown(cs, bank.questions, bank.meta.exams);
  return h('div', { class: 'etable' }, rows.map((r) => h('button', {
    class: 'erow', onClick: () => startSession({ mode: 'practice', kind: 'exam', label: `Exam ${r.exam}`, qids: bank.questions.filter((q) => q.exams.some((w) => w.exam === r.exam)).map((q) => q.id) }),
    'aria-label': t('stats.practiseExamAria', { n: r.exam }),
  },
    h('span', { class: 'erow-n' }, t('kind.exam', { n: r.exam })),
    h('span', { class: 'exam-bar' },
      h('span', { class: 'seg-mastered', style: `width:${pct(r.mastered, r.total)}%` }),
      h('span', { class: 'seg-shaky', style: `width:${pct(r.seen - r.mastered - r.wrong, r.total)}%` }),
      h('span', { class: 'seg-wrong', style: `width:${pct(r.wrong, r.total)}%` })),
    h('span', { class: 'erow-s' }, `${r.mastered}/${r.total}`))));
}

function mockList(mocks) {
  return h('ul', { class: 'mock-list' }, [...mocks].reverse().slice(0, 10).map((m) => h('li', null,
    h('a', { href: `#/results/${m.id}` },
      h('span', { class: `chip ${m.passed ? 'chip-ready' : 'chip-building'}` }, m.passed ? t('stats.pass') : t('stats.fail')),
      h('strong', null, `${m.correct}/${m.total}`),
      h('span', { class: 'muted' }, `${fmtDate(m.t)} · ${fmtDuration(m.ms)}`),
      icon('right', 16)))));
}

function mostMissed(cs) {
  const list = [...cs.values()].filter((c) => c.wrong > 0).sort((a, b) => b.wrong - a.wrong || a.right - b.right).slice(0, 8);
  if (!list.length) return null;
  return h('section', { class: 'card' },
    h('h3', null, t('stats.mostMissed')),
    h('ul', { class: 'missed-list' }, list.map((c) => h('li', null,
      h('span', { class: 'missed-n' }, `${c.wrong}×`),
      h('span', null, byId.get(c.id).text)))),
    h('button', { class: 'btn btn-block', onClick: () => startSession({ mode: 'practice', kind: 'weak', label: 'Most missed', qids: list.map((c) => c.id) }) }, t('stats.practiseThese')));
}
