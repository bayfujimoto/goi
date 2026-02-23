const CACHE = 'goi-v2'; // bump this number on every deploy

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
});

self.addEventListener('activate', e => {
  // Delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first strategy: always try network, fall back to cache
  // This means updates show up immediately when online
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a copy of the fresh response
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});
