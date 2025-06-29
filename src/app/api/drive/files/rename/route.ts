import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateRenameRequest } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { throttledDriveRequest } from '@/lib/api-throttle'

/**
 * Rename pattern generators following Download Operations pattern
 */
function generateRenamedFileName(originalName: string, pattern: string, renameType: string, index?: number): string {
  const extension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : ''
  const nameWithoutExt = extension ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName

  switch (renameType) {
    case 'prefix':
      return `${pattern}_${originalName}`

    case 'suffix':
      return extension ? `${nameWithoutExt}_${pattern}${extension}` : `${originalName}_${pattern}`

    case 'numbering':
      const basePattern = pattern || 'File'
      return extension ? `${basePattern} (${index || 1})${extension}` : `${basePattern} (${index || 1})`

    case 'timestamp':
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '_').replace(/-/g, '')
      return extension ? `${nameWithoutExt}_${timestamp}${extension}` : `${originalName}_${timestamp}`

    case 'replace':
      if (!pattern.includes('|')) return originalName
      const [oldText, newText] = pattern.split('|')
      return originalName.replace(new RegExp(oldText, 'g'), newText)

    case 'regex':
      try {
        // Parse regex pattern in format: /pattern/replacement/flags
        const regexMatch = pattern.match(/^\/(.+)\/(.*)\/([gimuy]*)$/)
        if (regexMatch) {
          const [, regPattern, replacement, flags] = regexMatch
          const regex = new RegExp(regPattern, flags)
          return originalName.replace(regex, replacement)
        }
        return originalName
      } catch (error) {
        return originalName
      }

    default:
      return originalName
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()

    if (!validateRenameRequest(body)) {
      return NextResponse.json({ error: 'Invalid rename request format' }, { status: 400 })
    }

    // Handle both single and bulk operations
    const { fileId, namePrefix, newName, items, renameType = 'prefix' } = body

    // Determine operation type based on items array or single fileId
    const fileIds = items && items.length > 0 ? items.map((item: any) => item.id || item.fileId) : [fileId]
    const isBulkOperation = items && items.length > 1

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (let i = 0; i < fileIds.length; i++) {
      const id = fileIds[i]

      try {
        let finalName = newName

        // For bulk operations, generate appropriate name based on rename type
        if (isBulkOperation && items) {
          const originalItem = items.find((item: any) => item.id === id)
          const originalName = originalItem?.name || 'Unknown'
          const pattern = namePrefix || ''

          finalName = generateRenamedFileName(originalName, pattern, renameType, i + 1)
        } else if (!isBulkOperation && namePrefix && items) {
          // Single item with pattern
          const originalItem = items[0]
          const originalName = originalItem?.name || 'Unknown'
          finalName = generateRenamedFileName(originalName, namePrefix, renameType, 1)
        }

        if (!finalName) {
          errors.push({
            fileId: id,
            success: false,
            error: 'New name is required',
          })
          continue
        }

        // Use throttling and retry like Download Operations
        const result = await throttledDriveRequest(async () => {
          return await retryDriveApiCall(async () => {
            return await driveService.renameFile(id, finalName)
          }, `Rename file ${id}`)
        })

        results.push({
          fileId: id,
          success: true,
          result,
          newName: finalName,
        })
      } catch (error: any) {
        errors.push({
          fileId: id,
          success: false,
          error: error.message || 'Rename failed',
        })
      }
    }

    const response = {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      total: fileIds.length,
      type: isBulkOperation ? 'bulk' : 'single',
      operation: 'rename',
      renameType,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
