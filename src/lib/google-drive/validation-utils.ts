/**
 * Validation utilities for Google Drive API parameters
 * Extracted from high-complexity functions to improve maintainability
 */

import { buildSearchQuery } from './utils'

/**
 * Validates and sanitizes page size parameter
 */
export function validatePageSize(pageSize: number): number {
  return Math.min(Math.max(pageSize, 1), 1000)
}

/**
 * Validates and sanitizes page token parameter
 */
export function validatePageToken(pageToken: string | undefined): string | undefined {
  if (!pageToken) return undefined

  try {
    let validPageToken = pageToken

    // Try to decode if it appears to be URL encoded
    if (pageToken.includes('%')) {
      validPageToken = decodeURIComponent(pageToken)
    }

    // Basic validation for pageToken format
    if (typeof validPageToken !== 'string' || validPageToken.length === 0 || validPageToken.length > 2048) {
      return undefined
    }

    // Additional validation: pageToken should not contain invalid characters or control chars
    const invalidChars = /[<>"'&\s]/
    if (invalidChars.test(validPageToken)) {
      return undefined
    }

    return validPageToken
  } catch {
    return undefined
  }
}

/**
 * Builds search query based on provided parameters
 */
export function buildSearchQueryForListFiles(
  query: string | undefined,
  parentId: string | undefined,
  mimeType: string | undefined,
): string {
  if (query) {
    // If query is already formatted (contains operators), use it directly
    if (query.includes('=') || query.includes('and') || query.includes('or') || query.includes('in')) {
      return query
    }

    // Otherwise treat it as a search term and build proper query
    return buildSearchQuery({
      name: query,
      ...(parentId && { parentId }),
      ...(mimeType && { mimeType }),
      trashed: false,
    })
  }

  if (parentId || mimeType) {
    return buildSearchQuery({
      ...(parentId && { parentId }),
      ...(mimeType && { mimeType }),
      trashed: false,
    })
  }

  // Default to non-trashed files only
  return 'trashed=false'
}

/**
 * Determines operation type based on page size
 */
export function getOperationType(pageSize: number): 'EXISTS_CHECK' | 'LIST_STANDARD' {
  return pageSize === 1 ? 'EXISTS_CHECK' : 'LIST_STANDARD'
}

/**
 * Validates search options for list files operation
 */
export function validateListFilesOptions(options: {
  pageSize?: number
  pageToken?: string
  query?: string
  parentId?: string
  mimeType?: string
}) {
  return {
    validPageSize: validatePageSize(options.pageSize ?? 50),
    validPageToken: validatePageToken(options.pageToken),
    searchQuery: buildSearchQueryForListFiles(options.query, options.parentId, options.mimeType),
    operationType: getOperationType(options.pageSize ?? 50),
  }
}
