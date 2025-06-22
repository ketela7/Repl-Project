
"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, AlertTriangle, Router, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";

export default function ServerOfflinePage() {
  const [hasStoredSession, setHasStoredSession] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextAuthSession = localStorage.getItem('next-auth.session-token') || 
                              localStorage.getItem('__Secure-next-auth.session-token') ||
                              document.cookie.includes('next-auth.session-token') ||
                              document.cookie.includes('__Secure-next-auth.session-token');
      setHasStoredSession(!!nextAuthSession);
    }
  }, []);
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    window.location.href = "/dashboard/drive";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Server Offline</CardTitle>
          <CardDescription>
            We're unable to connect to the server right now.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {hasStoredSession && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Anda masih login.</strong> Session tersimpan dan akan otomatis tersambung kembali ketika server online.
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Server sementara tidak tersedia atau sedang dalam maintenance.
              {!hasStoredSession && " Anda perlu login kembali setelah server online."}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Router className="h-4 w-4" />
                What you can try:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  Check your internet connection
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  Wait a few minutes and try again
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  Refresh the page
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  Contact support if the issue persists
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRefresh} 
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              onClick={handleRetry}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>

          <div className="text-center">
            <Link 
              href="/dashboard" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>If this problem continues, please check:</p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• Server Status</span>
              <span>• Network Connection</span>
              <span>• Browser Settings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
