import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, CACHE_TTL } from './cacheManager';

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipCache?: (req: NextRequest) => boolean;
  tags?: string[];
}

export function withCache(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const {
      ttl = CACHE_TTL.MEDIUM,
      keyGenerator = defaultKeyGenerator,
      skipCache = () => false,
      tags = []
    } = options;

    // Skip cache for non-GET requests or when skipCache returns true
    if (req.method !== 'GET' || skipCache(req)) {
      return handler(req, context);
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cached = await cacheManager.get<{
        data: any;
        status: number;
        headers: Record<string, string>;
        tags: string[];
        timestamp: number;
      }>(cacheKey);
      
      if (cached) {
        const response = new NextResponse(JSON.stringify(cached.data), {
          status: cached.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${ttl}`,
            ...cached.headers
          }
        });
        return response;
      }

      // Execute handler
      const response = await handler(req, context);
      const responseData = await response.json();

      // Cache successful responses
      if (response.status < 400) {
        const cacheData = {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          tags,
          timestamp: Date.now()
        };

        await cacheManager.set(cacheKey, cacheData, ttl);
      }

      // Return response with cache headers
      return new NextResponse(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${ttl}`,
          ...Object.fromEntries(response.headers.entries())
        }
      });

    } catch (error) {
      console.error('Cache middleware error:', error);
      return handler(req, context);
    }
  };
}

function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `api:${path}:${searchParams}`;
}

// Rate limiting with cache
export class RateLimiter {
  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100
  ) {}

  async checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const windowStart = Math.floor(Date.now() / this.windowMs) * this.windowMs;
    const windowKey = `${key}:${windowStart}`;

    try {
      const current = await cacheManager.increment(windowKey, Math.ceil(this.windowMs / 1000));
      const remaining = Math.max(0, this.maxRequests - current);
      const resetTime = windowStart + this.windowMs;

      return {
        allowed: current <= this.maxRequests,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      return { allowed: true, remaining: this.maxRequests, resetTime: Date.now() + this.windowMs };
    }
  }
}

// Session cache helpers
export class SessionCache {
  static async get(sessionId: string) {
    return cacheManager.get(`session:${sessionId}`);
  }

  static async set(sessionId: string, data: any, ttl: number = CACHE_TTL.LONG) {
    return cacheManager.set(`session:${sessionId}`, data, ttl);
  }

  static async delete(sessionId: string) {
    return cacheManager.delete(`session:${sessionId}`);
  }

  static async extend(sessionId: string, ttl: number = CACHE_TTL.LONG) {
    const data = await this.get(sessionId);
    if (data) {
      return this.set(sessionId, data, ttl);
    }
    return false;
  }
}

// Cache invalidation patterns
export class CacheInvalidator {
  static async invalidateUser(userId: string) {
    const patterns = [
      `user:${userId}:*`,
      `books:user:${userId}`,
      `transactions:${userId}`,
      `session:*:${userId}`,
    ];

    await Promise.all(
      patterns.map(pattern => cacheManager.deletePattern(pattern))
    );
  }

  static async invalidateBook(bookId: string) {
    const patterns = [
      `book:${bookId}`,
      `books:search:*`,
      `books:popular`,
      `books:recent`,
      `recommendations:*`,
    ];

    await Promise.all(
      patterns.map(pattern => cacheManager.deletePattern(pattern))
    );
  }

  static async invalidateSearch() {
    await cacheManager.deletePattern('books:search:*');
  }

  static async invalidateTransaction(transactionId: string) {
    const patterns = [
      `transaction:${transactionId}`,
      `escrow:${transactionId}`,
      `transactions:*`, // Invalidate all user transaction lists
    ];

    await Promise.all(
      patterns.map(pattern => cacheManager.deletePattern(pattern))
    );
  }
}

// Preloading strategies
export class CachePreloader {
  static async preloadPopularBooks() {
    try {
      // This would typically fetch from your database
      const books = await fetch('/api/books?sort=popularity&limit=50').then(r => r.json());
      await cacheManager.set('books:popular', books, CACHE_TTL.VERY_LONG);
    } catch (error) {
      console.error('Failed to preload popular books:', error);
    }
  }

  static async preloadUserRecommendations(userId: string) {
    try {
      const recommendations = await fetch(`/api/recommendations/${userId}`).then(r => r.json());
      await cacheManager.set(`recommendations:${userId}`, recommendations, CACHE_TTL.VERY_LONG);
    } catch (error) {
      console.error('Failed to preload recommendations:', error);
    }
  }

  static async preloadBookCategories() {
    try {
      const categories = await fetch('/api/books/categories').then(r => r.json());
      await cacheManager.set('books:categories', categories, CACHE_TTL.VERY_LONG);
    } catch (error) {
      console.error('Failed to preload categories:', error);
    }
  }
}

// Cache warming scheduler (call this periodically)
export async function warmCache() {
  console.log('Starting cache warming...');
  
  try {
    await Promise.all([
      CachePreloader.preloadPopularBooks(),
      CachePreloader.preloadBookCategories(),
    ]);
    
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}