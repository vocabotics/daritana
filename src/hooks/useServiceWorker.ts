import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Only register service worker in production
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      setRegistration(reg);

      // Check for updates every hour
      setInterval(() => {
        reg.update();
      }, 1000 * 60 * 60);

      // Handle updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            toast.info('New version available!', {
              action: {
                label: 'Update',
                onClick: () => updateServiceWorker()
              },
              duration: Infinity
            });
          }
        });
      });

      // Handle offline ready
      if (reg.active) {
        setOfflineReady(true);
      }

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      try {
        await registration.update();
        toast.success('Checked for updates');
      } catch (error) {
        toast.error('Failed to check for updates');
      }
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        toast.success('Cache cleared successfully');
      } catch (error) {
        toast.error('Failed to clear cache');
      }
    }
  };

  return {
    registration,
    updateAvailable,
    offlineReady,
    updateServiceWorker,
    checkForUpdates,
    clearCache
  };
}