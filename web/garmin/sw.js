/* Service worker de ManuSquash: permite instalar la app en el celular y abrirla sin red.
 * - La "cáscara" (index.html, config, íconos) se sirve red-primero con copia de respaldo.
 * - Los datos (/data, /sync, /auth...) NUNCA se guardan aquí: son privados y la app ya
 *   los guarda en localStorage para verlos sin conexión.
 */
const CACHE = 'msq-shell-v1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
const API = /\/(data|sync|generate|auth|cron|healthz)(\/|\?|$)/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || API.test(url.pathname) || url.pathname.endsWith('.json')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
