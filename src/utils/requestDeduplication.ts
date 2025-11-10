/**
 * Request deduplication utility
 * Prevents duplicate API calls when multiple components request the same data
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000;

  async deduplicate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: { cacheTTL?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { cacheTTL = this.CACHE_TTL, forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }

    const pending = this.pending.get(key);
    if (pending) {
      return pending.promise;
    }

    const promise = fetchFn()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pending.delete(key);
        return data;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, { promise, timestamp: Date.now() });
    return promise;
  }

  invalidate(key: string) {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) this.cache.delete(key);
    }
    for (const key of this.pending.keys()) {
      if (pattern.test(key)) this.pending.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }

  cleanup(maxAge: number = 60000) {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) this.cache.delete(key);
    }
    for (const [key, value] of this.pending.entries()) {
      if (now - value.timestamp > maxAge) this.pending.delete(key);
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();

export function getCacheKey(url: string, params?: Record<string, any>): string {
  if (!params) return url;
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => key + '=' + JSON.stringify(params[key]))
    .join('&');
  return url + '?' + sortedParams;
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 60000);
}
