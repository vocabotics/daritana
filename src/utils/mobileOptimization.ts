/**
 * Mobile Optimization Utilities
 * PWA enhancements, offline support, and mobile-specific optimizations
 */

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if app is running as PWA (installed)
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
}

/**
 * Get device orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (window.innerHeight > window.innerWidth) {
    return 'portrait';
  }
  return 'landscape';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device viewport size category
 */
export function getViewportCategory(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;

  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Optimize images for mobile
 */
export function optimizeImageUrl(url: string, width?: number): string {
  // If it's already optimized or external, return as is
  if (!url || url.startsWith('http') || url.includes('?')) {
    return url;
  }

  // Determine optimal width based on device
  const optimalWidth = width || (isMobileDevice() ? 640 : 1920);

  // Add image optimization parameters (works with many CDNs)
  return `${url}?w=${optimalWidth}&q=80&fm=webp`;
}

/**
 * Enable pull-to-refresh
 */
export function enablePullToRefresh(callback: () => void): () => void {
  let startY = 0;
  let currentY = 0;
  let pulling = false;

  const handleTouchStart = (e: TouchEvent) => {
    // Only activate if at top of page
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY;
      pulling = true;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling) return;

    currentY = e.touches[0].pageY;
    const pullDistance = currentY - startY;

    // If pulled down more than 80px, trigger refresh
    if (pullDistance > 80) {
      pulling = false;
      callback();
    }
  };

  const handleTouchEnd = () => {
    pulling = false;
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Request notification permission for mobile
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show local notification (works offline)
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      ...options,
    });
  }
}

/**
 * Optimize touch interactions with haptic feedback
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  // Check if device supports haptics
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50,
    };

    navigator.vibrate(patterns[type]);
  }
}

/**
 * Add to home screen prompt helper
 */
export class AddToHomeScreen {
  private deferredPrompt: any = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  canPrompt(): boolean {
    return this.deferredPrompt !== null;
  }

  async prompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    return result.outcome === 'accepted';
  }

  showInstructions(): string {
    if (isIOS()) {
      return 'Tap the Share button and select "Add to Home Screen"';
    } else if (isAndroid()) {
      return 'Tap the menu and select "Add to Home Screen"';
    }
    return 'Use your browser menu to add this app to your home screen';
  }
}

/**
 * Network status monitoring
 */
export class NetworkMonitor {
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.notify(true));
    window.addEventListener('offline', () => this.notify(false));
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    // Call immediately with current status
    callback(this.isOnline());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(online: boolean): void {
    this.listeners.forEach(callback => callback(online));
  }

  async estimateSpeed(): Promise<'slow-2g' | '2g' | '3g' | '4g' | 'unknown'> {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection && connection.effectiveType) {
      return connection.effectiveType;
    }

    return 'unknown';
  }

  shouldLoadHighQuality(): boolean {
    const connection = (navigator as any).connection;

    if (!connection) return true; // Assume good connection

    // Don't load high quality on 2G or save-data mode
    if (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      return false;
    }

    return true;
  }
}

/**
 * Battery status monitoring (for power-saving features)
 */
export class BatteryMonitor {
  private battery: any = null;

  async initialize(): Promise<void> {
    if ('getBattery' in navigator) {
      this.battery = await (navigator as any).getBattery();
    }
  }

  isLowBattery(): boolean {
    if (!this.battery) return false;
    return this.battery.level < 0.2; // Below 20%
  }

  isCharging(): boolean {
    if (!this.battery) return true; // Assume charging if unknown
    return this.battery.charging;
  }

  shouldEnergySave(): boolean {
    return this.isLowBattery() && !this.isCharging();
  }

  getLevel(): number {
    if (!this.battery) return 1; // Assume full if unknown
    return this.battery.level;
  }
}

/**
 * Prevent zoom on double-tap (for mobile apps)
 */
export function preventDoubleTapZoom(): void {
  let lastTouchEnd = 0;

  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

/**
 * Safe area insets helper (for devices with notches)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Service Worker registration and update handling
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available, prompt user to refresh
            if (confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Cache management for offline support
 */
export class CacheManager {
  private cacheName = 'daritana-v1';

  async cacheAssets(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open(this.cacheName);
    await cache.addAll(urls);
  }

  async getCached(url: string): Promise<Response | undefined> {
    if (!('caches' in window)) return undefined;

    return await caches.match(url);
  }

  async clearOldCaches(): Promise<void> {
    if (!('caches' in window)) return;

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name !== this.cacheName)
        .map(name => caches.delete(name))
    );
  }
}

// Export singleton instances
export const addToHomeScreen = new AddToHomeScreen();
export const networkMonitor = new NetworkMonitor();
export const batteryMonitor = new BatteryMonitor();
export const cacheManager = new CacheManager();

// Initialize battery monitor
batteryMonitor.initialize();
