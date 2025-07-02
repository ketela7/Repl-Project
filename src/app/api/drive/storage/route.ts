import { NextResponse } from 'next/server'
import { initDriveService, handleApiError } from '@/lib/apiutils'

export async function GET() {
  try {
    const { driveService, response } = await initDriveService()
    if (response) return response
    if (!driveService) throw new Error('Drive service not available')

    // Get comprehensive about information including storage quota and system capabilities
    const aboutResponse = await driveService.drive.about.get({
      fields:
        'storageQuota,user,maxUploadSize,maxImportSizes,importFormats,exportFormats,canCreateDrives,folderColorPalette,driveThemes',
    })

    const about = aboutResponse.data
    const storageQuota = about.storageQuota
    const user = about.user

    // Get file statistics by querying files with specific criteria
    const [
      allFilesResponse,
      ,
      ,
      ,
      ,
      ,
      ,
      sharedResponse,
      starredResponse,
    ] = await Promise.all([
      // All files count and basic stats
      driveService.drive.files.list({
        q: 'trashed=false',
        fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,shared,starred)',
        pageSize: 1000,
      }),
      // Google Docs
      driveService.drive.files.list({
        q: "trashed=false and mimeType='application/vnd.googleapps.document'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Google Sheets
      driveService.drive.files.list({
        q: "trashed=false and mimeType='application/vnd.googleapps.spreadsheet'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Google Slides
      driveService.drive.files.list({
        q: "trashed=false and mimeType='application/vnd.googleapps.presentation'",
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Images
      driveService.drive.files.list({
        q: "trashed=false and (mimeType contains 'image/')",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // Videos
      driveService.drive.files.list({
        q: "trashed=false and (mimeType contains 'video/')",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // PDFs
      driveService.drive.files.list({
        q: "trashed=false and mimeType='application/pdf'",
        fields: 'files(id,size)',
        pageSize: 1000,
      }),
      // Shared files
      driveService.drive.files.list({
        q: 'trashed=false and sharedWithMe=true',
        fields: 'files(id)',
        pageSize: 1000,
      }),
      // Starred files
      driveService.drive.files.list({
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
      if (mimeType === 'application/vnd.googleapps.document') {
        filesByType.documents++
      } else if (mimeType === 'application/vnd.googleapps.spreadsheet') {
        filesByType.spreadsheets++
      } else if (mimeType === 'application/vnd.googleapps.presentation') {
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
    const quotaUsageInDrive = storageQuota?.usageInDrive ? parseInt(storageQuota.usageInDrive) : totalUsedBytes

    // Calculate comprehensive storage analytics with all Google Drive API statistics
    const storageAnalytics = {
      quota: {
        limit: quotaLimit,
        used: quotaUsage,
        usedInDrive: quotaUsageInDrive,
        usedInDriveTrash: storageQuota?.usageInDriveTrash ? parseInt(storageQuota.usageInDriveTrash) : 0,
        available: quotaLimit ? quotaLimit - quotaUsage : null,
        usagePercentage: quotaLimit ? Math.round((quotaUsage / quotaLimit) * 100) : null,
        hasUnlimitedStorage: !quotaLimit,
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
      systemCapabilities: {
        maxUploadSize: about.maxUploadSize ? parseInt(about.maxUploadSize) : null,
        canCreateDrives: about.canCreateDrives || false,
        maxImportSizes: about.maxImportSizes || {},
        importFormats: about.importFormats || {},
        exportFormats: about.exportFormats || {},
        folderColorPalette: about.folderColorPalette || [],
        driveThemes: about.driveThemes || [],
      },
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
