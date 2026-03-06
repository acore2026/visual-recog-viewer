const CACHE_NAME = 'visual-recog-viewer-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './src/main.ts',
  './src/style.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 网络优先的缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // API 和 WebSocket 请求不缓存
  if (request.url.includes('/api/') || request.url.includes('/ws/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 缓存成功的响应
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时使用缓存
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          // 如果缓存也没有，返回离线页面
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Network error', { status: 408 });
        });
      })
  );
});

// 处理后台同步（用于断线重连）
self.addEventListener('sync', (event) => {
  if (event.tag === 'reconnect-stream') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'RECONNECT' });
        });
      })
    );
  }
});
