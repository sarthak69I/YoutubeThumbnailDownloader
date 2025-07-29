// Service Worker for E-LEAKxDOWN PWA
const CACHE_NAME = 'eleakxdown-v1';
const urlsToCache = [
    '/',
    '/static/css/custom.css',
    '/static/js/app.js',
    'https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://i.postimg.cc/ZKGmmSyr/a5f7295b-f621-4163-b66d-8edadf7721d8-removebg-preview-1-1.webp'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});