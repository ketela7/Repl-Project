import { NextRequest, NextResponse } from 'next/server'
import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { driveService, response } = await initDriveService()
    if (response) return response

    // Get about information which includes storage quota
    const aboutResponse = await driveService.about.get({
      fields: 'storageQuota,user',
    })

    const storageQuota = aboutResponse.data.storageQuota
    const user = aboutResponse.data.user

    // Get file statistics by querying files with specific criteria
    const [
      allFilesResponse,
      documentsResponse,
      spreadsheetsResponse,
      presentationsResponse,
      imagesResponse,
      videosResponse,
      pdfsResponse,
      sharedResponse,
      starredResponse,
    ] = await Promise.all([
      // All files count and basic stats
      driveService.files.list({
        q: 'trashed=false',
        fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,shared,starred)',
        pageSize: 1000,
      }),
      // Google Docs
      driveService.files.list({
        q: "trashed=false and mimeType='application/vnd.google-apps.document'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Google Sheets
      driveService.files.list({
        q: "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Google Slides
      driveService.files.list({
        q: "trashed=false and mimeType='application/vnd.google-apps.presentation'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Images
      driveService.files.list({
        q: "trashed=false and (mimeType contains 'image/')",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // Videos
      driveService.files.list({
        q: "trashed=false and (mimeType contains 'video/')",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // PDFs
      driveService.files.list({
        q: "trashed=false and mimeType='application/pdf'",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // Shared files
      driveService.files.list({
        q: 'trashed=false and sharedWithMe=true',
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Starred files
      driveService.files.list({
        q: 'trashed=false and starred=true',
        fields: 'files(id)',
        pageSize: 1000,
      }),
    ])

    const allFiles = allFilesResponse.data.files || []

    // Calculate total size of files (excluding Google Workspace files which don't count toward quota)
    let totalUsedBytes = 0
    let largestFiles: Array<{ name: string; size: number; mimeType: string }> = []

    const filesByType = {
      documents: 0,
      spreadsheets: 0,
      presentations: 0,
      images: 0,
      videos: 0,
      pdfs: 0,
      other: 0,
    }

    const fileSizesByType = {
      images: 0,
      videos: 0,
      pdfs: 0,
      other: 0,
    }

    allFiles.forEach(file => {
      const size = file.size ? parseInt(file.size) : 0
      const mimeType = file.mimeType || ''

      // Only count files with actual storage size toward quota
      if (size > 0) {
        totalUsedBytes += size

        // Track largest files
        largestFiles.push({
          name: file.name || 'Unnamed',
          size,
          mimeType,
        })
      }

      // Categorize files
      if (mimeType === 'application/vnd.google-apps.document') {
        filesByType.documents++
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        filesByType.spreadsheets++
      } else if (mimeType === 'application/vnd.google-apps.presentation') {
        filesByType.presentations++
      } else if (mimeType.startsWith('image/')) {
        filesByType.images++
        fileSizesByType.images += size
      } else if (mimeType.startsWith('video/')) {
        filesByType.videos++
        fileSizesByType.videos += size
      } else if (mimeType === 'application/pdf') {
        filesByType.pdfs++
        fileSizesByType.pdfs += size
      } else {
        filesByType.other++
        fileSizesByType.other += size
      }
    })

    // Sort largest files by size
    largestFiles.sort((a, b) => b.size - a.size)
    largestFiles = largestFiles.slice(0, 10) // Top 10 largest files

    // Parse storage quota information
    const quotaLimit = storageQuota?.limit ? parseInt(storageQuota.limit) : null
    const quotaUsage = storageQuota?.usage ? parseInt(storageQuota.usage) : totalUsedBytes
    const quotaUsageInDrive = storageQuota?.usageInDrive
      ? parseInt(storageQuota.usageInDrive)
      : totalUsedBytes

    // Calculate storage analytics
    const storageAnalytics = {
      quota: {
        limit: quotaLimit,
        used: quotaUsage,
        usedInDrive: quotaUsageInDrive,
        usedInDriveTrash: storageQuota?.usageInDriveTrash
          ? parseInt(storageQuota.usageInDriveTrash)
          : 0,
        available: quotaLimit ? quotaLimit - quotaUsage : null,
        usagePercentage: quotaLimit ? Math.round((quotaUsage / quotaLimit) * 100) : null,
      },
      fileStats: {
        totalFiles: allFiles.length,
        totalSizeBytes: totalUsedBytes,
        filesByType,
        fileSizesByType,
        sharedFiles: sharedResponse.data.files?.length || 0,
        starredFiles: starredResponse.data.files?.length || 0,
      },
      largestFiles,
      user: {
        displayName: user?.displayName,
        emailAddress: user?.emailAddress,
        photoLink: user?.photoLink,
      },
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: storageAnalytics,
    })
  } catch (error) {
    console.error('Storage analytics error:', error)
    return handleApiError(error)
  }
}
