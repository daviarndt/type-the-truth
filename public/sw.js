/* Service worker mínimo — app shell + cache dos capítulos da Bíblia (offline).
   Base-path-agnóstico: deriva o prefixo do próprio caminho de sw.js,
   funcionando tanto na raiz quanto em subdiretório (GitHub Pages). */
const CACHE = "ttt-v1";
const BASE = self.location.pathname.replace(/\/sw\.js$/, ""); // "" ou "/type-the-truth"

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Capítulos da Bíblia e assets estáticos: cache-first (nunca mudam)
  const cacheFirst =
    url.pathname.startsWith(`${BASE}/bible/`) || url.pathname.startsWith(`${BASE}/_next/static/`);

  if (cacheFirst) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Demais: network-first com fallback ao cache (offline)
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match(`${BASE}/dashboard`)))
  );
});
