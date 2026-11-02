// Service worker: guarda la app para que abra rápido y avisa cuando hay una versión nueva.
// Al publicar cambios, subí el número de VERSION (y el de VERSION_WEB en js/app.js).
const VERSION = '2.5.2';
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
  if (/\/(version\.json|servidor\/)/.test(url.pathname) || /lista\.html$|lista\.js$/.test(url.pathname)) return; // v2.5: siempre lo más nuevo
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

// ---------------------------------------------------------------- v2.5: avisos en la barra
// Chrome despierta al service worker 1–2 veces al día (periodicsync). Lee la configuración que dejó la app
// en la caché "mf-cfg", pide el resumen al servidor con la llave de avisos y muestra lo que haya.
async function leerCfg(clave) {
  try { const c = await caches.open('mf-cfg'); const r = await c.match(clave || './__cfg'); return r ? await r.json() : null; } catch (e) { return null; }
}
async function guardarCfg(clave, obj) { const c = await caches.open('mf-cfg'); await c.put(clave, new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } })); }
function enSilencio(s) {
  if (!s) return false;
  const h = new Date().getHours(), d = Number(s.d), a = Number(s.h);
  return d === a ? false : d < a ? (h >= d && h < a) : (h >= d || h < a);
}
function cmpV(a, b) { const x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }
async function revisarAvisos() {
  const cfg = await leerCfg();
  if (!cfg || !cfg.tel || enSilencio(cfg.silencio)) return;
  const t = cfg.tipos || {}, si = (k) => t[k] !== false, ult = (await leerCfg('./__ultimo')) || {}, nuevo = { dia: new Date().toDateString() };
  const mostrar = (tag, titulo, cuerpo, url, accion) => self.registration.showNotification(titulo, { body: cuerpo, tag, icon: 'icons/icono-192.png', badge: 'icons/icono-192.png', data: { url }, actions: accion ? [{ action: 'abrir', title: accion }] : [] });
  const repetido = (k, v) => ult.dia === nuevo.dia && ult[k] === v;
  if (cfg.url && cfg.llave) {
    try {
      const r = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ avisos: cfg.llave }) });
      const j = await r.json();
      if (j && j.ok) {
        const x = j.resultado;
        if (si('asignar') && x.porAsignar && !repetido('a', x.porAsignar)) await mostrar('asignar', '✉ ' + x.porAsignar + ' movimiento' + (x.porAsignar === 1 ? '' : 's') + ' por asignar', 'Repartilos en tus sobres', './?ir=porasignar', 'Asignar');
        if (si('revisar') && x.porRevisar && !repetido('r', x.porRevisar)) await mostrar('revisar', '⚠ ' + x.porRevisar + ' por revisar', 'Movimientos sin categoría', './?ir=revisar', 'Revisar');
        if (si('salario') && x.salarioHoy && !repetido('s', 1)) await mostrar('salario', '💰 Hoy es día de salario', 'Confirmalo y repartilo en tus sobres', './?ir=inicio', 'Abrir');
        if (si('tarjeta')) for (const p of (x.pagos || [])) { if (!repetido('p' + p.nombre, p.dias)) await mostrar('pago-' + p.nombre, '💳 ' + p.nombre + (p.dias === 0 ? ' vence hoy' : ' vence en ' + p.dias + ' día' + (p.dias === 1 ? '' : 's')), 'Revisá la deuda y lo reservado', './?ir=tarjetas', 'Ver tarjeta'); nuevo['p' + p.nombre] = p.dias; }
        if (si('negativo') && (x.negativos || []).length && !repetido('n', x.negativos.join(','))) await mostrar('negativo', '🔴 Sobre en negativo', x.negativos.join(', '), './?ir=sobres', 'Ver sobres');
        if (si('super') && x.consultas && !repetido('c', x.consultas)) await mostrar('super', '🛒 ' + x.consultas + ' “¿este sirve?” sin responder', 'Abrí Super y Otros', './?ir=super', 'Ver');
        Object.assign(nuevo, { a: x.porAsignar, r: x.porRevisar, s: x.salarioHoy ? 1 : 0, n: (x.negativos || []).join(','), c: x.consultas });
      }
    } catch (e) { /* sin internet: la próxima vez */ }
  }
  if (si('version')) {
    try {
      const v = await (await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' })).json();
      if (v && cmpV(v.web, cfg.version) > 0 && ult.ver !== v.web) { await mostrar('version', '⬆ Nueva versión ' + v.web + ' lista', (v.novedades || '') + ' Tocá para actualizar.', './?ir=inicio', 'Actualizar ahora'); }
      nuevo.ver = v && cmpV(v.web, cfg.version) > 0 ? v.web : ult.ver;
    } catch (e) { /* nada */ }
  }
  await guardarCfg('./__ultimo', Object.assign({}, ult.dia === nuevo.dia ? ult : {}, nuevo));
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'mf-avisos') e.waitUntil(revisarAvisos()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const ws = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of ws) { if (w.url.startsWith(self.registration.scope)) { await w.focus(); return w.navigate(url); } }
    return self.clients.openWindow(url);
  })());
});
