/**
 * Error handling for Google Drive API
 * Provides retry, fallback, and user-friendly error messages
 * Based on official Google Drive API error handling documentation
 */

import { toast } from 'sonner'

export interface DriveError {
  code: string
  message: string
  status?: number
  retryable: boolean
  userMessage: string
  action?: 'retry' | 'reconnect' | 'refresh' | 'none'
  reason?: string
  domain?: string
  location?: string
  locationType?: string
}

/**
 * Google Drive API Error Reasons based on official documentation
 */
export const DRIVE_ERROR_REASONS = {
  // Authentication errors (401)
  AUTH_ERROR: 'authError',
  FILE_NOT_DOWNLOADABLE: 'fileNotDownloadable',
  
  // Authorization errors (403)
  ACTIVE_ITEM_CREATION_LIMIT_EXCEEDED: 'activeItemCreationLimitExceeded',
  APP_NOT_AUTHORIZED_TO_FILE: 'appNotAuthorizedToFile',
  CANNOT_MODIFY_INHERITED_TEAM_DRIVE_PERMISSION: 'cannotModifyInheritedTeamDrivePermission',
  DAILY_LIMIT_EXCEEDED: 'dailyLimitExceeded',
  DOMAIN_POLICY: 'domainPolicy',
  FILE_OWNER_NOT_MEMBER_OF_TEAM_DRIVE: 'fileOwnerNotMemberOfTeamDrive',
  FILE_WRITER_TEAM_DRIVE_MOVE_IN_DISABLED: 'fileWriterTeamDriveMoveInDisabled',
  INSUFFICIENT_FILE_PERMISSIONS: 'insufficientFilePermissions',
  MY_DRIVE_HIERARCHY_DEPTH_LIMIT_EXCEEDED: 'myDriveHierarchyDepthLimitExceeded',
  NUM_CHILDREN_IN_NON_ROOT_LIMIT_EXCEEDED: 'numChildrenInNonRootLimitExceeded',
  RATE_LIMIT_EXCEEDED: 'rateLimitExceeded',
  SHARING_RATE_LIMIT_EXCEEDED: 'sharingRateLimitExceeded',
  STORAGE_QUOTA_EXCEEDED: 'storageQuotaExceeded',
  TEAM_DRIVE_FILE_LIMIT_EXCEEDED: 'teamDriveFileLimitExceeded',
  TEAM_DRIVE_HIERARCHY_TOO_DEEP: 'teamDriveHierarchyTooDeep',
  TEAM_DRIVE_MEMBERSHIP_REQUIRED: 'teamDriveMembershipRequired',
  TEAM_DRIVES_FOLDER_MOVE_IN_NOT_SUPPORTED: 'teamDrivesFolderMoveInNotSupported',
  TEAM_DRIVES_PARENT_LIMIT: 'teamDrivesParentLimit',
  URL_LEASE_LIMIT_EXCEEDED: 'UrlLeaseLimitExceeded',
  USER_RATE_LIMIT_EXCEEDED: 'userRateLimitExceeded',
  
  // Client errors (400)
  BAD_REQUEST: 'badRequest',
  INVALID_SHARING_REQUEST: 'invalidSharingRequest',
  
  // Not found errors (404)
  NOT_FOUND: 'notFound',
  
  // Server errors (5xx)
  BACKEND_ERROR: 'backendError',
  INTERNAL_ERROR: 'internalError',
  SERVICE_UNAVAILABLE: 'serviceUnavailable',
  TIMEOUT: 'timeout'
} as const

export type DriveErrorReason = typeof DRIVE_ERROR_REASONS[keyof typeof DRIVE_ERROR_REASONS]

/**
 * Status codes that should be retried according to Google Drive API documentation
 */
export const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504] as const

/**
 * Error reasons that should be retried according to Google Drive API documentation
 */
