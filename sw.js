// Offline support.
//
// The app is cached as ONE immutable, versioned set. A new version is downloaded in full, bypassing the
// browser's HTTP cache, and only replaces the old set once every file has arrived (install is all-or-nothing).
// Files are never refreshed one by one, so the app can never run with a mixture of old and new files.
// VERSION is stamped from the content of the files by `npm run stamp`; a test fails if it is stale.
const VERSION = '587fe24ce7cf';
const CACHE = `litukp-${VERSION}`;
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/main.js', 'js/engine.js', 'js/store.js', 'js/ctx.js', 'js/ui.js', 'js/session.js',
  'js/views/home.js', 'js/views/practice.js', 'js/views/stats.js', 'js/views/browse.js', 'js/views/settings.js', 'js/views/welcome.js',
  'data/questions.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('litukp-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await fetch(req);
    } catch {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
