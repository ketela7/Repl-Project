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
import { convertGoogleDriveFile, convertGoogleDriveFolder, buildSearchQuery, getMimeTypeFromFileName } from './utils'
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
        if (typeof validPageToken !== 'string' || validPageToken.length === 0 || validPageToken.length > 2048) {
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
      if (query.includes('=') || query.includes('and') || query.includes('or') || query.includes('in')) {
        searchQuery = query
      } else {
        // Otherwise treat it as a search term and build proper query
        searchQuery = buildSearchQuery({
          name: query,
          ...(parentId && { parentId }),
          ...(mimeType && { mimeType }),
          trashed: false,
        })
      }
    } else if (parentId || mimeType) {
      searchQuery = buildSearchQuery({
        ...(parentId && { parentId }),
        ...(mimeType && { mimeType }),
        trashed: false,
      })
    } else {
      // Default to non-trashed files only
      searchQuery = 'trashed=false'
    }

    // Use optimized request parameters based on operation type
    const operation = pageSize === 1 ? 'EXISTS_CHECK' : 'LIST_STANDARD'
    const baseParams = {
      q: searchQuery,
      pageSize: validPageSize,
      orderBy,
      includeItemsFromAllDrives: includeTeamDriveItems,
      supportsAllDrives: includeTeamDriveItems,
    }

    const requestParams = getOptimizedRequestParams(operation, baseParams)
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

      if (process.env.NODE_ENV === 'development') {
        console.info(`[Drive API] - Result: ${files.length} items`)
      }

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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, shared, trashed, starred, capabilities, owners',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  async getFileDetails(
    fileId: string,
    fields?: string,
  ): Promise<
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
      fields: fields || '*',
    })

    const file = convertGoogleDriveFile(response.data)

    return {
      ...file,
      ...(response.data.description && { description: response.data.description }),
      ...(response.data.lastModifyingUser && {
        lastModifyingUser: {
          displayName: response.data.lastModifyingUser.displayName || '',
          emailAddress: response.data.lastModifyingUser.emailAddress || '',
          ...(response.data.lastModifyingUser.photoLink && {
            photoLink: response.data.lastModifyingUser.photoLink,
          }),
        },
      }),
      ...(response.data.sharingUser && {
        sharingUser: {
          displayName: response.data.sharingUser.displayName || '',
          emailAddress: response.data.sharingUser.emailAddress || '',
          ...(response.data.sharingUser.photoLink && {
            photoLink: response.data.sharingUser.photoLink,
          }),
        },
      }),
      ...(response.data.version && { version: response.data.version }),
      ...(response.data.md5Checksum && { md5Checksum: response.data.md5Checksum }),
      ...(response.data.sha1Checksum && { sha1Checksum: response.data.sha1Checksum }),
      ...(response.data.sha256Checksum && { sha256Checksum: response.data.sha256Checksum }),
      ...(response.data.quotaBytesUsed && { quotaBytesUsed: response.data.quotaBytesUsed }),
      starred: response.data.starred || false,
      viewed: response.data.viewedByMe || false,
      explicitlyTrashed: response.data.explicitlyTrashed || false,
      ...(response.data.folderColorRgb && { folderColorRgb: response.data.folderColorRgb }),
      ...(response.data.fullFileExtension && {
        fullFileExtension: response.data.fullFileExtension,
      }),
      ...(response.data.fileExtension && { fileExtension: response.data.fileExtension }),
      ...(response.data.originalFilename && { originalFilename: response.data.originalFilename }),
      ...(response.data.headRevisionId && { headRevisionId: response.data.headRevisionId }),
      isAppAuthorized: response.data.isAppAuthorized || false,
      copyRequiresWriterPermission: response.data.copyRequiresWriterPermission || false,
      writersCanShare: response.data.writersCanShare || true,
      hasAugmentedPermissions: response.data.hasAugmentedPermissions || false,
      ownedByMe: response.data.ownedByMe || false,

      ...(response.data.teamDriveId && { teamDriveId: response.data.teamDriveId }),
      spaces: response.data.spaces || [],
      properties: response.data.properties || {},
      appProperties: response.data.appProperties || {},
      ...(response.data.imageMediaMetadata && {
        imageMediaMetadata: {
          ...(response.data.imageMediaMetadata.width !== undefined && {
            width: response.data.imageMediaMetadata.width,
          }),
          ...(response.data.imageMediaMetadata.height !== undefined && {
            height: response.data.imageMediaMetadata.height,
          }),
          ...(response.data.imageMediaMetadata.rotation !== undefined && {
            rotation: response.data.imageMediaMetadata.rotation,
          }),
          ...(response.data.imageMediaMetadata.location && {
            location: {
              ...(response.data.imageMediaMetadata.location.latitude !== undefined && {
                latitude: response.data.imageMediaMetadata.location.latitude,
              }),
              ...(response.data.imageMediaMetadata.location.longitude !== undefined && {
                longitude: response.data.imageMediaMetadata.location.longitude,
              }),
              ...(response.data.imageMediaMetadata.location.altitude !== undefined && {
                altitude: response.data.imageMediaMetadata.location.altitude,
              }),
            },
          }),
          ...(response.data.imageMediaMetadata.time && {
            time: response.data.imageMediaMetadata.time,
          }),
          ...(response.data.imageMediaMetadata.cameraMake && {
            cameraMake: response.data.imageMediaMetadata.cameraMake,
          }),
          ...(response.data.imageMediaMetadata.cameraModel && {
            cameraModel: response.data.imageMediaMetadata.cameraModel,
          }),
          ...(response.data.imageMediaMetadata.exposureTime !== undefined && {
            exposureTime: response.data.imageMediaMetadata.exposureTime,
          }),
          ...(response.data.imageMediaMetadata.aperture !== undefined && {
            aperture: response.data.imageMediaMetadata.aperture,
          }),
          ...(response.data.imageMediaMetadata.flashUsed !== undefined && {
            flashUsed: response.data.imageMediaMetadata.flashUsed,
          }),
          ...(response.data.imageMediaMetadata.focalLength !== undefined && {
            focalLength: response.data.imageMediaMetadata.focalLength,
          }),
          ...(response.data.imageMediaMetadata.isoSpeed !== undefined && {
            isoSpeed: response.data.imageMediaMetadata.isoSpeed,
          }),
          ...(response.data.imageMediaMetadata.meteringMode && {
            meteringMode: response.data.imageMediaMetadata.meteringMode,
          }),
          ...(response.data.imageMediaMetadata.sensor && {
            sensor: response.data.imageMediaMetadata.sensor,
          }),
          ...(response.data.imageMediaMetadata.exposureMode && {
            exposureMode: response.data.imageMediaMetadata.exposureMode,
          }),
          ...(response.data.imageMediaMetadata.colorSpace && {
            colorSpace: response.data.imageMediaMetadata.colorSpace,
          }),
          ...(response.data.imageMediaMetadata.whiteBalance && {
            whiteBalance: response.data.imageMediaMetadata.whiteBalance,
          }),
          ...(response.data.imageMediaMetadata.exposureBias !== undefined && {
            exposureBias: response.data.imageMediaMetadata.exposureBias,
          }),
          ...(response.data.imageMediaMetadata.maxApertureValue !== undefined && {
            maxApertureValue: response.data.imageMediaMetadata.maxApertureValue,
          }),
          ...(response.data.imageMediaMetadata.subjectDistance !== undefined && {
            subjectDistance: response.data.imageMediaMetadata.subjectDistance,
          }),
          ...(response.data.imageMediaMetadata.lens && {
            lens: response.data.imageMediaMetadata.lens,
          }),
        },
      }),
      ...(response.data.videoMediaMetadata && {
        videoMediaMetadata: {
          ...(response.data.videoMediaMetadata.width !== undefined && {
            width: response.data.videoMediaMetadata.width,
          }),
          ...(response.data.videoMediaMetadata.height !== undefined && {
            height: response.data.videoMediaMetadata.height,
          }),
          ...(response.data.videoMediaMetadata.durationMillis && {
            durationMillis: response.data.videoMediaMetadata.durationMillis,
          }),
        },
      }),
      exportLinks: response.data.exportLinks || {},
      ...(response.data.shortcutDetails && {
        shortcutDetails: {
          ...(response.data.shortcutDetails.targetId && {
            targetId: response.data.shortcutDetails.targetId,
          }),
          ...(response.data.shortcutDetails.targetMimeType && {
            targetMimeType: response.data.shortcutDetails.targetMimeType,
          }),
          ...(response.data.shortcutDetails.targetResourceKey && {
            targetResourceKey: response.data.shortcutDetails.targetResourceKey,
          }),
        },
      }),
      contentRestrictions:
        response.data.contentRestrictions?.map(restriction => ({
          readOnly: restriction.readOnly || false,
          ...(restriction.reason && { reason: restriction.reason }),
          ...(restriction.restrictingUser && {
            restrictingUser: {
              displayName: restriction.restrictingUser.displayName || '',
              emailAddress: restriction.restrictingUser.emailAddress || '',
              ...(restriction.restrictingUser.photoLink && {
                photoLink: restriction.restrictingUser.photoLink,
              }),
            },
          }),
          ...(restriction.restrictionTime && { restrictionTime: restriction.restrictionTime }),
          ...(restriction.type && { type: restriction.type }),
        })) || [],
      ...(response.data.resourceKey && { resourceKey: response.data.resourceKey }),
      ...(response.data.linkShareMetadata && {
        linkShareMetadata: {
          ...(response.data.linkShareMetadata.securityUpdateEligible !== undefined && {
            securityUpdateEligible: response.data.linkShareMetadata.securityUpdateEligible,
          }),
          ...(response.data.linkShareMetadata.securityUpdateEnabled !== undefined && {
            securityUpdateEnabled: response.data.linkShareMetadata.securityUpdateEnabled,
          }),
        },
      }),
      ...(response.data.labelInfo && {
        labelInfo: {
          ...(response.data.labelInfo.labels && {
            labels: response.data.labelInfo.labels.map(label => ({
              ...(label.id && { id: label.id }),
              ...(label.revisionId && { revisionId: label.revisionId }),
              ...(label.kind && { kind: label.kind }),
              ...(label.fields && { fields: label.fields }),
            })),
          }),
        },
      }),
      capabilities: response.data.capabilities || {},
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
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
  async getFileMetadata(fileId: string, fields: string[]): Promise<DriveFileMetadata & { id: string }> {
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
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
      // Validate filename before sending to API
      if (!newName || newName.trim().length === 0) {
        throw new Error('Filename cannot be empty')
      }

      if (newName.length > 255) {
        throw new Error('Filename is too long (maximum 255 characters)')
      }

      // Check for invalid characters in filename
      const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
      if (invalidChars.test(newName)) {
        throw new Error('Filename contains invalid characters: < > : " / \\ | ? *')
      }

      // // // // // console.log(`[Rename Debug] Attempting to rename file ${fileId} to "${newName}"`)

      const response = await this.drive.files.update({
        fileId,
        requestBody: { name: newName.trim() },
        fields:
          'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
      })

      // // // // // console.log(`[Rename Debug] API Response:`, response.data)

      // // // // // console.log(`[Rename Debug] Converted file:`, convertedFile)

      return convertGoogleDriveFile(response.data)
    } catch (error: any) {
      // Handle Google Drive API specific errors
      if (error.response?.status) {
        const status = error.response.status
        const errorData = error.response.data?.error

        switch (status) {
          case 400:
            if (errorData?.message?.includes('Invalid value')) {
              throw new Error('Invalid filename provided')
            }
            throw new Error(errorData?.message || 'Bad request - invalid parameters')
          case 401:
            throw new Error('Authentication expired - please re-login to Google Drive')
          case 403:
            if (errorData?.message?.includes('insufficient permission')) {
              throw new Error("Permission denied - you don't have write access to this file")
            }
            throw new Error('Access forbidden - check your Google Drive permissions')
          case 404:
            throw new Error('File not found - it may have been deleted or moved')
          case 409:
            throw new Error('A file with this name already exists in the same location')
          case 429:
            throw new Error('Too many requests - please wait and try again')
          case 500:
          case 502:
          case 503:
            throw new Error('Google Drive server error - please try again later')
          default:
            throw new Error(errorData?.message || `Google Drive API error (${status})`)
        }
      }

      // Handle network and other errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Network connection failed - check your internet connection')
      }

      // Re-throw with original message if it's already informative
      throw error
    }
  }

  // Alias for clarity - same operation works for both files and folders
  async renameFolder(folderId: string, newName: string): Promise<DriveFile> {
    return this.renameFile(folderId, newName)
  }

  // Unified move operation for both files and folders with error recovery
  async moveFile(fileId: string, newParentId: string, currentParentId?: string): Promise<DriveFile> {
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
          'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
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
  async moveFolder(folderId: string, newParentId: string, currentParentId?: string): Promise<DriveFile> {
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
        'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners, shared, trashed',
    })

    const result = await response
    return convertGoogleDriveFile(result.data)
  }

  // Special handling for folder copying
  async copyFolder(folderId: string, metadata: Partial<DriveFileMetadata>): Promise<DriveFile> {
    const originalFolder = await this.getFile(folderId)

    // Create new folder with the specified metadata
    const newFolder = await this.createFolder(metadata.name || `${originalFolder.name} - Copy`, metadata.parents?.[0])

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
    try {
      const response = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id, type, role, emailAddress, domain, displayName)',
      })

      return response.data.permissions || []
    } catch (error) {
      throw error
    }
  }

  // Remove file permission
  async removeFilePermission(fileId: string, permissionId: string): Promise<void> {
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
  async createPermission(fileId: string, permissionData: any): Promise<any> {
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
  async deletePermission(fileId: string, permissionId: string): Promise<void> {
    try {
      await this.drive.permissions.delete({
        fileId,
        permissionId,
      })
    } catch (error) {
      throw error
    }
  }

  // Send notification email (for enhanced sharing)
  async sendNotificationEmail(_fileId: string, _emailData: any): Promise<void> {
    // Note: This would typically use the Gmail API or similar service
    // For now, we'll just log the action
  }
}
