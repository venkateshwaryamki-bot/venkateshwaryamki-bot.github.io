/* Offline cache for CorpFin Ace. Bump VERSION when files change. */
const VERSION = "corpfin-v1";
const CORE = ["./", "index.html", "app.css", "manifest.webmanifest", "icon.svg",
  "js/core.js", "js/gen.js", "js/labs.js", "js/app.js",
  "data/u1.js", "data/u2.js", "data/u3.js", "data/u4.js", "data/u5.js", "data/cards.js", "data/quiz.js", "data/bank.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // network first for our own files so updates arrive, cache as fallback for offline use
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })));
  }
});
