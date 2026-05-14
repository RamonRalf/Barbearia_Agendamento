const cacheName = 'barber-v1';
const assets = ['./', './index.html'];

// Instala o Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(assets);
    })
  );
});

// Faz o app funcionar offline (necessário para o botão instalar)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
