// Service Worker - Excursionistas FC
// Cache version - incrementar al actualizar
const CACHE_NAME = 'excursio-v1';

// Archivos a cachear para funcionamiento offline
const STATIC_FILES = [
  '/excursio/',
  '/excursio/index.html',
  '/excursio/manifest.json',
  '/excursio/icons/icon-192.png',
  '/excursio/icons/icon-512.png',
];

// Instalar: cachear archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES).catch(err => {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback a cache
self.addEventListener('fetch', event => {
  // No interceptar llamadas a Apps Script (siempre necesitan red)
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleusercontent.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia en cache si es exitosa
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: usar cache
        return caches.match(event.request).then(cached => {
          return cached || new Response(
            '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px">Sin conexion. La app necesita internet para funcionar.</h2>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});
