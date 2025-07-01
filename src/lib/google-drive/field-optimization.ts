/**
 * Google Drive API Field Optimization
 * Optimizes API requests by requesting only necessary fields for each operation
 * This significantly improves request performance and reduces bandwidth usage
 */

// Base fields always needed for file identification and basic operations
const BASE_FIELDS = 'id,name,mimeType'

// Optimized field sets for different use cases
export const FIELD_SETS = {
  // Minimal fields for basic listing (fastest)
  LIST_BASIC: `${BASE_FIELDS},parents,trashed`,

  // Essential fields for file management operations - now includes owners and createdTime
  LIST_STANDARD: `${BASE_FIELDS},size,createdTime,modifiedTime,parents,owners(displayName,emailAddress),trashed,shared,capabilities(canEdit,canShare,canDelete,canDownload,canCopy,canTrash,canUntrash,canRename,canMoveItemWithinDrive)`,

  // Extended fields for detailed views
  LIST_DETAILED: `${BASE_FIELDS},size,createdTime,modifiedTime,webViewLink,thumbnailLink,parents,owners(displayName,emailAddress,photoLink),shared,trashed,starred,capabilities(canEdit,canShare,canDelete,canDownload,canCopy,canTrash,canUntrash,canRename,canMoveItemWithinDrive)`,

  // Complete fields for file details page - comprehensive technical details
  FILE_DETAILS: `${BASE_FIELDS},size,quotaBytesUsed,createdTime,modifiedTime,viewedByMeTime,sharedWithMeTime,webViewLink,webContentLink,thumbnailLink,iconLink,parents,owners,lastModifyingUser,sharingUser,shared,trashed,starred,viewed,ownedByMe,viewedByMe,description,properties,appProperties,capabilities,permissions,copyRequiresWriterPermission,writersCanShare,folderColorRgb,originalFilename,fullFileExtension,fileExtension,md5Checksum,sha1Checksum,sha256Checksum,headRevisionId,isAppAuthorized,hasAugmentedPermissions,spaces,version,teamDriveId,driveId,hasVisitedTeamDrive,exportLinks,shortcutDetails,contentRestrictions,resourceKey,linkShareMetadata,labelInfo,imageMediaMetadata,videoMediaMetadata`,

  // Ultra-comprehensive for Details Operations - ALL possible fields
  DETAILS_COMPLETE: '*', // Request all available fields for comprehensive details

  // Fields for download operations
  DOWNLOAD: `${BASE_FIELDS},webContentLink,size,mimeType`,

  // Fields for sharing operations
  SHARE: `${BASE_FIELDS},shared,permissions,capabilities`,

  // Fields for move/copy operations
  MOVE_COPY: `${BASE_FIELDS},parents,capabilities`,

  // Fields for search operations
  SEARCH: `${BASE_FIELDS},size,modifiedTime,parents,trashed,thumbnailLink`,

  // Fields for folder structure
  FOLDER_STRUCTURE: `${BASE_FIELDS},parents,trashed`,

  // Fields for drive info
  DRIVE_INFO: 'storageQuota,user',
} as const

/**
 * Get optimized fields for specific operations
 */
export function getOptimizedFields(operation: keyof typeof FIELD_SETS): string {
  return FIELD_SETS[operation]
}

/**
 * Dynamic field optimization based on UI context
 */
export interface FieldContext {
  showThumbnails?: boolean
  showOwners?: boolean
  showPermissions?: boolean
  showDetails?: boolean
  includeCapabilities?: boolean
}

export function getDynamicFields(baseOperation: keyof typeof FIELD_SETS, context: FieldContext = {}): string {
  const fields = FIELD_SETS[baseOperation].split(',')

  // Add optional fields based on context
  if (context.showThumbnails && !fields.includes('thumbnailLink')) {
    fields.push('thumbnailLink')
  }

  if (context.showOwners && !fields.includes('owners')) {
    fields.push('owners')
  }

  if (context.showPermissions && !fields.includes('permissions')) {
    fields.push('permissions')
  }

  if (context.showDetails) {
    if (!fields.includes('description')) fields.push('description')
    if (!fields.includes('properties')) fields.push('properties')
  }

  if (context.includeCapabilities && !fields.includes('capabilities')) {
    fields.push('capabilities')
  }

  return fields.join(',')
}

/**
 * Field optimization for different view modes
 */
export const VIEW_MODE_FIELDS = {
  // Grid view with thumbnails
  GRID: getDynamicFields('LIST_STANDARD', { showThumbnails: true }),

  // List view without thumbnails
  LIST: FIELD_SETS.LIST_STANDARD,

  // Compact view - minimal data
  COMPACT: FIELD_SETS.LIST_BASIC,

  // Detailed view - comprehensive data
  DETAILED: FIELD_SETS.LIST_DETAILED,
} as const

/**
 * Monitoring for field optimization performance
 */
interface FieldOptimizationMetrics {
  requestCount: number
  averageResponseTime: number
  dataSaved: number
  fieldsSaved: number
}

class FieldOptimizationMonitor {
  private metrics: Map<string, FieldOptimizationMetrics> = new Map()

  trackRequest(operation: string, responseTime: number, fieldsUsed: number) {
    const existing = this.metrics.get(operation) || {
      requestCount: 0,
      averageResponseTime: 0,
      dataSaved: 0,
      fieldsSaved: 0,
    }

    const newCount = existing.requestCount + 1
    const newAvgTime = (existing.averageResponseTime * existing.requestCount + responseTime) / newCount

    // Estimate fields saved (assuming full field set would be ~30 fields)
    const estimatedFullFields = 30
    const fieldsSaved = Math.max(0, estimatedFullFields - fieldsUsed)

    this.metrics.set(operation, {
      requestCount: newCount,
      averageResponseTime: newAvgTime,
      dataSaved: existing.dataSaved + fieldsSaved * 100, // Rough bytes estimate
      fieldsSaved: existing.fieldsSaved + fieldsSaved,
    })
  }

  getMetrics(): Record<string, FieldOptimizationMetrics> {
    return Object.fromEntries(this.metrics)
  }

  getTotalSavings(): {
    requestsOptimized: number
    estimatedDataSaved: number
    fieldsSaved: number
  } {
    return Array.from(this.metrics.values()).reduce(
      (acc, metric) => ({
        requestsOptimized: acc.requestsOptimized + metric.requestCount,
        estimatedDataSaved: acc.estimatedDataSaved + metric.dataSaved,
        fieldsSaved: acc.fieldsSaved + metric.fieldsSaved,
      }),
      { requestsOptimized: 0, estimatedDataSaved: 0, fieldsSaved: 0 },
    )
  }
}

export const fieldOptimizationMonitor = new FieldOptimizationMonitor()

/**
 * Utility to validate if required fields are present in response
 */
export function validateRequiredFields(response: any, requiredFields: string[]): boolean {
  return requiredFields.every(field => {
    const fieldPath = field.split('.')
    let current = response

    for (const path of fieldPath) {
      if (current == null || !(path in current)) {
        return false
      }
      current = current[path]
    }

    return true
  })
}
