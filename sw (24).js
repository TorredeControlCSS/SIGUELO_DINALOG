/* ============================================================
   SÍGUELO — Portal Central DINALOG · Service Worker
   Estrategia:
     - Navegación (el portal): network-first con fallback a caché
       (así el usuario siempre ve la versión nueva si hay internet,
        y el portal abre offline si no lo hay).
     - Estáticos del propio scope (íconos, manifest): cache-first.
   NO cachea los tableros externos: abren en pestaña nueva hacia
   otros repos GitHub Pages y deben cargar siempre en vivo.
   ============================================================ */

const CACHE = "siguelo-portal-v1";   // <-- sube este número al publicar cambios

const SHELL = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo manejamos peticiones GET del mismo origen.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  // Navegación (abrir el portal): network-first.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Estáticos del scope: cache-first.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => hit))
  );
});
