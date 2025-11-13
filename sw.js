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

// Receive asset buffer and store under {scope}/share/{id}.{ext}; reply with URL
self.addEventListener('message', async (event) => {
const data = event.data || {};
if (data.type !== 'store-share') return;

try {
const { id, buffer, mime, ext } = data;
const normalizeExt = (value) => {
  const cleaned = (value || '').toLowerCase().split(/[;+]/)[0].split('+')[0].replace(/[^a-z0-9]/g, '');
  if (cleaned === 'quicktime') return 'mov';
  if (cleaned === 'x-m4v') return 'm4v';
  if (cleaned === 'x-msvideo') return 'avi';
  return cleaned;
};
let safeExt = normalizeExt(ext);
if (!safeExt && mime) {
  const parts = mime.split('/');
  if (parts[1]) safeExt = normalizeExt(parts[1]);
}
if (!safeExt) {
  if (mime && mime.startsWith('video/')) safeExt = 'webm';
  else if (mime && mime.startsWith('image/')) safeExt = 'png';
  else safeExt = 'bin';
}
const defaultMime = (() => {
  if (mime) return mime;
  if (safeExt === 'webm') return 'video/webm';
  if (safeExt === 'mp4') return 'video/mp4';
  if (safeExt === 'mov') return 'video/quicktime';
  if (safeExt === 'm4v') return 'video/x-m4v';
  if (safeExt === 'avi') return 'video/x-msvideo';
  if (safeExt === 'gif') return 'image/gif';
  if (safeExt === 'jpg' || safeExt === 'jpeg') return 'image/jpeg';
  if (safeExt === 'png') return 'image/png';
  return 'application/octet-stream';
})();
const path = scopePath() + 'share/' + id + '.' + safeExt;
const req = new Request(path, { method: 'GET' });
const blob = new Blob([buffer], { type: defaultMime });
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
