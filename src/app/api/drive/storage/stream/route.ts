import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'
import { DriveFile } from '@/lib/google-drive/types'
import { initDriveService } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { withErrorHandling } from '@/lib/error-handler'

/**
 * Progressive Storage Analytics with Server-Sent Events
 * Uses existing basecode service functions for efficiency and consistency
 * Enhanced with comprehensive error handling and retry mechanisms
 */
export async function GET() {
  try {
    // Enhanced authentication and service initialization
    const authResult = await initDriveService()
    if (!authResult.success) {
      return new Response('Authentication required', { status: 401 })
    }

    const { session, driveService } = authResult

    // Setup Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        let isStreamClosed = false
        
        const sendData = (type: string, data: any) => {
          if (isStreamClosed) return
          try {
            const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch {
            isStreamClosed = true
          }
        }
        
        const closeStream = () => {
          if (!isStreamClosed) {
            isStreamClosed = true
            try {
              controller.close()
            } catch {
              // Stream already closed
            }
          }
        }

        // Main analysis function using service basecode
        ;(async () => {
          try {
            // Step 1: Get user info and quota using service
            sendData('progress', { step: 'quota', message: 'Getting storage quota...' })
            
            const userInfo = await withErrorHandling(
              () => retryDriveApiCall(() => driveService!.getUserInfo()),
              'SSE Storage Analytics - Get User Info'
            )
            
            // Safe number parsing with null checks
            const parseQuotaNumber = (value: string | undefined | null): number => {
              if (!value || value === 'null' || value === 'undefined') return 0
              const parsed = parseInt(value.toString(), 10)
              return isNaN(parsed) ? 0 : parsed
            }

            const limit = parseQuotaNumber(userInfo.storageQuota?.limit)
            const used = parseQuotaNumber(userInfo.storageQuota?.usage)
            const usedInDrive = parseQuotaNumber(userInfo.storageQuota?.usageInDrive)

            const quotaData = {
              limit: limit > 0 ? limit : null,
              used,
              usedInDrive,
              available: limit > 0 ? limit - used : null,
              usagePercentage: limit > 0 ? Math.round((used / limit) * 100) : null,
            }

            const user = {
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture || '',
            }

            sendData('quota_update', { user, quota: quotaData })

            // Step 2: Analyze files using service listFiles function
            sendData('progress', { step: 'file_analysis', message: 'Analyzing files...' })
            
            let allFiles: DriveFile[] = []
            let pageToken: string | undefined
            let totalProcessed = 0
            const filesByType: Record<string, number> = {}
            const fileSizesByType: Record<string, number> = {}
            const largestFiles: DriveFile[] = []

            // Use service listFiles with optimized pagination
            do {
              try {
                // Use service function with retry + throttle built-in
                const listOptions: any = {
                  pageSize: 1000, // Maximum for efficiency  
                //  orderBy: 'modifiedTime desc',
                  includeTeamDriveItems: true,
                  // Force use of LIST_STANDARD fields to get size data
                  fields: 'nextPageToken,files(id,name,mimeType,size)',
                }
                
                // Only add pageToken if it exists
                if (pageToken) {  
                  listOptions.pageToken = pageToken
                }
                
                const response = await driveService.listFiles(listOptions)

                const files = response.files || []
                allFiles = [...allFiles, ...files]
                totalProcessed += files.length
                pageToken = response.nextPageToken || undefined

                // Process files for statistics with safe number parsing
                files.forEach((file: DriveFile) => {
                  const mimeType = file.mimeType || 'unknown'
                  
                  // Skip folders - they don't have meaningful sizes
                  if (mimeType === 'application/vnd.google-apps.folder') {
                    filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
                    fileSizesByType[mimeType] = (fileSizesByType[mimeType] || 0) + 0
                    return
                  }
                  
                  // Safe file size parsing - Google Drive returns size as string
                  const sizeValue = file.size
                  let size = 0
                  
                  // Debug logging for first few files per batch  
                  const isFirstBatch = totalProcessed <= 10
                  if (isFirstBatch) {
                    console.log(`[Storage Debug] File: ${file.name}`)
                    console.log(`[Storage Debug] - Size: "${sizeValue}" (${typeof sizeValue})`)
                    console.log(`[Storage Debug] - MimeType: ${mimeType}`)
                    console.log(`[Storage Debug] - Full file object:`, JSON.stringify(file, null, 2))
                  }
                  
                  // Parse file size properly - Google Drive API returns it as string
                  if (sizeValue != null && sizeValue !== '' && sizeValue !== 'null' && sizeValue !== 'undefined') {
                    if (typeof sizeValue === 'string') {
                      const parsed = parseInt(sizeValue, 10)
                      size = isNaN(parsed) ? 0 : parsed
                    } else if (typeof sizeValue === 'number') {
                      size = sizeValue
                    }
                    
                    if (isFirstBatch) {
                      console.log(`[Storage Debug] - Parsed size: ${size} bytes`)
                    }
                  } else {
                    if (isFirstBatch) {
                      console.log(`[Storage Debug] - No size data available`)
                    }
                  }
                  
                  // Count by type
                  filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
                  fileSizesByType[mimeType] = (fileSizesByType[mimeType] || 0) + size
                  
                  // Track largest files
                  if (size > 0) {
                    largestFiles.push(file)
                    largestFiles.sort((a, b) => {
                      const sizeA = a.size ? (parseInt(a.size.toString(), 10) || 0) : 0
                      const sizeB = b.size ? (parseInt(b.size.toString(), 10) || 0) : 0
                      return sizeB - sizeA
                    })
                    
                    // Keep only top 10
                    if (largestFiles.length > 10) {
                      largestFiles.splice(10)
                    }
                  }
                })

                // Send progress update
                sendData('progress_update', {
                  totalProcessed,
                  hasMore: !!pageToken,
                  currentBatch: files.length,
                })

                // Real-time file stats update
                const topTypes = Object.entries(filesByType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([type, count]) => ({
                    type,
                    count,
                    totalSize: fileSizesByType[type] || 0,
                  }))

                sendData('file_stats_update', {
                  totalFiles: totalProcessed,
                  topFileTypes: topTypes,
                  largestFiles: largestFiles.slice(0, 5),
                })

              } catch (error: any) {
                if (error.message?.includes('timeout') || error.code === 504) {
                  sendData('progress', { 
                    step: 'timeout_continue', 
                    message: `Analysis timeout. Processed ${totalProcessed} files. Results available.`,
                    isComplete: true,
                    canContinue: !!pageToken,
                    nextPageToken: pageToken
                  })
                  break
                }
                throw error
              }

            } while (pageToken && totalProcessed < 100000) // Reasonable limit

            // Step 3: Final analysis and categorization
            sendData('progress', { step: 'final_analysis', message: 'Generating final report...' })

            // Categorize files by type
            const categories = {
              documents: 0,
              images: 0,
              videos: 0,
              audio: 0,
              archives: 0,
              spreadsheets: 0,
              presentations: 0,
              other: 0,
            }

            const categorySizes = {
              documents: 0,
              images: 0,
              videos: 0,
              audio: 0,
              archives: 0,
              spreadsheets: 0,
              presentations: 0,
              other: 0,
            }

            Object.entries(filesByType).forEach(([mimeType, count]) => {
              const size = fileSizesByType[mimeType] || 0
              
              if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) {
                categories.documents += count
                categorySizes.documents += size
              } else if (mimeType.includes('image')) {
                categories.images += count
                categorySizes.images += size
              } else if (mimeType.includes('video')) {
                categories.videos += count
                categorySizes.videos += size
              } else if (mimeType.includes('audio')) {
                categories.audio += count
                categorySizes.audio += size
              } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
                categories.archives += count
                categorySizes.archives += size
              } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
                categories.spreadsheets += count
                categorySizes.spreadsheets += size
              } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
                categories.presentations += count
                categorySizes.presentations += size
              } else {
                categories.other += count
                categorySizes.other += size
              }
            })

            // Send final comprehensive results
            sendData('analysis_complete', {
              summary: {
                totalFiles: totalProcessed,
                totalCategories: Object.keys(filesByType).length,
                processedAt: new Date().toISOString(),
              },
              categories,
              categorySizes,
              filesByType: Object.entries(filesByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20),
              fileSizesByType: Object.entries(fileSizesByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20),
              largestFiles: largestFiles.slice(0, 10),
            })

            sendData('complete', { 
              message: `Analysis complete! Processed ${totalProcessed} files.`,
              totalProcessed 
            })

          } catch (error: any) {
            console.error('Storage analysis error:', error)
            sendData('error', { 
              message: error.message || 'Analysis failed',
              canRetry: true 
            })
          } finally {
            closeStream()
          }
        })()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('Storage stream error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}