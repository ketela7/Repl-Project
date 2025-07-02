/**
 * Helper functions for mapping Google Drive API responses to detailed file objects
 * Extracted from the monolithic getFileDetails function to improve maintainability
 */

import type {
  UserInfo,
  ImageMediaMetadata,
  VideoMediaMetadata,
  ShortcutDetails,
  ContentRestriction,
  LinkShareMetadata,
  LabelInfo,
} from './detailed-file-types'

/**
 * Map Google Drive user object to UserInfo interface
 */
export function mapUserInfo(user: any): UserInfo | undefined {
  if (!user) return undefined

  return {
    displayName: user.displayName || '',
    emailAddress: user.emailAddress || '',
    ...(user.photoLink && { photoLink: user.photoLink }),
  }
}

/**
 * Map image location data
 */
function mapImageLocation(locationData: any) {
  if (!locationData) return undefined

  return {
    ...(locationData.latitude !== undefined && { latitude: locationData.latitude }),
    ...(locationData.longitude !== undefined && { longitude: locationData.longitude }),
    ...(locationData.altitude !== undefined && { altitude: locationData.altitude }),
  }
}

/**
 * Map basic image dimensions and rotation
 */
function mapImageBasics(imageData: any) {
  return {
    ...(imageData.width !== undefined && { width: imageData.width }),
    ...(imageData.height !== undefined && { height: imageData.height }),
    ...(imageData.rotation !== undefined && { rotation: imageData.rotation }),
  }
}

/**
 * Map camera information
 */
function mapCameraInfo(imageData: any) {
  return {
    ...(imageData.cameraMake && { cameraMake: imageData.cameraMake }),
    ...(imageData.cameraModel && { cameraModel: imageData.cameraModel }),
    ...(imageData.lens && { lens: imageData.lens }),
  }
}

/**
 * Map exposure settings
 */
function mapExposureSettings(imageData: any) {
  return {
    ...(imageData.exposureTime !== undefined && { exposureTime: imageData.exposureTime }),
    ...(imageData.aperture !== undefined && { aperture: imageData.aperture }),
    ...(imageData.maxApertureValue !== undefined && {
      maxApertureValue: imageData.maxApertureValue,
    }),
    ...(imageData.exposureBias !== undefined && { exposureBias: imageData.exposureBias }),
    ...(imageData.exposureMode && { exposureMode: imageData.exposureMode }),
  }
}

/**
 * Map other camera settings
 */
function mapCameraSettings(imageData: any) {
  return {
    ...(imageData.flashUsed !== undefined && { flashUsed: imageData.flashUsed }),
    ...(imageData.focalLength !== undefined && { focalLength: imageData.focalLength }),
    ...(imageData.isoSpeed !== undefined && { isoSpeed: imageData.isoSpeed }),
    ...(imageData.meteringMode && { meteringMode: imageData.meteringMode }),
    ...(imageData.sensor && { sensor: imageData.sensor }),
    ...(imageData.colorSpace && { colorSpace: imageData.colorSpace }),
    ...(imageData.whiteBalance && { whiteBalance: imageData.whiteBalance }),
    ...(imageData.subjectDistance !== undefined && { subjectDistance: imageData.subjectDistance }),
  }
}

/**
 * Map Google Drive image metadata to ImageMediaMetadata interface
 */
export function mapImageMetadata(imageData: any): ImageMediaMetadata | undefined {
  if (!imageData) return undefined

  return {
    ...mapImageBasics(imageData),
    ...(imageData.location && { location: mapImageLocation(imageData.location) }),
    ...(imageData.time && { time: imageData.time }),
    ...mapCameraInfo(imageData),
    ...mapExposureSettings(imageData),
    ...mapCameraSettings(imageData),
  }
}

/**
 * Map Google Drive video metadata to VideoMediaMetadata interface
 */
export function mapVideoMetadata(videoData: any): VideoMediaMetadata | undefined {
  if (!videoData) return undefined

  return {
    ...(videoData.width !== undefined && { width: videoData.width }),
    ...(videoData.height !== undefined && { height: videoData.height }),
    ...(videoData.durationMillis && { durationMillis: videoData.durationMillis }),
  }
}

/**
 * Map Google Drive shortcut details to ShortcutDetails interface
 */
