export interface DriveFileCapabilities {
  canCopy?: boolean
  canDelete?: boolean
  canDownload?: boolean
  canEdit?: boolean
  canRename?: boolean
  canShare?: boolean
  canTrash?: boolean
  canUntrash?: boolean
  canMoveItemWithinDrive?: boolean
  canMoveItemOutOfDrive?: boolean
  canAddChildren?: boolean
  canListChildren?: boolean
  canRemoveChildren?: boolean
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime: string
  modifiedTime: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  md5Checksum?: string
  parents?: string[]
  owners?: Array<{
    displayName: string
    emailAddress: string
    photoLink?: string
  }>
  permissions?: Array<{
    id: string
    type: string
    role: string
    emailAddress?: string
  }>
  shared?: boolean
  starred?: boolean
  trashed?: boolean
  ownedByMe?: boolean
  viewedByMeTime?: string
  viewedByMe?: boolean
  capabilities?: DriveFileCapabilities
  // File organization features
  autoTags?: string[]
  manualTags?: string[]
}

export interface TaggingCondition {
  fileName?: RegExp | string
  mimeType?: string[]
  fileSize?: { min?: number; max?: number }
  parentFolder?: string[]
  keywords?: string[]
}

export interface TaggingRule {
  id: string
  name: string
  condition: TaggingCondition
  tags: string[]
  category?: string
  enabled: boolean
  priority: number
}

export interface OrganizationSettings {
  autoTagging: boolean
  smartCategorization: boolean
  customRules: TaggingRule[]
  tagSuggestions: boolean
  duplicateDetection: boolean
}

export interface DriveFolder {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  thumbnailLink?: string
  parents?: string[]
  shared?: boolean
  trashed?: boolean
  starred?: boolean
  capabilities?: DriveFileCapabilities
  owners?: Array<{
    displayName: string
    emailAddress: string
    photoLink?: string
  }>
  ownedByMe?: boolean
}

export interface DriveFileMetadata {
  id?: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  parents?: string[]
  shared?: boolean
  trashed?: boolean
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  iconLink?: string
  description?: string
  starred?: boolean
  explicitlyTrashed?: boolean
  exportLinks?: Record<string, string>
}

export interface DriveUploadOptions {
  file: File
  metadata: DriveFileMetadata
  parentId?: string
  onProgress?: (_progress: number) => void
}

export interface DriveSearchOptions {
  query?: string
  parentId?: string
  mimeType?: string
  pageSize?: number
  pageToken?: string
  orderBy?: string
  includeTeamDriveItems?: boolean
  fields?: string // Custom fields parameter for specific operations like storage analytics
}

export interface BulkOperationItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  parentId?: string
}

export interface DriveSearchResult {
  files: DriveFile[]
  nextPageToken?: string | null
  incompleteSearch: boolean
}

export interface DrivePermission {
  type: 'user' | 'group' | 'domain' | 'anyone'
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'
  emailAddress?: string
  domain?: string
  allowFileDiscovery?: boolean
  sendNotificationEmail?: boolean
}

export interface DriveUserInfo {
  id: string
  name: string
  email: string
  picture?: string
  storageQuota?: {
    limit: string
    usage: string
    usageInDrive: string
    usageInDriveTrash: string
  }
}

export interface TaggingCondition {
  fileName?: RegExp | string
  mimeType?: string[]
  fileSize?: { min?: number; max?: number }
  parentFolder?: string[]
  keywords?: string[]
}

export interface TaggingRule {
  id: string
  name: string
  condition: TaggingCondition
  tags: string[]
  category?: string
  enabled: boolean
  priority: number
}

export interface OrganizationSettings {
  autoTagging: boolean
  smartCategorization: boolean
  customRules: TaggingRule[]
  tagSuggestions: boolean
  duplicateDetection: boolean
}
