import { handleError, AppError, ErrorSeverity } from '../error-handler'

describe('Error Handler', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.isOperational).toBe(true)
    })

    it('should create AppError with custom values', () => {
      const error = new AppError('Custom error', 400, ErrorSeverity.LOW, false)

      expect(error.message).toBe('Custom error')
      expect(error.statusCode).toBe(400)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.isOperational).toBe(false)
    })
  })

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('App error', 400, ErrorSeverity.MEDIUM)
      const result = handleError(appError)

      expect(result.success).toBe(false)
      expect(result.error).toBe('App error')
      expect(result.statusCode).toBe(400)
      expect(result.data).toBeNull()
    })

    it('should handle standard Error objects', () => {
      const error = new Error('Standard error')
      const result = handleError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Standard error')
      expect(result.statusCode).toBe(500)
      expect(result.data).toBeNull()
    })

    it('should handle string errors', () => {
      const result = handleError('String error')

      expect(result.success).toBe(false)
      expect(result.error).toBe('String error')
      expect(result.statusCode).toBe(500)
      expect(result.data).toBeNull()
    })

    it('should handle unknown error types', () => {
      const result = handleError({ unknown: 'object' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unknown error occurred')
      expect(result.statusCode).toBe(500)
      expect(result.data).toBeNull()
    })

    it('should handle errors based on severity without console logging', () => {
      const highSeverityError = new AppError('High severity', 500, ErrorSeverity.HIGH)
      const result = handleError(highSeverityError)

      expect(result.success).toBe(false)
      expect(result.error).toBe('High severity')
      expect(result.statusCode).toBe(500)
      expect(result.data).toBeNull()

      // Console logging removed to comply with ESLint strict mode
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })
})
