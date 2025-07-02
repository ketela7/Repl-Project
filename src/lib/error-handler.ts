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
  processError(error: unknown, context?: string): DriveError {
    const errorCode = this.extractErrorCode(error)
    const status = (error as any)?.response?.status || (error as any)?.status || 0

    // Increment error count for this type
    const errorKey = `${errorCode}-${context || 'general'}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)

    // Reset counts after ERROR_RESET_TIME
    setTimeout(() => {
      this.errorCounts.delete(errorKey)
    }, this.ERROR_RESET_TIME)

    // Determine if error is retryable
    const retryable = this.isRetryableError(error, currentCount)

    return this.classifyError(errorCode, status, retryable)
  }

  private extractErrorCode(error: unknown): string {
    if (typeof error === 'string') return 'UNKNOWN_STRING_ERROR'
    if (!error || typeof error !== 'object') return 'UNKNOWN_ERROR'

    const err = error as any
    
    // Google API specific error codes
    if (err.code) return err.code
    if (err.error?.code) return err.error.code
    if (err.response?.status) return `HTTP_${err.response.status}`
    if (err.status) return `HTTP_${err.status}`
    if (err.message?.includes('403')) return 'FORBIDDEN'
    if (err.message?.includes('401')) return 'UNAUTHORIZED'
    if (err.message?.includes('429')) return 'QUOTA_EXCEEDED'
    if (err.message?.includes('404')) return 'NOT_FOUND'
    if (err.message?.includes('500')) return 'INTERNAL_ERROR'

    return 'UNKNOWN_ERROR'
  }

  private isRetryableError(error: unknown, currentCount: number): boolean {
    if (currentCount >= this.MAX_RETRY_COUNT) return false

    const errorCode = this.extractErrorCode(error)
    const retryableCodes = [
      'QUOTA_EXCEEDED',
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_ERROR',
      'BACKEND_ERROR',
      'SERVICE_UNAVAILABLE',
      'HTTP_429',
      'HTTP_500',
      'HTTP_502',
      'HTTP_503',
      'HTTP_504'
    ]

    return retryableCodes.includes(errorCode)
  }

  private classifyError(code: string, status: number, retryable: boolean): DriveError {
    const errorMap: Record<string, Omit<DriveError, 'code' | 'retryable'>> = {
      'FORBIDDEN': {
        message: 'Access denied to Google Drive',
        status: 403,
        userMessage: 'You need to grant permission to access your Google Drive',
        action: 'reconnect'
      },
      'UNAUTHORIZED': {
        message: 'Authentication required',
        status: 401,
        userMessage: 'Please sign in to access your Google Drive',
        action: 'reconnect'
      },
      'QUOTA_EXCEEDED': {
        message: 'API quota exceeded',
        status: 429,
        userMessage: 'Too many requests. Please wait a moment and try again',
        action: 'retry'
      },
      'RATE_LIMIT_EXCEEDED': {
        message: 'Rate limit exceeded',
        status: 429,
        userMessage: 'Too many requests. Please wait a moment and try again',
        action: 'retry'
      },
      'NOT_FOUND': {
        message: 'File or folder not found',
        status: 404,
        userMessage: 'The requested file or folder could not be found',
        action: 'refresh'
      },
      'INTERNAL_ERROR': {
        message: 'Google Drive internal error',
        status: 500,
        userMessage: 'Google Drive is experiencing issues. Please try again later',
        action: 'retry'
      },
      'NETWORK_ERROR': {
        message: 'Network connection error',
        status: 0,
        userMessage: 'Check your internet connection and try again',
        action: 'retry'
      }
    }

    const errorInfo = errorMap[code] || {
      message: 'Unknown error occurred',
      status: status || 500,
      userMessage: 'An unexpected error occurred. Please try again',
      action: 'retry' as const
    }

    return {
      code,
      retryable,
      ...errorInfo
    }
  }

  /**
   * Show user-friendly error toast
   */
  showErrorToast(error: DriveError): void {
    const actionText = this.getActionText(error.action)
    
    toast.error(error.userMessage, {
      description: actionText ? `Tip: ${actionText}` : undefined,
      duration: 5000,
      action: error.action && error.action !== 'none' ? {
        label: actionText,
        onClick: () => {
          // Action will be handled by the calling component
        }
      } : undefined
    })
  }

  private getActionText(action?: string): string {
    switch (action) {
      case 'retry': return 'Try again'
      case 'reconnect': return 'Reconnect your account'
      case 'refresh': return 'Refresh the page'
      default: return ''
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
export async function withErrorHandling<T>(apiCall: () => Promise<T>, context?: string, showToast = true): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const driveError = errorHandler.processError(error, context)
    
    if (showToast) {
      errorHandler.showErrorToast(driveError)
    }
    
    throw driveError
  }
}

// Enhanced error handler for better type safety
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.severity = severity
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export interface ErrorResponse {
  success: false
  error: string
  statusCode: number
  data: null
}

export interface SuccessResponse<T> {
  success: true
  data: T
  error: null
  statusCode: number
}

export type ApiResponse<T> = ErrorResponse | SuccessResponse<T>

export function handleError(error: unknown): ErrorResponse {
  let message = 'An unknown error occurred'
  let statusCode = 500

  if (error instanceof AppError) {
    message = error.message
    statusCode = error.statusCode
    
    // Log based on severity
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      console.error(`[${error.severity}] AppError:`, error.message, error.stack)
    }
  } else if (error instanceof Error) {
    message = error.message
    console.error('Standard Error:', error.message, error.stack)
  } else if (typeof error === 'string') {
    message = error
  }

  return {
    success: false,
    error: message,
    statusCode,
    data: null
  }
}

export function successResponse<T>(data: T, statusCode: number = 200): SuccessResponse<T> {
  return {
    success: true,
    data,
    error: null,
    statusCode
  }
}