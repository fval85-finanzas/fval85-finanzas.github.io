// Service worker: guarda la app para que abra rápido y avisa cuando hay una versión nueva.
// Al publicar cambios, subí el número de VERSION (y el de VERSION_WEB en js/app.js).
const VERSION = '2.3.0';
const CACHE = 'misfinanzas-' + VERSION;
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest', './css/estilos.css', './js/calculos.js', './js/pdf.js', './js/app.js', './js/lector.js', './js/ocr-worker.js', './js/vendor/pdf-lib.min.js',
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

const LIBS = 'mf-libs-1';   // lector de fotos y PDF (pesados): se guardan aparte y no se borran con cada versión
const COMPARTIDO = 'mf-compartido';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url0 = new URL(req.url);
  // v2.3: "Compartir → Finanzas" desde la app del banco o Gmail (foto o PDF)
  if (req.method === 'POST' && url0.origin === location.origin && url0.pathname.endsWith('/compartir')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const f = fd.get('archivo');
        const c = await caches.open(COMPARTIDO);
        if (f && f.size) await c.put('./__compartido', new Response(f, { headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-Nombre': encodeURIComponent(f.name || 'archivo') } }));
      } catch (err) { /* sin archivo */ }
      return Response.redirect(new URL('./?compartido=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  if (url0.origin === location.origin && url0.pathname.includes('/js/vendor/') && !url0.pathname.endsWith('pdf-lib.min.js')) {
    e.respondWith((async () => {
      const c = await caches.open(LIBS);
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    })());
    return;
  }
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
