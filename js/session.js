// Running a session (practice with instant feedback, or a timed mock) and showing results.
import { MOCK, isCorrect, optionOrder, shuffle, uid, supportKindForSession } from './engine.js';
import * as store from './store.js';
import { byId, examLabel } from './ctx.js';
import { supportCard } from './views/support.js';
import { h, icon, toast, announce, closeDialogs, openDialog, confirmDialog, fmtDuration, pct } from './ui.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_Q_MS = 5 * 60 * 1000;

// ---------- starting ----------

export async function startSession({ mode, kind, label, qids }) {
  const prior = store.getActive();
  if (prior?.mode === 'mock') {
    // A mock's answers are only scored when it finishes, so replacing it would throw them away.
    const answered = Object.keys(prior.answers || {}).length;
    const discard = await confirmDialog({
      title: 'Discard your mock test?',
      body: `You have a mock test in progress (${answered} of ${prior.qids.length} answered). Starting something new discards it without scoring.`,
      confirm: 'Discard and start', cancel: 'Resume the mock', danger: true,
    });
    if (!discard) { location.hash = '#/session'; return; }
  }
  const settings = store.getState().settings;
  const ordered = settings.shuffleQuestions || mode === 'mock' ? shuffle(qids) : qids;
  const now = Date.now();
  store.saveActive({
    id: uid(), mode, kind, label,
    qids: ordered,
    i: 0,
    startedAt: now,
    shownAt: now,
    limitSec: mode === 'mock' ? MOCK.minutes * 60 : null,
    deadline: mode === 'mock' ? now + MOCK.minutes * 60 * 1000 : null,
    orders: {}, answers: {}, checked: {}, results: {}, spent: {}, flags: {},
  });
  location.hash = '#/session';
}

/**
 * Make a saved session safe to resume against the current question bank: questions that no longer exist
 * are dropped, and stored option orders / selections that no longer fit a question are discarded.
 */
export function sanitizeActive(a) {
  if (!a || !Array.isArray(a.qids)) return null;
  for (const k of ['orders', 'answers', 'checked', 'results', 'spent', 'flags']) {
    if (!a[k] || typeof a[k] !== 'object') a[k] = {};
  }
  const kept = a.qids.filter((id) => byId.has(id));
  if (!kept.length) return null;
  if (kept.length !== a.qids.length) {
    const currentId = a.qids[a.i];
    a.qids = kept;
    a.i = kept.includes(currentId) ? kept.indexOf(currentId) : Math.min(a.i || 0, kept.length - 1);
  }
  a.i = Math.max(0, Math.min(a.qids.length - 1, Number.isInteger(a.i) ? a.i : 0));
  for (const id of a.qids) {
    const n = byId.get(id).options.length;
    const order = a.orders[id];
    if (order && !(Array.isArray(order) && order.length === n && [...order].sort((x, y) => x - y).every((v, i) => v === i))) delete a.orders[id];
    if (a.answers[id]) {
      const sel = (Array.isArray(a.answers[id]) ? a.answers[id] : []).filter((v) => Number.isInteger(v) && v >= 0 && v < n);
      if (sel.length) a.answers[id] = sel; else delete a.answers[id];
    }
  }
  return a;
}

// ---------- finishing (shared by the UI and by the "expired while away" path) ----------
// Attempt ids are derived from the session and question, and sessions are upserted by id, so running any
// of these twice (double tap, two tabs, a crash half-way through) can never double-count anything.

export function completePractice(a) {
  const ids = a.qids.filter((id) => a.checked[id]);
  if (!ids.length) { store.clearActive(); return null; }
  const res = {};
  for (const id of ids) res[id] = a.results[id];
  const summary = {
    id: a.id, mode: 'practice', kind: a.kind, label: a.label, t: Date.now(), started: a.startedAt,
    total: ids.length, correct: ids.filter((id) => res[id] === 'r').length,
    ms: Date.now() - a.startedAt, res,
  };
  store.addSession(summary);
  store.clearActive();
  return summary;
}

