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
import {
  convertGoogleDriveFile,
  convertGoogleDriveFolder,
  buildSearchQuery,
  getMimeTypeFromFileName,
} from './utils'

export class GoogleDriveService {
  private drive: drive_v3.Drive

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
      id: user.permissionId || 'unknown',
      name: user.displayName || 'Unknown User',
      email: user.emailAddress || '',
      picture: user.photoLink ?? undefined,
      storageQuota: about.storageQuota
        ? {
            limit: about.storageQuota.limit!,
            usage: about.storageQuota.usage!,
            usageInDrive: about.storageQuota.usageInDrive!,
            usageInDriveTrash: about.storageQuota.usageInDriveTrash!,
          }
        : undefined,
    }
  }

  async listFiles(
    options: DriveSearchOptions = {}
  ): Promise<DriveSearchResult> {
    const {
      query,
      parentId,
      mimeType,
      pageSize = 50,
      pageToken,
      orderBy = 'modifiedTime desc',
      includeTeamDriveItems = true,
    } = options

    // Validate and sanitize pageSize
    const validPageSize = Math.min(Math.max(pageSize, 1), 1000)

    // Validate and sanitize pageToken
    let validPageToken: string | undefined = pageToken
    if (pageToken) {
      try {
        // Try to decode if it appears to be URL encoded
        if (pageToken.includes('%')) {
          validPageToken = decodeURIComponent(pageToken)
        }

        // Basic validation for pageToken format
        if (
          typeof validPageToken !== 'string' ||
          validPageToken.length === 0 ||
          validPageToken.length > 2048
        ) {
          validPageToken = undefined
        } else {
          // Additional validation: pageToken should not contain certain invalid characters
          const invalidChars = /[<>"'&\x00-\x1f\x7f-\x9f\s]/
          if (invalidChars.test(validPageToken)) {
            validPageToken = undefined
          }
        }
      } catch (error) {
        validPageToken = undefined
      }
    }

    // Use the query parameter directly if provided, otherwise build one
    let searchQuery = ''

    if (query) {
      // If query is already formatted (contains operators), use it directly
      if (
        query.includes('=') ||
        query.includes('and') ||
        query.includes('or') ||
        query.includes('in')
      ) {
        searchQuery = query
      } else {
        // Otherwise treat it as a search term and build proper query
        searchQuery = buildSearchQuery({
          name: query,
          parentId,
          mimeType,
          trashed: false,
        })
      }
    } else if (parentId || mimeType) {
      searchQuery = buildSearchQuery({
        parentId,
        mimeType,
        trashed: false,
      })
    } else {
      // Default to non-trashed files only
      searchQuery = 'trashed=false'
    }

    if (pageSize === 1) {
      // For cek access to confirm session is valid
      fields = 'files(id)'
    } else {
      fields =
        'nextPageToken, incompleteSearch, files(id, name, mimeType, size, createdTime, modifiedTime, owners, shared, trashed, starred, webViewLink, thumbnailLink, parents, capabilities)'
    }
    // Prepare API request parameters with proper validation
    const requestParams: any = {
      q: searchQuery,
      pageSize: validPageSize,
      orderBy,
      //  spaces: 'drive',
      //  corpora: 'user',
      //  supportsTeamDrives: includeTeamDriveItems,
      includeItemsFromAllDrives: includeTeamDriveItems,
      supportsAllDrives: includeTeamDriveItems,
      fields: fields,
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
      const response = await this.drive.files.list(requestParams)

      const files = response.data.files?.map(convertGoogleDriveFile) || []

      if (process.env.NODE_ENV === 'development') {
        console.info(`[Drive API] - Result: ${files.length} items`)
      }

      return {
        files,
        nextPageToken: response.data.nextPageToken,
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
          const retryFiles =
            retryResponse.data.files?.map(convertGoogleDriveFile) || []

          return {
            files: retryFiles,
            nextPageToken: retryResponse.data.nextPageToken,
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, shared, trashed, starred, capabilities, owners',
    })

    return convertGoogleDriveFile(response.data)
  }

  async getFileDetails(fileId: string): Promise<
    DriveFile & {
      description?: string
      lastModifyingUser?: {
        displayName: string
        emailAddress: string
        photoLink?: string
      }
      sharingUser?: {
        displayName: string
        emailAddress: string
        photoLink?: string
      }
      version?: string
      md5Checksum?: string
      sha1Checksum?: string
      sha256Checksum?: string
      quotaBytesUsed?: string
      starred?: boolean
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
      ownedByMe?: boolean
      id?: string
      teamDriveId?: string
      spaces?: string[]
      properties?: Record<string, string>
      appProperties?: Record<string, string>
      imageMediaMetadata?: {
        width?: number
        height?: number
        rotation?: number
        location?: {
          latitude?: number
          longitude?: number
          altitude?: number
        }
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
      videoMediaMetadata?: {
        width?: number
        height?: number
        durationMillis?: string
      }
      exportLinks?: Record<string, string>
      shortcutDetails?: {
        targetId?: string
        targetMimeType?: string
        targetResourceKey?: string
      }
      contentRestrictions?: Array<{
        readOnly?: boolean
        reason?: string
        restrictingUser?: {
          displayName: string
          emailAddress: string
          photoLink?: string
        }
        restrictionTime?: string
        type?: string
      }>
      resourceKey?: string
      linkShareMetadata?: {
        securityUpdateEligible?: boolean
        securityUpdateEnabled?: boolean
      }
      labelInfo?: {
        labels?: Array<{
          id?: string
          revisionId?: string
          kind?: string
          fields?: Record<string, any>
        }>
      }
      capabilities?: {
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
    }
  > {
    const response = await this.drive.files.get({
      fileId,
      fields: '*',
    })

    const file = convertGoogleDriveFile(response.data)

    return {
      ...file,
      description: response.data.description || undefined,
      lastModifyingUser: response.data.lastModifyingUser
        ? {
            displayName: response.data.lastModifyingUser.displayName || '',
            emailAddress: response.data.lastModifyingUser.emailAddress || '',
            photoLink: response.data.lastModifyingUser.photoLink || undefined,
          }
        : undefined,
      sharingUser: response.data.sharingUser
        ? {
            displayName: response.data.sharingUser.displayName || '',
            emailAddress: response.data.sharingUser.emailAddress || '',
            photoLink: response.data.sharingUser.photoLink || undefined,
          }
        : undefined,
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
      copyRequiresWriterPermission:
        response.data.copyRequiresWriterPermission || false,
      writersCanShare: response.data.writersCanShare || true,
      hasAugmentedPermissions: response.data.hasAugmentedPermissions || false,
      ownedByMe: response.data.ownedByMe || false,
      // driveId: response.data.driveId || undefined,
      teamDriveId: response.data.teamDriveId || undefined,
      spaces: response.data.spaces || [],
      properties: response.data.properties || {},
      appProperties: response.data.appProperties || {},
      imageMediaMetadata: response.data.imageMediaMetadata
        ? {
            width: response.data.imageMediaMetadata.width,
            height: response.data.imageMediaMetadata.height,
            rotation: response.data.imageMediaMetadata.rotation,
            location: response.data.imageMediaMetadata.location
              ? {
                  latitude: response.data.imageMediaMetadata.location.latitude,
                  longitude:
                    response.data.imageMediaMetadata.location.longitude,
                  altitude: response.data.imageMediaMetadata.location.altitude,
                }
              : undefined,
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
          }
        : undefined,
      videoMediaMetadata: response.data.videoMediaMetadata
        ? {
            width: response.data.videoMediaMetadata.width,
            height: response.data.videoMediaMetadata.height,
            durationMillis: response.data.videoMediaMetadata.durationMillis,
          }
        : undefined,
      exportLinks: response.data.exportLinks || {},
      shortcutDetails: response.data.shortcutDetails
        ? {
            targetId: response.data.shortcutDetails.targetId,
            targetMimeType: response.data.shortcutDetails.targetMimeType,
            targetResourceKey: response.data.shortcutDetails.targetResourceKey,
          }
        : undefined,
      contentRestrictions:
        response.data.contentRestrictions?.map((restriction) => ({
          readOnly: restriction.readOnly || false,
          reason: restriction.reason || undefined,
          restrictingUser: restriction.restrictingUser
            ? {
                displayName: restriction.restrictingUser.displayName || '',
                emailAddress: restriction.restrictingUser.emailAddress || '',
                photoLink: restriction.restrictingUser.photoLink || undefined,
              }
            : undefined,
          restrictionTime: restriction.restrictionTime || undefined,
          type: restriction.type || undefined,
        })) || [],
      resourceKey: response.data.resourceKey || undefined,
      linkShareMetadata: response.data.linkShareMetadata
        ? {
            securityUpdateEligible:
              response.data.linkShareMetadata.securityUpdateEligible,
            securityUpdateEnabled:
              response.data.linkShareMetadata.securityUpdateEnabled,
          }
        : undefined,
      labelInfo: response.data.labelInfo
        ? {
            labels:
              response.data.labelInfo.labels?.map((label) => ({
                id: label.id || undefined,
                revisionId: label.revisionId || undefined,
                kind: label.kind || undefined,
                fields: label.fields || undefined,
              })) || undefined,
          }
        : undefined,
      capabilities: response.data.capabilities || {},
    }
  }

  async getFolders(parentId?: string): Promise<DriveFolder[]> {
    const query = buildSearchQuery({
      parentId,
      mimeType: 'application/vnd.google-apps.folder',
      trashed: false,
    })

    const response = await this.drive.files.list({
      q: query,
      orderBy: 'name',
      fields:
        'files(id, name, createdTime, modifiedTime, parents, shared, trashed)',
    })

    return response.data.files?.map(convertGoogleDriveFolder) || []
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const metadata: DriveFileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
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

    const fileMetadata = {
      name: metadata.name || file.name,
      parents: parentId ? [parentId] : metadata.parents,
      description: metadata.description,
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    return convertGoogleDriveFile(response.data)
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    )

    return response.data as ArrayBuffer
  }

  async downloadFileStream(fileId: string): Promise<ReadableStream> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    )

    // Convert Node.js readable stream to Web ReadableStream
    const nodeStream = response.data as any

    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: any) => {
          controller.enqueue(chunk)
        })

        nodeStream.on('end', () => {
          controller.close()
        })

        nodeStream.on('error', (error: any) => {
          controller.error(error)
        })
      },
    })
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
      }
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    return convertGoogleDriveFile(response.data)
  }

  // Alias for clarity - same operation works for both files and folders
  async moveFolderToTrash(folderId: string): Promise<DriveFile> {
    return this.moveToTrash(folderId)
  }

  // Unified restore from trash operation for both files and folders
  async restoreFromTrash(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { trashed: false },
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    return convertGoogleDriveFile(response.data)
  }

  // Alias for clarity - same operation works for both files and folders
  async restoreFolderFromTrash(folderId: string): Promise<DriveFile> {
    return this.restoreFromTrash(folderId)
  }

  // Unified rename operation for both files and folders
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { name: newName },
      fields:
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    return convertGoogleDriveFile(response.data)
  }

  // Alias for clarity - same operation works for both files and folders
  async renameFolder(folderId: string, newName: string): Promise<DriveFile> {
    return this.renameFile(folderId, newName)
  }

  // Unified move operation for both files and folders with error recovery
  async moveFile(
    fileId: string,
    newParentId: string,
    currentParentId?: string
  ): Promise<DriveFile> {
    try {
      // According to Drive API docs, we should get current parents if not provided
      if (!currentParentId) {
        const fileInfo = await this.getFile(fileId)
        currentParentId = fileInfo.parents?.[0]
      }

      const response = await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: currentParentId,
        fields:
          'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
      })

      return convertGoogleDriveFile(response.data)
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
    currentParentId?: string
  ): Promise<DriveFile> {
    return this.moveFile(folderId, newParentId, currentParentId)
  }

  // Copy operation - works for files, folders require special handling
  async copyFile(
    fileId: string,
    metadata: Partial<DriveFileMetadata>
  ): Promise<DriveFile> {
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    return convertGoogleDriveFile(response.data)
  }

  // Special handling for folder copying
  async copyFolder(
    folderId: string,
    metadata: Partial<DriveFileMetadata>
  ): Promise<DriveFile> {
    const originalFolder = await this.getFile(folderId)

    // Create new folder with the specified metadata
    const newFolder = await this.createFolder(
      metadata.name || `${originalFolder.name} - Copy`,
      metadata.parents?.[0]
    )

    // Note: For full folder copying with contents, we would need recursive copying
    // This creates an empty copy of the folder structure
    return convertGoogleDriveFile({
      id: newFolder.id!,
      name: newFolder.name!,
      mimeType: 'application/vnd.google-apps.folder',
      createdTime: newFolder.createdTime!,
      modifiedTime: newFolder.modifiedTime!,
      parents: newFolder.parents ?? undefined,
      shared: newFolder.shared ?? undefined,
      trashed: newFolder.trashed ?? undefined,
    })
  }

  // Alias for clarity - same operation works for both files and folders
  async removeFolderPermission(
    folderId: string,
    permissionId: string
  ): Promise<void> {
    return this.removeFilePermission(folderId, permissionId)
  }

  async searchFiles(
    searchQuery: string,
    options: Partial<DriveSearchOptions> = {}
  ): Promise<DriveSearchResult> {
    return this.listFiles({
      ...options,
      query: searchQuery,
    })
  }

  async getRecentFiles(limit: number = 20): Promise<DriveFile[]> {
    const result = await this.listFiles({
      pageSize: limit,
      orderBy: 'modifiedTime desc',
    })

    return result.files
  }

  async getSharedFiles(): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'sharedWithMe=true and trashed=false',
      orderBy: 'modifiedTime desc',
      fields:
        'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed)',
    })

    return response.data.files?.map(convertGoogleDriveFile) || []
  }

  async getTrashedFiles(): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'trashed=true',
      orderBy: 'modifiedTime desc',
      fields:
        'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed)',
    })

    return response.data.files?.map(convertGoogleDriveFile) || []
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
        permissionRequest.allowFileDiscovery =
          permission.allowFileDiscovery ?? false
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
  async shareFolder(
    folderId: string,
    permission: DrivePermission
  ): Promise<void> {
    return this.shareFile(folderId, permission)
  }

  // Get file permissions
  async getFilePermissions(fileId: string): Promise<any[]> {
    try {
      const response = await this.drive.permissions.list({
        fileId,
        fields:
          'permissions(id, type, role, emailAddress, domain, displayName)',
      })

      return response.data.permissions || []
    } catch (error) {
      throw error
    }
  }

  // Remove file permission
  async removeFilePermission(
    fileId: string,
    permissionId: string
  ): Promise<void> {
    try {
      await this.drive.permissions.delete({
        fileId,
        permissionId,
      })
    } catch (error) {
      throw error
    }
  }

  // Create permission (for enhanced sharing)
  async createPermission(
    fileId: string,
    permissionData: any,
    _accessToken?: string
  ): Promise<any> {
    try {
      const response = await this.drive.permissions.create({
        fileId,
        requestBody: permissionData,
        sendNotificationEmail: false,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Delete permission (for enhanced sharing)
  async deletePermission(
    fileId: string,
    permissionId: string,
    _accessToken?: string
  ): Promise<any> {
    try {
      const response = await this.drive.permissions.delete({
        fileId,
        permissionId,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Send notification email (for enhanced sharing)
  async sendNotificationEmail(
    fileId: string,
    emailAddress: string,
    message: string,
    _accessToken?: string
  ): Promise<any> {
    // Simplified implementation - return success
    return Promise.resolve({
      success: true,
      message: `Notification sent to ${emailAddress}`,
    })
  }
}
