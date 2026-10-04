// Gentle, honest request for support. Rules live in the engine (canAskForSupport, supportKindForSession):
// only after enough use, at most weekly, never during practice or a mock, never after a weak result.
import { SUPPORT, canAskForSupport } from '../engine.js';
import * as store from '../store.js';
import { h, icon } from '../ui.js';

export const SUPPORT_URL = 'https://buymeacoffee.com/ryanchan';
const DAY = 86400000;

const COPY = {
  pass: { title: 'You passed the mock! 🎉', body: 'This app is free, ad-free and made by one person. If it helped you get ready, a coffee helps me keep the questions checked and the app improving.' },
  good: { title: 'Strong session. Nice work.', body: 'This app is free, ad-free and made by one person. If it is helping, a coffee helps me keep improving it.' },
  home: { title: 'Finding it useful?', body: 'This app is free and ad-free, and made by one person. If it is helping you prepare, a coffee helps me keep it updated.' },
};

/** The yellow "Buy me a coffee" button. Opens in a new tab; nothing is sent from the app. */
export function coffeeButton({ onClick } = {}) {
  return h('a', {
    class: 'btn btn-coffee', href: SUPPORT_URL, target: '_blank', rel: 'noopener noreferrer',
    onClick: () => onClick?.(),
  }, icon('coffee', 18), 'Buy me a coffee');
}

/**
 * A support card for the given moment ('pass' | 'good' | 'home'), or null if we shouldn't ask right now.
 * Showing it counts as "asked", so it appears at most once a week even if the page is reloaded.
 */
export function supportCard(kind, { onGone } = {}) {
  const state = store.getState();
  if (!COPY[kind] || !canAskForSupport(state)) return null;
  store.setSettings({ supportShownAt: Date.now() });

  const card = h('section', { class: 'card support', 'aria-label': 'Support this app' });
  const close = (days) => {
    store.setSettings({ supportHiddenUntil: Date.now() + days * DAY });
    card.remove();
    onGone?.();
  };
  const { title, body } = COPY[kind];
  card.append(
    h('h3', null, title),
    h('p', null, body),
    h('div', { class: 'support-actions' },
      coffeeButton({ onClick: () => store.setSettings({ supportHiddenUntil: Date.now() + SUPPORT.thankedDays * DAY }) }),
      h('button', { class: 'linkbtn', onClick: () => close(SUPPORT.hideDays) }, 'Not now')));
  return card;
}
