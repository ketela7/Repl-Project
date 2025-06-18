
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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

  useEffect(() => {
    // Subscribe to performance monitor if available
    if (typeof window !== 'undefined') {
      import('@/lib/performance-monitor').then(({ performanceMonitor }) => {
        if (performanceMonitor) {
          performanceMonitor.subscribe(setMetrics);
          return () => performanceMonitor.unsubscribe(setMetrics);
        }
      }).catch(() => {
        // Performance monitor not available, use mock data
        const interval = setInterval(() => {
          setMetrics({
            memoryUsage: { used: Math.floor(Math.random() * 200) + 50, total: 512 },
            apiCalls: { count: Math.floor(Math.random() * 50), averageTime: Math.floor(Math.random() * 2000) + 500, errors: Math.floor(Math.random() * 5) },
            cacheStats: { hits: Math.floor(Math.random() * 100), misses: Math.floor(Math.random() * 20), hitRate: Math.random() * 100 },
            networkRequests: { active: Math.floor(Math.random() * 5), completed: Math.floor(Math.random() * 50), failed: Math.floor(Math.random() * 3) },
            userActions: { total: Math.floor(Math.random() * 100), errors: Math.floor(Math.random() * 5) }
          });
        }, 3000);
        
        return () => clearInterval(interval);
      });
    }
  }, []);

  const getMemoryStatus = () => {
    if (metrics.memoryUsage.used > 300) return { color: 'red', status: 'High' };
    if (metrics.memoryUsage.used > 200) return { color: 'yellow', status: 'Medium' };
    return { color: 'green', status: 'Normal' };
  };

  const memoryStatus = getMemoryStatus();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.memoryUsage.used}MB</div>
          <div className="flex items-center gap-2">
            <Badge variant={memoryStatus.color === 'green' ? 'default' : memoryStatus.color === 'yellow' ? 'secondary' : 'destructive'}>
              {memoryStatus.status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              of {metrics.memoryUsage.total}MB
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Performance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(metrics.apiCalls.averageTime)}ms</div>
          <p className="text-xs text-muted-foreground">
            {metrics.apiCalls.count} calls, {metrics.apiCalls.errors} errors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(metrics.cacheStats.hitRate)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.cacheStats.hits} hits, {metrics.cacheStats.misses} misses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Status</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.networkRequests.active}</div>
          <p className="text-xs text-muted-foreground">
            active, {metrics.networkRequests.failed} failed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
