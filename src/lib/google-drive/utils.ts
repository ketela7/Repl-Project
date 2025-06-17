import { drive_v3 } from 'googleapis';
import { DriveFile, DriveFolder } from './types';

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  
  if (isNaN(size) || size === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getFileIcon(mimeType: string): string {
  const iconMap: Record<string, string> = {
    'application/vnd.google-apps.folder': '📁',
    'application/vnd.google-apps.document': '📄',
    'application/vnd.google-apps.spreadsheet': '📊',
    'application/vnd.google-apps.presentation': '📈',
    'application/vnd.google-apps.form': '📋',
    'application/vnd.google-apps.drawing': '🎨',
    'application/pdf': '📕',
    'text/plain': '📄',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.ms-powerpoint': '📈',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📈',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
    'image/gif': '🖼️',
    'image/svg+xml': '🖼️',
    'video/mp4': '🎥',
    'video/avi': '🎥',
    'video/mov': '🎥',
    'audio/mp3': '🎵',
    'audio/wav': '🎵',
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
  };
  
  return iconMap[mimeType] || '📄';
}

export function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps.');
}

/**
 * Extract folder ID from Google Drive URL or return the input if it's already an ID
 * Supports formats:
 * - https://drive.google.com/drive/folders/1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 * - https://drive.google.com/drive/u/0/folders/1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 * - Direct folder ID: 1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 */
export function extractFolderIdFromUrl(input: string): string | null {
  if (!input) return null;
  
  // Remove whitespace
  const cleanInput = input.trim();
  
  // If it's already a folder ID (no URL format), return it
  if (!cleanInput.includes('drive.google.com') && cleanInput.length > 10) {
    return cleanInput;
  }
  
  // Extract from various Google Drive URL formats
  const urlPatterns = [
    /\/drive\/folders\/([a-zA-Z0-9_-]+)/,  // Standard folder URL
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/, // User-specific folder URL
    /id=([a-zA-Z0-9_-]+)/, // Query parameter format
  ];
  
  for (const pattern of urlPatterns) {
    const match = cleanInput.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate if a string is a valid Google Drive folder ID
 */
export function isValidFolderId(id: string): boolean {
  if (!id) return false;
  // Google Drive IDs are typically 28-44 characters long and contain letters, numbers, hyphens, and underscores
  return /^[a-zA-Z0-9_-]{10,50}$/.test(id);
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.document',
  ];
  return documentTypes.includes(mimeType);
}

/**
 * Check if a file type supports preview functionality
 */
export function isPreviewable(mimeType: string): boolean {
  return isImageFile(mimeType) || 
         isVideoFile(mimeType) || 
         isAudioFile(mimeType) || 
         isDocumentFile(mimeType) ||
         isGoogleWorkspaceFile(mimeType);
}

/**
 * Generate preview URL for different media types
 */
export function getPreviewUrl(fileId: string, mimeType: string, webContentLink?: string): string {
  if (isImageFile(mimeType)) {
    // Use our direct download API for images
    return `/api/drive/download/${fileId}`;
  }
  
  if (isVideoFile(mimeType)) {
    // Simple Google Drive iframe streaming
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  if (isAudioFile(mimeType)) {
    // Use proxy audio for better streaming compatibility
    return `/api/audio-proxy/${fileId}`;
  }
  
  if (isDocumentFile(mimeType)) {
    if (mimeType.includes("google-apps")) {
      return `https://docs.google.com/document/d/${fileId}/preview`;
    }
    // For documents, use Google Docs Viewer or Drive preview
    return webContentLink
      ? `https://docs.google.com/gview?pid=explorer&efh=false&a=v&chrome=false&embedded=true&url=${encodeURIComponent(webContentLink)}`
      : `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  // Default fallback to Google Drive preview
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function convertGoogleDriveFile(file: drive_v3.Schema$File): DriveFile {
  return {
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    size: file.size ?? undefined,
    createdTime: file.createdTime!,
    modifiedTime: file.modifiedTime!,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    thumbnailLink: file.thumbnailLink ?? undefined,
    parents: file.parents ?? undefined,
    owners: file.owners?.map(owner => ({
      displayName: owner.displayName!,
      emailAddress: owner.emailAddress!,
      photoLink: owner.photoLink ?? undefined,
    })),
    shared: file.shared ?? undefined,
    trashed: file.trashed ?? undefined,
  };
}

export function convertGoogleDriveFolder(folder: drive_v3.Schema$File): DriveFolder {
  return {
    id: folder.id!,
    name: folder.name!,
    createdTime: folder.createdTime!,
    modifiedTime: folder.modifiedTime!,
    parents: folder.parents ?? undefined,
    shared: folder.shared ?? undefined,
    trashed: folder.trashed ?? undefined,
  };
}

export function buildSearchQuery(options: {
  name?: string;
  mimeType?: string;
  parentId?: string;
  trashed?: boolean;
  shared?: boolean;
}): string {
  const conditions: string[] = [];
  
  if (options.name) {
    conditions.push(`name contains '${options.name.replace(/'/g, "\\'")}'`);
  }
  
  if (options.mimeType) {
    conditions.push(`mimeType='${options.mimeType}'`);
  }
  
  if (options.parentId) {
    conditions.push(`'${options.parentId}' in parents`);
  }
  
  if (options.trashed !== undefined) {
    conditions.push(`trashed=${options.trashed}`);
  }
  
  if (options.shared !== undefined) {
    conditions.push(`sharedWithMe=${options.shared}`);
  }
  
  return conditions.join(' and ');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}