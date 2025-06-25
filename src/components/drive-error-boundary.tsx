'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Wifi } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { errorHandler, type DriveError } from '@/lib/enhanced-error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: DriveError
  errorInfo?: any
}

export class DriveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const processedError = errorHandler.processError(error, 'error-boundary')
    return {
      hasError: true,
      error: processedError,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReconnect = () => {
    // Redirect to auth
    window.location.href = '/api/auth/signin'
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state

      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="mx-auto mt-8 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              {this.getErrorIcon(error?.code)}
            </div>
            <CardTitle className="text-lg text-red-700">
              {this.getErrorTitle(error?.code)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6 text-sm">
              {error?.userMessage ||
                'Something went wrong while loading your files.'}
            </p>

            <div className="flex flex-col gap-2">
              {error?.action === 'retry' && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}

              {error?.action === 'reconnect' && (
                <Button onClick={this.handleReconnect} className="w-full">
                  <Wifi className="mr-2 h-4 w-4" />
                  Reconnect Account
                </Button>
              )}

              {error?.action === 'refresh' && (
                <Button onClick={this.handleRefresh} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
              )}

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Technical Details
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                  {JSON.stringify(
                    {
                      code: error.code,
                      message: error.message,
                      status: error.status,
                      retryable: error.retryable,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }

  private getErrorIcon(code?: string) {
    switch (code) {
      case 'AUTH_ERROR':
        return <Wifi className="h-6 w-6 text-red-600" />
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return <Wifi className="h-6 w-6 text-red-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />
    }
  }

  private getErrorTitle(code?: string): string {
    switch (code) {
      case 'AUTH_ERROR':
        return 'Authentication Required'
      case 'NETWORK_ERROR':
        return 'Connection Problem'
      case 'TIMEOUT':
        return 'Request Timeout'
      case 'RATE_LIMIT':
        return 'Too Many Requests'
      case 'PERMISSION_DENIED':
        return 'Access Denied'
      case 'NOT_FOUND':
        return 'File Not Found'
      case 'SERVER_ERROR':
        return 'Server Error'
      default:
        return 'Something Went Wrong'
    }
  }
}
