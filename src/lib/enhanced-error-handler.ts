/**
 * Error handling for Google Drive API
 * Provides retry, fallback, and user-friendly error messages
 */

import { toast } from 'sonner'

export interface DriveError {
  code: string
  message: string
  status?: number
  retryable: boolean
  userMessage: string
  action?: 'retry' | 'reconnect' | 'refresh' | 'none'
}

class ErrorHandler {
  private errorCounts = new Map<string, number>()
  private readonly MAX_RETRY_COUNT = 3
  private readonly ERROR_RESET_TIME = 5 * 60 * 1000 // 5 minutes

  /**
   * Process and classify Google Drive API errors
   */
  processError(error: any, context?: string): DriveError {
    const errorCode = this.extractErrorCode(error)
    const status = error?.response?.status || error?.status || 0

    // Increment error count for this type
    const errorKey = `${errorCode}-${context || 'general'}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)

    // Auto-reset error counts after time period
    setTimeout(() => {
      this.errorCounts.delete(errorKey)
    }, this.ERROR_RESET_TIME)

    return this.classifyError(errorCode, status, error, currentCount < this.MAX_RETRY_COUNT)
  }

  private extractErrorCode(error: any): string {
    if (error?.code) return error.code
    if (error?.response?.data?.error?.code) return error.response.data.error.code
    if (error?.message?.includes('timeout')) return 'TIMEOUT'
    if (error?.message?.includes('network')) return 'NETWORK_ERROR'
    if (error?.name === 'TypeError') return 'NETWORK_ERROR'
    return 'UNKNOWN_ERROR'
  }

  private classifyError(
    code: string,
    status: number,
    originalError: any,
    retryable: boolean,
  ): DriveError {
    switch (code) {
      case 'rateLimitExceeded':
      case '429':
        return {
          code: 'RATE_LIMIT',
          message: 'Too many requests',
          status: 429,
          retryable: true,
          userMessage: 'Server is busy. Trying again in a moment...',
          action: 'retry',
        }

      case 'quotaExceeded':
        return {
          code: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          status: 403,
          retryable: false,
          userMessage: 'Daily usage limit reached. Please try again tomorrow.',
          action: 'none',
        }

      case 'authError':
      case 'invalid_grant':
      case '401':
        return {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          status: 401,
          retryable: false,
          userMessage: 'Session expired. Please sign in again.',
          action: 'reconnect',
        }

      case 'forbidden':
      case '403':
        return {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied',
          status: 403,
          retryable: false,
          userMessage: "You don't have permission to access this file.",
          action: 'refresh',
        }

      case 'notFound':
      case '404':
        return {
          code: 'NOT_FOUND',
          message: 'File not found',
          status: 404,
          retryable: false,
          userMessage: 'File or folder no longer exists.',
          action: 'refresh',
        }

      case 'TIMEOUT':
        return {
          code: 'TIMEOUT',
          message: 'Request timeout',
          status: 408,
          retryable,
          userMessage: retryable
            ? 'Connection slow. Retrying...'
            : 'Connection timeout. Please check your internet.',
          action: retryable ? 'retry' : 'refresh',
        }

      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          status: 0,
          retryable,
          userMessage: retryable
            ? 'Network issue. Retrying...'
            : 'Connection lost. Please check your internet.',
          action: retryable ? 'retry' : 'refresh',
        }

      case 'backendError':
      case '500':
      case '502':
      case '503':
        return {
          code: 'SERVER_ERROR',
          message: 'Server error',
          status: status || 500,
          retryable,
          userMessage: retryable
            ? 'Server temporarily unavailable. Retrying...'
            : 'Server error. Please try again later.',
          action: retryable ? 'retry' : 'refresh',
        }

      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: originalError?.message || 'Unknown error',
          status,
          retryable,
          userMessage: retryable
            ? 'Something went wrong. Retrying...'
            : 'An unexpected error occurred.',
          action: retryable ? 'retry' : 'refresh',
        }
    }
  }

  /**
   * Show user-friendly error toast
   */
  showErrorToast(error: DriveError): void {
    const actionText = this.getActionText(error.action)

    toast.error(error.userMessage, {
      description: actionText,
      duration: error.retryable ? 3000 : 5000,
    })
  }

  private getActionText(action?: string): string {
    switch (action) {
      case 'retry':
        return 'Please wait while we try again...'
      case 'reconnect':
        return 'Click to sign in again'
      case 'refresh':
        return 'Click refresh to reload'
      default:
        return ''
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorCounts)
  }

  /**
   * Reset error counts
   */
  resetErrorCounts(): void {
    this.errorCounts.clear()
  }
}

export const errorHandler = new ErrorHandler()

/**
 * Wrapper for API calls with error handling
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context?: string,
  showToast = true,
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const processedError = errorHandler.processError(error, context)

    if (showToast) {
      errorHandler.showErrorToast(processedError)
    }

    throw processedError
  }
}
