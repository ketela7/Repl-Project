
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Shield, 
  TrendingUp,
  X
} from 'lucide-react';
import { errorRecovery } from '@/lib/error-recovery';

interface ErrorRecoveryStatusProps {
  className?: string;
  showDetailed?: boolean;
}

export function ErrorRecoveryStatus({ 
  className = '', 
  showDetailed = false 
}: ErrorRecoveryStatusProps) {
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateStats = () => {
      const currentStats = errorRecovery.getErrorStats();
      setStats(currentStats);
      setLastUpdate(new Date());
      
      // Show component if there's any recovery activity
      const hasActivity = Object.values(currentStats).some((stat: any) => 
        stat.totalAttempts > 0 || stat.successfulRetries > 0 || stat.fallbackUsed > 0
      );
      setIsVisible(hasActivity);
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getTotalStats = () => {
    return Object.values(stats).reduce(
      (totals: any, stat: any) => ({
        totalAttempts: totals.totalAttempts + (stat.totalAttempts || 0),
        successfulRetries: totals.successfulRetries + (stat.successfulRetries || 0),
        fallbackUsed: totals.fallbackUsed + (stat.fallbackUsed || 0),
      }),
      { totalAttempts: 0, successfulRetries: 0, fallbackUsed: 0 }
    );
  };

  const getRecoveryRate = () => {
    const totals = getTotalStats();
    if (totals.totalAttempts === 0) return 0;
    return Math.round(((totals.successfulRetries + totals.fallbackUsed) / totals.totalAttempts) * 100);
  };

  const clearStats = () => {
    errorRecovery.clearStats();
    setStats({});
    setIsVisible(false);
  };

  if (!isVisible && !showDetailed) return null;

  const totals = getTotalStats();
  const recoveryRate = getRecoveryRate();

  return (
    <Card className={`${className} border-orange-200 dark:border-orange-800`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Error Recovery Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={recoveryRate >= 80 ? "default" : recoveryRate >= 60 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {recoveryRate}% Recovery Rate
            </Badge>
            {!showDetailed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totals.successfulRetries}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Successful Retries
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totals.fallbackUsed}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Fallbacks Used
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {totals.totalAttempts}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Attempts
            </div>
          </div>
        </div>

        {/* Recovery Rate Alert */}
        {recoveryRate > 0 && (
          <Alert className={
            recoveryRate >= 80 
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" 
              : recoveryRate >= 60
              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }>
            <div className="flex items-center gap-2">
              {recoveryRate >= 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <AlertDescription className="text-sm">
              {recoveryRate >= 80 
                ? "Excellent! Error recovery system is working effectively."
                : recoveryRate >= 60
                ? "Good recovery rate. Some operations needed retry or fallback strategies."
                : "Recovery system active but experiencing challenges. Monitor for issues."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Stats */}
        {showDetailed && Object.keys(stats).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Operation Details:</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(stats).map(([operation, stat]: [string, any]) => (
                <div key={operation} className="text-xs p-2 bg-muted rounded border">
                  <div className="font-medium text-foreground mb-1">
                    {operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                    <span>Attempts: {stat.totalAttempts}</span>
                    <span>Retries: {stat.successfulRetries}</span>
                    <span>Fallbacks: {stat.fallbackUsed}</span>
                  </div>
                  {stat.commonErrors && Object.keys(stat.commonErrors).length > 0 && (
                    <div className="mt-1 text-red-600 dark:text-red-400">
                      Common errors: {Object.keys(stat.commonErrors).slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          {Object.keys(stats).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearStats}
              className="text-xs"
            >
              Clear Stats
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
