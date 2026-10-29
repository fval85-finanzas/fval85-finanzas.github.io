// Service worker: guarda la app para que abra rápido y avisa cuando hay una versión nueva.
// Al publicar cambios, subí el número de VERSION (y el de VERSION_WEB en js/app.js).
const VERSION = '1.4.0';
const CACHE = 'misfinanzas-' + VERSION;
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest', './css/estilos.css', './js/calculos.js', './js/pdf.js', './js/app.js', './js/vendor/pdf-lib.min.js',
  './icons/icono-192.png', './icons/icono-512.png', './icons/icono-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    const viejas = claves.filter((k) => k.startsWith('misfinanzas-') && k !== CACHE);
    await Promise.all(viejas.map((k) => caches.delete(k)));
    await self.clients.claim();
    if (viejas.length) (await self.clients.matchAll({ type: 'window' })).forEach((c) => c.postMessage({ tipo: 'actualizada', version: VERSION }));
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Google (datos y fuentes): directo a la red
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await c.match('./index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
