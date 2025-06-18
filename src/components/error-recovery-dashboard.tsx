
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  Clock,
  Zap
} from 'lucide-react';

interface ErrorRecoveryStats {
  operation: string;
  totalAttempts: number;
  successfulRetries: number;
  fallbackUsed: number;
  averageRecoveryTime: number;
  circuitBreakerActivations: number;
  commonErrors: Record<string, number>;
  lastError?: {
    timestamp: number;
    message: string;
    category: string;
    severity: string;
  };
  circuitBreakerState?: {
    isOpen: boolean;
    failureCount: number;
    nextAttemptTime: number;
  };
}

interface ErrorRecoveryDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export function ErrorRecoveryDashboard({ 
  className = '',
  refreshInterval = 30000 
}: ErrorRecoveryDashboardProps) {
  const [stats, setStats] = useState<Record<string, ErrorRecoveryStats>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      // This would integrate with your error recovery system
      // For now, we'll simulate the data structure
      const mockStats: Record<string, ErrorRecoveryStats> = {
        'bulk_file_download': {
          operation: 'Bulk File Download',
          totalAttempts: 150,
          successfulRetries: 12,
          fallbackUsed: 3,
          averageRecoveryTime: 2500,
          circuitBreakerActivations: 1,
          commonErrors: {
            'network timeout': 5,
            'rate limit exceeded': 8,
            'permission denied': 2
          },
          lastError: {
            timestamp: Date.now() - 300000,
            message: 'Rate limit exceeded',
            category: 'rate_limit',
            severity: 'medium'
          }
        },
        'bulk_file_move': {
          operation: 'Bulk File Move',
          totalAttempts: 89,
          successfulRetries: 7,
          fallbackUsed: 2,
          averageRecoveryTime: 1800,
          circuitBreakerActivations: 0,
          commonErrors: {
            'folder not found': 3,
            'permission denied': 4
          }
        },
        'file_export': {
          operation: 'File Export',
          totalAttempts: 45,
          successfulRetries: 15,
          fallbackUsed: 8,
          averageRecoveryTime: 3200,
          circuitBreakerActivations: 2,
          commonErrors: {
            'export format not supported': 6,
            'server error': 9
          },
          circuitBreakerState: {
            isOpen: true,
            failureCount: 5,
            nextAttemptTime: Date.now() + 15000
          }
        }
      };

      setStats(mockStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch error recovery stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const calculateSuccessRate = (stats: ErrorRecoveryStats) => {
    if (stats.totalAttempts === 0) return 100;
    const failures = Object.values(stats.commonErrors).reduce((sum, count) => sum + count, 0);
    return Math.round(((stats.totalAttempts - failures) / stats.totalAttempts) * 100);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Error Recovery Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOperations = Object.keys(stats).length;
  const activeCircuitBreakers = Object.values(stats).filter(s => s.circuitBreakerState?.isOpen).length;
  const averageSuccessRate = Math.round(
    Object.values(stats).reduce((sum, s) => sum + calculateSuccessRate(s), 0) / totalOperations
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Operations</p>
                <p className="text-2xl font-bold">{totalOperations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Average Success Rate</p>
                <p className="text-2xl font-bold">{averageSuccessRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${activeCircuitBreakers > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div>
                <p className="text-sm font-medium">Circuit Breakers</p>
                <p className="text-2xl font-bold">{activeCircuitBreakers}</p>
                <p className="text-xs text-muted-foreground">active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Last Update</p>
                <p className="text-sm font-mono">
                  {lastUpdate?.toLocaleTimeString() || 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Circuit Breakers Alert */}
      {activeCircuitBreakers > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{activeCircuitBreakers} circuit breaker(s)</strong> are currently open, 
            protecting against cascading failures. Operations will retry automatically when conditions improve.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Stats */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(stats).map(([key, stat]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stat.operation}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={stat.circuitBreakerState?.isOpen ? 'destructive' : 'secondary'}>
                        {stat.circuitBreakerState?.isOpen ? 'Circuit Open' : 'Active'}
                      </Badge>
                      <Badge variant="outline">
                        {calculateSuccessRate(stat)}% Success
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Attempts</p>
                      <p className="text-lg font-semibold">{stat.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Successful Retries</p>
                      <p className="text-lg font-semibold text-green-600">{stat.successfulRetries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fallbacks Used</p>
                      <p className="text-lg font-semibold text-blue-600">{stat.fallbackUsed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Recovery Time</p>
                      <p className="text-lg font-semibold">{stat.averageRecoveryTime}ms</p>
                    </div>
                  </div>

                  <Progress 
                    value={calculateSuccessRate(stat)} 
                    className="mb-3"
                  />

                  {stat.lastError && (
                    <div className={`p-3 rounded-lg border ${getSeverityColor(stat.lastError.severity)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Last Error</span>
                        <Badge variant="outline" className="text-xs">
                          {stat.lastError.category}
                        </Badge>
                      </div>
                      <p className="text-sm">{stat.lastError.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(stat.lastError.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(stats).map(([key, stat]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.operation} - Error Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stat.commonErrors).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stat.commonErrors)
                        .sort(([,a], [,b]) => b - a)
                        .map(([error, count]) => (
                        <div key={error} className="flex items-center justify-between">
                          <span className="text-sm">{error}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{count}</Badge>
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(stat.commonErrors))) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No errors recorded for this operation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(stats).map(([key, stat]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.operation} - Recovery Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Retry Success</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {stat.totalAttempts > 0 ? Math.round((stat.successfulRetries / stat.totalAttempts) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.successfulRetries} of {stat.totalAttempts} attempts
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Fallback Usage</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {stat.totalAttempts > 0 ? Math.round((stat.fallbackUsed / stat.totalAttempts) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.fallbackUsed} fallbacks executed
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Circuit Protection</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {stat.circuitBreakerActivations}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        breaker activations
                      </p>
                    </div>
                  </div>

                  {stat.circuitBreakerState?.isOpen && (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Circuit breaker is open. Next retry attempt in{' '}
                        <strong>
                          {Math.ceil((stat.circuitBreakerState.nextAttemptTime - Date.now()) / 1000)}s
                        </strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
        <p className="text-sm text-muted-foreground">
          Auto-refresh every {refreshInterval / 1000}s
        </p>
      </div>
    </div>
  );
}
