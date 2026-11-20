// App de la casa (v2.18): service worker propio y chiquito (solo casa.html y lo que usa). Primero la red; sin internet, lo guardado.
var CACHE = 'casa-v2.18.0';
var ARCHIVOS = ['casa.html', 'js/casa.js', 'js/calculos.js', 'casa.webmanifest', 'icons/casa-192.png', 'icons/casa-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).catch(function () {})); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^casa-/.test(k) && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (x) { x.put(e.request, c); }); return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('casa.html'); }); }));
});
