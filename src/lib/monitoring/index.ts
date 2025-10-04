export { 
  PerformanceCollector, 
  performanceCollector, 
  usePerformanceMonitoring 
} from './performanceCollector';

export { 
  performanceMonitoringMiddleware,
  DatabaseMonitor,
  CacheMonitor,
  RealtimeMonitor,
  ApplicationMonitor,
  dbMonitor,
  cacheMonitor,
  realtimeMonitor,
  appMonitor,
  trackPerformance,
  measurePerformance
} from './performanceMonitoring';

export { PerformanceDashboard } from './PerformanceDashboard';

// Monitoring configuration
export const monitoringConfig = {
  collection: {
    maxMetricsPerType: 1000,
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
    samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    bufferSize: 50,
    flushInterval: 10000 // 10 seconds
  },
  
  thresholds: {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    apiResponseTime: { good: 500, needsImprovement: 1000 },
    dbQueryTime: { good: 100, needsImprovement: 300 },
    pageLoadTime: { good: 2000, needsImprovement: 4000 }
  },
  
  alerts: {
    enabled: process.env.NODE_ENV === 'production',
    endpoints: {
      webhook: process.env.PERFORMANCE_ALERT_WEBHOOK,
      email: process.env.PERFORMANCE_ALERT_EMAIL
    },
    conditions: [
      { metric: 'lcp', threshold: 4000, operator: 'gt' },
      { metric: 'fid', threshold: 300, operator: 'gt' },
      { metric: 'cls', threshold: 0.25, operator: 'gt' },
      { metric: 'api-error-rate', threshold: 5, operator: 'gt' }
    ]
  }
};