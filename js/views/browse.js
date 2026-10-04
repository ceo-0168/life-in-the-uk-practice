import * as store from '../store.js';
import { bank, cards, examLabel } from '../ctx.js';
import { h, icon, toast } from '../ui.js';

const PAGE = 40;
const FILTERS = [
  ['all', 'All'], ['unseen', 'Not seen'], ['wrong', 'Missed'], ['shaky', 'Learning'],
  ['mastered', 'Mastered'], ['bm', 'Saved'], ['rep', 'Reported'], ['note', 'Notes'],
];
const STATUS_LABEL = { unseen: 'Not seen', wrong: 'Missed last time', shaky: 'Learning', mastered: 'Mastered' };

// remembered while the tab is open so returning from a session doesn't reset the filter
const ui = { q: '', filter: 'all', exam: 'all', shown: PAGE };

export function renderBrowse(root) {
  const state = store.getState();
  const cs = cards();

  const search = h('input', {
    class: 'input', type: 'search', placeholder: 'Search questions and answers', value: ui.q, 'aria-label': 'Search questions',
    onInput: (e) => { ui.q = e.target.value; ui.shown = PAGE; draw(); },
  });
  const examSel = h('select', { class: 'input', 'aria-label': 'Filter by exam', onChange: (e) => { ui.exam = e.target.value; ui.shown = PAGE; draw(); } },
    h('option', { value: 'all' }, 'All exams'),
    bank.meta.exams.map((n) => h('option', { value: String(n), selected: String(n) === ui.exam }, `Exam ${n}`)));
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by status' });
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
    chips.replaceChildren(...FILTERS.map(([k, label]) => h('button', {
      class: 'chip-btn' + (ui.filter === k ? ' on' : ''), type: 'button', 'aria-pressed': ui.filter === k ? 'true' : 'false',
      onClick: () => { ui.filter = k; ui.shown = PAGE; draw(); },
    }, label)));
    const found = bank.questions.filter(matches);
    count.textContent = `${found.length} question${found.length === 1 ? '' : 's'}`;
    list.replaceChildren(...found.slice(0, ui.shown).map(item));
    if (found.length > ui.shown) {
      list.append(h('button', { class: 'btn btn-block', onClick: () => { ui.shown += PAGE; draw(); } }, `Show ${Math.min(PAGE, found.length - ui.shown)} more`));
    }
    if (!found.length) list.append(h('p', { class: 'empty' }, 'No questions match.'));
  }

  function item(q) {
    const c = cs.get(q.id);
    const m = () => store.getState().meta[q.id] || {};
    const body = h('div', { class: 'qi-body' });
    const flags = h('span', { class: 'qi-flags' });
    const paintFlags = () => flags.replaceChildren(...[
      m().bm ? h('span', { class: 'qi-flag', title: 'Saved' }, icon('star', 14)) : null,
      m().rep ? h('span', { class: 'qi-flag', title: 'Reported' }, icon('alert', 14)) : null].filter(Boolean));
    paintFlags();
    const d = h('details', { class: 'qi' },
      h('summary', null,
        h('span', { class: `dot seg-${c.status === 'unseen' ? 'unseen' : c.status}`, title: STATUS_LABEL[c.status] }),
        h('span', { class: 'qi-text' }, q.text),
        flags),
      body);
    d.addEventListener('toggle', () => { if (d.open && !body.childElementCount) fill(); });
    function fill() {
      const mm = m();
      const note = h('textarea', {
        class: 'input note', rows: 2, placeholder: 'Add a note or memory trick…', 'aria-label': 'Note',
        onChange: (e) => { store.setMeta(q.id, { note: e.target.value.trim() }); toast('Note saved', { ms: 1200 }); },
      });
      note.value = mm.note || '';
      body.replaceChildren(
        h('p', { class: 'q-source' }, examLabel(q)),
        h('ul', { class: 'qi-opts' }, q.options.map((o) => h('li', { class: o.c ? 'right' : '' }, icon(o.c ? 'check' : 'x', 14), o.t))),
        h('p', { class: 'qi-ref' }, q.ref || 'No explanation is provided for this question in the source.'),
        q.note ? h('p', { class: 'qi-ref' }, h('strong', null, 'Since the handbook: '), q.note) : null,
        h('p', { class: 'muted qi-hist' }, c.seen ? `${STATUS_LABEL[c.status]} · answered ${c.seen}× (${c.right} right, ${c.wrong} wrong)` : 'Not attempted yet'),
        note,
        h('div', { class: 'qi-actions' },
          h('button', { class: 'tool' + (mm.bm ? ' on' : ''), type: 'button', onClick: () => { store.setMeta(q.id, { bm: !m().bm }); fill(); paintFlags(); } }, icon('star', 16), mm.bm ? 'Saved' : 'Save'),
          h('button', { class: 'tool' + (mm.rep ? ' on' : ''), type: 'button', onClick: () => { store.setMeta(q.id, { rep: !m().rep }); fill(); paintFlags(); } }, icon('alert', 16), mm.rep ? 'Reported' : 'Looks wrong?')));
    }
    return d;
  }
  return () => {};
}
