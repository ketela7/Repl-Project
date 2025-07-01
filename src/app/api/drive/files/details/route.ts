import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const driveService = authResult.driveService!
    const body = await request.json()

    // Handle both single fileId and multiple fileIds
    const { fileId, fileIds, fields } = body

    if (!fileId && (!fileIds || fileIds.length === 0)) {
      return NextResponse.json({ error: 'File ID or File IDs are required' }, { status: 400 })
    }

    const idsToProcess = fileId ? [fileId] : fileIds

    // Get file details for all requested files
    const results = await Promise.all(
      idsToProcess.map(async (id: string) => {
        try {
          return await driveService.getFileDetails(id, fields)
        } catch (error) {
          // // // // // console.error(`Failed to get details for file ${id}:`, error)
          return null
        }
      }),
    )

    // For single file request, return the details directly
    if (fileId) {
      return NextResponse.json({
        success: true,
        fileDetails: results[0],
        operation: 'details',
      })
    }

    // For multiple files, return array of results
    return NextResponse.json({
      success: true,
      results: results,
      operation: 'details',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
