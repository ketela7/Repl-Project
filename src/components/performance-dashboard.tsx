'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { resourceOptimizer } from '@/lib/resource-optimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, BarChart3, Clock, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceStats {
  memory: {
    current: number;
    threshold: number;
    status: 'normal' | 'high' | 'critical';
  };
  api: {
    responseTime: number;
    errorRate: number;
    status: 'good' | 'slow' | 'unstable';
  };
  cache: {
    hitRate: number;
    size: number;
    memoryUsage: number;
  };
  optimization: {
    level: 'normal' | 'moderate' | 'aggressive';
    backgroundProcessing: boolean;
  };
  resourceEfficiencyScore: number;
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const updateStats = () => {
      const resourceStatus = resourceOptimizer.getResourceStatus();
      const currentMetrics = performanceMonitor.getCurrentMetrics();
      const recs = performanceMonitor.getOptimizationRecommendations();

      if (resourceStatus && currentMetrics) {
        setStats({
          ...resourceStatus,
          cache: {
            hitRate: currentMetrics.cache.hitRate,
            size: currentMetrics.cache.size,
            memoryUsage: currentMetrics.cache.memoryUsage
          },
          resourceEfficiencyScore: performanceMonitor.getResourceEfficiencyScore()
        });
        setRecommendations(recs);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return 'bg-green-500';
      case 'high':
      case 'slow':
        return 'bg-yellow-500';
      case 'critical':
      case 'unstable':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'high':
      case 'slow':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'unstable':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleOptimize = async () => {
    await resourceOptimizer.forceOptimization();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-full h-12 w-12 p-0"
          title="Performance Monitor"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <>
              {/* Resource Efficiency Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Efficiency Score</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(stats.resourceEfficiencyScore)}%
                  </span>
                </div>
                <Progress value={stats.resourceEfficiencyScore} className="h-2" />
              </div>

              {/* Memory Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.memory.status)}
                    <Badge variant="outline" className={getStatusColor(stats.memory.status)}>
                      {stats.memory.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(stats.memory.current)}MB / {Math.round(stats.memory.threshold)}MB
                </div>
                <Progress 
                  value={(stats.memory.current / stats.memory.threshold) * 100} 
                  className="h-2" 
                />
              </div>

              {/* API Performance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">API Performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.api.status)}
                    <Badge variant="outline" className={getStatusColor(stats.api.status)}>
                      {stats.api.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(stats.api.responseTime)}ms avg • {stats.api.errorRate.toFixed(1)}% errors
                </div>
              </div>

              {/* Cache Performance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Cache</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(stats.cache.hitRate)}% hit rate
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.cache.size} entries • {Math.round(stats.cache.memoryUsage / 1024)}KB
                </div>
                <Progress value={stats.cache.hitRate} className="h-2" />
              </div>

              {/* Optimization Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Optimization</span>
                  <Badge variant="outline">
                    {stats.optimization.level}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Background processing: {stats.optimization.backgroundProcessing ? 'enabled' : 'disabled'}
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Recommendations</span>
                  <div className="space-y-1">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleOptimize} size="sm" variant="outline" className="flex-1">
                  Optimize Now
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}