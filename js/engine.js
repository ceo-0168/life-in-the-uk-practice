// Pure logic: no DOM, no storage. Everything here is unit-tested (tests/engine.test.mjs).

export const MOCK = { questions: 24, minutes: 45, passMark: 18 };
export const MASTERED_STREAK = 3;
// Days until a question is due again, indexed by current streak of correct answers.
export const INTERVALS = [0, 1, 3, 7, 14, 30];
const DAY = 86400000;

export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Local midnight n calendar days from ts. Calendar arithmetic, so DST changes can't skip or repeat a date. */
export const addDays = (ts, n) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};

export const uid = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

export function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A question is answered correctly only if the selection equals the set of correct options. */
export function isCorrect(question, selected) {
  const want = question.options.flatMap((o, i) => (o.c ? [i] : []));
  const got = [...new Set(selected)].sort((a, b) => a - b);
  return want.length === got.length && want.every((v, i) => v === got[i]);
}

/** True/False and Yes/No options keep a fixed order; everything else may be shuffled. */
export function isBinary(question) {
  const t = question.options.map((o) => o.t.toLowerCase()).sort().join('|');
  return t === 'false|true' || t === 'no|yes';
}

export function optionOrder(question, doShuffle, rnd = Math.random) {
  const idx = question.options.map((_, i) => i);
  if (!doShuffle) return idx;
  if (isBinary(question)) {
    // Always show True before False / Yes before No.
    return idx.sort((a, b) => {
      const ta = question.options[a].t.toLowerCase();
      const tb = question.options[b].t.toLowerCase();
      return ta === 'true' || ta === 'yes' ? -1 : tb === 'true' || tb === 'yes' ? 1 : 0;
    });
  }
  return shuffle(idx, rnd);
}

/** Whole days from today to the test date, or null if unset / already passed. */
export function daysToTest(testDate, now = Date.now()) {
  if (typeof testDate !== 'string' || !testDate) return null;
  const [y, m, d] = testDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d).getTime();
  const diff = Math.round((target - startOfDay(now)) / DAY);
  return diff >= 0 ? diff : null;
}

/** With a test date approaching, shrink review intervals so each question is seen again before it. */
export function intervalDays(streak, testDays) {
  const base = INTERVALS[Math.min(streak, INTERVALS.length - 1)];
  if (testDays == null) return base;
  const cap = Math.max(1, Math.floor((testDays - 1) / 2));
  return Math.min(base, cap);
}

/** Replays the attempt log into one card per question. */
export function deriveCards(attempts, questions, settings = {}, now = Date.now()) {
  const testDays = daysToTest(settings.testDate, now);
  const cards = new Map();
  for (const q of questions) {
    cards.set(q.id, { id: q.id, seen: 0, right: 0, wrong: 0, streak: 0, lastOk: null, lastT: 0, due: 0, status: 'unseen' });
  }
  const sorted = [...attempts].sort((a, b) => a.t - b.t);
  for (const a of sorted) {
    const c = cards.get(a.q);
    if (!c) continue; // question removed from the bank
    c.seen++;
    c.lastT = a.t;
    c.lastOk = a.ok;
    if (a.ok) {
      c.right++;
      c.streak++;
    } else {
      c.wrong++;
      c.streak = 0;
    }
  }
  for (const c of cards.values()) {
    if (c.seen === 0) continue;
    // A wrong device clock can stamp an attempt in the future; never let that push a review date out.
    c.due = Math.min(c.lastT, now) + intervalDays(c.streak, testDays) * DAY;
    c.status = c.streak >= MASTERED_STREAK ? 'mastered' : c.lastOk ? 'shaky' : 'wrong';
  }
  return cards;
}

export const isDue = (c, now = Date.now()) => c.seen > 0 && c.due <= now;

