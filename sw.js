/* Service Worker — Bomrillaz Conferência de Material (CBMRS)
   REGRA DE OURO: só o APP (same-origin: index, assets, img) e os SCRIPTS ESTÁTICOS do
   Firebase SDK (gstatic /firebasejs/) passam pelo cache. TUDO que é Firebase DINÂMICO
   (RTDB firebaseio.com, Auth googleapis.com) passa DIRETO, sem intercept — senão o SW
   cacheava as chamadas do banco e o app abriria zerado / "sem conexão".
   - navegação (HTML): network-first (offline cai no cache).
   - demais GET elegíveis: stale-while-revalidate. */

const CACHE = 'cbmrs-conferencia-cache-v3';
const SAME = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/cesar-coin.png',
  'assets/favicon-16.png', 'assets/favicon-32.png', 'assets/apple-touch-icon.png',
  'img/banner.jpg', 'img/banner.webp'
];
const CROSS = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SAME.map((u) => cache.add(u)));
    await Promise.allSettled(CROSS.map(async (u) => {
      try { const r = await fetch(u, { mode: 'no-cors' }); await cache.put(u, r); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function cachePut(req, res) {
  if (res && (res.status === 200 || res.status === 0)) {
    caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  const sameOrigin = url.origin === self.location.origin;
  const sdkEstatico = url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') !== -1;
  // Firebase dinâmico / terceiros: NÃO intercepta, vai direto ao servidor.
  if (!sameOrigin && !sdkEstatico) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { cachePut(req, res.clone()); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const net = fetch(req).then((res) => { cachePut(req, res.clone()); return res; }).catch(() => cached);
      return cached || net;
    })
  );
});
