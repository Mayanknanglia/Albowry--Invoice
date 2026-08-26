// Service Worker - Al Bowry Carpentry LLC
const CACHE_NAME = 'albowry-invoice-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/utils.js',
    '/js/db.js',
    '/js/auth.js',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/customers.js',
    '/js/invoices.js',
    '/js/quotations.js',
    '/js/suppliers.js',
    '/js/purchases.js',
    '/js/reports.js',
    '/js/vat-reports.js',
    '/js/settings.js',
    '/js/pdf.js',
    '/js/whatsapp.js',
    '/public/logo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});