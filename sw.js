/* BIOCOGNIA · service worker (app instalable).
   Estrategia: primero la red y, si no hay conexión, la copia guardada. Así cada cambio subido a GitHub se ve
   en cuanto hay internet, y QUAESTIA (entrenamiento) sigue funcionando sin conexión. No toca Firebase:
   las peticiones a Firestore y al inicio de sesión pasan directamente a la red. */
"use strict";
const CACHE = "biocognia-v1";
const BASE = new URL("./", self.location).href;
const PRECARGA = [
  "./", "index.html", "manifest.webmanifest", "comun/pwa.js",
  "comun/iconos/icono-192.png", "comun/iconos/icono-512.png",
  "quaestia/", "quaestia/firebase-config.js",
  ...[1, 2, 3, 4, 5, 6, 7].map((t) => `quaestia/data/tema0${t}.json`),
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECARGA.map((u) => c.add(new URL(u, BASE).href).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("biocognia-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const FUENTES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  // Tipografías de Google: se guardan la primera vez y se reutilizan.
  if (FUENTES.test(url)) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })));
    return;
  }
  // Solo lo de BIOCOGNIA; todo lo demás (Firebase, SheetJS…) va directo a la red.
  if (!url.startsWith(BASE)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await fetch(req, { cache: "no-cache" });
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) ||
        (req.mode === "navigate" ? (await c.match(new URL("./", BASE).href)) : undefined) ||
        new Response("Sin conexión / Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
