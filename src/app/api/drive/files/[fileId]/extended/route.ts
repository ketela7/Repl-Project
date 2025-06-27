import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError, getFileIdFromParams } from '@/lib/api-utils'
import { driveCache } from '@/lib/cache'
import { generateProgressiveKey, LoadingStage } from '@/lib/google-drive/progressive-fields'

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const fileId = await getFileIdFromParams(params)

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const userId = authResult.session!.user.email || authResult.session!.user.id || ''

    // Check cache first (longer TTL for extended metadata)
    const cacheKey = generateProgressiveKey(fileId, userId, LoadingStage.EXTENDED)
    const cachedDetails = driveCache.get(cacheKey)
    if (cachedDetails) {
      return NextResponse.json({
        success: true,
        data: cachedDetails,
        cached: true,
        stage: LoadingStage.EXTENDED,
      })
    }

    // Fetch extended metadata with all fields
    const startTime = Date.now()
    const fileDetails = await authResult.driveService!.getFileDetails(fileId)

    const responseTime = Date.now() - startTime

    // Cache for 60 minutes (extended metadata changes rarely)
    driveCache.set(cacheKey, fileDetails, 60)

    return NextResponse.json({
      success: true,
      data: fileDetails,
      cached: false,
      stage: LoadingStage.EXTENDED,
      responseTime,
      compressionEnabled: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
