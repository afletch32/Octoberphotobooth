// Always take control ASAP
self.addEventListener('install', (event) => { self.skipWaiting(); });

// Bump these to force one-time invalidation when changing strategies
const RUNTIME_CACHE = 'pb-runtime-v2';
const SHARE_CACHE = 'pb-share-v1';

// On activate, clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keep = new Set([RUNTIME_CACHE, SHARE_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    } catch (_) { /* noop */ }
    await self.clients.claim();
  })());
});

// Works at domain root or subpaths (e.g., '/')
function scopePath() {
return new URL('./', self.registration.scope).pathname;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const base = scopePath();
  const sameOrigin = url.origin === self.location.origin;

// Serve share images from cache at {scope}/share/{id}.png
if (sameOrigin && url.pathname.startsWith(base + 'share/')) {
event.respondWith(
caches.open(SHARE_CACHE).then(async (cache) => {
const resp = await cache.match(event.request);
return resp || new Response('Not found', { status: 404 });
})
);
return;
}

// Runtime handling for site asset images
// Use network-first so edits synced from another device show up immediately.
  const isAssetImg =
    sameOrigin &&
    url.pathname.includes('/assets/') &&
    (event.request.destination === 'image' ||
    /.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname));

  if (isAssetImg) {
    event.respondWith((async () => {
      // Network-only with cache: 'reload' so edits appear immediately
      try {
        const req = new Request(event.request, { cache: 'reload' });
        return await fetch(req);
      } catch (_) {
        // If offline, attempt any previous cache as a last resort
        try {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(event.request);
          if (cached) return cached;
        } catch (_) {}
        return new Response('Offline', { status: 503 });
      }
    })());
    return;
  }
});

// Receive image buffer and store as {scope}/share/{id}.png; reply with URL
self.addEventListener('message', async (event) => {
const data = event.data || {};
if (data.type !== 'store-share') return;

try {
const { id, buffer, mime } = data;
const path = scopePath() + 'share/' + id + '.png';
const req = new Request(path, { method: 'GET' });
const blob = new Blob([buffer], { type: mime || 'image/png' });
const resp = new Response(blob, {
headers: { 'Content-Type': blob.type, 'Cache-Control': 'public, max-age=31536000' }
});
const cache = await caches.open(SHARE_CACHE);
await cache.put(req, resp);
event.ports?.[0]?.postMessage({ ok: true, url: path });
} catch (e) {
event.ports?.[0]?.postMessage({ ok: false, error: String(e) });
}
});
