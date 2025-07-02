/**
 * Type definitions for detailed Google Drive file information
 * Extracted from the monolithic getFileDetails function for better maintainability
 */

import { DriveFile } from './types'

export interface UserInfo {
  displayName: string
  emailAddress: string
  photoLink?: string
}

export interface ImageLocation {
  latitude?: number
  longitude?: number
  altitude?: number
}

export interface ImageMediaMetadata {
  width?: number
  height?: number
  rotation?: number
  location?: ImageLocation
  time?: string
  cameraMake?: string
  cameraModel?: string
  exposureTime?: number
  aperture?: number
  flashUsed?: boolean
  focalLength?: number
  isoSpeed?: number
  meteringMode?: string
  sensor?: string
  exposureMode?: string
  colorSpace?: string
  whiteBalance?: string
  exposureBias?: number
  maxApertureValue?: number
  subjectDistance?: number
  lens?: string
}

export interface VideoMediaMetadata {
  width?: number
  height?: number
  durationMillis?: string
}

export interface ShortcutDetails {
  targetId?: string
  targetMimeType?: string
  targetResourceKey?: string
}

export interface ContentRestriction {
  readOnly?: boolean
  reason?: string
  restrictingUser?: UserInfo
  restrictionTime?: string
  type?: string
}

export interface LinkShareMetadata {
  securityUpdateEligible?: boolean
  securityUpdateEnabled?: boolean
}

export interface LabelInfo {
  labels?: Array<{
    id?: string
    revisionId?: string
    kind?: string
    fields?: Record<string, any>
  }>
}

export interface FileCapabilities {
  canAcceptOwnership?: boolean
  canAddChildren?: boolean
  canAddFolderFromAnotherDrive?: boolean
  canAddMyDriveParent?: boolean
  canChangeCopyRequiresWriterPermission?: boolean
  canChangeSecurityUpdateEnabled?: boolean
  canChangeViewersCanCopyContent?: boolean
  canComment?: boolean
  canCopy?: boolean
  canCreateGoogleWorkspaceTeamDrive?: boolean
  canDelete?: boolean
  canDeleteChildren?: boolean
  canDownload?: boolean
  canEdit?: boolean
  canListChildren?: boolean
  canModifyContent?: boolean
  canModifyContentRestriction?: boolean
  canModifyLabels?: boolean
  canMoveChildrenOutOfDrive?: boolean
  canMoveChildrenOutOfTeamDrive?: boolean
  canMoveChildrenWithinDrive?: boolean
  canMoveChildrenWithinTeamDrive?: boolean
  canMoveItemIntoTeamDrive?: boolean
  canMoveItemOutOfDrive?: boolean
  canMoveItemOutOfTeamDrive?: boolean
  canMoveItemWithinDrive?: boolean
  canMoveItemWithinTeamDrive?: boolean
  canMoveTeamDriveItem?: boolean
  canReadDrive?: boolean
  canReadLabels?: boolean
  canReadRevisions?: boolean
  canReadTeamDrive?: boolean
  canRemoveChildren?: boolean
  canRemoveMyDriveParent?: boolean
  canRename?: boolean
  canShare?: boolean
  canTrash?: boolean
  canTrashChildren?: boolean
  canUntrash?: boolean
}

/**
 * Additional metadata not included in the base DriveFile interface
 */
export interface FileDetailExtensions {
  description?: string
  lastModifyingUser?: UserInfo
  sharingUser?: UserInfo
  version?: string
  md5Checksum?: string
  sha1Checksum?: string
  sha256Checksum?: string
  quotaBytesUsed?: string
  viewed?: boolean
  explicitlyTrashed?: boolean
  folderColorRgb?: string
  fullFileExtension?: string
  fileExtension?: string
  originalFilename?: string
  headRevisionId?: string
  isAppAuthorized?: boolean
  copyRequiresWriterPermission?: boolean
  writersCanShare?: boolean
  hasAugmentedPermissions?: boolean
  teamDriveId?: string
  spaces?: string[]
  properties?: Record<string, string>
  appProperties?: Record<string, string>
  imageMediaMetadata?: ImageMediaMetadata
  videoMediaMetadata?: VideoMediaMetadata
  exportLinks?: Record<string, string>
  shortcutDetails?: ShortcutDetails
  contentRestrictions?: ContentRestriction[]
  resourceKey?: string
  linkShareMetadata?: LinkShareMetadata
  labelInfo?: LabelInfo
}

/**
 * Extended file details interface - combines DriveFile with detailed metadata
 * Uses intersection type to avoid conflicts with existing DriveFile properties
 */
export type DetailedDriveFile = DriveFile &
  FileDetailExtensions & {
    capabilities?: FileCapabilities // Override with more detailed capabilities
  }
