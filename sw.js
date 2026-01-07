const CACHE_NAME = 'atomic-pwa-v2025.02.02-fix2'; // VERSÃO ATUALIZADA (Força a limpeza do cache antigo)

// Arquivos que devem ser cacheados imediatamente na instalação
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './chatbot.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/@phosphor-icons/web',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap'
];

// Instalação: Cacheia assets críticos
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW a assumir o controle imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpa caches antigos (Isso resolve o problema dos usuários recorrentes)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla todos os clientes imediatamente
});

// Fetch: Estratégia Inteligente
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Arquivos Core (HTML, JS, CSS, JSON de Dados) -> NETWORK FIRST (Rede Primeiro)
  // Garante que o usuário sempre veja a versão mais recente do site/preços
  if (
      url.origin === location.origin && 
      (url.pathname.endsWith('.html') || 
       url.pathname.endsWith('/') || 
       url.pathname.endsWith('.js') || 
       url.pathname.endsWith('.css') || 
       url.pathname.endsWith('.json'))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Se deu certo, atualiza o cache e retorna a versão nova
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Se falhar (offline), retorna o que tem no cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. Assets Estáticos Externos (Fontes, Libs, Imagens) -> CACHE FIRST (Cache Primeiro)
  // Melhora performance e economiza dados, pois mudam pouco
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Não cacheia respostas inválidas
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }
        // Cacheia novos assets dinamicamente
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});