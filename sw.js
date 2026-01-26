const CACHE_NAME = 'atomic-pwa-v6.0.1-MIRROR'; // FORCE UPDATE - RESET TOTAL
const URLS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './utils.js',
  './api.js',
  './calculator.js',
  './chatbot.js',
  './manifest.json'
];

// Install: Skip Waiting para assumir controle imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Opened cache:', CACHE_NAME);
      return cache.addAll(URLS_TO_CACHE).catch(err => console.warn('[SW] Cache Warning:', err));
    })
  );
});

// Activate: Remove caches antigos (Nuclear Option)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First (Sempre tenta pegar fresco, fallback para cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de outras origens (API, Analytics, etc) para não cachear erros
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
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