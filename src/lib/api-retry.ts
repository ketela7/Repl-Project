/**
 * API retry mechanism for handling transient failures
 * Implements exponential backoff with jitter
 */

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitterFactor: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 500, // 500ms - faster initial retry
  maxDelay: 8000, // 8 seconds max - prevent excessive delays
  backoffMultiplier: 2,
  jitterFactor: 0.1,
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true
  }

  // HTTP status codes that are retryable
  if (error.response?.status) {
    const status = error.response.status
    return (
      status === 429 || // Rate limited
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504
    ) // Gateway Timeout
  }

  // Google Drive API specific error structure analysis
  if (error.error?.errors && Array.isArray(error.error.errors)) {
    const firstError = error.error.errors[0]
    if (firstError?.reason) {
      // Official Google Drive API retryable error reasons
      const retryableReasons = [
        'rateLimitExceeded',
        'userRateLimitExceeded',
        'sharingRateLimitExceeded',
        'backendError',
        'internalError',
        'serviceUnavailable',
        'timeout',
        'activeItemCreationLimitExceeded',
      ]

      return retryableReasons.includes(firstError.reason)
    }
  }

  // Legacy Google API error patterns
  return (
    error.message?.includes('Rate Limit Exceeded') ||
    error.message?.includes('Backend Error') ||
    error.message?.includes('Internal error') ||
    error.message?.includes('Service Unavailable') ||
    error.message?.includes('Invalid authentication credentials') ||
    false
  )
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay,
  )

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random()
  return Math.floor(exponentialDelay + jitter)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: any

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if not retryable or on last attempt
      if (!isRetryableError(error) || attempt === finalConfig.maxRetries) {
        break
      }

      const delay = calculateDelay(attempt, finalConfig)
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Specialized retry for Google Drive API calls
 */
export async function retryDriveApiCall<T>(operation: () => Promise<T>): Promise<T> {
  return retryOperation(operation, {
    maxRetries: 3,
    baseDelay: 3000, // Start with 2 seconds for API calls
    maxDelay: 15000, // Max 15 seconds
  })
}
