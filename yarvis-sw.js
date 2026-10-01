/* YARVIS · service worker propio (alcance ./yarvis), separado del sw.js del portal.
 * - La página se pide primero a la red (siempre la versión más nueva) y, sin conexión,
 *   se sirve la última copia guardada.
 * - Íconos y manifiesto se guardan para que la app abra rápido.
 * - Las preguntas a YARVIS (POST a Apps Script) NUNCA pasan por la caché.
 * Al publicar cambios grandes en yarvis.html, subir el número de versión. */
var VERSION = 'yarvis-v4';
var BASICOS = ['./yarvis.html', './yarvis.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASICOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('yarvis-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   /* Apps Script y CDN: directo a la red */
  if (req.mode === 'navigate' || /yarvis\.html/.test(req.url)) {
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put('./yarvis.html', cp); }); return r; })
      .catch(function () { return caches.match('./yarvis.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
