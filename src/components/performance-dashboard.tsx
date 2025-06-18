'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { resourceOptimizer } from '@/lib/resource-optimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, BarChart3, Clock, Database, Zap, AlertTriangle, CheckCircle, X, HardDrive } from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: { used: number; total: number };
  apiCalls: { count: number; averageTime: number; errors: number };
  cacheStats: { hits: number; misses: number; hitRate: number };
  networkRequests: { active: number; completed: number; failed: number };
  userActions: { total: number; errors: number };
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0 },
    apiCalls: { count: 0, averageTime: 0, errors: 0 },
    cacheStats: { hits: 0, misses: 0, hitRate: 0 },
    networkRequests: { active: 0, completed: 0, failed: 0 },
    userActions: { total: 0, errors: 0 }
  });

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.init();

    // Subscribe to metrics updates
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
      setLastUpdate(new Date());
    };

    performanceMonitor.subscribe(handleMetricsUpdate);

    // Force initial update
    setTimeout(() => {
      setMetrics(performanceMonitor.getMetrics());
      setLastUpdate(new Date());
    }, 1000);

    return () => {
      performanceMonitor.unsubscribe(handleMetricsUpdate);
    };
  }, []);

  const getMemoryStatus = () => {
    const { used } = metrics.memoryUsage;
    if (used > 300) return 'critical';
    if (used > 150) return 'warning';
    return 'normal';
  };

  const getApiStatus = () => {
    const errorRate = metrics.apiCalls.count > 0 ? 
      (metrics.apiCalls.errors / metrics.apiCalls.count) * 100 : 0;

    if (errorRate > 10) return 'critical';
    if (errorRate > 5) return 'warning';
    return 'good';
  };

  const memoryPercentage = metrics.memoryUsage.total > 0 ? 
    Math.min(100, (metrics.memoryUsage.used / metrics.memoryUsage.total) * 100) : 
    Math.min(100, metrics.memoryUsage.used / 5); // Fallback calculation

  const efficiencyScore = Math.max(50, Math.round(100 - (metrics.apiCalls.errors / Math.max(1, metrics.apiCalls.count)) * 100));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Efficiency Score
            </span>
            <span className="text-sm font-bold text-blue-600">
              {efficiencyScore}%
            </span>
          </div>
          <Progress 
            value={efficiencyScore} 
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-green-500" />
              Memory
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={getMemoryStatus() === 'normal' ? 'default' : 'destructive'}>
                {getMemoryStatus()}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total || (metrics.memoryUsage.used * 2)}MB
          </div>
          <Progress value={memoryPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              API Performance
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={getApiStatus() === 'good' ? 'default' : 'destructive'}>
                {getApiStatus()}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.apiCalls.averageTime.toFixed(0)}ms avg • {((metrics.apiCalls.errors / Math.max(1, metrics.apiCalls.count)) * 100).toFixed(1)}% errors
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Cache
            </span>
            <span className="text-sm">{metrics.cacheStats.hitRate.toFixed(0)}% hit rate</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.cacheStats.hits} entries • {Math.max(0, (metrics.cacheStats.hits + metrics.cacheStats.misses) / 10).toFixed(0)}KB
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Optimization: {getMemoryStatus() === 'normal' ? 'normal' : 'degraded'}</div>
            <div>Background processing: {metrics.networkRequests.active > 0 ? 'active' : 'disabled'}</div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <div className="text-xs text-muted-foreground">
            {getMemoryStatus() === 'critical' 
              ? 'High memory usage detected - consider refreshing'
              : 'Improve cache strategy to reduce API calls'
            }
          </div>
        </div>

        <Button size="sm" className="w-full" variant="outline">
          Optimize Now
        </Button>
      </CardContent>
    </Card>
  );
}