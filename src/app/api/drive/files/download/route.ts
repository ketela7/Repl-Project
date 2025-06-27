
import { NextRequest, NextResponse } from 'next/server'

import { initDriveService, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await initDriveService()
    if (!authResult.success) {
      return authResult.response!
    }

    const body = await request.json()
    const { items, downloadMode } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const results = []
    const errors = []

    // Only process files, not folders
    const filesToProcess = items.filter((item) => !item.isFolder)

    if (downloadMode === 'exportLinks') {
      // Generate CSV with download links
      for (const item of filesToProcess) {
        try {
          const file = await authResult.driveService!.getFile(item.id)
          results.push({
            id: item.id,
            name: item.name,
            downloadUrl: file.webContentLink || file.webViewLink,
            success: true,
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

      // Generate CSV content
      const csvHeaders = 'File Name,Download Link\n'
      const csvRows = results
        .filter((item) => item.downloadUrl)
        .map((item) => `"${item.name}","${item.downloadUrl}"`)
        .join('\n')

      const csvContent = csvHeaders + csvRows

      // Return CSV as blob
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="download-links-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // For other download modes, return JSON with results
      for (const item of filesToProcess) {
        try {
          const file = await authResult.driveService!.getFile(item.id)
          results.push({
            id: item.id,
            name: item.name,
            downloadUrl: file.webContentLink || file.webViewLink,
            success: true,
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
        total: filesToProcess.length,
        successCount: results.length,
        errorCount: errors.length,
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
