/* Zando Yetu — service worker (réseau mobile instable à Lubumbashi / Kolwezi)
 * - pages : réseau d'abord, page hors ligne en secours
 * - /_next/static : cache d'abord (fichiers versionnés, immuables)
 * - images produits : cache d'abord, nombre d'entrées limité
 * - API, Supabase REST/Auth, paiement : jamais mis en cache
 */
const VERSION = 'zy-v1';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/icon-512.png'];
const MAX_IMAGES = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    cache.put(request, response.clone());
    if (maxEntries) trimCache(cacheName, maxEntries);
  }
  return response;
}

function isProductImage(url) {
  return (
    url.pathname.startsWith('/_next/image') ||
    url.pathname.includes('/storage/v1/object/public/') ||
    url.hostname === 'images.unsplash.com'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Données vivantes : stock, prix, panier, session
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/rest/v1/') ||
    url.pathname.startsWith('/auth/v1/') ||
    url.pathname.startsWith('/realtime/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
    );
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.destination === 'image' && isProductImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGES).catch(() => Response.error()));
  }
});
