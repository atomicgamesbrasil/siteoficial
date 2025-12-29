const CACHE_NAME = 'atomic-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './chatbot.js',
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/@phosphor-icons/web',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap'
];

// Instalação: Cacheia assets críticos imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estratégia Híbrida
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Dados Dinâmicos (JSONs do GitHub, API do Chat) -> Network First
  // Tenta pegar da rede. Se falhar, tenta cache (se houver), ou falha.
  if (url.pathname.endsWith('.json') || url.href.includes('/chat')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Se offline, tenta retornar algo do cache se existir (opcional)
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. Assets Estáticos (Imagens, CSS, JS) -> Cache First
  // Tenta cache. Se não achar, vai pra rede e cacheia pro futuro.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Não cacheia respostas inválidas ou de plugins externos estranhos
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }
        // Clona a resposta para salvar no cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});