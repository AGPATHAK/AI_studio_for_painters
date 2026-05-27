/* ==========================================================================
   AI Painter Studio — service-worker.js
   Strategy: cache-first for the app shell only.
   API responses and user images are NEVER cached.
   Bump CACHE_NAME on every shell change to trigger revalidation.
   ========================================================================== */

'use strict';

const CACHE_NAME = 'apsv1-shell-2026-05-27b';

/** Files that make up the installable app shell. */
const SHELL_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ── Install ──────────────────────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

/* ── Activate ─────────────────────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)   // delete stale caches
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())        // take control immediately
  );
});

/* ── Fetch ────────────────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only intercept same-origin GET requests
  if (req.method !== 'GET') return;

  const reqUrl = new URL(req.url);
  if (reqUrl.origin !== self.location.origin) return;

  // During local development, always read the app shell from disk/network.
  // Otherwise an older installed PWA shell can mask current HTML/CSS/JS edits.
  const isLocalDev = ['localhost', '127.0.0.1', '::1'].includes(reqUrl.hostname);
  if (isLocalDev) {
    event.respondWith(fetch(req));
    return;
  }

  // Cache-first: serve from cache, fall back to network
  event.respondWith(
    caches.match(req)
      .then(cached => {
        if (cached) return cached;
        return fetch(req);
      })
  );
});
