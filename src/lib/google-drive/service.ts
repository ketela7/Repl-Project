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
    // Use Drive API about endpoint for user info instead of OAuth2 userinfo API
    // This is the recommended approach according to Google Drive API documentation
    const aboutResponse = await this.drive.about.get({ 
      fields: 'user,storageQuota' 
    });

    const about = aboutResponse.data;
    const user = about.user;

    if (!user) {
      throw new Error('Unable to fetch user information from Drive API');
    }

    return {
      id: user.permissionId || 'unknown',
      name: user.displayName || 'Unknown User',
      email: user.emailAddress || '',
      picture: user.photoLink ?? undefined,
      storageQuota: about.storageQuota ? {
        limit: about.storageQuota.limit!,
        usage: about.storageQuota.usage!,
        usageInDrive: about.storageQuota.usageInDrive!,
        usageInDriveTrash: about.storageQuota.usageInDriveTrash!,
      } : undefined,
    };
  }

  async listFiles(options: DriveSearchOptions = {}): Promise<DriveSearchResult> {
    const {
      query,
      parentId,
      mimeType,
      pageSize = 50,
      pageToken,
      orderBy = 'modifiedTime desc',
      includeTeamDriveItems = false,
    } = options;

    // Use the query parameter directly if provided, otherwise build one
    let searchQuery = '';
    
    if (query) {
      // If query is already formatted (contains operators), use it directly
      if (query.includes('=') || query.includes('and') || query.includes('or')) {
        searchQuery = query;
      } else {
        // Otherwise treat it as a search term
        searchQuery = buildSearchQuery({
          name: query,
          parentId,
          mimeType,
          trashed: false,
        });
      }
    } else if (parentId || mimeType) {
      searchQuery = buildSearchQuery({
        parentId,
        mimeType,
        trashed: false,
      });
    } else {
      searchQuery = 'trashed=false';
    }

    console.log('Google Drive Service - Final Query:', searchQuery);

    const response = await this.drive.files.list({
      q: searchQuery,
      pageSize,
      pageToken,
      orderBy,
      includeItemsFromAllDrives: includeTeamDriveItems,
      supportsAllDrives: includeTeamDriveItems,
      fields: 'nextPageToken, incompleteSearch, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, parents, shared, trashed, starred, viewedByMeTime, capabilities, owners)',
    });

    const files = response.data.files?.map(convertGoogleDriveFile) || [];

    console.log(`Google Drive Service - Retrieved ${files.length} files`);

    return {
      files,
      nextPageToken: response.data.nextPageToken,
      incompleteSearch: response.data.incompleteSearch || false,
    };
  }

  async getFile(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, shared, trashed, starred, capabilities, owners',
    });

    return convertGoogleDriveFile(response.data);
  }

  async getFileDetails(fileId: string): Promise<DriveFile & { 
    description?: string;
    lastModifyingUser?: {
      displayName: string;
      emailAddress: string;
      photoLink?: string;
    };
    sharingUser?: {
      displayName: string;
      emailAddress: string;
      photoLink?: string;
    };
    version?: string;
    md5Checksum?: string;
    sha1Checksum?: string;
    sha256Checksum?: string;
    quotaBytesUsed?: string;
    starred?: boolean;
    viewed?: boolean;
    explicitlyTrashed?: boolean;
    folderColorRgb?: string;
    fullFileExtension?: string;
    fileExtension?: string;
    originalFilename?: string;
    headRevisionId?: string;
    isAppAuthorized?: boolean;
    copyRequiresWriterPermission?: boolean;
    writersCanShare?: boolean;
    hasAugmentedPermissions?: boolean;
    ownedByMe?: boolean;
    driveId?: string;
    teamDriveId?: string;
    spaces?: string[];
    properties?: Record<string, string>;
    appProperties?: Record<string, string>;
    imageMediaMetadata?: {
      width?: number;
      height?: number;
      rotation?: number;
      location?: {
        latitude?: number;
        longitude?: number;
        altitude?: number;
      };
      time?: string;
      cameraMake?: string;
      cameraModel?: string;
      exposureTime?: number;
      aperture?: number;
      flashUsed?: boolean;
      focalLength?: number;
      isoSpeed?: number;
      meteringMode?: string;
      sensor?: string;
      exposureMode?: string;
      colorSpace?: string;
      whiteBalance?: string;
      exposureBias?: number;
      maxApertureValue?: number;
      subjectDistance?: number;
      lens?: string;
    };
    videoMediaMetadata?: {
      width?: number;
      height?: number;
      durationMillis?: string;
    };
    exportLinks?: Record<string, string>;
    shortcutDetails?: {
      targetId?: string;
      targetMimeType?: string;
      targetResourceKey?: string;
    };
    contentRestrictions?: Array<{
      readOnly?: boolean;
      reason?: string;
      restrictingUser?: {
        displayName: string;
        emailAddress: string;
        photoLink?: string;
      };
      restrictionTime?: string;
      type?: string;
    }>;
    resourceKey?: string;
    linkShareMetadata?: {
      securityUpdateEligible?: boolean;
      securityUpdateEnabled?: boolean;
    };
    labelInfo?: {
      labels?: Array<{
        id?: string;
        revisionId?: string;
        kind?: string;
        fields?: Record<string, any>;
      }>;
    };
    capabilities?: {
      canAcceptOwnership?: boolean;
      canAddChildren?: boolean;
      canAddFolderFromAnotherDrive?: boolean;
      canAddMyDriveParent?: boolean;
      canChangeCopyRequiresWriterPermission?: boolean;
      canChangeSecurityUpdateEnabled?: boolean;
      canChangeViewersCanCopyContent?: boolean;
      canComment?: boolean;
      canCopy?: boolean;
      canCreateGoogleWorkspaceTeamDrive?: boolean;
      canDelete?: boolean;
      canDeleteChildren?: boolean;
      canDownload?: boolean;
      canEdit?: boolean;
      canListChildren?: boolean;
      canModifyContent?: boolean;
      canModifyContentRestriction?: boolean;
      canModifyLabels?: boolean;
      canMoveChildrenOutOfDrive?: boolean;
      canMoveChildrenOutOfTeamDrive?: boolean;
      canMoveChildrenWithinDrive?: boolean;
      canMoveChildrenWithinTeamDrive?: boolean;
      canMoveItemIntoTeamDrive?: boolean;
      canMoveItemOutOfDrive?: boolean;
      canMoveItemOutOfTeamDrive?: boolean;
      canMoveItemWithinDrive?: boolean;
      canMoveItemWithinTeamDrive?: boolean;
      canMoveTeamDriveItem?: boolean;
      canReadDrive?: boolean;
      canReadLabels?: boolean;
      canReadRevisions?: boolean;
      canReadTeamDrive?: boolean;
      canRemoveChildren?: boolean;
      canRemoveMyDriveParent?: boolean;
      canRename?: boolean;
      canShare?: boolean;
      canTrash?: boolean;
      canTrashChildren?: boolean;
      canUntrash?: boolean;
    };
  }> {
    const response = await this.drive.files.get({
      fileId,
      fields: '*',
    });

    const file = convertGoogleDriveFile(response.data);
    
    return {
      ...file,
      description: response.data.description || undefined,
      lastModifyingUser: response.data.lastModifyingUser ? {
        displayName: response.data.lastModifyingUser.displayName || '',
        emailAddress: response.data.lastModifyingUser.emailAddress || '',
        photoLink: response.data.lastModifyingUser.photoLink || undefined,
      } : undefined,
      sharingUser: response.data.sharingUser ? {
        displayName: response.data.sharingUser.displayName || '',
        emailAddress: response.data.sharingUser.emailAddress || '',
        photoLink: response.data.sharingUser.photoLink || undefined,
      } : undefined,
      version: response.data.version || undefined,
      md5Checksum: response.data.md5Checksum || undefined,
      sha1Checksum: response.data.sha1Checksum || undefined,
      sha256Checksum: response.data.sha256Checksum || undefined,
      quotaBytesUsed: response.data.quotaBytesUsed || undefined,
      starred: response.data.starred || false,
      viewed: response.data.viewedByMe || false,
      explicitlyTrashed: response.data.explicitlyTrashed || false,
      folderColorRgb: response.data.folderColorRgb || undefined,
      fullFileExtension: response.data.fullFileExtension || undefined,
      fileExtension: response.data.fileExtension || undefined,
      originalFilename: response.data.originalFilename || undefined,
      headRevisionId: response.data.headRevisionId || undefined,
      isAppAuthorized: response.data.isAppAuthorized || false,
      copyRequiresWriterPermission: response.data.copyRequiresWriterPermission || false,
      writersCanShare: response.data.writersCanShare || true,
      hasAugmentedPermissions: response.data.hasAugmentedPermissions || false,
      ownedByMe: response.data.ownedByMe || false,
      driveId: response.data.driveId || undefined,
      teamDriveId: response.data.teamDriveId || undefined,
      spaces: response.data.spaces || [],
      properties: response.data.properties || {},
      appProperties: response.data.appProperties || {},
      imageMediaMetadata: response.data.imageMediaMetadata ? {
        width: response.data.imageMediaMetadata.width,
        height: response.data.imageMediaMetadata.height,
        rotation: response.data.imageMediaMetadata.rotation,
        location: response.data.imageMediaMetadata.location ? {
          latitude: response.data.imageMediaMetadata.location.latitude,
          longitude: response.data.imageMediaMetadata.location.longitude,
          altitude: response.data.imageMediaMetadata.location.altitude,
        } : undefined,
        time: response.data.imageMediaMetadata.time,
        cameraMake: response.data.imageMediaMetadata.cameraMake,
        cameraModel: response.data.imageMediaMetadata.cameraModel,
        exposureTime: response.data.imageMediaMetadata.exposureTime,
        aperture: response.data.imageMediaMetadata.aperture,
        flashUsed: response.data.imageMediaMetadata.flashUsed,
        focalLength: response.data.imageMediaMetadata.focalLength,
        isoSpeed: response.data.imageMediaMetadata.isoSpeed,
        meteringMode: response.data.imageMediaMetadata.meteringMode,
        sensor: response.data.imageMediaMetadata.sensor,
        exposureMode: response.data.imageMediaMetadata.exposureMode,
        colorSpace: response.data.imageMediaMetadata.colorSpace,
        whiteBalance: response.data.imageMediaMetadata.whiteBalance,
        exposureBias: response.data.imageMediaMetadata.exposureBias,
        maxApertureValue: response.data.imageMediaMetadata.maxApertureValue,
        subjectDistance: response.data.imageMediaMetadata.subjectDistance,
        lens: response.data.imageMediaMetadata.lens,
      } : undefined,
      videoMediaMetadata: response.data.videoMediaMetadata ? {
        width: response.data.videoMediaMetadata.width,
        height: response.data.videoMediaMetadata.height,
        durationMillis: response.data.videoMediaMetadata.durationMillis,
      } : undefined,
      exportLinks: response.data.exportLinks || {},
      shortcutDetails: response.data.shortcutDetails ? {
        targetId: response.data.shortcutDetails.targetId,
        targetMimeType: response.data.shortcutDetails.targetMimeType,
        targetResourceKey: response.data.shortcutDetails.targetResourceKey,
      } : undefined,
      contentRestrictions: response.data.contentRestrictions?.map(restriction => ({
        readOnly: restriction.readOnly || false,
        reason: restriction.reason || undefined,
        restrictingUser: restriction.restrictingUser ? {
          displayName: restriction.restrictingUser.displayName || '',
          emailAddress: restriction.restrictingUser.emailAddress || '',
          photoLink: restriction.restrictingUser.photoLink || undefined,
        } : undefined,
        restrictionTime: restriction.restrictionTime || undefined,
        type: restriction.type || undefined,
      })) || [],
      resourceKey: response.data.resourceKey || undefined,
      linkShareMetadata: response.data.linkShareMetadata ? {
        securityUpdateEligible: response.data.linkShareMetadata.securityUpdateEligible,
        securityUpdateEnabled: response.data.linkShareMetadata.securityUpdateEnabled,
      } : undefined,
      labelInfo: response.data.labelInfo ? {
        labels: response.data.labelInfo.labels?.map(label => ({
          id: label.id || undefined,
          revisionId: label.revisionId || undefined,
          kind: label.kind || undefined,
          fields: label.fields || undefined,
        })) || undefined,
      } : undefined,
      capabilities: response.data.capabilities || {},
    };
  }

  async getFolders(parentId?: string): Promise<DriveFolder[]> {
    const query = buildSearchQuery({
      parentId,
      mimeType: 'application/vnd.google-apps.folder',
      trashed: false,
    });

    const response = await this.drive.files.list({
      q: query,
      orderBy: 'name',
      fields: 'files(id, name, createdTime, modifiedTime, parents, shared, trashed)',
    });

    return response.data.files?.map(convertGoogleDriveFolder) || [];
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const metadata: DriveFileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const response = await this.drive.files.create({
      requestBody: metadata,
      fields: 'id, name, createdTime, modifiedTime, parents, shared, trashed',
    });

    return convertGoogleDriveFolder(response.data);
  }

  async uploadFile(options: DriveUploadOptions): Promise<DriveFile> {
    const { file, metadata, parentId } = options;

    const fileMetadata = {
      name: metadata.name || file.name,
      parents: parentId ? [parentId] : metadata.parents,
      description: metadata.description,
      // Don't include mimeType in metadata as it should be in media object
    };

    // Convert File to readable stream for Google Drive API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const media = {
      mimeType: file.type || getMimeTypeFromFileName(file.name),
      body: stream,
    };

    // Use uploadType=multipart for proper file upload according to Drive API docs
    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      uploadType: 'multipart',
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    });

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
    const response = await this.drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    // Convert Node.js readable stream to Web ReadableStream
    const nodeStream = response.data as any;
    
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: any) => {
          controller.enqueue(chunk);
        });
        
        nodeStream.on('end', () => {
          controller.close();
        });
        
        nodeStream.on('error', (error: any) => {
          controller.error(error);
        });
      }
    });
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

  // Unified move operation for both files and folders with error recovery
  async moveFile(fileId: string, newParentId: string, currentParentId?: string): Promise<DriveFile> {
    try {
      // According to Drive API docs, we should get current parents if not provided
      if (!currentParentId) {
        const fileInfo = await this.getFile(fileId);
        currentParentId = fileInfo.parents?.[0];
      }

      const response = await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: currentParentId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
      });

      return convertGoogleDriveFile(response.data);
    } catch (error: any) {
      console.error(`Move operation failed for file ${fileId}:`, error);
      
      // Handle specific Google API errors according to documentation
      if (error.code === 403) {
        throw new Error('Insufficient permissions to move this file');
      } else if (error.code === 404) {
        throw new Error('File or destination folder not found');
      } else if (error.code === 429) {
        throw new Error('Rate limit exceeded. Please try again later');
      } else if (error.code === 400) {
        throw new Error('Invalid move operation parameters');
      }
      
      // Re-throw with original error for unexpected cases
      throw error;
    }
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

  // Unified share operation for both files and folders
  async shareFile(fileId: string, permission: DrivePermission): Promise<void> {
    try {
      console.log('Creating permission for file:', fileId, 'with permission:', permission);
      
      const permissionRequest: any = {
        role: permission.role,
        type: permission.type,
      };

      // Add optional fields only if provided, according to API docs
      if (permission.emailAddress) {
        permissionRequest.emailAddress = permission.emailAddress;
      }
      
      if (permission.domain) {
        permissionRequest.domain = permission.domain;
      }

      // Set allowFileDiscovery for domain/anyone permissions as per API docs
      if (permission.type === 'domain' || permission.type === 'anyone') {
        permissionRequest.allowFileDiscovery = permission.allowFileDiscovery ?? false;
      }

      await this.drive.permissions.create({
        fileId,
        requestBody: permissionRequest,
        sendNotificationEmail: permission.sendNotificationEmail ?? false,
        // Add emailMessage if sending notifications
        ...(permission.sendNotificationEmail && { emailMessage: 'File shared with you via Drive Manager' })
      });

      console.log('Permission created successfully for file:', fileId);
    } catch (error: any) {
      console.error('Error creating permission:', error);
      
      // Handle specific API errors according to documentation
      if (error.code === 403) {
        throw new Error('Insufficient permissions to share this file');
      } else if (error.code === 404) {
        throw new Error('File not found');
      } else if (error.code === 400) {
        throw new Error('Invalid sharing parameters');
      }
      
      throw error;
    }
  }

  // Alias for clarity - same operation works for both files and folders
  async shareFolder(folderId: string, permission: DrivePermission): Promise<void> {
    return this.shareFile(folderId, permission);
  }

  // Get file permissions
  async getFilePermissions(fileId: string): Promise<any[]> {
    try {
      const response = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id, type, role, emailAddress, domain, displayName)'
      });

      return response.data.permissions || [];
    } catch (error) {
      console.error('Error getting file permissions:', error);
      throw error;
    }
  }

  // Remove file permission
  async removeFilePermission(fileId: string, permissionId: string): Promise<void> {
    try {
      await this.drive.permissions.delete({
        fileId,
        permissionId
      });
    } catch (error) {
      console.error('Error removing file permission:', error);
      throw error;
    }
  }

  // Create permission (for enhanced sharing)
  async createPermission(fileId: string, permissionData: any, accessToken?: string): Promise<any> {
    try {
      const response = await this.drive.permissions.create({
        fileId,
        requestBody: permissionData,
        sendNotificationEmail: false
      });
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }



  // Delete permission (for enhanced sharing)
  async deletePermission(fileId: string, permissionId: string, accessToken?: string): Promise<void> {
    try {
      await this.drive.permissions.delete({
        fileId,
        permissionId
      });
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  }



  // Send notification email (for enhanced sharing)
  async sendNotificationEmail(fileId: string, emailData: any, accessToken?: string): Promise<void> {
    // Note: This would typically use the Gmail API or similar service
    // For now, we'll just log the action
    console.log('Notification email would be sent for file:', fileId, 'with data:', emailData);
  }
}