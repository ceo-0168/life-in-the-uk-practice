// Running a session (practice with instant feedback, or a timed mock) and showing results.
import { MOCK, isCorrect, optionOrder, shuffle, uid, supportKindForSession } from './engine.js';
import * as store from './store.js';
import { byId, examLabel } from './ctx.js';
import { supportCard } from './views/support.js';
import { h, icon, toast, announce, closeDialogs, openDialog, confirmDialog, fmtDuration, pct, sessionLabel } from './ui.js';
import { t, tn } from './i18n.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_Q_MS = 5 * 60 * 1000;

// ---------- starting ----------

export async function startSession({ mode, kind, label, qids }) {
  const prior = store.getActive();
  if (prior?.mode === 'mock') {
    // A mock's answers are only scored when it finishes, so replacing it would throw them away.
    const answered = Object.keys(prior.answers || {}).length;
    const discard = await confirmDialog({
      title: t('sess.discard.title'),
      body: t('sess.discard.body', { done: answered, total: prior.qids.length }),
      confirm: t('sess.discard.confirm'), cancel: t('sess.discard.cancel'), danger: true,
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
    toast(t('sess.expiredAway'), { ms: 4000 });
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
    const timer = mock ? h('span', { class: 'timer', id: 'timer', role: 'timer', 'aria-label': t('sess.timeRemaining') }, '') : null;
    const top = h('div', { class: 'session-top' },
      h('button', { class: 'btn btn-ghost btn-sm', onClick: endEarly, 'aria-label': mock ? t('sess.finishTest') : t('sess.endSession'), 'data-focus': 'end' }, icon('x', 18), mock ? t('sess.finish') : t('sess.end')),
      h('div', { class: 'session-count' }, t('sess.questionOf', { n: a.i + 1, total: a.qids.length })),
      timer || h('span', { class: 'session-label' }, sessionLabel(a.label)));
    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': t('sess.progress'), 'aria-valuemin': 0, 'aria-valuemax': a.qids.length, 'aria-valuenow': a.i + (checked ? 1 : 0) },
      h('span', { style: `width:${((a.i + (checked ? 1 : 0)) / a.qids.length) * 100}%` }));

    // question card
    const hint = q.pick > 1 ? t('sess.selectN', { n: q.pick }) : t('sess.selectOne');
    const options = h('div', { class: 'options', role: q.pick > 1 ? 'group' : 'radiogroup', 'aria-label': hint },
      order.map((idx, pos) => {
        const o = q.options[idx];
        const picked = sel.includes(idx);
        let cls = 'opt' + (picked ? ' picked' : '');
        let mark = null;
        let status = '';
        if (checked) {
          if (o.c) { cls += picked ? ' right' : ' missed'; mark = icon('check', 18); status = picked ? t('sess.status.correct') : t('sess.status.theCorrect'); }
          else if (picked) { cls += ' wrong'; mark = icon('x', 18); status = t('sess.status.incorrect'); }
        }
        return h('button', {
          class: cls, type: 'button', role: q.pick > 1 ? 'checkbox' : 'radio',
          'aria-checked': picked ? 'true' : 'false', 'aria-label': `${LETTERS[pos]}. ${o.t}${status}`, disabled: checked,
          'data-focus': `opt-${idx}`, onClick: () => choose(idx),
        },
          h('span', { class: 'opt-key', 'aria-hidden': 'true' }, LETTERS[pos]),
          h('span', { class: 'opt-text' }, o.t),
          mark ? h('span', { class: 'opt-mark' }, mark) : null,
          checked && o.c && !picked ? h('span', { class: 'opt-note', 'aria-hidden': 'true' }, t('sess.correctAnswer')) : null);
      }));

    const tools = h('div', { class: 'q-tools' },
      h('button', { class: 'tool' + (meta.bm ? ' on' : ''), type: 'button', 'aria-pressed': meta.bm ? 'true' : 'false', 'data-focus': 'tool-bm', onClick: () => { store.setMeta(q.id, { bm: !meta.bm }); draw(); } },
        icon('star', 16), meta.bm ? t('q.saved') : t('q.save')),
      mock ? h('button', { class: 'tool' + (a.flags[q.id] ? ' on' : ''), type: 'button', 'aria-pressed': a.flags[q.id] ? 'true' : 'false', 'data-focus': 'tool-flag', onClick: () => { a.flags[q.id] = !a.flags[q.id]; persist(); draw(); } },
        icon('flag', 16), a.flags[q.id] ? t('sess.flagged') : t('sess.flag')) : null,
      !mock ? h('button', { class: 'tool' + (meta.rep ? ' on' : ''), type: 'button', 'aria-pressed': meta.rep ? 'true' : 'false', 'data-focus': 'tool-rep', title: t('sess.reportTitle'), onClick: () => { store.setMeta(q.id, { rep: !meta.rep }); toast(!meta.rep ? t('sess.reportedToast') : t('sess.reportRemoved')); draw(); } },
        icon('alert', 16), meta.rep ? t('q.reported') : t('q.looksWrong')) : null);

    const card = h('section', { class: 'card q-card', 'aria-label': t('sess.questionAria') },
      h('div', { class: 'q-source' }, examLabel(q)),
      h('h2', { class: 'q-text', tabIndex: -1 }, q.text),
      h('p', { class: 'q-hint' + (q.pick > 1 ? ' multi' : '') }, hint),
      options, tools);

    // feedback (practice only). Announced through the shell's live region, not here.
    let feedback = null;
    if (!mock && checked) {
      const ok = a.results[q.id] === 'r';
      feedback = h('section', { class: 'card feedback ' + (ok ? 'ok' : 'bad') },
        h('div', { class: 'feedback-head' }, icon(ok ? 'check' : 'x', 20), ok ? t('sess.correct') : t('sess.notQuite')),
        !ok ? h('p', { class: 'feedback-answer' }, t('sess.correctColon') + ' ', q.options.filter((o) => o.c).map((o) => o.t).join(' · ')) : null,
        h('p', { class: 'feedback-ref' }, q.ref || t('q.noExplanation')),
        q.note ? h('p', { class: 'feedback-note' }, h('strong', null, t('q.sinceHandbook') + ' '), q.note) : null);
    }

    // bottom action bar
    const last = a.i === a.qids.length - 1;
    let actions;
    if (mock) {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn', disabled: a.i === 0, 'data-focus': 'act-back', onClick: () => go(a.i - 1) }, icon('left', 18), t('sess.back')),
        h('button', { class: 'btn btn-ghost', onClick: openNavigator, 'aria-label': t('sess.navigatorAria', { done: answeredCount, total: a.qids.length }) }, icon('grid', 18), `${answeredCount}/${a.qids.length}`),
        last
          ? h('button', { class: 'btn btn-primary', 'data-focus': 'act-primary', onClick: () => finishMock(false) }, t('sess.finishTest'))
          : h('button', { class: 'btn btn-primary', 'data-focus': 'act-primary', onClick: () => go(a.i + 1) }, t('sess.next'), icon('right', 18)));
    } else if (!checked) {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn btn-primary btn-block', 'data-focus': 'act-primary', disabled: sel.length !== q.pick, onClick: check },
          sel.length === q.pick ? t('sess.check') : t('sess.selectMore', { n: q.pick - sel.length })));
    } else {
      actions = h('div', { class: 'actionbar' },
        h('button', { class: 'btn btn-primary btn-block', onClick: next, 'data-focus': 'act-primary', id: 'next-btn' }, last ? t('sess.seeResults') : t('sess.nextQuestion'), icon('right', 18)));
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
    else { toast(t('sess.selectExactly', { n: q.pick }), { ms: 2200 }); return; }
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
    announce(ok ? t('sess.announce.correct') : t('sess.announce.wrong', { answer: q.options.filter((o) => o.c).map((o) => o.t).join(', ') }));
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
      const sure = await confirmDialog({ title: t('sess.leave.title'), body: t('sess.leave.body'), confirm: t('sess.leave.confirm'), cancel: t('sess.leave.cancel') });
      if (!sure || finished) return;
      finished = true;
      store.clearActive();
      location.hash = '#/';
      return;
    }
    const sure = await confirmDialog({ title: t('sess.end.title'), body: tn('sess.end.body', done), confirm: t('sess.end.confirm'), cancel: t('sess.end.cancel') });
    if (sure) finishPractice();
  }

  function openNavigator() {
    const label = (id, i) => t('sess.nav.cell', { n: i + 1 }) + (isAnswered(id) ? t('sess.nav.answered') : a.answers[id] ? t('sess.nav.partly') : t('sess.nav.notAnswered')) + (a.flags[id] ? t('sess.nav.flagged') : '');
    const cells = a.qids.map((id, i) => h('button', {
      class: 'nav-cell' + (isAnswered(id) ? ' done' : '') + (a.flags[id] ? ' flagged' : '') + (i === a.i ? ' current' : ''),
      type: 'submit', value: String(i), 'aria-label': label(id, i),
    }, String(i + 1)));
    const dlg = h('dialog', { class: 'dialog', 'aria-label': t('sess.nav.title') },
      h('form', { method: 'dialog' },
        h('h2', null, t('sess.nav.title')),
        h('div', { class: 'nav-grid' }, cells),
        h('p', { class: 'nav-legend' }, h('span', { class: 'dot done' }), t('sess.nav.legendAnswered') + ' ', h('span', { class: 'dot flagged' }), t('sess.nav.legendFlagged') + ' ', h('span', { class: 'dot' }), t('sess.nav.legendUnanswered')),
        h('div', { class: 'dialog-actions' }, h('button', { class: 'btn', value: 'close' }, t('sess.nav.close')))));
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
      if (unanswered) parts.push(tn('sess.finish.unanswered', unanswered));
      if (flagged) parts.push(t('sess.finish.flagged', { n: flagged }));
      const sure = await confirmDialog({
        title: t('sess.finish.title'),
        body: (parts.length ? parts.join(t('sess.finish.sep')) + t('sess.finish.stop') : '') + t('sess.finish.cannotChange'),
        confirm: t('sess.finish.confirm'), cancel: t('sess.finish.cancel'),
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
      toast(t('sess.timeUp'), { ms: 2500 });
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
    filterBtn.textContent = showAll ? t('res.showMissed', { n: missed.length }) : t('res.showAll', { n: ids.length });
    list.replaceChildren(...items.map((qid) => {
      const q = byId.get(qid);
      const r = s.res[qid];
      const att = attempts.get(qid);
      const yours = att?.sel?.length ? att.sel.map((i) => q.options[i]?.t).filter(Boolean).join(' · ') : null;
      return h('details', { class: 'result-item ' + (r === 'r' ? 'r' : 'w') },
        h('summary', null,
          h('span', { class: 'ri-mark' }, icon(r === 'r' ? 'check' : 'x', 16)),
          h('span', { class: 'sr-only' }, r === 'r' ? t('res.sr.correct') : r === 'u' ? t('res.sr.unanswered') : t('res.sr.incorrect')),
          h('span', { class: 'ri-text' }, q.text)),
        h('div', { class: 'ri-body' },
          r === 'u' ? h('p', { class: 'ri-yours' }, t('res.notAnswered')) : null,
          r === 'w' && yours ? h('p', { class: 'ri-yours' }, h('strong', null, t('res.yourAnswer') + ' '), yours) : null,
          h('p', { class: 'ri-correct' }, h('strong', null, t('sess.correctColon') + ' '), q.options.filter((o) => o.c).map((o) => o.t).join(' · ')),
          h('p', { class: 'ri-ref' }, q.ref || t('q.noExplanation')),
          q.note ? h('p', { class: 'ri-ref' }, h('strong', null, t('q.sinceHandbook') + ' '), q.note) : null));
    }));
    if (!items.length) list.append(h('p', { class: 'empty' }, t('res.nothingMissed')));
  }

  const banner = mock
    ? h('div', { class: 'result-banner ' + (s.passed ? 'pass' : 'fail') },
        h('div', { class: 'rb-title' }, s.passed ? t('stats.pass') : t('home.mock.notYetTitle')),
        h('div', { class: 'rb-sub' }, t('res.passMark', { c: s.correct, t: s.total, pass: MOCK.passMark, total: MOCK.questions }) + (s.timedOut ? t('res.timeRanOut') : '')))
    : h('div', { class: 'result-banner ' + (p >= 75 ? 'pass' : 'neutral') },
        h('div', { class: 'rb-title' }, `${s.correct}/${s.total}`),
        h('div', { class: 'rb-sub' }, t('res.percentCorrect', { p, label: sessionLabel(s.label) })));

  const retry = missed.length
    ? h('button', { class: 'btn btn-primary', onClick: () => startSession({ mode: 'practice', kind: 'retry', label: 'Retry missed', qids: missed }) }, icon('refresh', 18), t('res.retry', { n: missed.length }))
    : null;

  const kind = supportKindForSession(s);
  const support = kind ? supportCard(kind) : null; // null when we shouldn't ask (too soon, declined, weak result)

  root.replaceChildren(h('div', { class: 'results' },
    banner,
    h('div', { class: 'result-meta' },
      h('span', null, icon('clock', 16), ` ${fmtDuration(s.ms)}`),
      h('span', null, t('res.counts', { right: ids.filter((q) => s.res[q] === 'r').length, wrong: ids.filter((q) => s.res[q] === 'w').length })
        + (ids.some((q) => s.res[q] === 'u') ? t('res.countsUnanswered', { n: ids.filter((q) => s.res[q] === 'u').length }) : ''))),
    removed ? h('p', { class: 'muted' }, tn('res.removed', removed)) : null,
    h('div', { class: 'result-actions' }, retry, h('a', { class: 'btn', href: '#/' }, t('nav.home')), h('a', { class: 'btn', href: '#/practice' }, t('res.practiseMore'))),
    support,
    h('div', { class: 'section-head' }, h('h3', null, t('res.review')), filterBtn),
    list));
  drawList();
  window.scrollTo(0, 0);
  return () => {};
}
