// Disabled Service Worker - Development Mode
// This file intentionally left empty to prevent service worker caching issues during development
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async () => {
  // Clear all caches
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  
  // Take control of all clients
  await self.clients.claim();
  
  // Don't unregister - this causes reload loops
  // await self.registration.unregister();
  
  console.log('[Service Worker] Disabled and cleared all caches');
});