export function mapShortcutDetails(shortcutData: any): ShortcutDetails | undefined {
  if (!shortcutData) return undefined

  return {
    ...(shortcutData.targetId && { targetId: shortcutData.targetId }),
    ...(shortcutData.targetMimeType && { targetMimeType: shortcutData.targetMimeType }),
    ...(shortcutData.targetResourceKey && { targetResourceKey: shortcutData.targetResourceKey }),
  }
}

/**
 * Map Google Drive content restrictions to ContentRestriction array
 */
export function mapContentRestrictions(restrictions: any[]): ContentRestriction[] {
  if (!restrictions) return []

  return restrictions.map(restriction => ({
    readOnly: restriction.readOnly || false,
    ...(restriction.reason && { reason: restriction.reason }),
    ...(restriction.restrictingUser && {
      restrictingUser: mapUserInfo(restriction.restrictingUser),
    }),
    ...(restriction.restrictionTime && { restrictionTime: restriction.restrictionTime }),
    ...(restriction.type && { type: restriction.type }),
  }))
}

/**
 * Map Google Drive link share metadata to LinkShareMetadata interface
 */
export function mapLinkShareMetadata(linkData: any): LinkShareMetadata | undefined {
  if (!linkData) return undefined

  return {
    ...(linkData.securityUpdateEligible !== undefined && {
      securityUpdateEligible: linkData.securityUpdateEligible,
    }),
    ...(linkData.securityUpdateEnabled !== undefined && {
      securityUpdateEnabled: linkData.securityUpdateEnabled,
    }),
  }
}

/**
 * Map Google Drive label info to LabelInfo interface
 */
export function mapLabelInfo(labelData: any): LabelInfo | undefined {
  if (!labelData) return undefined

  return {
    ...(labelData.labels && {
      labels: labelData.labels.map((label: any) => ({
        ...(label.id && { id: label.id }),
        ...(label.revisionId && { revisionId: label.revisionId }),
        ...(label.kind && { kind: label.kind }),
        ...(label.fields && { fields: label.fields }),
      })),
    }),
  }
}

/**
 * Map basic file properties that use simple conditional assignment
 */
export function mapBasicProperties(responseData: any) {
  return {
    ...(responseData.description && { description: responseData.description }),
    ...(responseData.version && { version: responseData.version }),
    ...(responseData.folderColorRgb && { folderColorRgb: responseData.folderColorRgb }),
    ...(responseData.fullFileExtension && { fullFileExtension: responseData.fullFileExtension }),
    ...(responseData.fileExtension && { fileExtension: responseData.fileExtension }),
    ...(responseData.originalFilename && { originalFilename: responseData.originalFilename }),
    ...(responseData.headRevisionId && { headRevisionId: responseData.headRevisionId }),
    ...(responseData.teamDriveId && { teamDriveId: responseData.teamDriveId }),
    ...(responseData.resourceKey && { resourceKey: responseData.resourceKey }),
  }
}

/**
 * Map checksum properties (md5, sha1, sha256)
 */
export function mapChecksums(responseData: any) {
  return {
    ...(responseData.md5Checksum && { md5Checksum: responseData.md5Checksum }),
    ...(responseData.sha1Checksum && { sha1Checksum: responseData.sha1Checksum }),
    ...(responseData.sha256Checksum && { sha256Checksum: responseData.sha256Checksum }),
    ...(responseData.quotaBytesUsed && { quotaBytesUsed: responseData.quotaBytesUsed }),
  }
}

/**
 * Map boolean properties with default values
 */
export function mapBooleanProperties(responseData: any) {
  return {
    starred: responseData.starred || false,
    viewed: responseData.viewedByMe || false,
    explicitlyTrashed: responseData.explicitlyTrashed || false,
    isAppAuthorized: responseData.isAppAuthorized || false,
    copyRequiresWriterPermission: responseData.copyRequiresWriterPermission || false,
    writersCanShare: responseData.writersCanShare || true,
    hasAugmentedPermissions: responseData.hasAugmentedPermissions || false,
    ownedByMe: responseData.ownedByMe || false,
  }
}

/**
 * Map array and object properties with defaults
 */
export function mapCollectionProperties(responseData: any) {
  return {
    spaces: responseData.spaces || [],
    properties: responseData.properties || {},
    appProperties: responseData.appProperties || {},
    exportLinks: responseData.exportLinks || {},
    capabilities: responseData.capabilities || {},
  }
}
