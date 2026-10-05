import * as store from './store.js';
import { loadBank } from './ctx.js';
import { daysToTest } from './engine.js';
import { renderSession, renderResults } from './session.js';
import { renderHome } from './views/home.js';
import { renderPractice } from './views/practice.js';
import { renderStats } from './views/stats.js';
import { renderBrowse } from './views/browse.js';
import { renderSettings } from './views/settings.js';
import { h, icon, toast } from './ui.js';
import { t, tn, setLang, resolveLang } from './i18n.js';

const app = document.getElementById('app');
const NAV = [
  ['#/', 'nav.home', 'home'],
  ['#/practice', 'nav.practice', 'target'],
  ['#/stats', 'nav.stats', 'chart'],
  ['#/questions', 'nav.questions', 'list'],
  ['#/settings', 'nav.settings', 'sliders'],
];
const TITLE_KEYS = {
  '': 'nav.home', practice: 'nav.practice', stats: 'nav.stats', questions: 'nav.questions',
  settings: 'nav.settings', session: 'nav.session', results: 'nav.results',
};

function applyTheme() {
  const theme = store.getState().settings.theme;
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f6f5f1');
}

let cleanup = () => {};
let shell = null;

function buildShell() {
  const main = h('main', { id: 'view', tabIndex: -1 });
  const left = h('span', { class: 'countdown', id: 'countdown' });
  const header = h('header', { class: 'topbar' },
    h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'UK'), h('span', null, t('app.brand'))),
    left);
  const nav = h('nav', { class: 'tabs', 'aria-label': t('nav.aria') },
    NAV.map(([href, key, ic]) => h('a', { class: 'tab', href, 'data-href': href }, icon(ic, 22), h('span', null, t(key)))));
  app.replaceChildren(
    header, main, nav,
    h('div', { id: 'toasts' }),
    // one persistent live region: screen readers reliably announce text placed into it
    h('div', { id: 'live', class: 'sr-only', role: 'status', 'aria-live': 'polite' }));
  return { main, nav, header, left };
}

function route() {
  cleanup();
  cleanup = () => {};
  const hash = location.hash || '#/';
  const [, path, arg] = hash.match(/^#\/([^/]*)\/?(.*)$/) || [];
  const inSession = path === 'session';
  app.classList.toggle('in-session', inSession);
  document.title = `${t(TITLE_KEYS[path ?? ''] ?? 'app.brand')} · ${t('app.title')}`;

  shell.nav.querySelectorAll('.tab').forEach((a) => {
    const target = a.dataset.href;
    const on = target === '#/' ? (path === '' || path === undefined) : hash.startsWith(target);
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });

  const left = daysToTest(store.getState().settings.testDate);
  shell.left.textContent = left == null ? '' : left === 0 ? t('countdown.testDay') : t('countdown.days', { n: left });
  shell.left.hidden = left == null;

  const root = shell.main;
  try {
    switch (path) {
      case 'practice': cleanup = renderPractice(root); break;
      case 'stats': cleanup = renderStats(root); break;
      case 'questions': cleanup = renderBrowse(root); break;
      case 'settings': cleanup = renderSettings(root, { applyTheme }); break;
      case 'session': cleanup = renderSession(root); break;
      case 'results': cleanup = renderResults(root, arg); break;
      default: cleanup = renderHome(root);
    }
  } catch (err) {
    console.error(err);
    root.replaceChildren(h('div', { class: 'card' }, h('h3', null, t('error.title')), h('p', { class: 'muted' }, String(err.message || err)), h('a', { class: 'btn', href: '#/' }, t('error.back'))));
  }
  if (path !== 'session') {
    window.scrollTo(0, 0);
    root.focus({ preventScroll: true }); // keyboard / screen-reader users land at the top of the new page
  }
}

/** A new version installs in the background; never reload under the user (they may be mid-test). */
function offerUpdate() {
  if (document.getElementById('update-banner')) return;
  const banner = h('div', { id: 'update-banner', class: 'banner banner-info update-banner', role: 'status' },
    icon('refresh', 18), t('update.ready'),
    h('button', { class: 'btn btn-sm', onClick: () => location.reload() }, t('update.reload')),
    h('button', { class: 'btn btn-sm btn-ghost', 'aria-label': t('common.dismiss'), onClick: () => banner.remove() }, icon('x', 16)));
  app.prepend(banner);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) offerUpdate(); });
  navigator.serviceWorker.register('sw.js')
    .then((reg) => { if (reg.waiting && hadController) offerUpdate(); })
    .catch((e) => console.warn('SW registration failed', e));
}

async function boot() {
  store.init();
  setLang(resolveLang(store.getState().settings.lang));
  store.setErrorHandler((message) => toast(message, { error: true, ms: 9000 }));
  applyTheme();
  shell = buildShell();
  try {
    await loadBank();
  } catch (err) {
    shell.main.replaceChildren(h('div', { class: 'card' }, h('h3', null, t('error.loadTitle')),
      h('p', { class: 'muted' }, t('error.loadHint') + ' ' + err.message)));
    return;
  }
  addEventListener('hashchange', route);
  // Choosing a language rebuilds the navigation and redraws the current page in the new language.
  document.addEventListener('langchange', () => { shell = buildShell(); route(); });
  route();
  window.__appReady = true; // the loading watchdog in index.html stands down
  // Ask the browser to protect our storage from automatic eviction (silent where unsupported).
  store.requestPersistence();
  registerServiceWorker();
}

boot();
