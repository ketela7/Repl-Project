"use client";

import { PerformanceDashboard } from "@/components/performance-dashboard";
import { ErrorRecoveryDashboard } from "@/components/error-recovery-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor system performance and resource usage
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <PerformanceDashboard />
          <ErrorRecoveryDashboard />
        </div>
      </div>
    </div>
  );
}