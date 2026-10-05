// Gentle, honest request for support. Rules live in the engine (canAskForSupport, supportKindForSession):
// only after enough use, at most weekly, never during practice or a mock, never after a weak result.
import { SUPPORT, canAskForSupport } from '../engine.js';
import * as store from '../store.js';
import { h, icon } from '../ui.js';
import { t } from '../i18n.js';

export const SUPPORT_URL = 'https://buymeacoffee.com/ryanchan';
const DAY = 86400000;
const KINDS = ['pass', 'good', 'home'];

/** The yellow "Buy me a coffee" button. Opens in a new tab; nothing is sent from the app. */
export function coffeeButton({ onClick } = {}) {
  return h('a', {
    class: 'btn btn-coffee', href: SUPPORT_URL, target: '_blank', rel: 'noopener noreferrer',
    onClick: () => onClick?.(),
  }, icon('coffee', 18), t('support.button'));
}

/**
 * A support card for the given moment ('pass' | 'good' | 'home'), or null if we shouldn't ask right now.
 * Showing it counts as "asked", so it appears at most once a week even if the page is reloaded.
 */
export function supportCard(kind, { onGone } = {}) {
  const state = store.getState();
  if (!KINDS.includes(kind) || !canAskForSupport(state)) return null;
  store.setSettings({ supportShownAt: Date.now() });

  const card = h('section', { class: 'card support', 'aria-label': t('support.aria') });
  const close = (days) => {
    store.setSettings({ supportHiddenUntil: Date.now() + days * DAY });
    card.remove();
    onGone?.();
  };
  card.append(
    h('h3', null, t(`support.${kind}.title`)),
    h('p', null, t(`support.${kind}.body`)),
    h('div', { class: 'support-actions' },
      coffeeButton({ onClick: () => store.setSettings({ supportHiddenUntil: Date.now() + SUPPORT.thankedDays * DAY }) }),
      h('button', { class: 'linkbtn', onClick: () => close(SUPPORT.hideDays) }, t('support.notNow'))));
  return card;
}
