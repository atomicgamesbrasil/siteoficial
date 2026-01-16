const CACHE_NAME = 'atomic-pwa-v2-dynamic'; // MUDANÇA CRÍTICA: Nome novo força a atualização
const URLS_TO_CACHE = [
  './',
  './index.html',
  './main.js',
  './chatbot.js'
];

// Install Event: Initialize Cache
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo SW a assumir o controle imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache:', CACHE_NAME);
      return cache.addAll(URLS_TO_CACHE).catch(err => console.warn('PWA Cache Warning:', err));
    })
  );
});

// Activate Event: Clean up old caches (CRUCIAL PARA REMOVER A VERSÃO ANTIGA)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName); // Apaga a versão v1 ou anterior
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle de todas as abas abertas
  );
});

// Fetch Event: Network First Strategy
// Tenta buscar na rede. Se der certo, atualiza o cache. Se falhar, usa o cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clonamos ela para atualizar o cache "em segundo plano"
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});