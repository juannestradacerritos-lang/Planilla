const CACHE_NAME = 'panel-u-cache-v16';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// INSTALACIÓN: Guarda los archivos iniciales y fuerza la activación inmediata
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting()) // Fuerza al nuevo SW a tomar el control inmediatamente
    );
});

// ACTIVACIÓN: Limpia cachés viejas para evitar que el HTML antiguo se quede pegado
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Caché antigua eliminada:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Toma el control de las pestañas abiertas
    );
});

// FETCH (INTERCEPCIÓN DE RED): Estrategia "Network First"
self.addEventListener('fetch', event => {
    // Excluir peticiones a Firestore (base de datos) del caché del Service Worker
    if (event.request.url.includes('firestore.googleapis.com')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Si hay conexión, clona la respuesta nueva y actualiza el caché en silencio
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Si no hay conexión a internet, busca en el caché
                return caches.match(event.request);
            })
    );
});
