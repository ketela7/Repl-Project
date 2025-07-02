import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'

export async function GET() {
  try {
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

    // Get basic file statistics
    const response = await driveService.listFiles({
      pageSize: 100,
      orderBy: 'modifiedTime desc',
      includeTeamDriveItems: true,
    })

    const files = response.files || []
    const filesByType: Record<string, number> = {}
    
    files.forEach(file => {
      const mimeType = file.mimeType || 'unknown'
      filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
    })

    const categories = {
      documents: 0,
      images: 0,
      videos: 0,
      audio: 0,
      other: 0,
    }

    Object.keys(filesByType).forEach(mimeType => {
      const count = filesByType[mimeType] ?? 0
      
      if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) {
        categories.documents += count
      } else if (mimeType.includes('image')) {
        categories.images += count
      } else if (mimeType.includes('video')) {
        categories.videos += count
      } else if (mimeType.includes('audio')) {
        categories.audio += count
      } else {
        categories.other += count
      }
    })

    return NextResponse.json({
      user,
      quota: quotaData,
      fileStats: {
        totalFiles: files.length,
        categories,
        filesByType: Object.entries(filesByType)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
      },
    })

  } catch (error: any) {
    console.error('Storage analytics error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get storage analytics' 
    }, { status: 500 })
  }
}