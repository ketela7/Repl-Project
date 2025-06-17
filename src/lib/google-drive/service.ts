import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { createDriveClient } from './config';
import { 
  DriveFile, 
  DriveFolder, 
  DriveSearchOptions, 
  DriveSearchResult, 
  DriveUploadOptions,
  DrivePermission,
  DriveUserInfo,
  DriveFileMetadata 
} from './types';
import { 
  convertGoogleDriveFile, 
  convertGoogleDriveFolder, 
  buildSearchQuery,
  getMimeTypeFromFileName 
} from './utils';

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor(accessToken: string) {
    this.drive = createDriveClient(accessToken);
  }

  async getUserInfo(): Promise<DriveUserInfo> {
    const [userResponse, aboutResponse] = await Promise.all([
      google.oauth2({ version: 'v2', auth: this.drive.context._options.auth }).userinfo.get(),
      this.drive.about.get({ fields: 'user,storageQuota' })
    ]);

    const user = userResponse.data;
    const about = aboutResponse.data;

    return {
      id: user.id!,
      name: user.name!,
      email: user.email!,
      picture: user.picture ?? undefined,
      storageQuota: about.storageQuota ? {
        limit: about.storageQuota.limit!,
        usage: about.storageQuota.usage!,
        usageInDrive: about.storageQuota.usageInDrive!,
        usageInDriveTrash: about.storageQuota.usageInDriveTrash!,
      } : undefined,
    };
  }

  async listFiles(options: Partial<DriveSearchOptions> = {}): Promise<DriveSearchResult> {
    const {
      parentId,
      query,
      mimeType,
      pageToken,
      pageSize = 20,
      orderBy = 'folder,name',
    } = options;

    let q = buildSearchQuery({ parentId, query, mimeType });
    
    // Always exclude trashed files unless specifically searching in trash
    if (!q.includes('trashed=true')) {
      if (q.length > 0) {
        q += ' and trashed=false';
      } else {
        q = 'trashed=false';
      }
    }

    console.log('Drive API: Fetching files with options:', options);
    console.log('Drive API: Query string:', q);

    const response = await this.drive.files.list({
      q,
      orderBy,
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed, exportLinks)',
    });

    const files = response.data.files?.map(convertGoogleDriveFile) || [];
    console.log(`Drive API: Files fetched successfully, count: ${files.length}`);

    return {
      files,
      nextPageToken: response.data.nextPageToken,
      incompleteSearch: false,
    };
  }

  async getFile(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed, exportLinks',
    });

    return convertGoogleDriveFile(response.data);
  }

  async getFileDetails(fileId: string): Promise<DriveFile> {
    return this.getFile(fileId);
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id, name, createdTime, modifiedTime, parents',
    });

    return convertGoogleDriveFolder(response.data);
  }

  async getFolders(parentId?: string): Promise<DriveFolder[]> {
    const query = parentId 
      ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      orderBy: 'name',
      fields: 'files(id, name, createdTime, modifiedTime, parents)',
    });

    return response.data.files?.map(convertGoogleDriveFolder) || [];
  }

  async uploadFile(
    file: File | Buffer, 
    metadata: DriveFileMetadata, 
    options: DriveUploadOptions = {}
  ): Promise<DriveFile> {
    const { onProgress } = options;
    
    // Determine file content and MIME type
    let fileContent: Buffer;
    let mimeType: string;
    
    if (file instanceof File) {
      fileContent = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || getMimeTypeFromFileName(file.name);
    } else {
      fileContent = file;
      mimeType = metadata.mimeType || 'application/octet-stream';
    }

    const response = await this.drive.files.create({
      requestBody: {
        name: metadata.name,
        parents: metadata.parents,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: Readable.from(fileContent),
      },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    // Call progress callback if provided
    if (onProgress) {
      onProgress(100); // Simple progress indication
    }

    return convertGoogleDriveFile(response.data);
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const response = await this.drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });

    return response.data as ArrayBuffer;
  }

  async downloadFileStream(fileId: string): Promise<ReadableStream> {
    try {
      // First check if the file is downloadable
      const fileInfo = await this.drive.files.get({
        fileId,
        fields: 'mimeType, name'
      });

      const mimeType = fileInfo.data.mimeType;
      const fileName = fileInfo.data.name;

      // Check if it's a folder
      if (mimeType === 'application/vnd.google-apps.folder') {
        throw new Error('Cannot download folders. Folders are not downloadable files.');
      }

      // Check if it's a Google Workspace document
      if (mimeType?.startsWith('application/vnd.google-apps.') && 
          mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error(`Cannot download Google Workspace document "${fileName}". Use export functionality instead.`);
      }

      // Use arraybuffer instead of stream for more reliable handling
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'arraybuffer' });

      if (!response.data) {
        throw new Error('No file data received from Google Drive');
      }

      // Convert ArrayBuffer to ReadableStream
      const buffer = response.data as ArrayBuffer;
      const uint8Array = new Uint8Array(buffer);
      
      return new ReadableStream({
        start(controller) {
          controller.enqueue(uint8Array);
          controller.close();
        }
      });
    } catch (error: any) {
      console.error('Error in downloadFileStream:', error);
      
      // Handle specific error codes
      if (error.code === 403 || error.status === 403) {
        throw new Error('Access denied: File cannot be downloaded (403)');
      }
      
      if (error.code === 404 || error.status === 404) {
        throw new Error('File not found (404)');
      }
      
      if (error.code === 401 || error.status === 401) {
        throw new Error('Unauthorized access (401)');
      }

      throw new Error(`Failed to download file stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Unified permanent delete operation for both files and folders
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }

  // Alias for clarity - same operation works for both files and folders
  async deleteFolder(folderId: string): Promise<void> {
    return this.deleteFile(folderId);
  }

  // Unified move to trash operation for both files and folders
  async moveToTrash(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { trashed: true },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    return convertGoogleDriveFile(response.data);
  }

  // Alias for clarity - same operation works for both files and folders
  async moveFolderToTrash(folderId: string): Promise<DriveFile> {
    return this.moveToTrash(folderId);
  }

  // Unified restore from trash operation for both files and folders
  async restoreFromTrash(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { trashed: false },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    return convertGoogleDriveFile(response.data);
  }

  // Alias for clarity - same operation works for both files and folders
  async restoreFolderFromTrash(folderId: string): Promise<DriveFile> {
    return this.restoreFromTrash(folderId);
  }

  // Unified rename operation for both files and folders
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { name: newName },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    return convertGoogleDriveFile(response.data);
  }

  // Alias for clarity - same operation works for both files and folders
  async renameFolder(folderId: string, newName: string): Promise<DriveFile> {
    return this.renameFile(folderId, newName);
  }

  // Unified move operation for both files and folders
  async moveFile(fileId: string, newParentId: string, currentParentId?: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      addParents: newParentId,
      removeParents: currentParentId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    return convertGoogleDriveFile(response.data);
  }

  // Alias for clarity - same operation works for both files and folders
  async moveFolder(folderId: string, newParentId: string, currentParentId?: string): Promise<DriveFile> {
    return this.moveFile(folderId, newParentId, currentParentId);
  }

  // Copy operation - works for files, folders require special handling
  async copyFile(fileId: string, metadata: Partial<DriveFileMetadata>): Promise<DriveFile> {
    // First check if this is a folder
    const originalFile = await this.getFile(fileId);
    
    if (originalFile.mimeType === 'application/vnd.google-apps.folder') {
      // For folders, we need to create a new folder and copy contents
      return this.copyFolder(fileId, metadata);
    }

    const response = await this.drive.files.copy({
      fileId,
      requestBody: metadata,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

    return convertGoogleDriveFile(response.data);
  }

  // Special handling for folder copying
  async copyFolder(folderId: string, metadata: Partial<DriveFileMetadata>): Promise<DriveFile> {
    const originalFolder = await this.getFile(folderId);
    
    // Create new folder with the specified metadata
    const newFolder = await this.createFolder(
      metadata.name || `${originalFolder.name} - Copy`,
      metadata.parents?.[0]
    );

    // Note: For full folder copying with contents, we would need recursive copying
    // This creates an empty copy of the folder structure
    return convertGoogleDriveFile({
      id: newFolder.id,
      name: newFolder.name,
      mimeType: 'application/vnd.google-apps.folder',
      createdTime: newFolder.createdTime,
      modifiedTime: newFolder.modifiedTime,
      parents: newFolder.parents,
      shared: newFolder.shared,
      trashed: newFolder.trashed,
    });
  }

  // Unified sharing operation for both files and folders
  async shareFile(fileId: string, permission: DrivePermission): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      requestBody: permission,
      sendNotificationEmail: permission.sendNotificationEmail,
    });
  }

  // Alias for clarity - same operation works for both files and folders
  async shareFolder(folderId: string, permission: DrivePermission): Promise<void> {
    return this.shareFile(folderId, permission);
  }

  // Unified permissions retrieval for both files and folders
  async getFilePermissions(fileId: string) {
    const response = await this.drive.permissions.list({
      fileId,
      fields: 'permissions(id, type, role, emailAddress, domain)',
    });

    return response.data.permissions || [];
  }

  // Alias for clarity - same operation works for both files and folders
  async getFolderPermissions(folderId: string) {
    return this.getFilePermissions(folderId);
  }

  // Unified permission removal for both files and folders
  async removeFilePermission(fileId: string, permissionId: string): Promise<void> {
    await this.drive.permissions.delete({
      fileId,
      permissionId,
    });
  }

  // Alias for clarity - same operation works for both files and folders
  async removeFolderPermission(folderId: string, permissionId: string): Promise<void> {
    return this.removeFilePermission(folderId, permissionId);
  }

  async searchFiles(searchQuery: string, options: Partial<DriveSearchOptions> = {}): Promise<DriveSearchResult> {
    return this.listFiles({
      ...options,
      query: searchQuery,
    });
  }

  async getRecentFiles(limit: number = 20): Promise<DriveFile[]> {
    const result = await this.listFiles({
      pageSize: limit,
      orderBy: 'modifiedTime desc',
    });

    return result.files;
  }

  async getSharedFiles(): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'sharedWithMe=true and trashed=false',
      orderBy: 'modifiedTime desc',
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed)',
    });

    return response.data.files?.map(convertGoogleDriveFile) || [];
  }

  async getTrashedFiles(): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'trashed=true',
      orderBy: 'modifiedTime desc',
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed)',
    });

    return response.data.files?.map(convertGoogleDriveFile) || [];
  }
}