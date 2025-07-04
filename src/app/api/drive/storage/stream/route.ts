import { DriveFile } from '@/lib/google-drive/types'
import { initDriveService } from '@/lib/api-utils'
import { retryDriveApiCall } from '@/lib/api-retry'
import { withErrorHandling } from '@/lib/error-handler'
import { countFilesByCategory, getFileTypeCategory } from '@/lib/mime-type-filter'
import { getOptimizedFields } from '@/lib/google-drive/field-optimization'

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

    const { driveService } = authResult

    // Setup Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
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

        // Progressive analysis with enhanced error handling
        try {
          try {
            // Step 1: Get user info and quota using service
            sendData('progress', { step: 'quota', message: 'Getting storage quota...' })

            const userInfo = await withErrorHandling(
              () => retryDriveApiCall(() => driveService!.getUserInfo()),
              'SSE Storage Analytics - Get User Info',
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
              // name: userInfo.name,
              // email: userInfo.email,
              // picture: userInfo.picture || '',
            }

            sendData('quota_update', { user, quota: quotaData })

            // Step 2: Analyze files using service listFiles function
            sendData('progress', { step: 'file_analysis', message: 'Analyzing files...' })

            let allFiles: DriveFile[] = []
            let pageToken: string | undefined
            let totalProcessed = 0
            let totalSizeBytes = 0
            const filesByType: Record<string, number> = {}
            const fileSizesByType: Record<string, number> = {}
            const largestFiles: DriveFile[] = []
            const duplicateMap: Record<string, DriveFile[]> = {} // MD5 hash -> files array
            const fileNameMap: Record<string, DriveFile[]> = {} // filename -> files array

            // Use service listFiles with optimized pagination
            do {
              try {
                // Use service function with custom fields for storage analytics
                const listOptions: {
                  fields: string
                  pageToken?: string
                } = {
                  fields: getOptimizedFields('STORAGE_ANALYTICS'),
                }

                // Only add pageToken if it exists
                if (pageToken) {
                  listOptions.pageToken = pageToken
                }

                const response = await driveService!.listFiles(listOptions)

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
                    console.log(
                      `[Storage Debug] - Full file object:`,
                      JSON.stringify(file, null, 2),
                    )
                  }

                  // Parse file size properly - Google Drive API returns it as string
                  if (
                    sizeValue != null &&
                    sizeValue !== '' &&
                    sizeValue !== 'null' &&
                    sizeValue !== 'undefined'
                  ) {
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

                  // Track duplicate files by MD5 hash
                  if (file.md5Checksum && size > 0) {
                    const md5Hash = file.md5Checksum
                    if (!duplicateMap[md5Hash]) {
                      duplicateMap[md5Hash] = []
                    }
                    duplicateMap[md5Hash].push(file)
                  }

                  // Track duplicate files by filename (normalize for better matching)
                  if (file.name && size > 0) {
                    const normalizedName = file.name.trim().toLowerCase()
                    if (!fileNameMap[normalizedName]) {
                      fileNameMap[normalizedName] = []
                    }
                    fileNameMap[normalizedName].push(file)
                  }

                  // Track largest files
                  if (size > 0) {
                    totalSizeBytes += size
                    largestFiles.push(file)
                    largestFiles.sort((a, b) => {
                      const sizeA = a.size ? parseInt(a.size.toString(), 10) || 0 : 0
                      const sizeB = b.size ? parseInt(b.size.toString(), 10) || 0 : 0
                      return sizeB - sizeA
                    })

                    // Keep only top 50 for better analysis
                    if (largestFiles.length > 50) {
                      largestFiles.splice(50)
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
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([type, count]) => ({
                    type,
                    count,
                    totalSize: fileSizesByType[type] || 0,
                  }))

                sendData('file_stats_update', {
                  totalSizeBytes,
                  totalFiles: totalProcessed,
                  topFileTypes: topTypes,
                  largestFiles: largestFiles.slice(0, 50),
                })
              } catch (error: any) {
                if (error.message?.includes('timeout') || error.code === 504) {
                  sendData('progress', {
                    step: 'timeout_continue',
                    message: `Analysis timeout. Processed ${totalProcessed} files. Results available.`,
                    isComplete: true,
                    canContinue: !!pageToken,
                    nextPageToken: pageToken,
                  })
                  break
                }
                throw error
              }
            } while (pageToken) // Reasonable limit

            // Step 3: Final analysis and categorization using existing basecode functions
            sendData('progress', { step: 'final_analysis', message: 'Generating final report...' })

            // Use existing countFilesByCategory function for all 27 categories
            const fileListForCategorization = Object.entries(filesByType).flatMap(
              ([mimeType, count]) => Array(count).fill({ mimeType }),
            )
            const categories = countFilesByCategory(fileListForCategorization)

            // Calculate category sizes using existing file type categorization
            const categorySizes: Record<string, number> = {}
            Object.keys(categories).forEach(category => {
              categorySizes[category] = 0
            })

            Object.entries(filesByType).forEach(([mimeType]) => {
              const size = fileSizesByType[mimeType] || 0
              const category = getFileTypeCategory(mimeType)
              categorySizes[category] = (categorySizes[category] || 0) + size
            })

            // Process duplicate files detection
            sendData('progress', {
              step: 'duplicate_detection',
              message: 'Detecting duplicate files...',
            })

            // Debug: Log duplicate detection process
            console.log(
              `[Duplicate Debug] Total MD5 hashes tracked: ${Object.keys(duplicateMap).length}`,
            )
            console.log(
              `[Duplicate Debug] Total filenames tracked: ${Object.keys(fileNameMap).length}`,
            )
            console.log(
              `[Duplicate Debug] Files with MD5: ${Object.values(duplicateMap).flat().length}`,
            )

            // Comprehensive duplicate detection: MD5 hash + filename matching
            const duplicateGroups: Array<{
              identifier: string
              type: 'md5' | 'filename'
              files: DriveFile[]
              totalSize: number
              wastedSpace: number
            }> = []

            // Process MD5 hash duplicates
            Object.entries(duplicateMap)
              .filter(([, files]) => files.length > 1)
              .forEach(([md5Hash, files]) => {
                const sortedFiles = files.sort((a, b) => {
                  const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0
                  const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0
                  return timeB - timeA || (a.name || '').localeCompare(b.name || '')
                })

                const fileSize = sortedFiles[0]?.size
                  ? parseInt(sortedFiles[0].size.toString(), 10) || 0
                  : 0
                const totalSize = fileSize * sortedFiles.length
                const wastedSpace = fileSize * (sortedFiles.length - 1)

                duplicateGroups.push({
                  identifier: md5Hash,
                  type: 'md5',
                  files: sortedFiles,
                  totalSize,
                  wastedSpace,
                })
              })

            // Process filename duplicates (exclude files already found in MD5 duplicates)
            const md5DuplicateFileIds = new Set(
              Object.values(duplicateMap)
                .filter(files => files.length > 1)
                .flat()
                .map(file => file.id),
            )

            Object.entries(fileNameMap)
              .filter(([, files]) => files.length > 1)
              .forEach(([filename, files]) => {
                // Filter out files already included in MD5 duplicates
                const uniqueFiles = files.filter(file => !md5DuplicateFileIds.has(file.id))

                if (uniqueFiles.length > 1) {
                  const sortedFiles = uniqueFiles.sort((a, b) => {
                    const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0
                    const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0
                    return timeB - timeA || (a.name || '').localeCompare(b.name || '')
                  })

                  // Calculate total size and wasted space for filename duplicates
                  const totalSize = sortedFiles.reduce((sum, file) => {
                    const size = file.size ? parseInt(file.size.toString(), 10) || 0 : 0
                    return sum + size
                  }, 0)

                  // For filename duplicates, we assume the smallest file should be kept
                  const sizes = sortedFiles.map(file =>
                    file.size ? parseInt(file.size.toString(), 10) || 0 : 0,
                  )
                  const minSize = Math.min(...sizes)
                  const wastedSpace = totalSize - minSize

                  duplicateGroups.push({
                    identifier: filename,
                    type: 'filename',
                    files: sortedFiles,
                    totalSize,
                    wastedSpace,
                  })
                }
              })

            // Sort all duplicate groups by wasted space (highest first)
            duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace)

            console.log(`[Duplicate Debug] Found ${duplicateGroups.length} total duplicate groups`)
            console.log(
              `[Duplicate Debug] - MD5 duplicates: ${duplicateGroups.filter(g => g.type === 'md5').length}`,
            )
            console.log(
              `[Duplicate Debug] - Filename duplicates: ${duplicateGroups.filter(g => g.type === 'filename').length}`,
            )

            duplicateGroups.slice(0, 5).forEach((group, index) => {
              console.log(
                `[Duplicate Debug] Group ${index + 1} (${group.type}): ${group.files.length} copies, ${group.wastedSpace} bytes wasted`,
              )
            })

            // Send final comprehensive results
            sendData('analysis_complete', {
              summary: {
                totalFiles: totalProcessed,
                totalSizeBytes,
                totalCategories: Object.keys(filesByType).length,
                processedAt: new Date().toISOString(),
              },
              categories,
              categorySizes,
              filesByType: Object.entries(filesByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 50), // Increased from 20 to 50
              fileSizesByType: Object.entries(fileSizesByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 50), // Increased from 20 to 50
              largestFiles: largestFiles.slice(0, 50), // Increased from 20 to 50
              duplicateFiles: duplicateGroups, // Include all duplicate files
            })

            sendData('complete', {
              message: `Analysis complete! Processed ${totalProcessed} files.`,
              totalProcessed,
            })
          } catch (error: any) {
            console.error('Storage analysis error:', error)
            sendData('error', {
              message: error.message || 'Analysis failed',
              canRetry: true,
            })
          } finally {
            closeStream()
          }
        } catch (error) {
          console.error('Storage analysis error:', error)
          sendData('error', {
            message: 'Analysis failed. Please try again.',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  } catch (error) {
    console.error('Storage analysis error:', error)
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