export function counts(cards, now = Date.now()) {
  const out = { total: cards.size, unseen: 0, wrong: 0, shaky: 0, mastered: 0, due: 0, seen: 0 };
  for (const c of cards.values()) {
    out[c.status]++;
    if (c.seen > 0) out.seen++;
    if (isDue(c, now)) out.due++;
  }
  return out;
}

/** Overall accuracy over every attempt. */
export function accuracy(attempts) {
  if (!attempts.length) return null;
  return attempts.filter((a) => a.ok).length / attempts.length;
}

/**
 * Estimated score on a real 24-question test, as a fraction.
 * Per-question chance of a correct answer: mastered 0.95, last answer right 0.75,
 * last answer wrong 0.35, never seen 0.4 (a guess on 4 options with some common sense).
 */
export function readiness(cards) {
  const P = { mastered: 0.95, shaky: 0.75, wrong: 0.35, unseen: 0.4 };
  let sum = 0;
  for (const c of cards.values()) sum += P[c.status];
  return cards.size ? sum / cards.size : 0;
}

export function verdict(counts_, ready, mocks) {
  const coverage = counts_.total ? counts_.seen / counts_.total : 0;
  const lastTwo = mocks.slice(-2);
  const mocksOk = lastTwo.length === 2 && lastTwo.every((m) => m.passed);
  if (coverage >= 0.9 && ready >= 0.85 && mocksOk) return { level: 'ready', text: 'Ready to book' };
  if (coverage >= 0.6 && ready >= 0.75) return { level: 'close', text: 'Getting close' };
  return { level: 'building', text: 'Still building' };
}

