/* This file stays at the published root so it can control both index.html and html/*.html. */
const CACHE_VERSION = 'development-2';
const SHELL_CACHE = `kata-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `kata-runtime-${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './data/manifest.webmanifest',
  './data/app-info.json',
  './style/common.css?v=14',
  './style/icons/kata-app-icon-192.png',
  './style/icons/kata-app-icon-512.png',
  './script/pwa.js?v=2',
  './script/common.js?v=20',
  './script/access-guard.js?v=2',
  './script/idle-lock.js',
  './script/kata-reader.js',
  './html/s01-kata.html',
  './html/s02-my-practice.html',
  './html/s03-my-practice-daily.html',
  './html/s04-my-practice-weekly.html',
  './html/s05-my-practice-monthly.html',
  './html/s06-my-journey.html',
  './html/s07-my-journey-my-flow.html',
  './html/s08-my-journey-my-reflections.html',
  './html/s09-my-kata.html',
  './html/s10-my-profile.html',
  './html/s11-about.html',
  './html/s12-change-password.html',
  './html/s13-enter-password.html',
  './html/s14-forgot-password.html'
];

const cacheResponse = async (cacheName, request, response) => {
  if (response?.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
};

const networkFirst = async (request, fallback) => {
  try {
    return await cacheResponse(RUNTIME_CACHE, request, await fetch(request));
  } catch (_) {
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : Response.error());
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kata-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'KATA_SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, url.pathname.endsWith('/html/') ? './html/s13-enter-password.html' : './index.html'));
    return;
  }

  if (url.pathname.endsWith('/data/app-info.json') || url.pathname.endsWith('/data/clarity-config.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(RUNTIME_CACHE, request, response)))
  );
});
