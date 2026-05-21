// Service worker — cache-first for app shell, network-first for HTML
// Bump CACHE_VERSION whenever you ship changes so users get the new build.

const CACHE_VERSION = 'gca-v9';
const APP_SHELL = [
  './',
  './美股記帳.html',
  './styles.css',
  './data.js',
  './shared.jsx',
  './tweaks-panel.jsx',
  './screens.jsx',
  './tracker.jsx',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  // CDN deps — cache so it works offline
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .catch((err) => console.warn('[sw] some assets failed to cache:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only handle GET
  if (e.request.method !== 'GET') return;

  // Network-first for HTML so updates show up; fall back to cache when offline.
  if (e.request.mode === 'navigate' || (e.request.destination === 'document')) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then((c) => c || caches.match('./美股記帳.html')))
    );
    return;
  }

  // Network-first for our own JS/JSX/CSS so code changes propagate without
  // waiting for a SW version bump. Falls back to cache when offline.
  const isOwnCode = url.origin === location.origin &&
    /\.(jsx?|css|webmanifest)$/.test(url.pathname);
  if (isOwnCode) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (CDN deps, fonts, images)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && (url.origin === location.origin || url.host.includes('unpkg.com') || url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com'))) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
