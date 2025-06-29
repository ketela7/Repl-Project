/**
 * Download utilities for direct streaming from Google Drive
 * Simple implementation without blobs - direct browser downloads
 */

interface DownloadItem {
  id: string
  name: string
  isFolder?: boolean
  size?: string
}

/**
 * Download single file directly via GET endpoint
 * Opens in new tab for immediate browser download
 */
export function downloadSingleFile(fileId: string, fileName?: string): void {
  const downloadUrl = `/api/drive/files/download?fileId=${fileId}`
  window.open(downloadUrl, '_blank')
}

/**
 * Download multiple files using POST endpoint
 * For single files - streams directly
 * For multiple files - returns download URLs to open in new tabs
 */
export async function downloadFiles(items: DownloadItem[], downloadMode: string = 'direct', progressCallback?: (progress: any) => void): Promise<void> {
  // Filter out folders - only files can be downloaded
  const downloadableFiles = items.filter((item) => !item.isFolder)

  if (downloadableFiles.length === 0) {
    throw new Error('No files available for download')
  }

  // For single file, use direct streaming
  if (downloadableFiles.length === 1) {
    downloadSingleFile(downloadableFiles[0].id, downloadableFiles[0].name)
    return
  }

  // For multiple files, use POST endpoint
  try {
    const response = await fetch('/api/drive/files/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: downloadableFiles,
        downloadMode,
      }),
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Handle successful downloads by opening URLs in new tabs
    if (result.success && Array.isArray(result.success)) {
      result.success.forEach((item: any, index: number) => {
        setTimeout(() => {
          if (item.direct) {
            // Direct stream failed, use fallback URL
            window.open(item.downloadUrl, '_blank')
          } else {
            // Use fallback Google Drive URL
            window.open(item.downloadUrl, '_blank')
          }
        }, index * 500) // Stagger downloads to avoid browser blocking
      })
    }

    // Report progress
    if (progressCallback) {
      progressCallback({
        current: result.summary?.successful || 0,
        total: result.summary?.total || downloadableFiles.length,
        success: result.summary?.successful || 0,
        failed: result.summary?.failed || 0,
        skipped: result.summary?.skipped || 0,
      })
    }

    // Handle failures
    if (result.failed && result.failed.length > 0) {
      console.warn('Some downloads failed:', result.failed)
    }
  } catch (error) {
    console.error('Download operation failed:', error)
    throw error
  }
}

/**
 * Simple download handler for operations dialog
 */
export async function handleDownloadOperation(selectedItems: DownloadItem[], downloadMode: string = 'direct', progressCallback?: (progress: any) => void): Promise<void> {
  return downloadFiles(selectedItems, downloadMode, progressCallback)
}
