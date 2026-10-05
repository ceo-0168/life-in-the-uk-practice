// Persistence. All progress lives in one JSON document in localStorage.
//
// Safety nets, in order of use:
//  1. Every write first merges with whatever another tab/window has stored (attempts are append-only and
//     unique by id), so two open copies of the app can never overwrite each other's answers.
//  2. A rolling snapshot (every 10 min or 25 answers) is used automatically if the main document is unreadable. It never
//     shrinks within the same epoch, so a bug or stale tab can't replace a big history with a small one.
//  3. Before anything destructive (erase, replace-import, restore) the current data is copied to a
//     "previous copies" list that nothing overwrites automatically. Settings → Restore brings it back.
//  4. Unreadable raw data is set aside under its own key instead of being overwritten.
import { emptyState, validateState, normalizeState, mergeStates, uid, dayKey } from './engine.js';
import { t, tn, getLocale } from './i18n.js';

const APP = 'life-in-the-uk-practice';
const KEY = 'litukp:state:v1';
const SNAPSHOT = 'litukp:snapshot:v1';
const PREV = 'litukp:prev:v1';
const CORRUPT = 'litukp:corrupt:v1';
const ACTIVE = 'litukp:active:v1';
const SNAPSHOT_EVERY_MS = 10 * 60 * 1000;
const SNAPSHOT_EVERY_ANSWERS = 25;
const PREV_KEEP = 2;

let state = emptyState();
let health = { ok: true, message: '', notice: '' };
let lastSnapshotAt = 0;
let snapshotAnswers = 0; // how many answers the snapshot held when it was taken
let lastRaw = null; // the exact string we last wrote to KEY, to detect other tabs' writes cheaply
let errorHandler = null;
let lastErrorAt = 0;
const listeners = new Set();

const readRaw = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const readJSON = (key) => {
  try {
    const raw = readRaw(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Parse + validate + normalise a stored document; null if it is not usable. */
function parseState(rawOrObj) {
  try {
    const obj = typeof rawOrObj === 'string' ? JSON.parse(rawOrObj) : rawOrObj;
    if (validateState(obj)) return null;
    return normalizeState(obj).state;
  } catch {
    return null;
  }
}

function write(key, value, { critical = true } = {}) {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
    if (key === KEY) lastRaw = raw;
    if (critical && !health.ok && key === KEY) health = { ...health, ok: true, message: '' };
    return true;
  } catch (err) {
    console.error('storage write failed', key, err);
    if (critical) {
      health = { ...health, ok: false, message: t('store.saveError') };
      if (errorHandler && Date.now() - lastErrorAt > 20000) {
        lastErrorAt = Date.now();
        errorHandler(t('store.saveError'));
      }
    }
    return false;
  }
}

export function setErrorHandler(fn) {
  errorHandler = fn;
}

export function init() {
  const raw = readRaw(KEY);
  let loaded = null;
  if (raw !== null) {
    loaded = parseState(raw);
    if (!loaded) write(CORRUPT, raw, { critical: false }); // keep the unreadable data for manual rescue
  }
  let recovered = false;
  if (!loaded) {
    const snap = readJSON(SNAPSHOT);
    const fromSnap = snap && parseState(snap.state);
    if (fromSnap) {
      loaded = fromSnap;
      recovered = true;
      const when = snap.at ? new Date(snap.at).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }) : snap.day;
      health.notice = t('store.recovered', { when });
    } else if (raw !== null) {
      health.notice = t('store.unreadable');
    }
  }
  state = loaded || normalizeState({}).state;
  if (recovered) write(KEY, state); // replace the unreadable value straight away
  else if (loaded) takeSnapshot(true);

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY || e.key === null) syncFromOtherTabs();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncFromOtherTabs();
    });
  }
  return state;
}

export const getState = () => state;
export const getHealth = () => health;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const notify = () => listeners.forEach((fn) => fn(state));

function syncFromOtherTabs() {
  const before = state;
  reconcile();
  if (state !== before) notify();
}

/** Rolling safety copy. Skips if it would replace a bigger history from the same epoch (that would be data loss). */
function takeSnapshot(force = false) {
  const now = Date.now();
  const due = now - lastSnapshotAt >= SNAPSHOT_EVERY_MS || state.attempts.length - snapshotAnswers >= SNAPSHOT_EVERY_ANSWERS;
  if (!force && !due) return;
  const snap = readJSON(SNAPSHOT);
  const old = snap?.state;
  if (old?.epoch?.id === state.epoch.id && Array.isArray(old.attempts) && old.attempts.length > state.attempts.length) return;
  if (write(SNAPSHOT, { day: dayKey(now), at: now, state }, { critical: false })) {
    lastSnapshotAt = now;
    snapshotAnswers = state.attempts.length;
  }
}

/** Fold in anything another tab/window wrote since we last looked. */
function reconcile() {
  const raw = readRaw(KEY);
  if (raw === null || raw === lastRaw) return;
  const stored = parseState(raw);
  if (!stored) {
    write(CORRUPT, raw, { critical: false });
    return;
  }
  if (stored.epoch.id === state.epoch.id) {
    state = mergeStates(state, stored);
  } else if (stored.epoch.at > state.epoch.at) {
    // Another tab erased/replaced the data. Adopt that, but keep anything we recorded after it happened.
    const mine = {
      ...state,
      attempts: state.attempts.filter((a) => a.t >= stored.epoch.at),
      sessions: state.sessions.filter((s) => s.t >= stored.epoch.at),
      meta: {},
    };
    state = mergeStates(stored, mine);
  }
  // else: our epoch is newer (we just erased/replaced), so our state stands.
}