export function completeMock(a, timedOut) {
  const endT = Math.min(Date.now(), a.deadline);
  const res = {};
  let correct = 0;
  for (const id of a.qids) {
    const sel = a.answers[id];
    if (!sel || !sel.length) { res[id] = 'u'; continue; }
    const ok = isCorrect(byId.get(id), sel);
    res[id] = ok ? 'r' : 'w';
    if (ok) correct++;
    store.recordAttempt({ id: `${a.id}:${id}`, q: id, ok, sel, ms: a.spent[id], mode: 'mock', s: a.id, t: endT });
  }
  const summary = {
    id: a.id, mode: 'mock', kind: 'mock', label: 'Mock test', t: endT, started: a.startedAt,
    total: a.qids.length, correct, passed: correct >= MOCK.passMark, timedOut: !!timedOut,
    ms: endT - a.startedAt, res,
  };
  store.addSession(summary);
  store.clearActive();
  return summary;
}

// ---------- the session view ----------

export function renderSession(root) {
  const a = sanitizeActive(store.getActive());
  if (!a) {
    store.clearActive();
    location.hash = '#/';
    return () => {};
  }
  const mock = a.mode === 'mock';

  // An expired mock found on load (app reopened after the time ran out): score it straight away.
  // Nothing below (timers, key handlers) has been set up yet, so nothing can fire a second time.
  if (mock && Date.now() >= a.deadline) {
    const summary = completeMock(a, true);
    toast("The time ran out while you were away, so your test was marked.", { ms: 4000 });
    location.hash = `#/results/${summary.id}`;
    return () => {};
  }

  const settings = store.getState().settings;
  let timerId = null;
  let finished = false;

  const persist = () => { if (!finished) store.saveActive(a); };
  const cur = () => byId.get(a.qids[a.i]);
  const orderFor = (q) => (a.orders[q.id] ||= optionOrder(q, settings.shuffleOptions));
  const isAnswered = (id) => (a.answers[id] || []).length === byId.get(id).pick;
  const touch = () => {
    const q = cur();
    const dt = Math.min(MAX_Q_MS, Date.now() - a.shownAt);
    a.spent[q.id] = (a.spent[q.id] || 0) + dt;
    a.shownAt = Date.now();
  };

  const view = h('div', { class: 'session' });
  root.replaceChildren(view);

  function draw({ focusQuestion = false } = {}) {
    if (finished) return;
    const q = cur();
    const order = orderFor(q);
    const checked = !!a.checked[q.id];
    const sel = a.answers[q.id] || [];
    const meta = store.getState().meta[q.id] || {};
    const answeredCount = a.qids.filter(isAnswered).length;
    const focusKey = document.activeElement?.dataset?.focus;

    // top bar
    const timer = mock ? h('span', { class: 'timer', id: 'timer', role: 'timer', 'aria-label': 'Time remaining' }, '') : null;
    const top = h('div', { class: 'session-top' },
      h('button', { class: 'btn btn-ghost btn-sm', onClick: endEarly, 'aria-label': mock ? 'Finish test' : 'End session', 'data-focus': 'end' }, icon('x', 18), mock ? 'Finish' : 'End'),
      h('div', { class: 'session-count' }, `Question ${a.i + 1} of ${a.qids.length}`),
      timer || h('span', { class: 'session-label' }, a.label));
    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': 0, 'aria-valuemax': a.qids.length, 'aria-valuenow': a.i + (checked ? 1 : 0) },
      h('span', { style: `width:${((a.i + (checked ? 1 : 0)) / a.qids.length) * 100}%` }));

    // question card
    const hint = q.pick > 1 ? `Select ${q.pick} answers` : 'Select 1 answer';
    const options = h('div', { class: 'options', role: q.pick > 1 ? 'group' : 'radiogroup', 'aria-label': hint },
      order.map((idx, pos) => {
        const o = q.options[idx];
        const picked = sel.includes(idx);
        let cls = 'opt' + (picked ? ' picked' : '');
        let mark = null;
        let status = '';
        if (checked) {
          if (o.c) { cls += picked ? ' right' : ' missed'; mark = icon('check', 18); status = picked ? ', correct' : ', the correct answer'; }
          else if (picked) { cls += ' wrong'; mark = icon('x', 18); status = ', incorrect'; }
        }
        return h('button', {
          class: cls, type: 'button', role: q.pick > 1 ? 'checkbox' : 'radio',
          'aria-checked': picked ? 'true' : 'false', 'aria-label': `${LETTERS[pos]}. ${o.t}${status}`, disabled: checked,
          'data-focus': `opt-${idx}`, onClick: () => choose(idx),
        },
          h('span', { class: 'opt-key', 'aria-hidden': 'true' }, LETTERS[pos]),
          h('span', { class: 'opt-text' }, o.t),
          mark ? h('span', { class: 'opt-mark' }, mark) : null,
          checked && o.c && !picked ? h('span', { class: 'opt-note', 'aria-hidden': 'true' }, 'Correct answer') : null);
      }));

    const tools = h('div', { class: 'q-tools' },
      h('button', { class: 'tool' + (meta.bm ? ' on' : ''), type: 'button', 'aria-pressed': meta.bm ? 'true' : 'false', 'data-focus': 'tool-bm', onClick: () => { store.setMeta(q.id, { bm: !meta.bm }); draw(); } },
        icon('star', 16), meta.bm ? 'Saved' : 'Save'),
      mock ? h('button', { class: 'tool' + (a.flags[q.id] ? ' on' : ''), type: 'button', 'aria-pressed': a.flags[q.id] ? 'true' : 'false', 'data-focus': 'tool-flag', onClick: () => { a.flags[q.id] = !a.flags[q.id]; persist(); draw(); } },
        icon('flag', 16), a.flags[q.id] ? 'Flagged' : 'Flag for later') : null,
      !mock ? h('button', { class: 'tool' + (meta.rep ? ' on' : ''), type: 'button', 'aria-pressed': meta.rep ? 'true' : 'false', 'data-focus': 'tool-rep', title: 'Mark this question or its answer as looking wrong', onClick: () => { store.setMeta(q.id, { rep: !meta.rep }); toast(!meta.rep ? 'Marked as possibly wrong. Find it under Questions → Reported.' : 'Report removed.'); draw(); } },
        icon('alert', 16), meta.rep ? 'Reported' : 'Looks wrong?') : null);

    const card = h('section', { class: 'card q-card', 'aria-label': 'Question' },
      h('div', { class: 'q-source' }, examLabel(q)),
      h('h2', { class: 'q-text', tabIndex: -1 }, q.text),
      h('p', { class: 'q-hint' + (q.pick > 1 ? ' multi' : '') }, hint),
      options, tools);

    // feedback (practice only). Announced through the shell's live region, not here.
    let feedback = null;
    if (!mock && checked) {
      const ok = a.results[q.id] === 'r';
      feedback = h('section', { class: 'card feedback ' + (ok ? 'ok' : 'bad') },
        h('div', { class: 'feedback-head' }, icon(ok ? 'check' : 'x', 20), ok ? 'Correct' : 'Not quite'),
        !ok ? h('p', { class: 'feedback-answer' }, 'Correct: ', q.options.filter((o) => o.c).map((o) => o.t).join(' · ')) : null,
        h('p', { class: 'feedback-ref' }, q.ref || 'No explanation is provided for this question in the source.'),
        q.note ? h('p', { class: 'feedback-note' }, h('strong', null, 'Since the handbook: '), q.note) : null);
    }

    // bottom action bar
    const last = a.i === a.qids.length - 1;
    let actions;
    if (mock) {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn', disabled: a.i === 0, 'data-focus': 'act-back', onClick: () => go(a.i - 1) }, icon('left', 18), 'Back'),
        h('button', { class: 'btn btn-ghost', onClick: openNavigator, 'aria-label': `Question navigator, ${answeredCount} of ${a.qids.length} answered` }, icon('grid', 18), `${answeredCount}/${a.qids.length}`),
        last
          ? h('button', { class: 'btn btn-primary', 'data-focus': 'act-primary', onClick: () => finishMock(false) }, 'Finish test')
          : h('button', { class: 'btn btn-primary', 'data-focus': 'act-primary', onClick: () => go(a.i + 1) }, 'Next', icon('right', 18)));
    } else if (!checked) {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn btn-primary btn-block', 'data-focus': 'act-primary', disabled: sel.length !== q.pick, onClick: check },
          sel.length === q.pick ? 'Check answer' : `Select ${q.pick - sel.length} more`));
    } else {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn btn-primary btn-block', onClick: next, 'data-focus': 'act-primary', id: 'next-btn' }, last ? 'See results' : 'Next question', icon('right', 18)));
    }

    view.replaceChildren(...[top, bar, card, feedback, actions].filter(Boolean));
    tick();
    // Keep keyboard / screen-reader focus where it was; on a new question, start at its text.
    const target = focusQuestion ? view.querySelector('.q-text') : focusKey && view.querySelector(`[data-focus="${focusKey}"]:not([disabled])`);
    target?.focus({ preventScroll: true });
  }

  function choose(idx) {
    if (finished) return;
    const q = cur();
    if (a.checked[q.id]) return;
    let sel = [...(a.answers[q.id] || [])];
    if (sel.includes(idx)) sel = sel.filter((i) => i !== idx);
    else if (q.pick === 1) sel = [idx];
    else if (sel.length < q.pick) sel.push(idx);
    else { toast(`Select exactly ${q.pick} — tap one to deselect first.`, { ms: 2200 }); return; }
    if (sel.length) a.answers[q.id] = sel; else delete a.answers[q.id];
    persist();
    draw();
  }

  function check() {
    if (finished) return;
    const q = cur();
    const sel = a.answers[q.id] || [];
    if (sel.length !== q.pick || a.checked[q.id]) return;
    touch();
    const ok = isCorrect(q, sel);
    a.checked[q.id] = true;
    a.results[q.id] = ok ? 'r' : 'w';
    store.recordAttempt({ id: `${a.id}:${q.id}`, q: q.id, ok, sel, ms: a.spent[q.id], mode: a.kind === 'retry' ? 'retry' : 'practice', s: a.id });
    persist();
    draw();
    announce(ok ? 'Correct.' : `Not quite. Correct answer: ${q.options.filter((o) => o.c).map((o) => o.t).join(', ')}.`);
    view.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function next() {
    if (finished) return;
    if (a.i >= a.qids.length - 1) return finishPractice();
    a.i++;
    a.shownAt = Date.now();
    persist();
    draw({ focusQuestion: true });
    window.scrollTo(0, 0);
  }

  function go(i) {
    if (finished) return;
    touch();
    a.i = Math.max(0, Math.min(a.qids.length - 1, i));
    persist();
    draw({ focusQuestion: true });
    window.scrollTo(0, 0);
  }

  async function endEarly() {
    if (finished) return;
    if (mock) return finishMock(false);
    const done = Object.keys(a.checked).length;
    if (done === 0) {
      const sure = await confirmDialog({ title: 'Leave this session?', body: 'You have not answered anything yet.', confirm: 'Leave', cancel: 'Stay' });
      if (!sure || finished) return;
      finished = true;
      store.clearActive();
      location.hash = '#/';
      return;
    }
    const sure = await confirmDialog({ title: 'End session?', body: `${done} answer${done === 1 ? ' is' : 's are'} already saved. The remaining questions stay unanswered.`, confirm: 'End and see results', cancel: 'Keep going' });
    if (sure) finishPractice();
  }

  function openNavigator() {
    const label = (id, i) => `Question ${i + 1}${isAnswered(id) ? ', answered' : a.answers[id] ? ', partly answered' : ', not answered'}${a.flags[id] ? ', flagged' : ''}`;
    const cells = a.qids.map((id, i) => h('button', {
      class: 'nav-cell' + (isAnswered(id) ? ' done' : '') + (a.flags[id] ? ' flagged' : '') + (i === a.i ? ' current' : ''),
      type: 'submit', value: String(i), 'aria-label': label(id, i),
    }, String(i + 1)));
    const dlg = h('dialog', { class: 'dialog', 'aria-label': 'Questions' },
      h('form', { method: 'dialog' },
        h('h2', null, 'Questions'),
        h('div', { class: 'nav-grid' }, cells),
        h('p', { class: 'nav-legend' }, h('span', { class: 'dot done' }), 'Answered ', h('span', { class: 'dot flagged' }), 'Flagged ', h('span', { class: 'dot' }), 'Unanswered'),
        h('div', { class: 'dialog-actions' }, h('button', { class: 'btn', value: 'close' }, 'Close'))));
    dlg.addEventListener('close', () => {
      const n = Number(dlg.returnValue);
      dlg.remove();
      if (!finished && /^\d+$/.test(dlg.returnValue) && Number.isFinite(n)) go(n);
    });
    document.body.append(dlg);
    openDialog(dlg);
  }

  // ----- finishing -----
  function finishPractice() {
    if (finished) return;
    finished = true;
    touch();
    clearInterval(timerId);
    closeDialogs();
    const summary = completePractice(a);
    location.hash = summary ? `#/results/${summary.id}` : '#/';
  }

  async function finishMock(timedOut) {
    if (finished) return;
    if (!timedOut) {
      const unanswered = a.qids.filter((id) => !isAnswered(id)).length;
      const flagged = a.qids.filter((id) => a.flags[id]).length;
      const parts = [];
      if (unanswered) parts.push(`${unanswered} unanswered or incomplete question${unanswered === 1 ? '' : 's'} will count as wrong`);
      if (flagged) parts.push(`${flagged} flagged`);
      const sure = await confirmDialog({
        title: 'Finish the test?',
        body: parts.length ? `${parts.join('; ')}. You cannot change answers after finishing.` : 'You cannot change answers after finishing.',
        confirm: 'Finish and mark', cancel: 'Keep working',
      });
      // The clock may have run out (and already marked the test) while the dialog was open.
      if (!sure || finished) return;
    }
    finished = true;
    touch();
    clearInterval(timerId);
    closeDialogs();
    const summary = completeMock(a, timedOut);
    location.hash = `#/results/${summary.id}`;
  }

  // ----- timer (mock) -----
  function tick() {
    if (!mock || finished) return;
    const el = view.querySelector('#timer');
    const left = Math.max(0, a.deadline - Date.now());
    if (el) {
      el.textContent = fmtDuration(left);
      el.classList.toggle('warn', left < 5 * 60000);
      el.classList.toggle('danger', left < 60000);
    }
    if (left <= 0) {
      clearInterval(timerId);
      toast("Time's up — marking your test.", { ms: 2500 });
      finishMock(true);
    }
  }
  if (mock) timerId = setInterval(tick, 1000);

  // ----- keyboard -----
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, dialog, select')) return;
    const q = cur();
    const checked = !!a.checked[q.id];
    if (/^[1-9]$/.test(e.key) && !checked) {
      const idx = orderFor(q)[Number(e.key) - 1];
      if (idx !== undefined) choose(idx);
    } else if (e.key === 'Enter') {
      if (mock || e.target.closest?.('button, a')) return;
      e.preventDefault();
      if (checked) next(); else check();
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.classList?.contains('opt')) {
      const opts = [...view.querySelectorAll('.opt')];
      const j = opts.indexOf(e.target) + (e.key === 'ArrowDown' ? 1 : -1);
      if (opts[j]) { e.preventDefault(); opts[j].focus(); }
    } else if (mock && e.key === 'ArrowRight') go(a.i + 1);
    else if (mock && e.key === 'ArrowLeft') go(a.i - 1);
  }
  document.addEventListener('keydown', onKey);

  a.shownAt = Date.now();
  draw();
  return () => {
    clearInterval(timerId);
    document.removeEventListener('keydown', onKey);
    if (!finished) { try { touch(); persist(); } catch { /* question may be gone */ } }
    finished = true; // any late timer / dialog callback from this view is now inert
  };
}

