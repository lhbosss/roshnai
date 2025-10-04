import { NextRequest, NextResponse } from 'next/server';
import { performanceCollector } from '@/lib/monitoring/performanceCollector';

// Performance monitoring middleware
export function performanceMonitoringMiddleware() {
  return async function middleware(request: NextRequest) {
    const startTime = Date.now();
    const url = request.url;
    const method = request.method;
    
    // Get request size
    const requestSize = parseInt(request.headers.get('content-length') || '0');
    
    // Record API request start
    performanceCollector.recordMetric('api-request-start', 1, {
      url,
      method,
      requestSize,
      userAgent: request.headers.get('user-agent'),
      timestamp: startTime
    });
    
    const response = await NextResponse.next();
    
    // Calculate response time
    const duration = Date.now() - startTime;
    
    // Get response size (approximate)
    const responseSize = response.headers.get('content-length') ? 
      parseInt(response.headers.get('content-length')!) : 
      0;
    
    // Record API performance metrics
    performanceCollector.recordApiCall(
      url,
      duration,
      response.status,
      responseSize
    );
    
    // Record specific performance metrics based on response
    if (response.status >= 500) {
      performanceCollector.recordMetric('server-error-rate', 1, {
        url,
        method,
        status: response.status
      });
    } else if (response.status >= 400) {
      performanceCollector.recordMetric('client-error-rate', 1, {
        url,
        method,
        status: response.status
      });
    }
    
    // Record slow requests (> 1 second)
    if (duration > 1000) {
      performanceCollector.recordMetric('slow-request', duration, {
        url,
        method,
        status: response.status
      });
    }
    
    // Add performance headers to response
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Timestamp', startTime.toString());
    
    return response;
  };
}

// Database performance monitoring
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryTimes: Map<string, number> = new Map();
  
  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }
  
  startQuery(queryId: string, operation: string, collection?: string): void {
    this.queryTimes.set(queryId, Date.now());
    
    performanceCollector.recordMetric('db-query-start', 1, {
      queryId,
      operation,
      collection
    });
  }
  
  endQuery(queryId: string, operation: string, collection?: string, error?: Error): void {
    const startTime = this.queryTimes.get(queryId);
    if (!startTime) return;
    
    const duration = Date.now() - startTime;
    this.queryTimes.delete(queryId);
    
    performanceCollector.recordDbQuery(operation, duration, collection);
    
    if (error) {
      performanceCollector.recordMetric('db-query-error', 1, {
        queryId,
        operation,
        collection,
        error: error.message
      });
    }
    
    // Record slow queries (> 100ms)
    if (duration > 100) {
      performanceCollector.recordMetric('slow-db-query', duration, {
        queryId,
        operation,
        collection
      });
    }
  }
  
  recordConnectionPool(stats: {
    activeConnections: number;
    poolSize: number;
    waitingRequests: number;
    totalCapacity: number;
  }): void {
    performanceCollector.recordMetric('db-pool-active', stats.activeConnections);
    performanceCollector.recordMetric('db-pool-size', stats.poolSize);
    performanceCollector.recordMetric('db-pool-waiting', stats.waitingRequests);
    performanceCollector.recordMetric('db-pool-utilization', 
      stats.activeConnections / stats.totalCapacity * 100);
  }
}

// Cache performance monitoring
export class CacheMonitor {
  private static instance: CacheMonitor;
  private operationTimes: Map<string, number> = new Map();
  
  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }
  
  recordCacheHit(key: string, valueSize?: number): void {
    performanceCollector.recordCacheOperation('hit', key);
    
    if (valueSize) {
      performanceCollector.recordMetric('cache-hit-size', valueSize, { key });
    }
  }
  
  recordCacheMiss(key: string): void {
    performanceCollector.recordCacheOperation('miss', key);
  }
  
  recordCacheSet(key: string, valueSize: number, ttl?: number): void {
    performanceCollector.recordCacheOperation('set', key);
    performanceCollector.recordMetric('cache-set-size', valueSize, { key, ttl });
  }
  
  recordCacheDelete(key: string): void {
    performanceCollector.recordCacheOperation('delete', key);
  }
  
  recordCacheStats(stats: {
    hitRate: number;
    missRate: number;
    memoryUsage: number;
    keyCount: number;
  }): void {
    performanceCollector.recordMetric('cache-hit-rate', stats.hitRate * 100);
    performanceCollector.recordMetric('cache-miss-rate', stats.missRate * 100);
    performanceCollector.recordMetric('cache-memory-usage', stats.memoryUsage);
    performanceCollector.recordMetric('cache-key-count', stats.keyCount);
  }
}