function commit({ unsaved = 0, destructive = false } = {}) {
  if (!destructive) reconcile();
  state.unsaved = (state.unsaved || 0) + unsaved;
  write(KEY, state);
  takeSnapshot();
  notify();
}

export function recordAttempt({ q, ok, sel, ms, mode, s, id, t }) {
  if (id) {
    const existing = state.attempts.find((a) => a.id === id);
    if (existing) return existing;
  }
  const now = Date.now();
  let stamp = Number.isFinite(t) ? t : now;
  // If the device clock was ever ahead, keep new answers ordered after the old ones.
  const lastT = state.attempts.slice(-100).reduce((m, a) => Math.max(m, a.t), 0);
  if (lastT > now) stamp = Math.max(stamp, lastT + 1);
  const attempt = { id: id || uid(), q, ok, sel, t: stamp, ms: Math.round(ms || 0), mode, s };
  state.attempts.push(attempt);
  commit({ unsaved: 1 });
  return attempt;
}

/** Add or replace (by id) a session summary. Idempotent, so finishing twice cannot create two. */
export function addSession(session) {
  const i = state.sessions.findIndex((x) => x.id === session.id);
  if (i >= 0) state.sessions[i] = session;
  else state.sessions.push(session);
  commit({ unsaved: i >= 0 ? 0 : 1 });
}

export const getSession = (id) => state.sessions.find((s) => s.id === id);

/** Bookmarks, notes, reports. Cleared entries stay as tombstones so a merge can't bring them back. */
export function setMeta(qid, patch) {
  const cur = state.meta[qid] || { bm: false, rep: false, note: '' };
  state.meta[qid] = { ...cur, ...patch, u: Date.now() };
  commit({ unsaved: 1 });
}

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  state.settingsAt = Date.now();
  commit();
}

export function markExported() {
  reconcile();
  state.lastExportAt = Date.now();
  state.unsaved = 0;
  write(KEY, state);
  notify();
}

export function exportData() {
  reconcile();
  return {
    app: APP,
    exportedAt: new Date().toISOString(),
    state: { ...state, unsaved: 0, lastExportAt: Date.now() },
  };
}

// ----- previous copies (taken before anything destructive) -----

function pushPrev(reason) {
  const empty = !state.attempts.length && !state.sessions.length && !Object.keys(state.meta).length;
  if (empty) return true; // nothing worth keeping
  const list = readJSON(PREV);
  const arr = Array.isArray(list) ? list : [];
  arr.unshift({ at: Date.now(), reason, state });
  return write(PREV, arr.slice(0, PREV_KEEP), { critical: false });
}

export function listPrev() {
  const list = readJSON(PREV);
  if (!Array.isArray(list)) return [];
  return list.map((p, index) => ({
    index, at: p.at, reason: p.reason,
    answers: p.state?.attempts?.length || 0,
    sessions: p.state?.sessions?.length || 0,
  }));
}

/** Replace everything with `next` under a fresh epoch, so other tabs adopt it instead of merging old data back. */
function replaceState(next) {
  state = { ...next, epoch: { id: uid(), at: Date.now() }, unsaved: 0 };
  commit({ destructive: true });
  takeSnapshot(true);
}

const noSafetyCopy = () => ({ ok: false, message: t('store.noSafetyCopy') });

export function restorePrev(index) {
  const list = readJSON(PREV);
  const entry = Array.isArray(list) ? list[index] : null;
  const restored = entry && parseState(entry.state);
  if (!restored) return { ok: false, message: t('store.copyUnreadable') };
  reconcile();
  if (!pushPrev('before restore')) return noSafetyCopy();
  replaceState(restored);
  return { ok: true, message: t('store.restored', { n: state.attempts.length }) };
}

/** mode: 'merge' (union of both devices) or 'replace'. Returns {ok, message}. */
export function importData(obj, mode) {
  const incomingRaw = obj && obj.app === APP ? obj.state : obj;
  const problem = validateState(incomingRaw);
  if (problem) return { ok: false, message: t(problem) };
  const { state: incoming, dropped } = normalizeState(incomingRaw);
  if (incomingRaw.attempts.length > 0 && incoming.attempts.length === 0) {
    return { ok: false, message: t('store.noneReadable') };
  }
  const skipped = dropped.attempts + dropped.sessions;
  const skippedNote = skipped ? ' ' + tn('store.skipped', skipped) : '';

  reconcile();
  if (mode === 'replace') {
    if (!pushPrev('before import')) return noSafetyCopy();
    replaceState(incoming);
    return { ok: true, message: t('store.replaced', { n: state.attempts.length, skipped: skippedNote }) };
  }
  const before = state.attempts.length;
  state = mergeStates(state, incoming);
  const added = state.attempts.length - before;
  state.unsaved = (state.unsaved || 0) + added;
  commit({ destructive: true }); // already merged with the stored copy above
  return { ok: true, message: tn('store.merged', added, { skipped: skippedNote }) };
}

export function resetAll() {
  reconcile();
  if (!pushPrev('before erase')) return noSafetyCopy();
  const { settings, settingsAt } = state;
  clearActive();
  replaceState(normalizeState({ settings, settingsAt }).state);
  return { ok: true, message: t('store.erased') };
}

// ----- live session (so a refresh or accidental close never loses place) -----
export const getActive = () => readJSON(ACTIVE);
export const saveActive = (s) => write(ACTIVE, s);
export function clearActive() {
  try {
    localStorage.removeItem(ACTIVE);
  } catch {
    /* ignore */
  }
}

export async function storageStatus() {
  if (!navigator.storage?.persisted) return { supported: false, persisted: false };
  return { supported: true, persisted: await navigator.storage.persisted() };
}

export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
