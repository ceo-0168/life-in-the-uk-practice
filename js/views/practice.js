import { counts, selectQuestions, buildMock, examBreakdown, MOCK } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon, pct } from '../ui.js';

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

  const lengthPicker = h('div', { class: 'seg', role: 'group', 'aria-label': 'Session length' },
    LENGTHS.map((n) => h('button', {
      class: 'seg-btn' + (len === n ? ' on' : ''), type: 'button', 'aria-pressed': len === n ? 'true' : 'false',
      onClick: () => { store.setSettings({ sessionLength: n }); renderPractice(root); },
    }, n === 0 ? 'All' : String(n))));

  const row = (iconName, title, sub, n, onClick, disabled) =>
    h('button', { class: 'row', disabled, onClick },
      h('span', { class: 'row-icon' }, icon(iconName, 20)),
      h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, title), h('span', { class: 'row-sub' }, sub)),
      n != null ? h('span', { class: 'row-n' }, String(n)) : null,
      icon('right', 16));

  const rows = h('div', { class: 'rows card' },
    row('refresh', 'Due for review', 'Questions the spaced-repetition schedule says to revisit', c.due, launch('due', 'Review'), c.due === 0),
    row('alert', 'Weak spots', 'Missed last time or under 60% accuracy', weak, launch('weak', 'Weak spots'), weak === 0),
    row('play', 'New questions', 'Never attempted', c.unseen, launch('new', 'New questions'), c.unseen === 0),
    row('star', 'Saved questions', 'Your starred questions', bm, launch('bookmarked', 'Saved questions'), bm === 0),
    row('target', 'Random mix', 'A random draw from every question', bank.questions.length, launch('random', 'Random mix')));

  const examRows = examBreakdown(cs, bank.questions, bank.meta.exams);
  const exams = h('div', { class: 'exam-grid' },
    examRows.map((r) => h('button', {
      class: 'exam-tile', onClick: () => {
        const qids = selectQuestions('exam', { questions: bank.questions, cards: cs, exam: r.exam });
        startSession({ mode: 'practice', kind: 'exam', label: `Exam ${r.exam}`, qids });
      },
      'aria-label': `Exam ${r.exam}: ${r.seen} of ${r.total} seen, ${r.mastered} mastered`,
    },
      h('span', { class: 'exam-n' }, `Exam ${r.exam}`),
      h('span', { class: 'exam-bar' },
        h('span', { class: 'seg-mastered', style: `width:${pct(r.mastered, r.total)}%` }),
        h('span', { class: 'seg-shaky', style: `width:${pct(r.seen - r.mastered - r.wrong, r.total)}%` }),
        h('span', { class: 'seg-wrong', style: `width:${pct(r.wrong, r.total)}%` })),
      h('span', { class: 'exam-s' }, `${r.seen}/${r.total} seen`))));

  const mock = h('section', { class: 'card mock-card' },
    h('h3', null, 'Mock test'),
    h('ul', { class: 'rules' },
      h('li', null, icon('list', 16), `${MOCK.questions} random questions`),
      h('li', null, icon('clock', 16), `${MOCK.minutes} minutes, auto-submits at zero`),
      h('li', null, icon('check', 16), `Pass mark ${MOCK.passMark}/${MOCK.questions} (75%)`),
      h('li', null, icon('shield', 16), 'No answers shown until you finish')),
    h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: () => startSession({ mode: 'mock', kind: 'mock', label: 'Mock test', qids: buildMock(bank.questions) }) }, icon('play', 18), 'Start mock test'));

  root.replaceChildren(h('div', { class: 'stack-v' },
    mock,
    h('section', null,
      h('div', { class: 'section-head' }, h('h3', null, 'Practise'), h('div', { class: 'len' }, h('span', { class: 'muted' }, 'Questions'), lengthPicker)),
      rows),
    h('section', null,
      h('div', { class: 'section-head' }, h('h3', null, 'Original exams'), h('span', { class: 'muted' }, 'Fixed sets, shuffled')),
      exams,
      h('button', { class: 'btn btn-block', style: 'margin-top:12px', onClick: launch('all', 'Marathon') }, `Marathon — all ${bank.questions.length} questions`))));
  return () => {};
}
