// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Service Worker
// Offline Caching & PWA Support
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'albowry-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './public/logo.png',
    './css/style.css',
    './js/utils.js',
    './js/db.js',
    './js/auth.js',
    './js/app.js',
    './js/pdf.js'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activate
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event (Network First, fallback to Cache)
// App mostly uses LocalStorage/Firebase, so we want fresh JS if network is available
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If network succeeds, clone and update cache
                const resClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, resClone);
                });
                return response;
            })
            .catch(() => {
                // If network fails, use cache
                return caches.match(event.request).then((response) => {
                    return response || caches.match('./index.html');
                });
            })
    );
});
