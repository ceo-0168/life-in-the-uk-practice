import * as store from '../store.js';
import { bank, cards, examLabel } from '../ctx.js';
import { h, icon, toast } from '../ui.js';
import { t, tn } from '../i18n.js';

const PAGE = 40;
const FILTERS = [
  ['all', 'browse.all'], ['unseen', 'status.notSeen'], ['wrong', 'status.missed'], ['shaky', 'status.learning'],
  ['mastered', 'status.mastered'], ['bm', 'tile.saved'], ['rep', 'q.reported'], ['note', 'browse.notes'],
];
const STATUS_KEY = { unseen: 'status.notSeen', wrong: 'status.missedLast', shaky: 'status.learning', mastered: 'status.mastered' };

// remembered while the tab is open so returning from a session doesn't reset the filter
const ui = { q: '', filter: 'all', exam: 'all', shown: PAGE };

export function renderBrowse(root) {
  const state = store.getState();
  const cs = cards();

  const search = h('input', {
    class: 'input', type: 'search', placeholder: t('browse.searchPlaceholder'), value: ui.q, 'aria-label': t('browse.searchAria'),
    onInput: (e) => { ui.q = e.target.value; ui.shown = PAGE; draw(); },
  });
  const examSel = h('select', { class: 'input', 'aria-label': t('browse.examFilterAria'), onChange: (e) => { ui.exam = e.target.value; ui.shown = PAGE; draw(); } },
    h('option', { value: 'all' }, t('browse.allExams')),
    bank.meta.exams.map((n) => h('option', { value: String(n), selected: String(n) === ui.exam }, t('kind.exam', { n }))));
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('browse.statusFilterAria') });
  const list = h('div', { class: 'qlist' });
  const count = h('p', { class: 'muted qcount', 'aria-live': 'polite' });

  root.replaceChildren(h('div', { class: 'stack-v' }, h('div', { class: 'filters' }, search, examSel), chips, count, list));
  draw();

  function matches(q) {
    const c = cs.get(q.id);
    const m = state.meta[q.id] || {};
    if (ui.exam !== 'all' && !q.exams.some((w) => String(w.exam) === ui.exam)) return false;
    switch (ui.filter) {
      case 'unseen': case 'wrong': case 'shaky': case 'mastered': if (c.status !== ui.filter) return false; break;
      case 'bm': if (!m.bm) return false; break;
      case 'rep': if (!m.rep) return false; break;
      case 'note': if (!m.note) return false; break;
      default:
    }
    if (ui.q.trim()) {
      const needle = ui.q.trim().toLowerCase();
      const hay = (q.text + ' ' + q.options.map((o) => o.t).join(' ') + ' ' + q.ref + ' ' + (m.note || '')).toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  }

  function draw() {
    chips.replaceChildren(...FILTERS.map(([k, labelKey]) => h('button', {
      class: 'chip-btn' + (ui.filter === k ? ' on' : ''), type: 'button', 'aria-pressed': ui.filter === k ? 'true' : 'false',
      onClick: () => { ui.filter = k; ui.shown = PAGE; draw(); },
    }, t(labelKey))));
    const found = bank.questions.filter(matches);
    count.textContent = tn('browse.count', found.length);
    list.replaceChildren(...found.slice(0, ui.shown).map(item));
    if (found.length > ui.shown) {
      list.append(h('button', { class: 'btn btn-block', onClick: () => { ui.shown += PAGE; draw(); } }, t('browse.showMore', { n: Math.min(PAGE, found.length - ui.shown) })));
    }
    if (!found.length) list.append(h('p', { class: 'empty' }, t('browse.noMatch')));
  }

  function item(q) {
    const c = cs.get(q.id);
    const m = () => store.getState().meta[q.id] || {};
    const body = h('div', { class: 'qi-body' });
    const flags = h('span', { class: 'qi-flags' });
    const paintFlags = () => flags.replaceChildren(...[
      m().bm ? h('span', { class: 'qi-flag', title: t('q.saved') }, icon('star', 14)) : null,
      m().rep ? h('span', { class: 'qi-flag', title: t('q.reported') }, icon('alert', 14)) : null].filter(Boolean));
    paintFlags();
    const d = h('details', { class: 'qi' },
      h('summary', null,
        h('span', { class: `dot seg-${c.status === 'unseen' ? 'unseen' : c.status}`, title: t(STATUS_KEY[c.status]) }),
        h('span', { class: 'qi-text' }, q.text),
        flags),
      body);
    d.addEventListener('toggle', () => { if (d.open && !body.childElementCount) fill(); });
    function fill() {
      const mm = m();
      const note = h('textarea', {
        class: 'input note', rows: 2, placeholder: t('browse.notePlaceholder'), 'aria-label': t('browse.noteAria'),
        onChange: (e) => { store.setMeta(q.id, { note: e.target.value.trim() }); toast(t('browse.noteSaved'), { ms: 1200 }); },
      });
      note.value = mm.note || '';
      body.replaceChildren(
        h('p', { class: 'q-source' }, examLabel(q)),
        h('ul', { class: 'qi-opts' }, q.options.map((o) => h('li', { class: o.c ? 'right' : '' }, icon(o.c ? 'check' : 'x', 14), o.t))),
        h('p', { class: 'qi-ref' }, q.ref || t('q.noExplanation')),
        q.note ? h('p', { class: 'qi-ref' }, h('strong', null, t('q.sinceHandbook') + ' '), q.note) : null,
        h('p', { class: 'muted qi-hist' }, c.seen ? t('browse.hist', { status: t(STATUS_KEY[c.status]), n: c.seen, right: c.right, wrong: c.wrong }) : t('browse.notAttempted')),
        note,
        h('div', { class: 'qi-actions' },
          h('button', { class: 'tool' + (mm.bm ? ' on' : ''), type: 'button', onClick: () => { store.setMeta(q.id, { bm: !m().bm }); fill(); paintFlags(); } }, icon('star', 16), mm.bm ? t('q.saved') : t('q.save')),
          h('button', { class: 'tool' + (mm.rep ? ' on' : ''), type: 'button', onClick: () => { store.setMeta(q.id, { rep: !m().rep }); fill(); paintFlags(); } }, icon('alert', 16), mm.rep ? t('q.reported') : t('q.looksWrong'))));
    }
    return d;
  }
  return () => {};
}
