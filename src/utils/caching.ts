// Comprehensive caching system for Daritana
import { LRUCache } from 'lru-cache';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  tags?: string[]; // Tags for cache invalidation
  compress?: boolean; // Compress large objects
  persist?: boolean; // Persist to localStorage
}

interface QueryCacheOptions extends CacheOptions {
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
  retry?: boolean; // Retry failed requests
  retryDelay?: number; // Delay between retries
}

class CacheManager {
  private static instance: CacheManager;
  private memoryCache: LRUCache<string, CacheEntry<any>>;
  private persistentCache: Map<string, CacheEntry<any>> = new Map();
  private tagMap: Map<string, Set<string>> = new Map();
  private compressionEnabled: boolean = true;

  private constructor() {
    this.memoryCache = new LRUCache<string, CacheEntry<any>>({
      max: 500, // Maximum 500 entries
      ttl: 1000 * 60 * 15, // Default 15 minutes TTL
      dispose: (value, key) => {
        this.cleanupTags(key);
      },
    });

    // Load persistent cache from localStorage
    this.loadPersistentCache();
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanupExpired(), 60000); // Every minute
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private loadPersistentCache() {
    try {
      const stored = localStorage.getItem('daritana_persistent_cache');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, entry]) => {
          this.persistentCache.set(key, entry as CacheEntry<any>);
        });
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  private savePersistentCache() {
    try {
      const data = Object.fromEntries(this.persistentCache);
      localStorage.setItem('daritana_persistent_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save persistent cache:', error);
      // Clear some entries if storage is full
      this.clearOldest(this.persistentCache, 50);
    }
  }

  private clearOldest(cache: Map<string, CacheEntry<any>>, keepCount: number) {
    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = entries.slice(0, -keepCount);
    toRemove.forEach(([key]) => cache.delete(key));
  }

  private compress(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Compression failed:', error);
      return JSON.stringify({ error: 'Compression failed' });
    }
  }

  private decompress(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return null;
    }
  }

  private addToTagMap(key: string, tags: string[]) {
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    });
  }

  private cleanupTags(key: string) {
    this.tagMap.forEach(keys => keys.delete(key));
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupExpired() {
    // Cleanup memory cache expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup persistent cache expired entries
    for (const [key, entry] of this.persistentCache.entries()) {
      if (this.isExpired(entry)) {
        this.persistentCache.delete(key);
      }
    }
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const {
      ttl = 15 * 60 * 1000, // 15 minutes default
      tags = [],
      compress = this.compressionEnabled,
      persist = false,
    } = options;

    const processedValue = compress && typeof value === 'object' ? this.compress(value) : value;

    const entry: CacheEntry<T> = {
      value: processedValue,
      timestamp: Date.now(),
      ttl,
      tags,
    };

    // Store in appropriate cache
    if (persist) {
      this.persistentCache.set(key, entry);
      this.savePersistentCache();
    } else {
      this.memoryCache.set(key, entry);
    }

    // Add to tag map
    if (tags.length > 0) {
      this.addToTagMap(key, tags);
    }
  }

  get<T>(key: string): T | null {
    // Check memory cache first
    let entry = this.memoryCache.get(key);
    
    // Then check persistent cache
    if (!entry) {
      entry = this.persistentCache.get(key);
    }

    if (!entry) return null;

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Decompress if needed
    if (typeof entry.value === 'string' && entry.value.startsWith('{')) {
      try {
        return this.decompress(entry.value);
      } catch {
        return entry.value;
      }
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.memoryCache.has(key) || this.persistentCache.has(key);
  }

  delete(key: string): boolean {
    this.cleanupTags(key);
    const memoryDeleted = this.memoryCache.delete(key);
    const persistentDeleted = this.persistentCache.delete(key);
    
    if (persistentDeleted) {
      this.savePersistentCache();
    }
    
    return memoryDeleted || persistentDeleted;
  }

  clear(): void {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.tagMap.clear();
    localStorage.removeItem('daritana_persistent_cache');
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagMap.get(tag);
    if (!keys) return 0;

    let deletedCount = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    this.tagMap.delete(tag);
    return deletedCount;
  }

  invalidateByTags(tags: string[]): number {
    return tags.reduce((total, tag) => total + this.invalidateByTag(tag), 0);
  }

  getStats() {
    const memorySize = this.memoryCache.size;
    const persistentSize = this.persistentCache.size;
    const totalTags = this.tagMap.size;

    return {
      memoryCache: {
        size: memorySize,
        maxSize: this.memoryCache.max,
        hitRate: this.memoryCache.calculatedSize / (this.memoryCache.calculatedSize + memorySize) || 0,
      },
      persistentCache: {
        size: persistentSize,
        estimatedSizeKB: JSON.stringify(Object.fromEntries(this.persistentCache)).length / 1024,
      },
      totalTags,
      totalEntries: memorySize + persistentSize,
    };
  }
}

export const cacheManager = CacheManager.getInstance();

// React Hook for caching API calls with SWR-like behavior
export const useQueryCache = <T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: QueryCacheOptions = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const isMountedRef = React.useRef(true);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout>();

  const {
    staleWhileRevalidate = true,
    retry = true,
    retryDelay = 1000,
    ttl = 15 * 60 * 1000,
    tags = [],
  } = options;

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = React.useCallback(async (showLoading = true) => {
    if (!key) return;

    try {
      if (showLoading) setIsLoading(true);
      setIsValidating(true);
      setError(null);

      const result = await fetcher();
      
      if (isMountedRef.current) {
        setData(result);
        cacheManager.set(key, result, { ttl, tags });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Retry logic
        if (retry) {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              fetchData(false);
            }
          }, retryDelay);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [key, fetcher, ttl, tags, retry, retryDelay]);

  React.useEffect(() => {
    if (!key) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cachedData = cacheManager.get<T>(key);
    
    if (cachedData) {
      setData(cachedData);
      
      // If stale-while-revalidate is enabled, fetch in background
      if (staleWhileRevalidate) {
        fetchData(false);
      }
    } else {
      // No cached data, fetch immediately
      fetchData(true);
    }
  }, [key, fetchData, staleWhileRevalidate]);

  const mutate = React.useCallback((newData?: T, revalidate = true) => {
    if (key) {
      if (newData !== undefined) {
        setData(newData);
        cacheManager.set(key, newData, { ttl, tags });
      }
      
      if (revalidate) {
        fetchData(false);
      }
    }
  }, [key, fetchData, ttl, tags]);

  const invalidate = React.useCallback(() => {
    if (key) {
      cacheManager.delete(key);
      fetchData(true);
    }
  }, [key, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    invalidate,
    revalidate: () => fetchData(false),
  };
};

// Component cache for expensive renders
export const useComponentCache = <T>(
  key: string,
  computeValue: () => T,
  dependencies: React.DependencyList
): T => {
  return React.useMemo(() => {
    const cacheKey = `component_${key}`;
    const cached = cacheManager.get<T>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = computeValue();
    cacheManager.set(cacheKey, value, { ttl: 5 * 60 * 1000 }); // 5 minutes
    return value;
  }, dependencies);
};

// Image caching utility
export const useImageCache = () => {
  const cacheImage = React.useCallback((url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cacheKey = `image_${url}`;
      const cached = cacheManager.get<string>(cacheKey);
      
      if (cached) {
        resolve(cached);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL();
          cacheManager.set(cacheKey, dataUrl, { 
            ttl: 60 * 60 * 1000, // 1 hour
            persist: true,
            tags: ['images']
          });
          resolve(dataUrl);
        } else {
          resolve(url);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  const clearImageCache = React.useCallback(() => {
    cacheManager.invalidateByTag('images');
  }, []);

  return { cacheImage, clearImageCache };
};

// Local storage cache with compression
export const useLocalStorageCache = <T>(
  key: string,
  defaultValue: T,
  options: { compress?: boolean; ttl?: number } = {}
) => {
  const { compress = true, ttl = 24 * 60 * 60 * 1000 } = options; // 24 hours default

  const [value, setValue] = React.useState<T>(() => {
    try {
      const cached = cacheManager.get<T>(`ls_${key}`);
      return cached !== null ? cached : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setCachedValue = React.useCallback((newValue: T | ((prev: T) => T)) => {
    const valueToStore = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue;
    
    setValue(valueToStore);
    cacheManager.set(`ls_${key}`, valueToStore, { 
      ttl, 
      persist: true, 
      compress,
      tags: ['localStorage']
    });
  }, [key, value, ttl, compress]);

  return [value, setCachedValue] as const;
};

// API response caching with automatic invalidation
export const createApiCache = (baseTag: string) => {
  return {
    set: <T>(endpoint: string, data: T, ttl = 10 * 60 * 1000) => {
      cacheManager.set(`api_${endpoint}`, data, { 
        ttl, 
        tags: [baseTag, `${baseTag}_${endpoint}`] 
      });
    },
    
    get: <T>(endpoint: string): T | null => {
      return cacheManager.get<T>(`api_${endpoint}`);
    },
    
    invalidate: (endpoint?: string) => {
      if (endpoint) {
        cacheManager.invalidateByTag(`${baseTag}_${endpoint}`);
      } else {
        cacheManager.invalidateByTag(baseTag);
      }
    },
    
    invalidateAll: () => {
      cacheManager.invalidateByTag(baseTag);
    }
  };
};

// Pre-defined cache instances for different data types
export const projectsCache = createApiCache('projects');
export const tasksCache = createApiCache('tasks');
export const usersCache = createApiCache('users');
export const filesCache = createApiCache('files');

// Development utilities
if (import.meta.env.DEV) {
  (window as any).cacheManager = {
    getStats: () => cacheManager.getStats(),
    clear: () => cacheManager.clear(),
    invalidateByTag: (tag: string) => cacheManager.invalidateByTag(tag),
  };
}