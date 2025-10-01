// minimal service worker for caching basic app shell
const CACHE_NAME = 'catatan-keuangan-shell-v1';
const URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  // tambahkan icon jika ada
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).catch(() => resp))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