export const RETRYABLE_ERROR_REASONS = [
  DRIVE_ERROR_REASONS.RATE_LIMIT_EXCEEDED,
  DRIVE_ERROR_REASONS.SHARING_RATE_LIMIT_EXCEEDED,
  DRIVE_ERROR_REASONS.USER_RATE_LIMIT_EXCEEDED,
  DRIVE_ERROR_REASONS.BACKEND_ERROR,
  DRIVE_ERROR_REASONS.INTERNAL_ERROR,
  DRIVE_ERROR_REASONS.SERVICE_UNAVAILABLE,
  DRIVE_ERROR_REASONS.TIMEOUT,
  DRIVE_ERROR_REASONS.ACTIVE_ITEM_CREATION_LIMIT_EXCEEDED
] as const

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

  /**
   * Extract Google Drive API error details according to official documentation
   */
  private extractErrorCode(error: unknown): string {
    if (typeof error === 'string') return 'UNKNOWN_STRING_ERROR'
    if (!error || typeof error !== 'object') return 'UNKNOWN_ERROR'

    const err = error as any
    
    // Google Drive API error structure: { error: { errors: [{ reason: "...", domain: "...", message: "..." }], code: 403, message: "..." } }
    if (err.error?.errors?.length > 0) {
      const firstError = err.error.errors[0]
      if (firstError.reason) {
        return firstError.reason
      }
    }
    
    // Direct Google API error codes
    if (err.code) return err.code
    if (err.error?.code) return err.error.code
    if (err.response?.status) return `HTTP_${err.response.status}`
    if (err.status) return `HTTP_${err.status}`
    
    // Parse from message for fallback
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
    const status = (error as any)?.response?.status || (error as any)?.status || (error as any)?.error?.code || 0

    // Check if status code is retryable according to Google Drive API documentation
    if (RETRYABLE_STATUS_CODES.includes(status)) {
      return true
    }

    // Check if error reason is retryable according to Google Drive API documentation
    const retryableReasons = RETRYABLE_ERROR_REASONS as readonly string[]
    if (retryableReasons.includes(errorCode)) {
      return true
    }

    // Legacy retryable codes for backward compatibility
    const legacyRetryableCodes = [
      'QUOTA_EXCEEDED',
      'INTERNAL_ERROR',
      'BACKEND_ERROR',
      'SERVICE_UNAVAILABLE',
      'HTTP_429',
      'HTTP_500',
      'HTTP_502',
      'HTTP_503',
      'HTTP_504'
    ]

    return legacyRetryableCodes.includes(errorCode)
  }

  private classifyError(code: string, status: number, retryable: boolean): DriveError {
    // Comprehensive Google Drive API error handling based on official documentation
    const errorMap: Record<string, Omit<DriveError, 'code' | 'retryable'>> = {
      // Authentication errors (401)
      [DRIVE_ERROR_REASONS.AUTH_ERROR]: {
        message: 'Invalid authentication credentials',
        status: 401,
        userMessage: 'Please sign in to access your Google Drive',
        action: 'reconnect'
      },
      [DRIVE_ERROR_REASONS.FILE_NOT_DOWNLOADABLE]: {
        message: 'File cannot be downloaded',
        status: 401,
        userMessage: 'This file cannot be downloaded. Check your permissions',
        action: 'none'
      },
      
      // Rate limiting errors (403)
      [DRIVE_ERROR_REASONS.RATE_LIMIT_EXCEEDED]: {
        message: 'Rate limit exceeded',
        status: 403,
        userMessage: 'Too many requests. Please wait and try again',
        action: 'retry'
      },
      [DRIVE_ERROR_REASONS.SHARING_RATE_LIMIT_EXCEEDED]: {
        message: 'Sharing rate limit exceeded',
        status: 403,
        userMessage: 'Too many sharing requests. Please wait and try again',
        action: 'retry'
      },
      [DRIVE_ERROR_REASONS.USER_RATE_LIMIT_EXCEEDED]: {
        message: 'User rate limit exceeded',
        status: 403,
        userMessage: 'Too many requests per user. Please wait and try again',
        action: 'retry'
      },
      [DRIVE_ERROR_REASONS.DAILY_LIMIT_EXCEEDED]: {
        message: 'Daily API limit exceeded',
        status: 403,
        userMessage: 'Daily API quota exceeded. Please try again tomorrow',
        action: 'none'
      },
      
      // Permission errors (403)
      [DRIVE_ERROR_REASONS.INSUFFICIENT_FILE_PERMISSIONS]: {
        message: 'Insufficient file permissions',
        status: 403,
        userMessage: 'You do not have permission to access this file',
        action: 'reconnect'
      },
      [DRIVE_ERROR_REASONS.APP_NOT_AUTHORIZED_TO_FILE]: {
        message: 'App not authorized to access file',
        status: 403,
        userMessage: 'This app is not authorized to access the file',
        action: 'reconnect'
      },
      [DRIVE_ERROR_REASONS.DOMAIN_POLICY]: {
        message: 'Domain policy violation',
        status: 403,
        userMessage: 'Operation blocked by domain security policy',
        action: 'none'
      },
      
      // Storage and limit errors (403)
      [DRIVE_ERROR_REASONS.STORAGE_QUOTA_EXCEEDED]: {
        message: 'Storage quota exceeded',
        status: 403,
        userMessage: 'Your Google Drive storage is full. Please free up space',
        action: 'none'
      },
      [DRIVE_ERROR_REASONS.ACTIVE_ITEM_CREATION_LIMIT_EXCEEDED]: {
        message: 'Too many files created',
        status: 403,
        userMessage: 'You have created too many files recently. Please try again later',
        action: 'retry'
      },
      [DRIVE_ERROR_REASONS.NUM_CHILDREN_IN_NON_ROOT_LIMIT_EXCEEDED]: {
        message: 'Folder has too many items',
        status: 403,
        userMessage: 'This folder has reached the maximum number of items',
        action: 'none'
      },
      [DRIVE_ERROR_REASONS.MY_DRIVE_HIERARCHY_DEPTH_LIMIT_EXCEEDED]: {
        message: 'Folder hierarchy too deep',
        status: 403,
        userMessage: 'The folder structure is too deep. Please organize your files',
        action: 'none'
      },
      
      // Shared drive errors (403)
      [DRIVE_ERROR_REASONS.TEAM_DRIVE_MEMBERSHIP_REQUIRED]: {
        message: 'Shared drive membership required',
        status: 403,
        userMessage: 'You must be a member of this shared drive to access it',
        action: 'none'
      },
      [DRIVE_ERROR_REASONS.TEAM_DRIVE_FILE_LIMIT_EXCEEDED]: {
        message: 'Shared drive file limit exceeded',
        status: 403,
        userMessage: 'This shared drive has reached its file limit',
        action: 'none'
      },
      [DRIVE_ERROR_REASONS.TEAM_DRIVE_HIERARCHY_TOO_DEEP]: {
        message: 'Shared drive hierarchy too deep',
        status: 403,
        userMessage: 'The shared drive folder structure is too deep',
        action: 'none'
      },
      
      // Client errors (400)
      [DRIVE_ERROR_REASONS.BAD_REQUEST]: {
        message: 'Bad request',
        status: 400,
        userMessage: 'The request was invalid. Please check your input',
        action: 'none'
      },
      [DRIVE_ERROR_REASONS.INVALID_SHARING_REQUEST]: {
        message: 'Invalid sharing request',
        status: 400,
        userMessage: 'The sharing request was invalid. Check the email address and permissions',
        action: 'none'
      },
      
      // Not found errors (404)
      [DRIVE_ERROR_REASONS.NOT_FOUND]: {
        message: 'File or folder not found',
        status: 404,
        userMessage: 'The requested file or folder could not be found',
        action: 'refresh'
      },
      
      // Legacy error codes for backward compatibility
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