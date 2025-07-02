
import { 
  createApiResponse, 
  handleApiError, 
  validateRequest 
} from '../api-utils'

describe('API Utils', () => {
  describe('createApiResponse', () => {
    it('should create success response', () => {
      const data = { message: 'success' }
      const response = createApiResponse(data)
      
      expect(response).toEqual({
        success: true,
        data,
        error: null
      })
    })

    it('should create error response', () => {
      const error = 'Something went wrong'
      const response = createApiResponse(null, error)
      
      expect(response).toEqual({
        success: false,
        data: null,
        error
      })
    })
  })

  describe('handleApiError', () => {
    it('should handle standard Error objects', () => {
      const error = new Error('Test error')
      const result = handleApiError(error)
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: 'Test error'
      })
    })

    it('should handle string errors', () => {
      const error = 'String error'
      const result = handleApiError(error)
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: 'String error'
      })
    })

    it('should handle unknown errors', () => {
      const error = { unknown: 'object' }
      const result = handleApiError(error)
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: 'An unknown error occurred'
      })
    })
  })

  describe('validateRequest', () => {
    it('should validate POST requests', () => {
      const mockRequest = {
        method: 'POST',
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any

      const result = validateRequest(mockRequest, ['POST'])
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid methods', () => {
      const mockRequest = {
        method: 'DELETE',
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any

      const result = validateRequest(mockRequest, ['POST', 'GET'])
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Method not allowed')
    })
  })
})
