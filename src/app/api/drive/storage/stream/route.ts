import { auth } from '@/auth'
import { GoogleDriveService } from '@/lib/google-drive/service'
import { DriveFile } from '@/lib/google-drive/types'

/**
 * Progressive Storage Analytics with Server-Sent Events
 * Uses existing basecode service functions for efficiency and consistency
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return new Response('Authentication required', { status: 401 })
    }

    const driveService = new GoogleDriveService(session.accessToken)

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
          } catch (error) {
            isStreamClosed = true
          }
        }
        
        const closeStream = () => {
          if (!isStreamClosed) {
            isStreamClosed = true
            try {
              controller.close()
            } catch (error) {
              // Stream already closed
            }
          }
        }

        // Main analysis function using service basecode
        ;(async () => {
          try {
            // Step 1: Get user info and quota using service
            sendData('progress', { step: 'quota', message: 'Getting storage quota...' })
            
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
                  orderBy: 'modifiedTime desc',
                  includeTeamDriveItems: true,
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

                // Process files for statistics
                files.forEach((file: DriveFile) => {
                  const mimeType = file.mimeType || 'unknown'
                  const size = file.size ? parseInt(file.size.toString()) : 0
                  
                  // Count by type
                  filesByType[mimeType] = (filesByType[mimeType] || 0) + 1
                  fileSizesByType[mimeType] = (fileSizesByType[mimeType] || 0) + size
                  
                  // Track largest files
                  if (size > 0) {
                    largestFiles.push(file)
                    largestFiles.sort((a, b) => {
                      const sizeA = a.size ? parseInt(a.size.toString()) : 0
                      const sizeB = b.size ? parseInt(b.size.toString()) : 0
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