/** Consecutive days with at least one answer, ending today (or yesterday if nothing yet today). */
export function streakDays(attempts, now = Date.now()) {
  const days = new Set(attempts.map((a) => dayKey(a.t)));
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function activityByDay(attempts, nDays, now = Date.now()) {
  const map = new Map();
  for (const a of attempts) {
    const k = dayKey(a.t);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const out = [];
  const today = startOfDay(now);
  for (let i = nDays - 1; i >= 0; i--) {
    const t = addDays(today, -i);
    out.push({ key: dayKey(t), t, n: map.get(dayKey(t)) || 0 });
  }
  return out;
}

export function todayCount(attempts, now = Date.now()) {
  const k = dayKey(now);
  return attempts.filter((a) => dayKey(a.t) === k).length;
}

/** Per-exam coverage: how many of an exam's questions are seen / mastered / last-wrong. */
export function examBreakdown(cards, questions, examNumbers) {
  return examNumbers.map((exam) => {
    const qs = questions.filter((q) => q.exams.some((w) => w.exam === exam));
    const row = { exam, total: qs.length, seen: 0, mastered: 0, wrong: 0 };
    for (const q of qs) {
      const c = cards.get(q.id);
      if (c.seen) row.seen++;
      if (c.status === 'mastered') row.mastered++;
      if (c.status === 'wrong') row.wrong++;
    }
    return row;
  });
}

// ---------- Choosing questions for a session ----------

const byDueThenWorst = (cards) => (a, b) => {
  const ca = cards.get(a), cb = cards.get(b);
  return ca.due - cb.due || cb.wrong - ca.wrong;
};

export function selectQuestions(kind, { questions, cards, meta = {}, limit = 20, exam = null, now = Date.now(), rnd = Math.random }) {
  const all = questions.map((q) => q.id);
  const get = (id) => cards.get(id);
  let ids;
  switch (kind) {
    case 'new':
      ids = shuffle(all.filter((id) => get(id).seen === 0), rnd);
      break;
    case 'due':
      ids = all.filter((id) => isDue(get(id), now)).sort(byDueThenWorst(cards));
      break;
    case 'weak': {
      // Last answer wrong, or shaky record: accuracy under 60% over 2+ attempts.
      ids = all
        .filter((id) => {
          const c = get(id);
          return c.seen > 0 && c.status !== 'mastered' && (c.status === 'wrong' || (c.seen >= 2 && c.right / c.seen < 0.6));
        })
        .sort((a, b) => get(b).wrong - get(a).wrong || get(a).right - get(b).right);
      break;
    }
    case 'bookmarked':
      ids = shuffle(all.filter((id) => meta[id]?.bm), rnd);
      break;
    case 'exam':
      ids = questions.filter((q) => q.exams.some((w) => w.exam === exam)).map((q) => q.id);
      return shuffle(ids, rnd);
    case 'random':
      return limit ? shuffle(all, rnd).slice(0, limit) : shuffle(all, rnd);
    case 'all':
      return shuffle(all, rnd);
    case 'today': {
      // Smart plan: due reviews first (at most 60% of the goal, so new material keeps flowing),
      // then new questions, then any remaining due reviews, then other unmastered questions.
      const due = all.filter((id) => isDue(get(id), now)).sort(byDueThenWorst(cards));
      const picked = due.slice(0, Math.ceil(limit * 0.6));
      const chosen = new Set(picked);
      const fill = (pool) => {
        for (const id of pool) {
          if (picked.length >= limit) break;
          if (!chosen.has(id)) { chosen.add(id); picked.push(id); }
        }
      };
      fill(shuffle(all.filter((id) => get(id).seen === 0), rnd));
      fill(due);
      fill(shuffle(all.filter((id) => get(id).status !== 'mastered'), rnd));
      return shuffle(picked, rnd);
    }
    default:
      ids = [];
  }
  return limit ? ids.slice(0, limit) : ids;
}

/** A mock test: 24 questions drawn at random from the whole bank, like the real test. */
export function buildMock(questions, rnd = Math.random) {
  return shuffle(questions.map((q) => q.id), rnd).slice(0, MOCK.questions);
}

// ---------- Backup / merge ----------

export const SETTING_CHOICES = {
  dailyGoal: [10, 20, 30, 50, 100],
  sessionLength: [0, 10, 20, 50],
  theme: ['auto', 'light', 'dark'],
};

export function defaultSettings() {
  return {
    testDate: '',
    dailyGoal: 20,
    shuffleOptions: true,
    shuffleQuestions: true,
    theme: 'auto',
    sessionLength: 20,
    welcomed: false,
  };
}

/** The first-visit welcome screen: only for someone with no history who hasn't dismissed it. */
export function shouldShowWelcome(state) {
  return !state.settings.welcomed && state.attempts.length === 0 && state.sessions.length === 0;
}

export function emptyState() {
  return {
    v: 1,
    // Bumped by erase / replace-import / restore so other tabs and devices don't resurrect old data.
    epoch: { id: 'e0', at: 0 },
    attempts: [],
    meta: {},
    sessions: [],
    settings: defaultSettings(),
    settingsAt: 0,
    lastExportAt: 0,
    unsaved: 0,
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

/** Structural check: is this recognisably a progress document at all? Returns an error string or null. */
export function validateState(obj) {
  if (!isObj(obj)) return 'Not a valid backup file.';
  if (!Array.isArray(obj.attempts) || !Array.isArray(obj.sessions)) return 'Backup file is missing progress data.';
  return null;
}

const validAttempt = (a) => isObj(a) && typeof a.id === 'string' && typeof a.q === 'string' && Number.isFinite(a.t) && typeof a.ok === 'boolean';
const validSession = (s) => isObj(s) && typeof s.id === 'string' && Number.isFinite(s.t) && Number.isFinite(s.total)
  && Number.isFinite(s.correct) && isObj(s.res);

function normalizeSettings(raw) {
  const d = defaultSettings();
  const r = isObj(raw) ? raw : {};
  const pick = (key) => (SETTING_CHOICES[key].includes(r[key]) ? r[key] : d[key]);
  return {
    testDate: typeof r.testDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.testDate) ? r.testDate : '',
    dailyGoal: pick('dailyGoal'),
    shuffleOptions: typeof r.shuffleOptions === 'boolean' ? r.shuffleOptions : d.shuffleOptions,
    shuffleQuestions: typeof r.shuffleQuestions === 'boolean' ? r.shuffleQuestions : d.shuffleQuestions,
    theme: pick('theme'),
    sessionLength: pick('sessionLength'),
    welcomed: typeof r.welcomed === 'boolean' ? r.welcomed : d.welcomed,
  };
}

/**
 * Turns anything that passed validateState into a safe state: bad entries are dropped (and counted),
 * wrong-typed fields are coerced to defaults. The app never has to defend against odd shapes after this.
 */
export function normalizeState(obj) {
  const src = isObj(obj) ? obj : {};
  const seen = new Set();
  const attempts = [];
  let droppedAttempts = 0;
  for (const a of Array.isArray(src.attempts) ? src.attempts : []) {
    if (!validAttempt(a) || seen.has(a.id)) { droppedAttempts++; continue; }
    seen.add(a.id);
    attempts.push({ ...a, sel: Array.isArray(a.sel) ? a.sel.filter(Number.isInteger) : [] });
  }
  const sessionIds = new Set();
  const sessions = [];
  let droppedSessions = 0;
  for (const s of Array.isArray(src.sessions) ? src.sessions : []) {
    if (!validSession(s) || sessionIds.has(s.id)) { droppedSessions++; continue; }
    sessionIds.add(s.id);
    sessions.push(s);
  }
  const meta = {};
  for (const [q, m] of Object.entries(isObj(src.meta) ? src.meta : {})) {
    if (!isObj(m)) continue;
    meta[q] = { bm: !!m.bm, rep: !!m.rep, note: typeof m.note === 'string' ? m.note : '', u: num(m.u) };
  }
  const state = {
    v: 1,
    epoch: isObj(src.epoch) && typeof src.epoch.id === 'string' ? { id: src.epoch.id, at: num(src.epoch.at) } : { id: 'e0', at: 0 },
    attempts: attempts.sort((a, b) => a.t - b.t),
    meta,
    sessions: sessions.sort((a, b) => a.t - b.t),
    settings: normalizeSettings(src.settings),
    settingsAt: num(src.settingsAt),
    lastExportAt: num(src.lastExportAt),
    unsaved: Math.max(0, num(src.unsaved)),
  };
  return { state, dropped: { attempts: droppedAttempts, sessions: droppedSessions } };
}

/**
 * Union of two states. Attempts and sessions are append-only and unique by id; notes/bookmarks and settings:
 * newest edit wins. Caller decides which state is `local` (its epoch is kept).
 */
export function mergeStates(local, incoming) {
  const attempts = new Map(local.attempts.map((a) => [a.id, a]));
  for (const a of incoming.attempts) if (!attempts.has(a.id)) attempts.set(a.id, a);
  const sessions = new Map(local.sessions.map((s) => [s.id, s]));
  for (const s of incoming.sessions) if (!sessions.has(s.id)) sessions.set(s.id, s);
  const meta = { ...local.meta };
  for (const [q, m] of Object.entries(incoming.meta || {})) {
    if (!meta[q] || (m.u || 0) > (meta[q].u || 0)) meta[q] = m;
  }
  const newerSettings = (incoming.settingsAt || 0) > (local.settingsAt || 0);
  return {
    ...local,
    attempts: [...attempts.values()].sort((a, b) => a.t - b.t),
    sessions: [...sessions.values()].sort((a, b) => a.t - b.t),
    meta,
    settings: newerSettings ? { ...local.settings, ...incoming.settings } : local.settings,
    settingsAt: Math.max(local.settingsAt || 0, incoming.settingsAt || 0),
    lastExportAt: Math.max(local.lastExportAt || 0, incoming.lastExportAt || 0),
    unsaved: Math.max(local.unsaved || 0, incoming.unsaved || 0),
  };
}
