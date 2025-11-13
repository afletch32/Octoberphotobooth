// Precache app shell
const PRECACHE_NAME = 'pb-precache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/scripts/themes.js',
  '/scripts/theme-storage.js',
  '/scripts/uploads.js',
  '/scripts/preview.js',
  '/scripts/config.js',
  '/manifest.json',
  '/fonts.css',
  '/fonts/AbrilFatface-400.woff2',
  '/fonts/Anton-400.woff2',
  '/fonts/Bangers-400.woff2',
  '/fonts/BebasNeue-400.woff2',
  '/fonts/Cabin-400.woff2',
  '/fonts/Cabin-600.woff2',
  '/fonts/Cabin-700.woff2',
  '/fonts/ComicNeue-400.woff2',
  '/fonts/ComicNeue-700.woff2',
  '/fonts/Creepster-400.woff2',
  '/fonts/CrimsonText-400.woff2',
  '/fonts/CrimsonText-600.woff2',
  '/fonts/CrimsonText-700.woff2',
  '/fonts/DancingScript-400.woff2',
  '/fonts/DancingScript-700.woff2',
  '/fonts/GreatVibes-400.woff2',
  '/fonts/Inter-400.woff2',
  '/fonts/Inter-600.woff2',
  '/fonts/Inter-700.woff2',
  '/fonts/Lato-400.woff2',
  '/fonts/Lato-700.woff2',
  '/fonts/Lora-400.woff2',
  '/fonts/Lora-600.woff2',
  '/fonts/Montserrat-400.woff2',
  '/fonts/Montserrat-600.woff2',
  '/fonts/Montserrat-700.woff2',
  '/fonts/MountainsofChristmas-400.woff2',
  '/fonts/MountainsofChristmas-700.woff2',
  '/fonts/Nosifer-400.woff2',
  '/fonts/OpenSans-400.woff2',
  '/fonts/OpenSans-600.woff2',
  '/fonts/OpenSans-700.woff2',
  '/fonts/Oswald-400.woff2',
  '/fonts/Oswald-600.woff2',
  '/fonts/PlayfairDisplay-400.woff2',
  '/fonts/PlayfairDisplay-600.woff2',
  '/fonts/Poppins-400.woff2',
  '/fonts/Poppins-600.woff2',
  '/fonts/Raleway-400.woff2',
  '/fonts/Raleway-600.woff2',
  '/fonts/Roboto-400.woff2',
  '/fonts/Roboto-500.woff2',
  '/fonts/Roboto-700.woff2',
  '/fonts/RobotoCondensed-400.woff2',
  '/fonts/RobotoCondensed-700.woff2',
  '/fonts/Sniglet-400.woff2',
  '/fonts/Sniglet-800.woff2',
  '/fonts/SourceSans3-400.woff2',
  '/fonts/SourceSans3-600.woff2',
  '/fonts/WorkSans-400.woff2',
  '/fonts/WorkSans-600.woff2',
  '/fonts/WorkSans-700.woff2',
  // Add other essential files here
];

// Always take control ASAP
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE_NAME);
    await cache.addAll(PRECACHE_ASSETS);
    self.skipWaiting();
  })());
});

// Bump these to force one-time invalidation when changing strategies
const RUNTIME_CACHE = 'pb-runtime-v2';
const SHARE_CACHE = 'pb-share-v1';
const OFFLINE_ASSETS_CACHE = 'pb-offline-assets-v1';

// On activate, clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keep = new Set([PRECACHE_NAME, RUNTIME_CACHE, SHARE_CACHE, OFFLINE_ASSETS_CACHE]);
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

  // For app shell files, use cache-first strategy
  if (sameOrigin && PRECACHE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.open(PRECACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fetch from network, cache it, and return it
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
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
        const resp = await fetch(req);
        // Also update the runtime cache
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, resp.clone());
        return resp;
      } catch (_) {
        // If offline, attempt any previous cache as a last resort
        const runtimeCache = await caches.open(RUNTIME_CACHE);
        const cached = await runtimeCache.match(event.request);
        if (cached) return cached;

        const offlineAssetsCache = await caches.open(OFFLINE_ASSETS_CACHE);
        const offlineCached = await offlineAssetsCache.match(event.request);
        if (offlineCached) return offlineCached;

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
