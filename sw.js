/* Nexus Calculator - Service Worker */
/* Strategy: network-first for the app shell (HTML/CSS/JS/JSON) so new
   deploys always show up when online; cache-first for images/fonts
   (rarely change); cache is the offline fallback. Bump CACHE_VERSION
   whenever you want to force-clear all previously cached assets. */
const CACHE_VERSION = 'nexus-v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
                .map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Let the page ask the waiting worker to take over immediately.
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Never intercept the live exchange-rate API — always fetch fresh.
    if (url.hostname.includes('er-api.com') || url.hostname.includes('exchangerate')) return;

    // Never intercept the AI endpoint (POST already passes through; this
    // guards any GET/preflight variants too).
    if (url.pathname.startsWith('/api/')) return;

    const sameOrigin = url.origin === self.location.origin;
    // App shell = navigations + our own HTML/CSS/JS/JSON. These must stay fresh.
    const isAppShell =
        request.mode === 'navigate' ||
        request.destination === 'document' ||
        url.pathname === '/' ||
        (sameOrigin && /\.(?:html|css|js|json)$/i.test(url.pathname));

    if (isAppShell) {
        // Network-first: fetch latest, update cache, fall back to cache offline.
        event.respondWith(
            fetch(request)
                .then(res => {
                    if (res && res.status === 200) {
                        const copy = res.clone();
                        caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(request).then(r =>
                    r || (request.mode === 'navigate' ? caches.match('/index.html') : undefined)
                ))
        );
        return;
    }

    // Cache-first for images, icons, fonts (rarely change).
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(res => {
            if (res && res.status === 200 && res.type !== 'opaque') {
                const copy = res.clone();
                caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
            }
            return res;
        }).catch(() => request.destination === 'image' ? caches.match('/icons/icon-192.png') : undefined))
    );
});
