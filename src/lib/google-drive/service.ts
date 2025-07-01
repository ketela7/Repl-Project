import { Readable } from 'stream'

import { drive_v3 } from 'googleapis'

import { createDriveClient } from './config'
import {
  DriveFile,
  DriveFolder,
  DriveSearchOptions,
  DriveSearchResult,
  DriveUploadOptions,
  DrivePermission,
  DriveUserInfo,
  DriveFileMetadata,
} from './types'
import { DetailedDriveFile } from './detailed-file-types'
import {
  mapUserInfo,
  mapImageMetadata,
  mapVideoMetadata,
  mapShortcutDetails,
  mapContentRestrictions,
  mapLinkShareMetadata,
  mapLabelInfo,
  mapBasicProperties,
  mapChecksums,
  mapBooleanProperties,
  mapCollectionProperties,
} from './file-detail-mappers'
import { validateListFilesOptions } from './validation-utils'
import { validateFileName, handleDriveApiError } from './file-validation'
import { getOptimizedFields, fieldOptimizationMonitor } from './field-optimization'
import {
  convertGoogleDriveFile,
  convertGoogleDriveFolder,
  buildSearchQuery,
  getMimeTypeFromFileName,
} from './utils'
import { getOptimizedRequestParams, performanceMonitor, requestDeduplicator } from './performance'

export class GoogleDriveService {
  public drive: drive_v3.Drive

  constructor(accessToken: string) {
    this.drive = createDriveClient(accessToken)
  }

  async getUserInfo(): Promise<DriveUserInfo> {
    // Use Drive API about endpoint for user info instead of OAuth2 userinfo API
    // This is the recommended approach according to Google Drive API documentation
    const aboutResponse = await this.drive.about.get({
      fields: 'user,storageQuota',
    })

    const about = aboutResponse.data
    const user = about.user

    if (!user) {
      throw new Error('Unable to fetch user information from Drive API')
    }

    return {
      id: user.permissionId ?? 'unknown',
      name: user.displayName ?? 'Unknown User',
      email: user.emailAddress ?? '',
      ...(user.photoLink && { picture: user.photoLink }),
      ...(about.storageQuota && {
        storageQuota: {
          limit: about.storageQuota.limit!,
          usage: about.storageQuota.usage!,
          usageInDrive: about.storageQuota.usageInDrive!,
          usageInDriveTrash: about.storageQuota.usageInDriveTrash!,
        },
      }),
    }
  }

  async listFiles(options: DriveSearchOptions = {}): Promise<DriveSearchResult> {
    const {
      query,
      parentId,
      mimeType,
      pageSize = 50,
      pageToken,
      orderBy = 'modifiedTime desc',
      includeTeamDriveItems = true,
    } = options

    // Validate and process all options using helper functions
    const { validPageSize, validPageToken, searchQuery, operationType } = validateListFilesOptions({
      pageSize,
      pageToken,
      query,
      parentId,
      mimeType,
    })

    // Use operation type from validation
    const operation = operationType
    const baseParams = {
      q: searchQuery,
      pageSize: validPageSize,
      orderBy,
      includeItemsFromAllDrives: includeTeamDriveItems,
      supportsAllDrives: includeTeamDriveItems,
    }

    // Use optimized fields based on operation type
    const optimizedFields = getOptimizedFields('LIST_STANDARD')
    const requestParams = {
      ...getOptimizedRequestParams(operation, baseParams),
      fields: `nextPageToken,incompleteSearch,files(${optimizedFields})`,
    }
    // Log query for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.info('[Drive API] - Query:', searchQuery)
    }

    // Only add pageToken if it's valid
    if (validPageToken) {
      requestParams.pageToken = validPageToken
    }