// ---------- results ----------

export function renderResults(root, id) {
  const s = store.getSession(id);
  if (!s) { location.hash = '#/'; return () => {}; }
  const attempts = new Map(store.getState().attempts.filter((x) => x.s === id).map((x) => [x.q, x]));
  const allIds = Object.keys(s.res);
  const ids = allIds.filter((q) => byId.has(q)); // questions removed from the bank can't be shown
  const removed = allIds.length - ids.length;
  const missed = ids.filter((q) => s.res[q] !== 'r');
  const mock = s.mode === 'mock';
  const p = pct(s.correct, s.total);
  let showAll = false;

  const list = h('div', { class: 'result-list' });
  const filterBtn = h('button', { class: 'btn btn-sm', onClick: () => { showAll = !showAll; drawList(); } });

  function drawList() {
    const items = (showAll ? ids : missed);
    filterBtn.textContent = showAll ? `Show only missed (${missed.length})` : `Show all (${ids.length})`;
    list.replaceChildren(...items.map((qid) => {
      const q = byId.get(qid);
      const r = s.res[qid];
      const att = attempts.get(qid);
      const yours = att?.sel?.length ? att.sel.map((i) => q.options[i]?.t).filter(Boolean).join(' · ') : null;
      return h('details', { class: 'result-item ' + (r === 'r' ? 'r' : 'w') },
        h('summary', null,
          h('span', { class: 'ri-mark' }, icon(r === 'r' ? 'check' : 'x', 16)),
          h('span', { class: 'sr-only' }, r === 'r' ? 'Correct: ' : r === 'u' ? 'Unanswered: ' : 'Incorrect: '),
          h('span', { class: 'ri-text' }, q.text)),
        h('div', { class: 'ri-body' },
          r === 'u' ? h('p', { class: 'ri-yours' }, 'You did not answer this question.') : null,
          r === 'w' && yours ? h('p', { class: 'ri-yours' }, h('strong', null, 'Your answer: '), yours) : null,
          h('p', { class: 'ri-correct' }, h('strong', null, 'Correct: '), q.options.filter((o) => o.c).map((o) => o.t).join(' · ')),
          h('p', { class: 'ri-ref' }, q.ref || 'No explanation is provided for this question in the source.'),
          q.note ? h('p', { class: 'ri-ref' }, h('strong', null, 'Since the handbook: '), q.note) : null));
    }));
    if (!items.length) list.append(h('p', { class: 'empty' }, 'Nothing missed — every answer was right.'));
  }

  const banner = mock
    ? h('div', { class: 'result-banner ' + (s.passed ? 'pass' : 'fail') },
        h('div', { class: 'rb-title' }, s.passed ? 'Pass' : 'Not yet'),
        h('div', { class: 'rb-sub' }, `${s.correct}/${s.total} — pass mark is ${MOCK.passMark}/${MOCK.questions} (75%)${s.timedOut ? ' · time ran out' : ''}`))
    : h('div', { class: 'result-banner ' + (p >= 75 ? 'pass' : 'neutral') },
        h('div', { class: 'rb-title' }, `${s.correct}/${s.total}`),
        h('div', { class: 'rb-sub' }, `${p}% correct · ${s.label}`));

  const retry = missed.length
    ? h('button', { class: 'btn btn-primary', onClick: () => startSession({ mode: 'practice', kind: 'retry', label: 'Retry missed', qids: missed }) }, icon('refresh', 18), `Retry ${missed.length} missed`)
    : null;

  const kind = supportKindForSession(s);
  const support = kind ? supportCard(kind) : null; // null when we shouldn't ask (too soon, declined, weak result)

  root.replaceChildren(h('div', { class: 'results' },
    banner,
    h('div', { class: 'result-meta' },
      h('span', null, icon('clock', 16), ` ${fmtDuration(s.ms)}`),
      h('span', null, `${ids.filter((q) => s.res[q] === 'r').length} right · ${ids.filter((q) => s.res[q] === 'w').length} wrong${ids.some((q) => s.res[q] === 'u') ? ` · ${ids.filter((q) => s.res[q] === 'u').length} unanswered` : ''}`)),
    removed ? h('p', { class: 'muted' }, `${removed} question${removed === 1 ? '' : 's'} from this session ${removed === 1 ? 'is' : 'are'} no longer in the question bank and can't be shown.`) : null,
    h('div', { class: 'result-actions' }, retry, h('a', { class: 'btn', href: '#/' }, 'Home'), h('a', { class: 'btn', href: '#/practice' }, 'Practise more')),
    support,
    h('div', { class: 'section-head' }, h('h3', null, 'Review'), filterBtn),
    list));
  drawList();
  window.scrollTo(0, 0);
  return () => {};
}
