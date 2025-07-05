'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { RefreshCw, AlertTriangle, Wifi, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  errorType: 'rate_limit' | 'network' | 'auth' | 'quota' | 'permission' | 'unknown'
}

interface ErrorPattern {
  pattern: RegExp | string
  type: State['errorType']
  retryable: boolean
  retryDelay: number
  userMessage: string
  actionText: string
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null

  // Enhanced error patterns for Google Drive API
  private errorPatterns: ErrorPattern[] = [
    {
      pattern: /quota.*exceeded|rate.*limit|too.*many.*requests/i,
      type: 'rate_limit',
      retryable: true,
      retryDelay: 30000, // 30 seconds
      userMessage: 'API rate limit exceeded. The app will automatically retry in 30 seconds.',
      actionText: 'Retry Now',
    },
    {
      pattern: /network.*error|fetch.*failed|connection.*timeout/i,
      type: 'network',
      retryable: true,
      retryDelay: 5000, // 5 seconds
      userMessage: 'Network connection issue. Check your internet connection.',
      actionText: 'Retry Connection',
    },
    {
      pattern: /unauthorized|invalid.*credentials|token.*expired/i,
      type: 'auth',
      retryable: false,
      retryDelay: 0,
      userMessage: 'Authentication expired. Please sign in again.',
      actionText: 'Sign In',
    },
    {
      pattern: /quota.*exceeded.*daily|storage.*full/i,
      type: 'quota',
      retryable: false,
      retryDelay: 0,
      userMessage: 'Daily API quota exceeded or storage full. Try again tomorrow.',
      actionText: 'Understand',
    },
    {
      pattern: /insufficient.*permissions|access.*denied/i,
      type: 'permission',
      retryable: false,
      retryDelay: 0,
      userMessage: 'Access denied. You may not have permission for this operation.',
      actionText: 'Check Permissions',
    },
  ]

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      errorType: 'unknown',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.classifyError(error)

    this.setState({
      error,
      errorInfo,
      errorType,
    })

    // Auto-retry for retryable errors
    const pattern = this.errorPatterns.find(p =>
      typeof p.pattern === 'string'
        ? error.message.includes(p.pattern)
        : p.pattern.test(error.message),
    )

    if (pattern?.retryable && this.state.retryCount < 3) {
      this.scheduleRetry(pattern.retryDelay)
    }

    // Enhanced error logging
    console.group('🚨 Enhanced Error Boundary')
    console.error('Error Type:', errorType)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Retry Count:', this.state.retryCount)
    console.groupEnd()

    // Report to monitoring service (if available)
    this.reportError(error, errorInfo, errorType)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private classifyError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    const fullText = `${message} ${stack}`

    for (const pattern of this.errorPatterns) {
      if (typeof pattern.pattern === 'string') {
        if (fullText.includes(pattern.pattern.toLowerCase())) {
          return pattern.type
        }
      } else if (pattern.pattern.test(fullText)) {
        return pattern.type
      }
    }

    return 'unknown'
  }

  private scheduleRetry(delay: number) {
    this.retryTimeoutId = window.setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorType: string) {
    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_type: errorType,
          component_stack: errorInfo.componentStack,
        },
      })
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      errorType: 'unknown',
    }))
  }

  private handleAuth = () => {
    // Redirect to auth or refresh token
    window.location.href = '/auth/v1/login'
  }

  private getErrorIcon() {
    switch (this.state.errorType) {
      case 'rate_limit':
        return <Clock className="h-8 w-8 text-yellow-500" />
      case 'network':
        return <Wifi className="h-8 w-8 text-red-500" />
      case 'auth':
        return <Shield className="h-8 w-8 text-blue-500" />
      case 'quota':
        return <AlertTriangle className="h-8 w-8 text-orange-500" />
      case 'permission':
        return <Shield className="h-8 w-8 text-purple-500" />
      default:
        return <AlertTriangle className="h-8 w-8 text-red-500" />
    }
  }

  private getErrorBadgeColor() {
    switch (this.state.errorType) {
      case 'rate_limit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'network':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'auth':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'quota':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'permission':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const pattern = this.errorPatterns.find(p =>
        typeof p.pattern === 'string'
          ? this.state.error?.message.includes(p.pattern)
          : p.pattern.test(this.state.error?.message || ''),
      )

      const defaultPattern = {
        retryable: true,
        userMessage: 'Something went wrong. Please try again.',
        actionText: 'Retry',
      }

      const currentPattern = pattern || defaultPattern

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                {this.getErrorIcon()}
              </div>
              <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                <Badge variant="outline" className={this.getErrorBadgeColor()}>
                  {this.state.errorType.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Alert>
                <AlertDescription>{currentPattern.userMessage}</AlertDescription>
              </Alert>

              {this.state.retryCount > 0 && (
                <p className="text-muted-foreground text-sm">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}

              <div className="flex justify-center gap-2">
                {currentPattern.retryable ? (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= 3}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {currentPattern.actionText}
                  </Button>
                ) : this.state.errorType === 'auth' ? (
                  <Button onClick={this.handleAuth} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {currentPattern.actionText}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                )}
              </div>

              {this.props.showDetails && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
                    Technical Details
                  </summary>
                  <pre className="bg-muted mt-2 rounded p-2 text-xs whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.errorInfo && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle specific error types
export function useErrorHandler() {
  const handleApiError = (error: any) => {
    if (error?.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
    }
    if (error?.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.')
    }
    if (error?.message?.includes('unauthorized')) {
      throw new Error('Authentication required. Please sign in again.')
    }
    throw error
  }

  return { handleApiError }
}
