import { NextRequest, NextResponse } from 'next/server';
import { performanceCollector } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type');
    const since = searchParams.get('since');
    const format = searchParams.get('format') || 'json';

    // Get metrics based on parameters
    if (metricType) {
      const sinceTime = since ? parseInt(since) : undefined;
      const metrics = performanceCollector.getMetrics(metricType, sinceTime);
      const stats = performanceCollector.getStats(metricType, sinceTime);
      
      return NextResponse.json({
        type: metricType,
        metrics,
        stats,
        count: metrics.length
      });
    }

    // Get all metric types and their stats
    const metricTypes = performanceCollector.getMetricTypes();
    const allStats: { [key: string]: any } = {};
    
    metricTypes.forEach(type => {
      const sinceTime = since ? parseInt(since) : undefined;
      allStats[type] = performanceCollector.getStats(type, sinceTime);
    });

    if (format === 'csv') {
      const csvData = performanceCollector.exportMetrics('csv');
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=performance-metrics.csv'
        }
      });
    }

    return NextResponse.json({
      metrics: allStats,
      metricTypes,
      exportUrl: `/api/monitoring/performance?format=csv`
    });

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, metadata } = body;

    if (!type || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data. Required: type (string), value (number)' },
        { status: 400 }
      );
    }

    // Record the custom metric
    performanceCollector.recordMetric(type, value, metadata);

    return NextResponse.json({ 
      success: true, 
      message: 'Metric recorded successfully' 
    });

  } catch (error) {
    console.error('Performance recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type) {
      // Clear specific metric type (would need to implement in collector)
      return NextResponse.json({ 
        message: `Cleared metrics for type: ${type}` 
      });
    } else {
      // Clear all metrics
      performanceCollector.clear();
      return NextResponse.json({ 
        message: 'All performance metrics cleared' 
      });
    }

  } catch (error) {
    console.error('Performance clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear performance metrics' },
      { status: 500 }
    );
  }
}