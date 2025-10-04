"use client";

import React, { useState, useEffect } from 'react';
import { performanceCollector, usePerformanceMonitoring } from './performanceCollector';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'green' | 'red' | 'yellow' | 'blue';
}

function MetricCard({ title, value, unit = '', trend, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {trend && <span className="text-lg">{trendIcons[trend]}</span>}
      </div>
      <p className="text-2xl font-bold mt-2">
        {value}{unit}
      </p>
    </Card>
  );
}

interface ChartProps {
  data: Array<{ timestamp: number; value: number }>;
  title: string;
  color?: string;
  height?: number;
}

function SimpleChart({ data, title, color = '#3b82f6', height = 100 }: ChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <div className="flex items-center justify-center h-24 text-gray-500">
          No data available
        </div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <polyline
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = ((maxValue - d.value) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute bottom-0 left-0 text-xs text-gray-500">
          {minValue.toFixed(1)}
        </div>
        <div className="absolute top-0 left-0 text-xs text-gray-500">
          {maxValue.toFixed(1)}
        </div>
      </div>
    </Card>
  );
}

export function PerformanceDashboard() {
  const { stats, exportData } = usePerformanceMonitoring();
  const [realTimeData, setRealTimeData] = useState<{ [key: string]: Array<{ timestamp: number; value: number }> }>({});
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    const updateRealTimeData = () => {
      const newRealTimeData: { [key: string]: Array<{ timestamp: number; value: number }> } = {};
      
      // Get recent data for charts (last 50 points)
      const metricTypes = ['lcp', 'fid', 'cls', 'api-response-time', 'page-load-time'];
      
      metricTypes.forEach(type => {
        const metrics = performanceCollector.getMetrics(type, Date.now() - 300000); // Last 5 minutes
        newRealTimeData[type] = metrics.slice(-50);
      });
      
      setRealTimeData(newRealTimeData);
    };

    const interval = setInterval(updateRealTimeData, 2000); // Update every 2 seconds
    updateRealTimeData(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number, decimals = 1): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(decimals)}s`;
    }
    return `${value.toFixed(decimals)}ms`;
  };

  const getPerformanceColor = (metric: string, value: number): 'green' | 'yellow' | 'red' => {
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'green' : value <= 4000 ? 'yellow' : 'red';
      case 'fid':
        return value <= 100 ? 'green' : value <= 300 ? 'yellow' : 'red';
      case 'cls':
        return value <= 0.1 ? 'green' : value <= 0.25 ? 'yellow' : 'red';
      case 'api-response-time':
        return value <= 500 ? 'green' : value <= 1000 ? 'yellow' : 'red';
      default:
        return 'yellow';
    }
  };

  const handleExport = () => {
    const data = exportData('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, you'd pause/resume the performance collector
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleRecording}
            className={`px-4 py-2 rounded text-white ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.lcp && (
            <MetricCard
              title="Largest Contentful Paint"
              value={formatValue(stats.lcp.avg)}
              color={getPerformanceColor('lcp', stats.lcp.avg)}
              trend={stats.lcp.avg <= 2500 ? 'down' : 'up'}
            />
          )}
          {stats.fid && (
            <MetricCard
              title="First Input Delay"
              value={formatValue(stats.fid.avg)}
              color={getPerformanceColor('fid', stats.fid.avg)}
              trend={stats.fid.avg <= 100 ? 'down' : 'up'}
            />
          )}
          {stats.cls && (
            <MetricCard
              title="Cumulative Layout Shift"
              value={stats.cls.avg.toFixed(3)}
              color={getPerformanceColor('cls', stats.cls.avg)}
              trend={stats.cls.avg <= 0.1 ? 'down' : 'up'}
            />
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats['page-load-time'] && (
            <MetricCard
              title="Page Load Time"
              value={formatValue(stats['page-load-time'].avg)}
              color={getPerformanceColor('api-response-time', stats['page-load-time'].avg)}
            />
          )}
          {stats['api-response-time'] && (
            <MetricCard
              title="API Response Time"
              value={formatValue(stats['api-response-time'].avg)}
              color={getPerformanceColor('api-response-time', stats['api-response-time'].avg)}
            />
          )}
          {stats['db-query-time'] && (
            <MetricCard
              title="DB Query Time"
              value={formatValue(stats['db-query-time'].avg)}
              color="blue"
            />
          )}
          {stats['cache-hit-rate'] && (
            <MetricCard
              title="Cache Hit Rate"
              value={stats['cache-hit-rate'].avg.toFixed(1)}
              unit="%"
              color={stats['cache-hit-rate'].avg >= 80 ? 'green' : 'yellow'}
            />
          )}
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Real-time Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleChart
            data={realTimeData['api-response-time'] || []}
            title="API Response Time (ms)"
            color="#ef4444"
          />
          <SimpleChart
            data={realTimeData['page-load-time'] || []}
            title="Page Load Time (ms)"
            color="#10b981"
          />
          <SimpleChart
            data={realTimeData['lcp'] || []}
            title="Largest Contentful Paint (ms)"
            color="#f59e0b"
          />
          <SimpleChart
            data={realTimeData['fid'] || []}
            title="First Input Delay (ms)"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Error Rates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Error Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats['api-error-rate'] && (
            <MetricCard
              title="API Errors"
              value={stats['api-error-rate'].count}
              color="red"
            />
          )}
          {stats['server-error-rate'] && (
            <MetricCard
              title="Server Errors"
              value={stats['server-error-rate'].count}
              color="red"
            />
          )}
          {stats['client-error-rate'] && (
            <MetricCard
              title="Client Errors"
              value={stats['client-error-rate'].count}
              color="yellow"
            />
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Current Session</h3>
              <p>Recording: {isRecording ? 'Active' : 'Paused'}</p>
              <p>Data Points: {Object.values(stats).reduce((acc, stat) => acc + (stat?.count || 0), 0)}</p>
              <p>Metric Types: {Object.keys(stats).length}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Performance Status</h3>
              <div className="space-y-1">
                {stats.lcp && (
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <span className={`font-medium ${stats.lcp.avg <= 2500 ? 'text-green-600' : stats.lcp.avg <= 4000 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.lcp.avg <= 2500 ? 'Good' : stats.lcp.avg <= 4000 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                )}
                {stats.fid && (
                  <div className="flex justify-between">
                    <span>FID:</span>
                    <span className={`font-medium ${stats.fid.avg <= 100 ? 'text-green-600' : stats.fid.avg <= 300 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.fid.avg <= 100 ? 'Good' : stats.fid.avg <= 300 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                )}
                {stats.cls && (
                  <div className="flex justify-between">
                    <span>CLS:</span>
                    <span className={`font-medium ${stats.cls.avg <= 0.1 ? 'text-green-600' : stats.cls.avg <= 0.25 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.cls.avg <= 0.1 ? 'Good' : stats.cls.avg <= 0.25 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}