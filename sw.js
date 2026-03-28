const CACHE_NAME = 'epargne-v38';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isShell = ASSETS.some(a => url.pathname.endsWith(a.replace('./', '')));
  if (isShell) {
    // App shell → cache d'abord, réseau en background pour mise à jour (stale-while-revalidate)
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          return res;
        });
        return cached || fresh;
      })
    );
  } else {
    // Autres requêtes (Google Sheets API, etc.) → réseau d'abord
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
