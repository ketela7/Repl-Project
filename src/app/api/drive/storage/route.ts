import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export async function GET() {
  try {
    const startTime = Date.now()
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const driveService = new GoogleDriveService(session.accessToken)

    // Get user info and quota using service
    const userInfo = await driveService.getUserInfo()
    
    const quotaData = {
      limit: userInfo.storageQuota?.limit ? parseInt(userInfo.storageQuota.limit) : null,
      used: userInfo.storageQuota?.usage ? parseInt(userInfo.storageQuota.usage) : 0,
      usedInDrive: userInfo.storageQuota?.usageInDrive ? parseInt(userInfo.storageQuota.usageInDrive) : 0,
      available: userInfo.storageQuota?.limit ? 
        parseInt(userInfo.storageQuota.limit) - parseInt(userInfo.storageQuota.usage) : null,
      usagePercentage: userInfo.storageQuota?.limit ? 
        Math.round((parseInt(userInfo.storageQuota.usage) / parseInt(userInfo.storageQuota.limit)) * 100) : null,
    }

    const user = {
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture || '',
    }

    // Get comprehensive file statistics with pagination
    let allFiles = []
    let pageToken = undefined
    let totalApiCalls = 0
    const maxFiles = 2000 // Limit for reasonable performance
    
    console.log('[Storage Analytics] Starting file collection...')
    
    do {
      totalApiCalls++
      const response = await driveService.listFiles({
        pageSize: 1000, // Maximum allowed
        pageToken,
        orderBy: 'modifiedTime desc',
        includeTeamDriveItems: true,
        fields: 'nextPageToken,files(id,name,mimeType,size,owners,createdTime,modifiedTime)',
      })

      const files = response.files || []
      allFiles.push(...files)
      pageToken = response.nextPageToken
      
      console.log(`[Storage Analytics] Collected ${files.length} files (total: ${allFiles.length})`)
      
      // Safety limit to prevent timeout
      if (allFiles.length >= maxFiles) {
        console.log(`[Storage Analytics] Reached file limit (${maxFiles}), stopping collection`)
        break
      }
    } while (pageToken && totalApiCalls < 10) // Max 10 API calls for safety

    console.log(`[Storage Analytics] Final collection: ${allFiles.length} files, ${totalApiCalls} API calls`)

    const filesByType: Record<string, number> = {}
    const fileSizesByType: Record<string, number> = {}
    let totalSizeBytes = 0
    
    allFiles.forEach(file => {
      const mimeType = file.mimeType || 'unknown'
      const fileSize = file.size ? parseInt(file.size, 10) : 0
      
      filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
      fileSizesByType[mimeType] = (fileSizesByType[mimeType] || 0) + fileSize
      totalSizeBytes += fileSize
    })

    // Enhanced categorization with better MIME type detection
    const categories = {
      documents: 0,
      images: 0,
      videos: 0,
      audio: 0,
      spreadsheets: 0,
      presentations: 0,
      folders: 0,
      other: 0,
    }

    Object.keys(filesByType).forEach(mimeType => {
      const count = filesByType[mimeType] ?? 0
      
      if (mimeType.includes('application/vnd.google-apps.folder')) {
        categories.folders += count
      } else if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text') || 
                 mimeType.includes('application/vnd.google-apps.document')) {
        categories.documents += count
      } else if (mimeType.includes('image') || mimeType.startsWith('image/')) {
        categories.images += count
      } else if (mimeType.includes('video') || mimeType.startsWith('video/')) {
        categories.videos += count
      } else if (mimeType.includes('audio') || mimeType.startsWith('audio/')) {
        categories.audio += count
      } else if (mimeType.includes('spreadsheet') || mimeType.includes('application/vnd.google-apps.spreadsheet')) {
        categories.spreadsheets += count
      } else if (mimeType.includes('presentation') || mimeType.includes('application/vnd.google-apps.presentation')) {
        categories.presentations += count
      } else {
        categories.other += count
      }
    })

    // Get top 15 file types with size information
    const topFileTypes = Object.entries(filesByType)
      .map(([mimeType, count]) => ({
        mimeType,
        count,
        totalSize: fileSizesByType[mimeType] || 0,
        averageSize: Math.round((fileSizesByType[mimeType] || 0) / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // Get largest files
    const largestFiles = allFiles
      .filter(file => file.size && parseInt(file.size, 10) > 0)
      .map(file => ({
        id: file.id || '',
        name: file.name || 'Unknown',
        size: parseInt(file.size || '0', 10),
        mimeType: file.mimeType || 'unknown',
        modifiedTime: file.modifiedTime,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20)

    return NextResponse.json({
      user,
      quota: quotaData,
      fileStats: {
        totalFiles: allFiles.length,
        totalSizeBytes,
        categories,
        filesByType: topFileTypes,
      },
      largestFiles,
      processing: {
        totalApiCalls,
        filesProcessed: allFiles.length,
        processingTimeMs: Date.now() - startTime,
        estimatedAccuracy: Math.min(100, Math.round((allFiles.length / maxFiles) * 100)),
      },
    })

  } catch (error: any) {
    console.error('Storage analytics error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get storage analytics' 
    }, { status: 500 })
  }
}