import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
});

// In-memory cache for when Redis is unavailable
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false
});

// Cache configuration
export const CACHE_KEYS = {
  BOOK_DETAILS: (id: string) => `book:${id}`,
  BOOK_SEARCH: (query: string, filters: string) => `search:${query}:${filters}`,
  USER_SESSION: (id: string) => `session:${id}`,
  USER_BOOKS: (userId: string) => `user_books:${userId}`,
  BOOK_RECOMMENDATIONS: (userId: string) => `recommendations:${userId}`,
  TRANSACTION_HISTORY: (userId: string) => `transactions:${userId}`,
  POPULAR_BOOKS: () => 'popular_books',
  RECENT_BOOKS: () => 'recent_books',
  BOOK_CATEGORIES: () => 'book_categories',
  ESCROW_STATUS: (transactionId: string) => `escrow:${transactionId}`,
  FRAUD_SCORE: (userId: string) => `fraud:${userId}`,
  RATE_LIMIT: (userId: string, endpoint: string) => `rate_limit:${userId}:${endpoint}`,
} as const;

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

export class CacheManager {
  private fallbackToMemory: boolean = false;

  constructor() {
    this.setupRedisHandlers();
  }

  private setupRedisHandlers(): void {
    redis.on('connect', () => {
      console.log('Redis connected successfully');
      this.fallbackToMemory = false;
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.fallbackToMemory = true;
    });

    redis.on('close', () => {
      console.warn('Redis connection closed, falling back to memory cache');
      this.fallbackToMemory = true;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.fallbackToMemory) {
        const value = memoryCache.get<T>(key);
        return value || null;
      }

      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      // Fallback to memory cache
      const value = memoryCache.get<T>(key);
      return value || null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      if (this.fallbackToMemory) {
        memoryCache.set(key, value, ttl);
        return true;
      }

      const result = await redis.setex(key, ttl, JSON.stringify(value));
      return result === 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      // Fallback to memory cache
      memoryCache.set(key, value, ttl);
      return true;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (this.fallbackToMemory) {
        return memoryCache.del(key) > 0;
      }

      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return memoryCache.del(key) > 0;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      if (this.fallbackToMemory) {
        const keys = memoryCache.keys().filter(key => key.includes(pattern));
        memoryCache.del(keys);
        return keys.length;
      }

      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.fallbackToMemory) {
        return memoryCache.has(key);
      }

      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return memoryCache.has(key);
    }
  }

  async increment(key: string, ttl: number = CACHE_TTL.SHORT): Promise<number> {
    try {
      if (this.fallbackToMemory) {
        const current = memoryCache.get<number>(key) || 0;
        const newValue = current + 1;
        memoryCache.set(key, newValue, ttl);
        return newValue;
      }

      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttl);
      const results = await pipeline.exec();
      
      return results?.[0]?.[1] as number || 1;
    } catch (error) {
      console.error('Cache increment error:', error);
      const current = memoryCache.get<number>(key) || 0;
      const newValue = current + 1;
      memoryCache.set(key, newValue, ttl);
      return newValue;
    }
  }

  async setWithExpiry(key: string, value: any, seconds: number): Promise<boolean> {
    return this.set(key, value, seconds);
  }

  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const fresh = await fetchFunction();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return await fetchFunction();
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (this.fallbackToMemory) {
        return keys.map(key => memoryCache.get<T>(key) || null);
      }

      const values = await redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(key => memoryCache.get<T>(key) || null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      if (this.fallbackToMemory) {
        keyValuePairs.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
          memoryCache.set(key, value, ttl);
        });
        return true;
      }

      const pipeline = redis.pipeline();
      keyValuePairs.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      keyValuePairs.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
        memoryCache.set(key, value, ttl);
      });
      return true;
    }
  }

  // Cache invalidation strategies
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      CACHE_KEYS.USER_BOOKS(userId),
      CACHE_KEYS.USER_SESSION(userId),
      CACHE_KEYS.BOOK_RECOMMENDATIONS(userId),
      CACHE_KEYS.TRANSACTION_HISTORY(userId),
      CACHE_KEYS.FRAUD_SCORE(userId),
    ];

    await Promise.all(patterns.map(pattern => this.delete(pattern)));
  }

  async invalidateBookCache(bookId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_KEYS.BOOK_DETAILS(bookId)),
      this.deletePattern('search:*'), // Invalidate all search results
      this.delete(CACHE_KEYS.POPULAR_BOOKS()),
      this.delete(CACHE_KEYS.RECENT_BOOKS()),
    ]);
  }

  async invalidateSearchCache(): Promise<void> {
    await this.deletePattern('search:*');
  }

  // Health check
  async healthCheck(): Promise<{ redis: boolean; memory: boolean }> {
    try {
      if (this.fallbackToMemory) {
        return { redis: false, memory: true };
      }

      await redis.ping();
      return { redis: true, memory: true };
    } catch (error) {
      return { redis: false, memory: true };
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      memory: {
        keys: memoryCache.keys().length,
        stats: memoryCache.getStats(),
      },
      fallbackMode: this.fallbackToMemory,
    };
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    try {
      await redis.quit();
      memoryCache.flushAll();
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Utility functions for specific cache operations
export const BookCache = {
  async getDetails(bookId: string) {
    return cacheManager.get(CACHE_KEYS.BOOK_DETAILS(bookId));
  },

  async setDetails(bookId: string, book: any) {
    return cacheManager.set(CACHE_KEYS.BOOK_DETAILS(bookId), book, CACHE_TTL.LONG);
  },

  async getSearchResults(query: string, filters: any) {
    const filterKey = JSON.stringify(filters);
    return cacheManager.get(CACHE_KEYS.BOOK_SEARCH(query, filterKey));
  },

  async setSearchResults(query: string, filters: any, results: any) {
    const filterKey = JSON.stringify(filters);
    return cacheManager.set(
      CACHE_KEYS.BOOK_SEARCH(query, filterKey), 
      results, 
      CACHE_TTL.MEDIUM
    );
  },

  async getPopular() {
    return cacheManager.get(CACHE_KEYS.POPULAR_BOOKS());
  },

  async setPopular(books: any[]) {
    return cacheManager.set(CACHE_KEYS.POPULAR_BOOKS(), books, CACHE_TTL.VERY_LONG);
  },
};

export const UserCache = {
  async getSession(userId: string) {
    return cacheManager.get(CACHE_KEYS.USER_SESSION(userId));
  },

  async setSession(userId: string, session: any) {
    return cacheManager.set(CACHE_KEYS.USER_SESSION(userId), session, CACHE_TTL.LONG);
  },

  async getBooks(userId: string) {
    return cacheManager.get(CACHE_KEYS.USER_BOOKS(userId));
  },

  async setBooks(userId: string, books: any[]) {
    return cacheManager.set(CACHE_KEYS.USER_BOOKS(userId), books, CACHE_TTL.MEDIUM);
  },

  async getRecommendations(userId: string) {
    return cacheManager.get(CACHE_KEYS.BOOK_RECOMMENDATIONS(userId));
  },

  async setRecommendations(userId: string, recommendations: any[]) {
    return cacheManager.set(
      CACHE_KEYS.BOOK_RECOMMENDATIONS(userId), 
      recommendations, 
      CACHE_TTL.VERY_LONG
    );
  },
};