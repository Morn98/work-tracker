/**
 * Request Cache and Deduplication Layer
 * Prevents duplicate in-flight requests and caches results temporarily
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, PendingRequest<unknown>>();
  private readonly DEFAULT_TTL = 5000; // 5 seconds default cache time

  /**
   * Wrap a function with caching and deduplication
   * @param key - Unique cache key for this request
   * @param fn - Function to execute if not cached
   * @param ttl - Time to live in milliseconds (0 = no caching, only deduplication)
   */
  async fetch<T>(key: string, fn: () => Promise<T>, ttl: number = this.DEFAULT_TTL): Promise<T> {
    // Check if we have a cached result that's still valid
    if (ttl > 0) {
      const cached = this.cache.get(key) as CacheEntry<T> | undefined;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // Check if there's already a pending request for this key
    const pending = this.pending.get(key) as PendingRequest<T> | undefined;
    if (pending) {
      return pending.promise;
    }

    // Create new request
    const promise = fn()
      .then((data) => {
        // Cache the result if TTL > 0
        if (ttl > 0) {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
          });
        }
        // Remove from pending
        this.pending.delete(key);
        return data;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pending.delete(key);
        throw error;
      });

    // Store pending request
    this.pending.set(key, { promise });

    return promise;
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pending.size,
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();
