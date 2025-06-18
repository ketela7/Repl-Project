"use client";

import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          description: 'You cancelled the Google authentication process.',
          suggestion: 'Please try signing in again and allow the required permissions.'
        };
      case 'invalid_scope':
        return {
          title: 'Invalid Permissions',
          description: 'The required Google Drive permissions were not granted.',
          suggestion: 'Please sign in again and make sure to grant access to Google Drive.'
        };
      case 'temporarily_unavailable':
        return {
          title: 'Service Temporarily Unavailable',
          description: 'Google authentication service is temporarily unavailable.',
          suggestion: 'Please try again in a few minutes.'
        };
      default:
        return {
          title: 'Authentication Error',
          description: description || 'An error occurred during the Google authentication process.',
          suggestion: 'Please try signing in again.'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {errorInfo.suggestion}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Error Code:</strong> {error}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Details:</strong> {description}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href="/auth/v1/login">
              <Button className="w-full" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full" variant="outline">
                <Home className="w-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If you continue to experience issues, please check that you have a Google account and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}