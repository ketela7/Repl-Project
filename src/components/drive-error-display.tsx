'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Settings, Wifi, Lock, HardDrive, FileX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DriveErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onReconnect?: () => void;
  compact?: boolean;
  className?: string;
}

export function DriveErrorDisplay({ 
  error, 
  onRetry, 
  onReconnect, 
  compact = false,
  className = '' 
}: DriveErrorDisplayProps) {
  
  const getErrorDetails = (error: any) => {
    const message = error?.message || error?.toString() || 'Unknown error';
    const code = error?.code || error?.status;

    // Network errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || message.includes('timeout') || code === 0) {
      return {
        type: 'network',
        icon: <Wifi className="h-4 w-4" />,
        title: 'Connection Issue',
        description: 'Unable to connect to Google Drive. Check your internet connection.',
        color: 'border-orange-200 bg-orange-50',
        actions: ['Check internet connection', 'Try again in a moment'],
        retryable: true
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('invalid') ||
        message.includes('authentication') || code === 401) {
      return {
        type: 'auth',
        icon: <Lock className="h-4 w-4" />,
        title: 'Authentication Required',
        description: 'Your Google Drive access has expired. Please reconnect.',
        color: 'border-red-200 bg-red-50',
        actions: ['Reconnect Google account', 'Check Drive permissions'],
        retryable: true
      };
    }

    // Permission errors
    if (message.includes('permission') || message.includes('forbidden') || code === 403) {
      return {
        type: 'permission',
        icon: <Settings className="h-4 w-4" />,
        title: 'Permission Denied',
        description: 'You don\'t have permission to access this file or folder.',
        color: 'border-yellow-200 bg-yellow-50',
        actions: ['Contact file owner', 'Check sharing settings'],
        retryable: false
      };
    }

    // Not found errors
    if (message.includes('not found') || code === 404) {
      return {
        type: 'notfound',
        icon: <FileX className="h-4 w-4" />,
        title: 'File Not Found',
        description: 'The file or folder may have been moved or deleted.',
        color: 'border-gray-200 bg-gray-50',
        actions: ['Refresh the page', 'Check if file still exists'],
        retryable: true
      };
    }

    // Quota errors
    if (message.includes('quota') || message.includes('storage') || message.includes('limit')) {
      return {
        type: 'quota',
        icon: <HardDrive className="h-4 w-4" />,
        title: 'Storage Full',
        description: 'Your Google Drive storage is full.',
        color: 'border-purple-200 bg-purple-50',
        actions: ['Free up space', 'Upgrade storage plan'],
        retryable: false
      };
    }

    // Rate limit errors
    if (message.includes('rate') || message.includes('too many') || code === 429) {
      return {
        type: 'rate_limit',
        icon: <Clock className="h-4 w-4" />,
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
        color: 'border-blue-200 bg-blue-50',
        actions: ['Wait 1-2 minutes', 'Reduce request frequency'],
        retryable: true
      };
    }

    // Default error
    return {
      type: 'unknown',
      icon: <AlertTriangle className="h-4 w-4" />,
      title: 'Error Occurred',
      description: message,
      color: 'border-gray-200 bg-gray-50',
      actions: ['Try refreshing the page', 'Contact support if issue persists'],
      retryable: true
    };
  };

  const errorDetails = getErrorDetails(error);

  if (compact) {
    return (
      <Alert className={`${errorDetails.color} ${className}`}>
        <div className="flex items-center gap-2">
          {errorDetails.icon}
          <AlertDescription className="flex-1 text-sm">
            <span className="font-medium">{errorDetails.title}:</span> {errorDetails.description}
          </AlertDescription>
          {errorDetails.retryable && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {errorDetails.type === 'auth' && onReconnect && (
            <Button size="sm" onClick={onReconnect}>
              Reconnect
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  return (
    <Card className={`${errorDetails.color} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {errorDetails.icon}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{errorDetails.title}</h4>
              <Badge variant={errorDetails.retryable ? 'secondary' : 'destructive'} className="text-xs">
                {errorDetails.retryable ? 'Retryable' : 'Manual Fix Required'}
              </Badge>
            </div>
            
            <AlertDescription className="text-sm">
              {errorDetails.description}
            </AlertDescription>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Suggested actions:</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {errorDetails.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              {errorDetails.retryable && onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              {errorDetails.type === 'auth' && onReconnect && (
                <Button size="sm" onClick={onReconnect}>
                  <Lock className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for consistent error handling across the app
export function useDriveErrorHandler() {
  const showError = React.useCallback((error: any, options?: {
    onRetry?: () => void;
    onReconnect?: () => void;
    compact?: boolean;
  }) => {
    // This can be expanded to show toast notifications or modal dialogs
    console.error('Drive error:', error);
    return <DriveErrorDisplay error={error} {...options} />;
  }, []);

  return { showError };
}