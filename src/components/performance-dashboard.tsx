
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
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  Gauge
} from "lucide-react";

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  resourceScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    apiCalls: { total: 0, successful: 0, failed: 0, avgResponseTime: 0 },
    cacheStats: { hits: 0, misses: 0, hitRate: 0 },
    resourceScore: 0,
    status: 'good'
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(metrics.status)}
            <div>
              <p className="font-medium">System Status</p>
              <p className={`text-sm capitalize ${getStatusColor(metrics.status)}`}>
                {metrics.status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{metrics.resourceScore}/100</p>
            <p className="text-xs text-muted-foreground">Efficiency Score</p>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium">Memory Usage</h4>
            <Badge variant="secondary" className="text-xs">
              {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
            </Badge>
          </div>
          <Progress value={metrics.memoryUsage.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {metrics.memoryUsage.percentage.toFixed(1)}% of available memory
          </p>
        </div>

        <Separator />

        {/* API Performance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-green-600" />
            <h4 className="font-medium">API Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {metrics.apiCalls.successful}
              </p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {metrics.apiCalls.failed}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Average Response Time</span>
            <Badge variant="outline">
              {metrics.apiCalls.avgResponseTime}ms
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Cache Performance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium">Cache Performance</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Hit Rate</span>
              <Badge variant="secondary">
                {metrics.cacheStats.hitRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.cacheStats.hitRate} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>Hits: {metrics.cacheStats.hits}</div>
              <div>Misses: {metrics.cacheStats.misses}</div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface PerformanceMetrics {
  apiLatency: number;
  cacheHitRate: number;
  errorRate: number;
  lastUpdated: Date;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    lastUpdated: new Date()
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for performance alerts
    const handlePerformanceAlert = (event: CustomEvent) => {
      if (event.detail?.type === 'high_latency') {
        setMetrics(prev => ({
          ...prev,
          apiLatency: event.detail.value,
          lastUpdated: new Date()
        }));
        setIsVisible(true);
      }
    };

    window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener);

    return () => {
      window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener);
    };
  }, []);

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible || metrics.apiLatency < 5000) {
    return null;
  }

  const getLatencyStatus = (latency: number) => {
    if (latency < 1000) return { status: 'good', color: 'bg-green-500', icon: CheckCircle };
    if (latency < 3000) return { status: 'warning', color: 'bg-yellow-500', icon: Clock };
    return { status: 'critical', color: 'bg-red-500', icon: AlertTriangle };
  };

  const latencyStatus = getLatencyStatus(metrics.apiLatency);
  const Icon = latencyStatus.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">API Latency</span>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                {metrics.apiLatency}ms
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            High latency detected. Performance may be affected.
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs text-blue-600 hover:underline"
          >
            Dismiss
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
