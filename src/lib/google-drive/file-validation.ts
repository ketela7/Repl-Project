/**
 * File validation utilities for Google Drive operations
 * Extracted from high-complexity functions to improve maintainability
 */

/**
 * Validates filename for Google Drive operations
 */
export function validateFileName(fileName: string): void {
  if (!fileName || fileName.trim().length === 0) {
    throw new Error('Filename cannot be empty')
  }

  if (fileName.length > 255) {
    throw new Error('Filename is too long (maximum 255 characters)')
  }

  // Check for invalid characters in filename
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(fileName)) {
    throw new Error('Filename contains invalid characters: < > : " / \\ | ? *')
  }
}

/**
 * Handles Google Drive API errors with specific status codes
 */
export function handleDriveApiError(error: any): never {
  if (error.response?.status) {
    const status = error.response.status
    const errorData = error.response.data?.error

    switch (status) {
      case 400:
        if (errorData?.message?.includes('Invalid value')) {
          throw new Error('Invalid filename provided')
        }
        throw new Error(errorData?.message || 'Bad request - invalid parameters')
      case 401:
        throw new Error('Authentication expired - please re-login to Google Drive')
      case 403:
        if (errorData?.message?.includes('insufficient permission')) {
          throw new Error("Permission denied - you don't have write access to this file")
        }
        throw new Error('Access forbidden - check your Google Drive permissions')
      case 404:
        throw new Error('File not found - it may have been deleted or moved')
      case 409:
        throw new Error('A file with this name already exists in the same location')
      case 429:
        throw new Error('Too many requests - please wait and try again')
      case 500:
      case 502:
      case 503:
        throw new Error('Google Drive server error - please try again later')
      default:
        throw new Error(errorData?.message || `Google Drive API error (${status})`)
    }
  }

  // Handle network and other errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    throw new Error('Network connection failed - check your internet connection')
  }

  // Re-throw with original message if it's already informative
  throw error
}
