
import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, validateOperationsRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const body = await request.json()
    const { items, targetFolderId } = body

    if (!validateOperationsRequest(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (!targetFolderId) {
      return NextResponse.json({ error: 'Target folder ID is required' }, { status: 400 })
    }

    const results = []
    const errors = []

    // Only copy files, not folders
    const filesToCopy = items.filter((item) => !item.isFolder)

    for (const item of filesToCopy) {
      try {
        const result = await authResult.driveService!.copyFile(item.id, {
          name: item.name,
          parents: [targetFolderId],
        })
        results.push({
          id: item.id,
          name: item.name,
          newId: result.id,
          success: true,
          result,
        })
      } catch (error: any) {
        errors.push({
          id: item.id,
          name: item.name,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: results,
      errors,
      total: filesToCopy.length,
      successCount: results.length,
      errorCount: errors.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
