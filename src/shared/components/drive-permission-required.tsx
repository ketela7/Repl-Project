"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HardDrive, Shield, AlertTriangle, RefreshCw } from "lucide-react";

interface DrivePermissionRequiredProps {
  error?: any;
  onRetry?: () => void;
  compact?: boolean;
}

export function DrivePermissionRequired({ 
  error, 
  onRetry, 
  compact = false 
}: DrivePermissionRequiredProps) {
  const [connecting, setConnecting] = useState(false);

  const handleReconnect = async () => {
    setConnecting(true);
    
    try {
      // Sign out first, then redirect to login
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Redirect to login with reauth parameter
      window.location.href = '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive';
    } catch (error) {
      // Fallback: direct redirect to login
      window.location.href = '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  if (compact) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Google Drive access required</span>
          <div className="flex gap-2 ml-4">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            <Button size="sm" onClick={handleReconnect} disabled={connecting}>
              <Shield className="h-3 w-3 mr-1" />
              {connecting ? 'Connecting...' : 'Grant Access'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Google Drive Access Required</CardTitle>
          <CardDescription>
            We need permission to access your Google Drive to manage your files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error.message || error.toString()}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span>View and manage your Drive files</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Secure access with OAuth 2.0</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={handleReconnect} 
              disabled={connecting}
              className="flex-1"
            >
              {connecting ? (
                <>
                  <HardDrive className="h-4 w-4 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Grant Access
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to Google to authorize Drive permissions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}