/* ANIMAti iPad — service worker
   Strategia: apre SUBITO la copia salvata sull'iPad (anche senza rete) e controlla
   gli aggiornamenti in background; la nuova versione si usa dall'apertura successiva.
   Per forzare l'aggiornamento dopo aver caricato un nuovo index.html, cambia VERSIONE. */
const VERSIONE = 'animati-v12.0';
const BASE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;
  e.respondWith(
    caches.open(VERSIONE).then(async cache => {
      const cached = await cache.match(key, { ignoreSearch: true });
      // aggiornamento in background (non blocca l'apertura)
      const rete = fetch(req, { cache: 'no-cache' }).then(r => {
        if (r && r.ok) cache.put(key, r.clone());
        return r;
      }).catch(() => null);
      if (cached) { e.waitUntil(rete); return cached; }
      return (await rete) || new Response('Offline', { status: 503 });
    })
  );
});
