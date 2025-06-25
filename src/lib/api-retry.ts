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

  // Google API specific errors
  if (
    error.message?.includes('Rate Limit Exceeded') ||
    error.message?.includes('Backend Error') ||
    error.message?.includes('Internal error')
  ) {
    return true
  }

  return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  )

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random()
  return Math.floor(exponentialDelay + jitter)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = 'operation'
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: any

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development' && attempt > 0) {
      }

      const result = await operation()

      if (attempt > 0 && process.env.NODE_ENV === 'development') {
      }

      return result
    } catch (error) {
      lastError = error

      if (process.env.NODE_ENV === 'development') {
      }

      // Don't retry if not retryable or on last attempt
      if (!isRetryableError(error) || attempt === finalConfig.maxRetries) {
        break
      }

      const delay = calculateDelay(attempt, finalConfig)
      if (process.env.NODE_ENV === 'development') {
      }

      await sleep(delay)
    }
  }

  // All retries exhausted
  if (process.env.NODE_ENV === 'development') {
  }

  throw lastError
}

/**
 * Specialized retry for Google Drive API calls
 */
export async function retryDriveApiCall<T>(
  operation: () => Promise<T>,
  context: string = 'Drive API call'
): Promise<T> {
  return retryOperation(
    operation,
    {
      maxRetries: 3,
      baseDelay: 2000, // Start with 2 seconds for API calls
      maxDelay: 15000, // Max 15 seconds
    },
    context
  )
}
