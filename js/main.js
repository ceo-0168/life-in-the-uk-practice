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

const app = document.getElementById('app');
const NAV = [
  ['#/', 'Home', 'home'],
  ['#/practice', 'Practice', 'target'],
  ['#/stats', 'Stats', 'chart'],
  ['#/questions', 'Questions', 'list'],
  ['#/settings', 'Settings', 'sliders'],
];
const TITLES = {
  '': 'Home', practice: 'Practice', stats: 'Stats', questions: 'Questions',
  settings: 'Settings', session: 'Session', results: 'Results',
};

function applyTheme() {
  const t = store.getState().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f6f5f1');
}

let cleanup = () => {};
let shell = null;

function buildShell() {
  const main = h('main', { id: 'view', tabIndex: -1 });
  const left = h('span', { class: 'countdown', id: 'countdown' });
  const header = h('header', { class: 'topbar' },
    h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'UK'), h('span', null, 'Life in the UK')),
    left);
  const nav = h('nav', { class: 'tabs', 'aria-label': 'Main' },
    NAV.map(([href, label, ic]) => h('a', { class: 'tab', href, 'data-href': href }, icon(ic, 22), h('span', null, label))));
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
  document.title = `${TITLES[path ?? ''] ?? 'Life in the UK'} · Life in the UK Practice`;

  shell.nav.querySelectorAll('.tab').forEach((a) => {
    const target = a.dataset.href;
    const on = target === '#/' ? (path === '' || path === undefined) : hash.startsWith(target);
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });

  const left = daysToTest(store.getState().settings.testDate);
  shell.left.textContent = left == null ? '' : left === 0 ? 'Test day' : `${left}d to test`;
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
    root.replaceChildren(h('div', { class: 'card' }, h('h3', null, 'Something went wrong'), h('p', { class: 'muted' }, String(err.message || err)), h('a', { class: 'btn', href: '#/' }, 'Back to Home')));
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
    icon('refresh', 18), 'A new version is ready.',
    h('button', { class: 'btn btn-sm', onClick: () => location.reload() }, 'Reload'),
    h('button', { class: 'btn btn-sm btn-ghost', 'aria-label': 'Dismiss', onClick: () => banner.remove() }, icon('x', 16)));
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
  store.setErrorHandler((message) => toast(message, { error: true, ms: 9000 }));
  applyTheme();
  shell = buildShell();
  try {
    await loadBank();
  } catch (err) {
    shell.main.replaceChildren(h('div', { class: 'card' }, h('h3', null, 'Could not load the questions'),
      h('p', { class: 'muted' }, 'Check your connection and reload. ' + err.message)));
    return;
  }
  addEventListener('hashchange', route);
  route();
  window.__appReady = true; // the loading watchdog in index.html stands down
  // Ask the browser to protect our storage from automatic eviction (silent where unsupported).
  store.requestPersistence();
  registerServiceWorker();
}

boot();
