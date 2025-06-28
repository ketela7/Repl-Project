import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const { driveService } = authResult
    const body = await request.json()

    // Get fileId from body
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get comprehensive file details
    const fileDetails = await driveService.getFileDetails(fileId)

    return NextResponse.json({
      success: true,
      fileDetails,
      operation: 'details',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
