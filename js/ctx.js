// Shared, read-only application context: the question bank and cached derived cards.
import { deriveCards } from './engine.js';
import * as store from './store.js';
import { t } from './i18n.js';

export let bank = null;
export const byId = new Map();

export async function loadBank() {
  const res = await fetch('data/questions.json');
  if (!res.ok) throw new Error(t('error.loadQuestions', { status: res.status }));
  bank = await res.json();
  byId.clear();
  bank.questions.forEach((q) => byId.set(q.id, q));
}

let memo = null;
/** Cards (per-question progress) derived from the attempt log; cached until progress changes. */
export function cards() {
  const s = store.getState();
  const k = `${s.attempts.length}|${s.attempts.at(-1)?.id}|${s.settings.testDate}|${Math.floor(Date.now() / 60000)}`;
  if (memo?.k !== k) memo = { k, v: deriveCards(s.attempts, bank.questions, s.settings) };
  return memo.v;
}

export const examLabel = (q) => q.exams.map((w) => `${t('kind.exam', { n: w.exam })} · ${t('q.number', { n: w.n })}`).join(' / ');
