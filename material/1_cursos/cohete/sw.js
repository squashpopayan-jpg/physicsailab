// Service worker: guarda la app para abrirla sin conexión en la cancha. Red primero (para recibir mejoras),
// caché de respaldo. Solo se activa si la página se sirve con un certificado de confianza.
const CACHE = 'apogeo-v1';
const ASSETS = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/analysis.js', 'js/barcode.js', 'js/chart.js', 'js/detect.js', 'js/geom.js', 'js/hud.js', 'js/orient.js',
  'js/physics.js', 'js/pipeline.js', 'js/recorder.js', 'js/scene.js', 'js/store.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
