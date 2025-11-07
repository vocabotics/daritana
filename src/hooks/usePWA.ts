import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [pwaStatus, setPWAStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
  });

  // Check if app is installed
  const checkIfInstalled = useCallback(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if installed on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSInstalled = (window.navigator as any).standalone === true;
    
    return isStandalone || isIOSInstalled;
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      setPWAStatus(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: promptEvent,
      }));
      
      // Show install suggestion after 30 seconds
      setTimeout(() => {
        if (!checkIfInstalled()) {
          toast.info('Install Daritana App', {
            description: 'Add to your home screen for quick access',
            duration: 10000,
            action: {
              label: 'Install',
              onClick: () => installApp(),
            },
          });
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setPWAStatus(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
      
      toast.success('App installed successfully!', {
        description: 'You can now access Daritana from your home screen',
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setPWAStatus(prev => ({ ...prev, isOffline: false }));
      toast.success('Back online', {
        description: 'Connection restored',
      });
    };

    const handleOffline = () => {
      setPWAStatus(prev => ({ ...prev, isOffline: true }));
      toast.warning('You are offline', {
        description: 'Some features may be limited',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPWAStatus(prev => ({ ...prev, isUpdateAvailable: true }));
                  
                  toast.info('Update available', {
                    description: 'A new version of the app is available',
                    duration: 0,
                    action: {
                      label: 'Update',
                      onClick: () => updateApp(),
                    },
                  });
                }
              });
            }
          });
        } catch (error) {
          console.error('Service worker error:', error);
        }
      };
      
      checkForUpdates();
    }
  }, []);

  // Install app
  const installApp = async () => {
    if (!pwaStatus.installPrompt) return;
    
    try {
      await pwaStatus.installPrompt.prompt();
      const { outcome } = await pwaStatus.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
        toast.info('You can install the app later from the browser menu');
      }
      
      setPWAStatus(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false,
      }));
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Installation failed');
    }
  };

  // Update app
  const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('Notifications enabled', {
          description: 'You will receive updates about your projects',
        });
        return true;
      } else if (permission === 'denied') {
        toast.error('Notifications blocked', {
          description: 'Enable notifications in your browser settings',
        });
        return false;
      }
    }
    return false;
  };

  // Share functionality
  const shareApp = async (data?: { title?: string; text?: string; url?: string }) => {
    const shareData = {
      title: data?.title || 'Daritana Architect Management',
      text: data?.text || 'Check out this professional architecture management platform',
      url: data?.url || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard');
        return true;
      } catch (error) {
        console.error('Copy failed:', error);
        return false;
      }
    }
  };

  // Vibration API
  const vibrate = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Battery API
  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
        };
      } catch (error) {
        console.error('Battery API error:', error);
      }
    }
    return null;
  };

  // Wake Lock API (keep screen on)
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        console.error('Wake Lock error:', error);
      }
    }
    return null;
  };

  return {
    ...pwaStatus,
    installApp,
    updateApp,
    requestNotificationPermission,
    shareApp,
    vibrate,
    getBatteryInfo,
    requestWakeLock,
    isStandalone: checkIfInstalled(),
  };
};

// Hook for responsive design
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [device, setDevice] = useState({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    isLandscape: window.innerWidth > window.innerHeight,
    isTouch: 'ontouchstart' in window,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });
      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isLandscape: width > height,
        isTouch: 'ontouchstart' in window,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    ...dimensions,
    ...device,
    breakpoint: device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop',
  };
};