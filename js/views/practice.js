import { counts, selectQuestions, buildMock, examBreakdown, MOCK } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon, pct } from '../ui.js';
import { t } from '../i18n.js';

const LENGTHS = [10, 20, 50, 0];

export function renderPractice(root) {
  const state = store.getState();
  const cs = cards();
  const c = counts(cs);
  const len = state.settings.sessionLength ?? 20;
  const meta = state.meta;
  const bm = Object.values(meta).filter((m) => m.bm).length;
  const weak = selectQuestions('weak', { questions: bank.questions, cards: cs, limit: 0 }).length;

  const launch = (kind, label, extra = {}) => () => {
    const qids = selectQuestions(kind, { questions: bank.questions, cards: cs, meta, limit: len, ...extra });
    if (!qids.length) return;
    startSession({ mode: 'practice', kind, label, qids });
  };

  const lengthPicker = h('div', { class: 'seg', role: 'group', 'aria-label': t('practice.lengthAria') },
    LENGTHS.map((n) => h('button', {
      class: 'seg-btn' + (len === n ? ' on' : ''), type: 'button', 'aria-pressed': len === n ? 'true' : 'false',
      onClick: () => { store.setSettings({ sessionLength: n }); renderPractice(root); },
    }, n === 0 ? t('practice.all') : String(n))));

  const row = (iconName, title, sub, n, onClick, disabled) =>
    h('button', { class: 'row', disabled, onClick },
      h('span', { class: 'row-icon' }, icon(iconName, 20)),
      h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, title), h('span', { class: 'row-sub' }, sub)),
      n != null ? h('span', { class: 'row-n' }, String(n)) : null,
      icon('right', 16));

  const rows = h('div', { class: 'rows card' },
    row('refresh', t('tile.due'), t('row.dueSub'), c.due, launch('due', 'Review'), c.due === 0),
    row('alert', t('tile.weak'), t('row.weakSub'), weak, launch('weak', 'Weak spots'), weak === 0),
    row('play', t('tile.new'), t('row.newSub'), c.unseen, launch('new', 'New questions'), c.unseen === 0),
    row('star', t('kind.saved'), t('row.savedSub'), bm, launch('bookmarked', 'Saved questions'), bm === 0),
    row('target', t('kind.random'), t('row.randomSub'), bank.questions.length, launch('random', 'Random mix')));

  const examRows = examBreakdown(cs, bank.questions, bank.meta.exams);
  const exams = h('div', { class: 'exam-grid' },
    examRows.map((r) => h('button', {
      class: 'exam-tile', onClick: () => {
        const qids = selectQuestions('exam', { questions: bank.questions, cards: cs, exam: r.exam });
        startSession({ mode: 'practice', kind: 'exam', label: `Exam ${r.exam}`, qids });
      },
      'aria-label': t('practice.examAria', { n: r.exam, seen: r.seen, total: r.total, mastered: r.mastered }),
    },
      h('span', { class: 'exam-n' }, t('kind.exam', { n: r.exam })),
      h('span', { class: 'exam-bar' },
        h('span', { class: 'seg-mastered', style: `width:${pct(r.mastered, r.total)}%` }),
        h('span', { class: 'seg-shaky', style: `width:${pct(r.seen - r.mastered - r.wrong, r.total)}%` }),
        h('span', { class: 'seg-wrong', style: `width:${pct(r.wrong, r.total)}%` })),
      h('span', { class: 'exam-s' }, t('practice.examSeen', { seen: r.seen, total: r.total })))));

  const mock = h('section', { class: 'card mock-card' },
    h('h3', null, t('home.mock.title')),
    h('ul', { class: 'rules' },
      h('li', null, icon('list', 16), t('practice.rule.random', { n: MOCK.questions })),
      h('li', null, icon('clock', 16), t('practice.rule.minutes', { n: MOCK.minutes })),
      h('li', null, icon('check', 16), t('practice.rule.pass', { pass: MOCK.passMark, total: MOCK.questions })),
      h('li', null, icon('shield', 16), t('practice.rule.noAnswers'))),
    h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: () => startSession({ mode: 'mock', kind: 'mock', label: 'Mock test', qids: buildMock(bank.questions) }) }, icon('play', 18), t('practice.startMock')));

  root.replaceChildren(h('div', { class: 'stack-v' },
    mock,
    h('section', null,
      h('div', { class: 'section-head' }, h('h3', null, t('practice.practise')), h('div', { class: 'len' }, h('span', { class: 'muted' }, t('practice.questions')), lengthPicker)),
      rows),
    h('section', null,
      h('div', { class: 'section-head' }, h('h3', null, t('practice.originalExams')), h('span', { class: 'muted' }, t('practice.fixedSets'))),
      exams,
      h('button', { class: 'btn btn-block', style: 'margin-top:12px', onClick: launch('all', 'Marathon') }, t('practice.marathon', { n: bank.questions.length })))));
  return () => {};
}
