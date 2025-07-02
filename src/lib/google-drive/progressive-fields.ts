/**
 * Progressive field loading for FileDetailsDialog optimization
 * Splits heavy DETAILS_FULL into multiple stages for better performance
 */

/**
 * Stage 1: Basic info (available from list cache - 0ms)
 * Data already available from main file list
 */
export const BASIC_FIELDS =
  'id,name,mimeType,size,createdTime,modifiedTime,owners(displayName,emailAddress),shared,trashed,starred'

/**
 * Stage 2: Essential details (~200ms response)
 * Critical info for immediate display
 */
export const ESSENTIAL_FIELDS = `
  ${BASIC_FIELDS},
  webViewLink,
  thumbnailLink,
  capabilities(canEdit,canShare,canDelete,canDownload,canCopy,canTrash,canUntrash,canRename,canMoveItemWithinDrive),
  permissions(id,type,role,emailAddress,displayName,photoLink),
  lastModifyingUser(displayName,emailAddress,photoLink),
  ownedByMe,
  viewed,
  viewedByMe,
  viewedByMeTime
`.replace(/\s+/g, '')

/**
 * Stage 3: Extended metadata (background loading)
 * Nice-to-have info loaded asynchronously
 */
export const EXTENDED_FIELDS = `
  ${ESSENTIAL_FIELDS},
  parents,
  properties,
  appProperties,
  spaces,
  version,
  headRevisionId,
  resourceKey,
  driveId,
  teamDriveId,
  sharingUser(displayName,emailAddress,photoLink),
  quotaBytesUsed,
  folderColorRgb,
  copyRequiresWriterPermission,
  writersCanShare,
  hasAugmentedPermissions,
  permissionIds,
  originalFilename,
  fullFileExtension,
  fileExtension,
  md5Checksum,
  sha1Checksum,
  sha256Checksum,
  contentRestrictions,
  contentHints,
  linkShareMetadata
`.replace(/\s+/g, '')

/**
 * Performance monitoring for progressive loading
 */
export interface ProgressiveLoadingMetrics {
  basicLoadTime: number
  essentialLoadTime: number
  extendedLoadTime: number
  totalLoadTime: number
  cacheHit: boolean
}

/**
 * Progressive loading stages
 */
export enum LoadingStage {
  BASIC = 'basic',
  ESSENTIAL = 'essential',
  EXTENDED = 'extended',
  COMPLETE = 'complete',
}

// Export individual constants for use without enum - currently used in configuration
// These are exported for external consumption but may not be used internally

export const BASIC = LoadingStage.BASIC

export const ESSENTIAL = LoadingStage.ESSENTIAL

export const EXTENDED = LoadingStage.EXTENDED

export const COMPLETE = LoadingStage.COMPLETE

/**
 * Field configuration for each stage
 */
export const PROGRESSIVE_FIELD_CONFIG = {
  [LoadingStage.BASIC]: {
    fields: BASIC_FIELDS,
    priority: 'immediate',
    cacheKey: 'basic',
    ttl: 5, // 5 minutes
  },
  [LoadingStage.ESSENTIAL]: {
    fields: ESSENTIAL_FIELDS,
    priority: 'high',
    cacheKey: 'essential',
    ttl: 15, // 15 minutes
  },
  [LoadingStage.EXTENDED]: {
    fields: EXTENDED_FIELDS,
    priority: 'background',
    cacheKey: 'extended',
    ttl: 60, // 60 minutes
  },
} as const

/**
 * Generate cache key for progressive loading
 */
export function generateProgressiveKey(fileId: string, userId: string, stage: LoadingStage): string {
  return `file-details:${stage}:${userId}:${fileId}`
}

/**
 * Estimate response size reduction with progressive loading
 */
export const PROGRESSIVE_BENEFITS = {
  basicVsExtended: 0.85, // 85% smaller
  essentialVsExtended: 0.65, // 65% smaller
  compressionBoost: 0.75, // Additional 75% with gzip
} as const
