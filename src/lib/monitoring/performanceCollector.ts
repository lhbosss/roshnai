import { EventEmitter } from 'events';

// Performance metrics collector
export class PerformanceCollector extends EventEmitter {
  private metrics: Map<string, Array<{
    value: number;
    timestamp: number;
    metadata?: any;
  }>> = new Map();
  
  private config = {
    maxMetricsPerType: 1000,
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
    samplingRate: 1.0, // 100% by default
    bufferSize: 100,
    flushInterval: 5000 // 5 seconds
  };
  
  private buffer: Array<{
    type: string;
    value: number;
    timestamp: number;
    metadata?: any;
  }> = [];
  
  private flushTimer: NodeJS.Timeout | null = null;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(options: Partial<typeof PerformanceCollector.prototype.config> = {}) {
    super();
    this.config = { ...this.config, ...options };
    this.startPerformanceObservers();
    this.startFlushTimer();
  }

  /**
   * Record a custom metric
   */
  recordMetric(type: string, value: number, metadata?: any): void {
    if (Math.random() > this.config.samplingRate) return;
    
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      metadata
    };
    
    this.buffer.push(metric);
    
    if (this.buffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
    
    this.emit('metric', metric);
  }

  /**
   * Start performance observers for web vitals
   */
  private startPerformanceObservers(): void {
    if (typeof window === 'undefined') return;
    
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
      
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any;
          this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime, {
            eventType: fidEntry.name
          });
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
      
      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        this.recordMetric('cls', clsValue);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
      
      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          
          this.recordMetric('ttfb', navEntry.responseStart - navEntry.fetchStart);
          this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          this.recordMetric('load-complete', navEntry.loadEventEnd - navEntry.fetchStart);
        });
      });
      
      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }
  }

  /**
   * Start periodic buffer flushing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval);
  }

  /**
   * Flush buffered metrics to storage
   */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;
    
    const metricsToFlush = [...this.buffer];
    this.buffer = [];
    
    metricsToFlush.forEach(metric => {
      if (!this.metrics.has(metric.type)) {
        this.metrics.set(metric.type, []);
      }
      
      const typeMetrics = this.metrics.get(metric.type)!;
      typeMetrics.push({
        value: metric.value,
        timestamp: metric.timestamp,
        metadata: metric.metadata
      });
      
      // Maintain max metrics per type
      if (typeMetrics.length > this.config.maxMetricsPerType) {
        typeMetrics.splice(0, typeMetrics.length - this.config.maxMetricsPerType);
      }
    });
    
    this.emit('flush', metricsToFlush);
    this.cleanup();
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    for (const [type, metrics] of this.metrics) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(type, filteredMetrics);
    }
  }

  /**
   * Get metrics for a specific type
   */
  getMetrics(type: string, since?: number): Array<{
    value: number;
    timestamp: number;
    metadata?: any;
  }> {
    const metrics = this.metrics.get(type) || [];
    
    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    
    return [...metrics];
  }

  /**
   * Get aggregated statistics for a metric type
   */
  getStats(type: string, since?: number): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(type, since);
    
    if (metrics.length === 0) return null;
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.getPercentile(values, 50),
      p90: this.getPercentile(values, 90),
      p95: this.getPercentile(values, 95),
      p99: this.getPercentile(values, 99)
    };
  }

  /**
   * Calculate percentile
   */
  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data: any = {};
    
    for (const [type, metrics] of this.metrics) {
      data[type] = metrics;
    }
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV format
    let csv = 'type,value,timestamp,metadata\n';
    
    for (const [type, metrics] of this.metrics) {
      metrics.forEach(metric => {
        csv += `${type},${metric.value},${metric.timestamp},${JSON.stringify(metric.metadata || {})}\n`;
      });
    }
    
    return csv;
  }

  /**
   * Record page load timing
   */
  recordPageLoad(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('page-load-time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('dom-interactive', navigation.domInteractive - navigation.fetchStart);
        this.recordMetric('first-paint', this.getFirstPaint());
        this.recordMetric('first-contentful-paint', this.getFirstContentfulPaint());
      }
    });
  }

  /**
   * Get First Paint timing
   */
  private getFirstPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fpEntry = entries.find(entry => entry.name === 'first-paint');
    return fpEntry ? fpEntry.startTime : 0;
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  /**
   * Record API call performance
   */
  recordApiCall(endpoint: string, duration: number, status: number, size?: number): void {
    this.recordMetric('api-response-time', duration, {
      endpoint,
      status,
      size
    });
    
    if (status >= 400) {
      this.recordMetric('api-error-rate', 1, { endpoint, status });
    }
  }

  /**
   * Record database query performance
   */
  recordDbQuery(operation: string, duration: number, collection?: string): void {
    this.recordMetric('db-query-time', duration, {
      operation,
      collection
    });
  }

  /**
   * Record cache performance
   */
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void {
    this.recordMetric(`cache-${operation}`, duration || 1, { key });
  }

  /**
   * Record real-time operation performance
   */
  recordRealtimeOperation(operation: string, duration: number, messageSize?: number): void {
    this.recordMetric('realtime-operation', duration, {
      operation,
      messageSize
    });
  }

  /**
   * Get all metric types
   */
  getMetricTypes(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.buffer = [];
  }

  /**
   * Destroy the collector and clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Disconnect all performance observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    
    this.flushBuffer();
    this.clear();
    this.removeAllListeners();
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector({
  maxMetricsPerType: 1000,
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  bufferSize: 50,
  flushInterval: 10000 // 10 seconds
});

// Auto-start page load recording
if (typeof window !== 'undefined') {
  performanceCollector.recordPageLoad();
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [stats, setStats] = React.useState<{ [key: string]: any }>({});
  
  React.useEffect(() => {
    const updateStats = () => {
      const metricTypes = performanceCollector.getMetricTypes();
      const newStats: { [key: string]: any } = {};
      
      metricTypes.forEach(type => {
        newStats[type] = performanceCollector.getStats(type);
      });
      
      setStats(newStats);
    };
    
    const handleMetric = () => updateStats();
    const handleFlush = () => updateStats();
    
    performanceCollector.on('metric', handleMetric);
    performanceCollector.on('flush', handleFlush);
    
    // Initial update
    updateStats();
    
    return () => {
      performanceCollector.off('metric', handleMetric);
      performanceCollector.off('flush', handleFlush);
    };
  }, []);
  
  const recordCustomMetric = React.useCallback((type: string, value: number, metadata?: any) => {
    performanceCollector.recordMetric(type, value, metadata);
  }, []);
  
  return {
    stats,
    recordMetric: recordCustomMetric,
    exportData: (format?: 'json' | 'csv') => performanceCollector.exportMetrics(format)
  };
}

// React import for the hook
import React from 'react';