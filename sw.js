const CACHE_NAME = 'panel-u-cache-v25';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// INSTALACIÓN
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// ACTIVACIÓN: Limpia cachés viejas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// FETCH: Estrategia "Network First"
self.addEventListener('fetch', event => {
    // 🛑 REGLA DE ORO: No interceptar JAMÁS las rutas de autenticación de Google ni base de datos
    if (event.request.method !== 'GET' || 
        event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('identitytoolkit.googleapis.com') ||
        event.request.url.includes('firebaseapp.com/__/')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
