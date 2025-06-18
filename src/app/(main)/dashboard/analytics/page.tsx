"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  Download, 
  HardDrive, 
  Network, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AnalyticsData {
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    uptime: string;
  };
  usage: {
    totalUsers: number;
    activeUsers: number;
    apiCalls: number;
    storageUsed: number;
  };
  errors: {
    total: number;
    resolved: number;
    pending: number;
    criticalAlerts: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    performance: {
      memoryUsage: 65,
      cpuUsage: 45,
      responseTime: 1200,
      uptime: "99.9%"
    },
    usage: {
      totalUsers: 1247,
      activeUsers: 89,
      apiCalls: 15420,
      storageUsed: 2.3
    },
    errors: {
      total: 12,
      resolved: 10,
      pending: 2,
      criticalAlerts: 0
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          memoryUsage: Math.max(30, Math.min(90, prev.performance.memoryUsage + (Math.random() - 0.5) * 10)),
          cpuUsage: Math.max(20, Math.min(80, prev.performance.cpuUsage + (Math.random() - 0.5) * 15)),
          responseTime: Math.max(800, Math.min(2000, prev.performance.responseTime + (Math.random() - 0.5) * 200))
        }
      }));
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (value: number, type: 'memory' | 'cpu' | 'response') => {
    switch (type) {
      case 'memory':
      case 'cpu':
        if (value > 80) return 'destructive';
        if (value > 60) return 'outline';
        return 'secondary';
      case 'response':
        if (value > 1500) return 'destructive';
        if (value > 1000) return 'outline';
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive system monitoring and performance analytics
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Excellent</div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {data.performance.uptime}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.usage.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.usage.totalUsers} total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.usage.apiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.usage.storageUsed} GB</div>
                <p className="text-xs text-muted-foreground">
                  of 10 GB available
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Performance Overview</CardTitle>
                <CardDescription>Current system resource utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{data.performance.memoryUsage}%</span>
                  </div>
                  <Progress value={data.performance.memoryUsage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{data.performance.cpuUsage}%</span>
                  </div>
                  <Progress value={data.performance.cpuUsage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>{Math.round((data.usage.storageUsed / 10) * 100)}%</span>
                  </div>
                  <Progress value={(data.usage.storageUsed / 10) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current operational status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Google Drive API
                  </span>
                  <Badge variant="secondary">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Authentication
                  </span>
                  <Badge variant="secondary">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Database
                  </span>
                  <Badge variant="secondary">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Performance Monitor
                  </span>
                  <Badge variant="outline">Monitoring</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <Badge variant={getStatusColor(data.performance.memoryUsage, 'memory')}>
                      {data.performance.memoryUsage}%
                    </Badge>
                  </div>
                  <Progress value={data.performance.memoryUsage} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <Badge variant={getStatusColor(data.performance.cpuUsage, 'cpu')}>
                      {data.performance.cpuUsage}%
                    </Badge>
                  </div>
                  <Progress value={data.performance.cpuUsage} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge variant={getStatusColor(data.performance.responseTime, 'response')}>
                      {data.performance.responseTime}ms
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average API response time
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Resources
                </CardTitle>
                <CardDescription>Resource utilization and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Limit</span>
                    <span>400 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{Math.round(400 * (data.performance.memoryUsage / 100))} MB</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Rate Limit</span>
                    <span>250K calls/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{data.usage.apiCalls.toLocaleString()} calls</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Limit</span>
                    <span>10 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{data.usage.storageUsed} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{data.usage.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active today</span>
                    <span>{data.usage.activeUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Activity rate</span>
                    <span>{Math.round((data.usage.activeUsers / data.usage.totalUsers) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  API Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{data.usage.apiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">API calls this month</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success rate</span>
                    <span>98.7%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg response</span>
                    <span>{data.performance.responseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{data.usage.storageUsed} GB</div>
                <p className="text-xs text-muted-foreground">of 10 GB total</p>
                <Progress value={(data.usage.storageUsed / 10) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {Math.round((10 - data.usage.storageUsed) * 100) / 100} GB remaining
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Summary
                </CardTitle>
                <CardDescription>Error tracking and resolution status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{data.errors.total}</div>
                    <p className="text-xs text-muted-foreground">Total Errors</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{data.errors.resolved}</div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{data.errors.pending}</div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resolution Rate</span>
                    <span>{Math.round((data.errors.resolved / data.errors.total) * 100)}%</span>
                  </div>
                  <Progress value={(data.errors.resolved / data.errors.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Current system alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.errors.criticalAlerts === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No critical alerts</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{data.errors.criticalAlerts} critical alerts</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">API rate limiting active</span>
                    <Badge variant="outline">Info</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">Performance monitoring enabled</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}