    try {
      // Generate deduplication key for identical requests
      const dedupKey = requestDeduplicator.generateKey('listFiles', requestParams)

      // Use performance monitoring and request deduplication
      const response = await performanceMonitor.trackRequest('listFiles', async () => {
        return await requestDeduplicator.deduplicate(dedupKey, async () => {
          return await this.drive.files.list(requestParams)
        })
      })

      const files = response.data.files?.map(convertGoogleDriveFile) ?? []

      console.info(`[Drive API] - Result: ${files.length} items`)

      return {
        files,
        ...(response.data.nextPageToken && { nextPageToken: response.data.nextPageToken }),
        incompleteSearch: response.data.incompleteSearch || false,
      }
    } catch (error: any) {
      // Handle authentication errors
      if (error.code === 401 || error.status === 401) {
        const authError = new Error('Authentication required')
        authError.name = 'AuthenticationError'
        ;(authError as any).code = 401
        ;(authError as any).needsReauth = true
        throw authError
      }

      // Handle insufficient permissions
      if (error.code === 403 || error.status === 403) {
        const permissionError = new Error('Insufficient permissions')
        permissionError.name = 'PermissionError'
        ;(permissionError as any).code = 403
        ;(permissionError as any).needsReauth = true
        throw permissionError
      }

      // Handle specific Google Drive API errors
      if (error.code === 400 && error.message?.includes('Invalid Value')) {
        // If pageToken was the issue, retry without it
        if (validPageToken) {
          const retryParams = { ...requestParams }
          delete retryParams.pageToken

          const retryResponse = await this.drive.files.list(retryParams)
          const retryFiles = retryResponse.data.files?.map(convertGoogleDriveFile) || []

          return {
            files: retryFiles,
            ...(retryResponse.data.nextPageToken && {
              nextPageToken: retryResponse.data.nextPageToken,
            }),
            incompleteSearch: retryResponse.data.incompleteSearch || false,
          }
        }
      }

      // Re-throw other errors
      throw error
    }
  }

  async getFile(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.get({
      fileId,
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, shared, trashed, starred, capabilities, owners(displayName,emailAddress,photoLink)',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  async getFileDetails(fileId: string, fields?: string): Promise<DetailedDriveFile> {
    const startTime = Date.now()
    const optimizedFields = fields || getOptimizedFields('FILE_DETAILS')

    const response = await this.drive.files.get({
      fileId,
      fields: optimizedFields, // Use optimized fields instead of '*'
    })

    // Track performance improvement
    const responseTime = Date.now() - startTime
    fieldOptimizationMonitor.trackRequest(
      'getFileDetails',
      responseTime,
      optimizedFields.split(',').length,
    )

    const file = convertGoogleDriveFile(response.data)
    const responseData = response.data

    return {
      ...file,
      // User information
      lastModifyingUser: mapUserInfo(responseData.lastModifyingUser),
      sharingUser: mapUserInfo(responseData.sharingUser),

      // Basic file properties
      ...mapBasicProperties(responseData),

      // Checksums and storage info
      ...mapChecksums(responseData),

      // Boolean properties with defaults
      ...mapBooleanProperties(responseData),

      // Array and object properties
      ...mapCollectionProperties(responseData),

      // Media metadata
      ...(responseData.imageMediaMetadata && {
        imageMediaMetadata: mapImageMetadata(responseData.imageMediaMetadata),
      }),
      ...(responseData.videoMediaMetadata && {
        videoMediaMetadata: mapVideoMetadata(responseData.videoMediaMetadata),
      }),

      // Shortcut details
      ...(responseData.shortcutDetails && {
        shortcutDetails: mapShortcutDetails(responseData.shortcutDetails),
      }),

      // Content restrictions
      contentRestrictions: mapContentRestrictions(responseData.contentRestrictions),

      // Link sharing metadata
      ...(responseData.linkShareMetadata && {
        linkShareMetadata: mapLinkShareMetadata(responseData.linkShareMetadata),
      }),

      // Label information
      ...(responseData.labelInfo && {
        labelInfo: mapLabelInfo(responseData.labelInfo),
      }),
    }
  }

  async getFolders(parentId?: string): Promise<DriveFolder[]> {
    const query = buildSearchQuery({
      ...(parentId && { parentId }),
      mimeType: 'application/vnd.google-apps.folder',
      trashed: false,
    })

    const response = await this.drive.files.list({
      q: query,
      orderBy: 'name',
      fields: 'files(id, name, createdTime, modifiedTime, parents, shared, trashed)',
    })

    return response.data.files?.map(convertGoogleDriveFolder) || []
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const metadata: DriveFileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    }

    if (parentId) {
      metadata.parents = [parentId]
    }

    const response = await this.drive.files.create({
      requestBody: metadata,
      fields: 'id, name, createdTime, modifiedTime, parents, shared, trashed',
    })

    return convertGoogleDriveFolder(response.data)
  }

  async uploadFile(options: DriveUploadOptions): Promise<DriveFile> {
    const { file, metadata, parentId } = options

    const fileMetadata: any = {
      name: metadata.name || file.name,
      ...(parentId ? { parents: [parentId] } : metadata.parents && { parents: metadata.parents }),
      ...(metadata.description && { description: metadata.description }),
      // Don't include mimeType in metadata as it should be in media object
    }

    // Convert File to readable stream for Google Drive API
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const stream = Readable.from(buffer)

    const media = {
      mimeType: file.type || getMimeTypeFromFileName(file.name),
      body: stream,
    }

    // Use uploadType=multipart for proper file upload according to Drive API docs
    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      uploadType: 'multipart',
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners(displayName,emailAddress,photoLink), shared, trashed',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  async downloadFile(fileId: string): Promise<Readable> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' },
    )

    return response.data as Readable
  }

  /**
   * Get file metadata with specific fields
   */
  async getFileMetadata(
    fileId: string,
    fields: string[],
  ): Promise<DriveFileMetadata & { id: string }> {
    const response = await this.drive.files.get({
      fileId,
      fields: fields.join(','),
    })

    // // // // // console.log('[Google Drive Service] Raw API response:', response.data)
    // // // // // console.log('[Google Drive Service] Response ID:', response.data.id)

    return {
      id: response.data.id || fileId, // Ensure id is always present
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      createdTime: response.data.createdTime!,
      modifiedTime: response.data.modifiedTime!,
      parents: response.data.parents || [],
      shared: response.data.shared || false,
      trashed: response.data.trashed || false,
      ...(response.data.webViewLink && { webViewLink: response.data.webViewLink }),
      ...(response.data.webContentLink && { webContentLink: response.data.webContentLink }),
      ...(response.data.thumbnailLink && { thumbnailLink: response.data.thumbnailLink }),
      ...(response.data.iconLink && { iconLink: response.data.iconLink }),
      ...(response.data.description && { description: response.data.description }),
      starred: response.data.starred || false,
      explicitlyTrashed: response.data.explicitlyTrashed || false,
      exportLinks: response.data.exportLinks || {},
    }
  }

  // Unified permanent delete operation for both files and folders
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId })
  }

  async exportFile(fileId: string, mimeType: string): Promise<ArrayBuffer> {
    const response = await this.drive.files.export(
      {
        fileId,
        mimeType,
      },
      {
        responseType: 'arraybuffer',
      },
    )
    return response.data as ArrayBuffer
  }

  // Alias for clarity - same operation works for both files and folders
  async deleteFolder(folderId: string): Promise<void> {
    return this.deleteFile(folderId)
  }

  // Unified move to trash operation for both files and folders
  async moveToTrash(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { trashed: true },
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners(displayName,emailAddress,photoLink), shared, trashed',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  // Alias for clarity - same operation works for both files and folders
  async moveFolderToTrash(folderId: string): Promise<DriveFile> {
    return this.moveToTrash(folderId)
  }

  // Unified restore from trash operation for both files and folders
  async untrashFile(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { trashed: false },
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners(displayName,emailAddress,photoLink), shared, trashed',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  // Alias for clarity - same operation works for both files and folders
  async restoreFolderFromTrash(folderId: string): Promise<DriveFile> {
    return this.untrashFile(folderId)
  }

  // Unified rename operation for both files and folders
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    try {
      // Validate filename using helper function
      validateFileName(newName)

      const optimizedFields = getOptimizedFields('LIST_DETAILED')
      const response = await this.drive.files.update({
        fileId,
        requestBody: { name: newName.trim() },
        fields: optimizedFields,
      })

      return convertGoogleDriveFile(response.data)
    } catch (error: any) {
      // Handle errors using centralized error handler
      handleDriveApiError(error)
    }
  }

  // Alias for clarity - same operation works for both files and folders
  async renameFolder(folderId: string, newName: string): Promise<DriveFile> {
    return this.renameFile(folderId, newName)
  }

  // Unified move operation for both files and folders with error recovery
  async moveFile(
    fileId: string,
    newParentId: string,
    currentParentId?: string,
  ): Promise<DriveFile> {
    try {
      // According to Drive API docs, we should get current parents if not provided
      if (!currentParentId) {
        const fileInfo = await this.getFile(fileId)
        currentParentId = fileInfo.parents?.[0]
      }

      const updateParams: any = {
        fileId,
        addParents: newParentId,
        ...(currentParentId && { removeParents: currentParentId }),
        fields:
          'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners(displayName,emailAddress,photoLink), shared, trashed',
      }

      const response = await this.drive.files.update(updateParams)

      const result = await response
      return convertGoogleDriveFile(result.data)
    } catch (error: any) {
      // Handle specific Google API errors according to documentation
      if (error.code === 403) {
        throw new Error('Insufficient permissions to move this file')
      } else if (error.code === 404) {
        throw new Error('File or destination folder not found')
      } else if (error.code === 429) {
        throw new Error('Rate limit exceeded. Please try again later')
      } else if (error.code === 400) {
        throw new Error('Invalid move operation parameters')
      }

      // Re-throw with original error for unexpected cases
      throw error
    }
  }

  // Alias for clarity - same operation works for both files and folders
  async moveFolder(
    folderId: string,
    newParentId: string,
    currentParentId?: string,
  ): Promise<DriveFile> {
    return this.moveFile(folderId, newParentId, currentParentId)
  }

  // Copy operation - works for files, folders require special handling
  async copyFile(fileId: string, metadata: Partial<DriveFileMetadata>): Promise<DriveFile> {
    // First check if this is a folder
    const originalFile = await this.getFile(fileId)

    if (originalFile.mimeType === 'application/vnd.google-apps.folder') {
      // For folders, we need to create a new folder and copy contents
      return this.copyFolder(fileId, metadata)
    }

    const response = await this.drive.files.copy({
      fileId,
      requestBody: metadata,
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners(displayName,emailAddress,photoLink), shared, trashed',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  // Special handling for folder copying
  async copyFolder(folderId: string, metadata: Partial<DriveFileMetadata>): Promise<DriveFile> {
    const originalFolder = await this.getFile(folderId)

    // Create new folder with the specified metadata
    const newFolder = await this.createFolder(
      metadata.name || `${originalFolder.name} - Copy`,
      metadata.parents?.[0],
    )

    // Note: For full folder copying with contents, we would need recursive copying
    // This creates an empty copy of the folder structure
    return convertGoogleDriveFile({
      id: newFolder.id!,
      name: newFolder.name!,
      mimeType: 'application/vnd.google-apps.folder',
      createdTime: newFolder.createdTime!,
      modifiedTime: newFolder.modifiedTime!,
      ...(newFolder.parents && { parents: newFolder.parents }),
      ...(newFolder.shared && { shared: newFolder.shared }),
      ...(newFolder.trashed && { trashed: newFolder.trashed }),
    })
  }

  // Alias for clarity - same operation works for both files and folders
  async removeFolderPermission(folderId: string, permissionId: string): Promise<void> {
    return this.removeFilePermission(folderId, permissionId)
  }

  // Unified share operation for both files and folders
  async shareFile(fileId: string, permission: DrivePermission): Promise<void> {
    try {
      const permissionRequest: any = {
        role: permission.role,
        type: permission.type,
      }

      // Add optional fields only if provided, according to API docs
      if (permission.emailAddress) {
        permissionRequest.emailAddress = permission.emailAddress
      }

      if (permission.domain) {
        permissionRequest.domain = permission.domain
      }

      // Set allowFileDiscovery for domain/anyone permissions as per API docs
      if (permission.type === 'domain' || permission.type === 'anyone') {
        permissionRequest.allowFileDiscovery = permission.allowFileDiscovery ?? false
      }

      await this.drive.permissions.create({
        fileId,
        requestBody: permissionRequest,
        sendNotificationEmail: permission.sendNotificationEmail ?? false,
        // Add emailMessage if sending notifications
        ...(permission.sendNotificationEmail && {
          emailMessage: 'File shared with you via Drive Manager',
        }),
      })
    } catch (error: any) {
      // Handle specific API errors according to documentation
      if (error.code === 403) {
        throw new Error('Insufficient permissions to share this file')
      } else if (error.code === 404) {
        throw new Error('File not found')
      } else if (error.code === 400) {
        throw new Error('Invalid sharing parameters')
      }

      throw error
    }
  }

  // Alias for clarity - same operation works for both files and folders
  async shareFolder(folderId: string, permission: DrivePermission): Promise<void> {
    return this.shareFile(folderId, permission)
  }

  // Get file permissions
  async getFilePermissions(fileId: string): Promise<any[]> {
    const response = await this.drive.permissions.list({
      fileId,
      fields: 'permissions(id, type, role, emailAddress, domain, displayName)',
    })

    return response.data.permissions || []
  }

  // Remove file permission
  async removeFilePermission(fileId: string, permissionId: string): Promise<void> {
    await this.drive.permissions.delete({
      fileId,
      permissionId,
    })
  }

  // Create permission (for enhanced sharing)
  async createPermission(fileId: string, permissionData: any): Promise<any> {
    const response = await this.drive.permissions.create({
      fileId,
      requestBody: permissionData,
      sendNotificationEmail: false,
    })
    return response.data
  }

  // Delete permission (for enhanced sharing)
  async deletePermission(fileId: string, permissionId: string): Promise<void> {
    await this.drive.permissions.delete({
      fileId,
      permissionId,
    })
  }

  // Send notification email (for enhanced sharing)
  async sendNotificationEmail(_fileId: string, _emailData: any): Promise<void> {
    // Note: This would typically use the Gmail API or similar service
    // For now, we'll just log the action
  }
}
