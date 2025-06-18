
"use client";

import { PerformanceDashboard } from '@/components/performance-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Database, Zap } from 'lucide-react';

export default function PerformancePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Performance Monitor</h1>
        <p className="text-muted-foreground">
          Monitor system performance, resource usage, and optimization recommendations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Efficiency</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Real-time</div>
              <p className="text-xs text-muted-foreground">
                Live monitoring active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Optimized</div>
              <p className="text-xs text-muted-foreground">
                Auto-scaling enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Performance</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Fast</div>
              <p className="text-xs text-muted-foreground">
                Response time tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Efficiency</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">High</div>
              <p className="text-xs text-muted-foreground">
                Hit rate optimization
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Performance Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Live Performance Metrics</CardTitle>
            <CardDescription>
              Real-time system monitoring with optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px]">
              <PerformanceDashboard />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
