export interface DriveFileCapabilities {
  canCopy?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
  canRename?: boolean;
  canShare?: boolean;
  canTrash?: boolean;
  canUntrash?: boolean;
  canMoveItemWithinDrive?: boolean;
  canMoveItemOutOfDrive?: boolean;
  canAddChildren?: boolean;
  canListChildren?: boolean;
  canRemoveChildren?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  }>;
  permissions?: Array<{
    id: string;
    type: string;
    role: string;
    emailAddress?: string;
  }>;
  shared?: boolean;
  trashed?: boolean;
  capabilities?: DriveFileCapabilities;
}

export interface DriveFolder {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  shared?: boolean;
  trashed?: boolean;
  capabilities?: DriveFileCapabilities;
}

export interface DriveFileMetadata {
  name: string;
  parents?: string[];
  description?: string;
  mimeType?: string;
}

export interface DriveUploadOptions {
  file: File;
  metadata: DriveFileMetadata;
  parentId?: string;
  onProgress?: (progress: number) => void;
}

export interface DriveSearchOptions {
  query?: string;
  parentId?: string;
  mimeType?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  includeTeamDriveItems?: boolean;
}

export interface DriveSearchResult {
  files: DriveFile[];
  nextPageToken?: string | null;
  incompleteSearch: boolean;
}

export interface DrivePermission {
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  allowFileDiscovery?: boolean;
  sendNotificationEmail?: boolean;
}

export interface DriveUserInfo {
  id: string;
  name: string;
  email: string;
  picture?: string;
  storageQuota?: {
    limit: string;
    usage: string;
    usageInDrive: string;
    usageInDriveTrash: string;
  };
}