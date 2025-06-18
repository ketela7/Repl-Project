import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance-monitor';
import { resourceOptimizer } from '@/lib/resource-optimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        const metrics = performanceMonitor.getCurrentMetrics();
        const resourceStatus = resourceOptimizer.getResourceStatus();
        const recommendations = performanceMonitor.getOptimizationRecommendations();
        
        return NextResponse.json({
          metrics,
          resourceStatus,
          recommendations,
          efficiencyScore: performanceMonitor.getResourceEfficiencyScore()
        });

      case 'optimize':
        await resourceOptimizer.forceOptimization();
        return NextResponse.json({ success: true, message: 'Optimization completed' });

      case 'export':
        const exportData = performanceMonitor.exportData();
        return NextResponse.json(exportData);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process performance request',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'timeout':
        console.warn('API Timeout logged:', data);
        return NextResponse.json({ success: true });

      case 'memory-spike':
        console.warn('Memory spike logged:', data);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance logging error:', error);
    return NextResponse.json({ 
      error: 'Failed to log performance event',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}