// Real-time performance monitoring
export class RealtimeMonitor {
  private static instance: RealtimeMonitor;
  
  static getInstance(): RealtimeMonitor {
    if (!RealtimeMonitor.instance) {
      RealtimeMonitor.instance = new RealtimeMonitor();
    }
    return RealtimeMonitor.instance;
  }
  
  recordWebSocketConnection(event: 'connect' | 'disconnect', duration?: number): void {
    performanceCollector.recordMetric(`websocket-${event}`, duration || 1);
  }
  
  recordMessageLatency(messageType: string, latency: number, messageSize: number): void {
    performanceCollector.recordRealtimeOperation(`message-${messageType}`, latency, messageSize);
  }
  
  recordBatchOperation(batchSize: number, processingTime: number): void {
    performanceCollector.recordMetric('batch-size', batchSize);
    performanceCollector.recordMetric('batch-processing-time', processingTime);
  }
  
  recordConnectionPool(stats: {
    activeConnections: number;
    poolSize: number;
    waitingRequests: number;
  }): void {
    performanceCollector.recordMetric('websocket-pool-active', stats.activeConnections);
    performanceCollector.recordMetric('websocket-pool-size', stats.poolSize);
    performanceCollector.recordMetric('websocket-pool-waiting', stats.waitingRequests);
  }
}

// Application performance monitoring
export class ApplicationMonitor {
  private static instance: ApplicationMonitor;
  
  static getInstance(): ApplicationMonitor {
    if (!ApplicationMonitor.instance) {
      ApplicationMonitor.instance = new ApplicationMonitor();
    }
    return ApplicationMonitor.instance;
  }
  
  recordUserAction(action: string, duration?: number, metadata?: any): void {
    performanceCollector.recordMetric('user-action', duration || 1, {
      action,
      ...metadata
    });
  }
  
  recordPageTransition(from: string, to: string, duration: number): void {
    performanceCollector.recordMetric('page-transition', duration, {
      from,
      to
    });
  }
  
  recordComponentRender(componentName: string, duration: number, props?: any): void {
    performanceCollector.recordMetric('component-render', duration, {
      componentName,
      propCount: props ? Object.keys(props).length : 0
    });
  }
  
  recordBundleSize(bundleName: string, size: number): void {
    performanceCollector.recordMetric('bundle-size', size, { bundleName });
  }
  
  recordMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      
      performanceCollector.recordMetric('memory-used', memory.usedJSHeapSize);
      performanceCollector.recordMetric('memory-total', memory.totalJSHeapSize);
      performanceCollector.recordMetric('memory-limit', memory.jsHeapSizeLimit);
    }
  }
}

// Global monitor instances
export const dbMonitor = DatabaseMonitor.getInstance();
export const cacheMonitor = CacheMonitor.getInstance();
export const realtimeMonitor = RealtimeMonitor.getInstance();
export const appMonitor = ApplicationMonitor.getInstance();

// Performance tracking decorator for functions
export function trackPerformance(metricName: string, metadata?: any) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        performanceCollector.recordMetric(metricName, duration, {
          ...metadata,
          method: propertyName,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        performanceCollector.recordMetric(metricName, duration, {
          ...metadata,
          method: propertyName,
          success: false,
          error: (error as Error).message
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Performance measurement utility
export function measurePerformance<T>(
  operation: () => Promise<T> | T,
  metricName: string,
  metadata?: any
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      performanceCollector.recordMetric(metricName, duration, {
        ...metadata,
        success: true
      });
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      performanceCollector.recordMetric(metricName, duration, {
        ...metadata,
        success: false,
        error: (error as Error).message
      });
      
      reject(error);
    }
  });
}