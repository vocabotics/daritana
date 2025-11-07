// DISABLED SERVICE WORKER FOR DEVELOPMENT
// This service worker bypasses all caching to prevent development issues

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing disabled service worker');
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  console.log('[ServiceWorker] Activating and clearing all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[ServiceWorker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Bypass service worker for all fetch requests
self.addEventListener('fetch', (event) => {
  // Do nothing - let the browser handle the request normally
  return;
});