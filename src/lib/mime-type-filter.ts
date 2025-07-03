/**
 * Shared mimeType filtering utility for consistent backend and frontend filtering
 * Ensures identical results between Google Drive API queries and client-side filtering
 */

import React from 'react'
import {
  FileText,
  Folder,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Link,
  Calendar,
  User,
  HardDrive,
} from 'lucide-react'

// File type categories with their associated mimeTypes
export interface FileTypeCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  mimeTypes: string[]
  googleDriveQuery: string
  description?: string
}

// Complete file type categories mapping
export const FILE_TYPE_CATEGORIES: Record<string, FileTypeCategory> = {
  folder: {
    id: 'folder',
    label: 'Folders',
    icon: Folder,
    color: 'text-blue-600',
    mimeTypes: ['application/vnd.google-apps.folder'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.folder'",
    description: 'All folders and directories',
  },

  shortcut: {
    id: 'shortcut',
    label: 'Shortcuts',
    icon: Link,
    color: 'text-blue-700',
    mimeTypes: ['application/vnd.google-apps.shortcut'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.shortcut'",
    description: 'Google Drive shortcuts',
  },

  document: {
    id: 'document',
    label: 'Documents',
    icon: FileText,
    color: 'text-blue-600',
    mimeTypes: [
      'application/vnd.google-apps.document',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/vnd.google-apps.document'",
      "mimeType = 'application/pdf'",
      "mimeType = 'text/plain'",
      "mimeType = 'application/msword'",
      "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
    ].join(' or ')})`,
    description: 'Text documents, PDFs, Word files',
  },

  spreadsheet: {
    id: 'spreadsheet',
    label: 'Spreadsheets',
    icon: FileText,
    color: 'text-green-600',
    mimeTypes: [
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/vnd.google-apps.spreadsheet'",
      "mimeType = 'application/vnd.ms-excel'",
      "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
    ].join(' or ')})`,
    description: 'Google Sheets, Excel files',
  },

  presentation: {
    id: 'presentation',
    label: 'Presentations',
    icon: FileText,
    color: 'text-orange-600',
    mimeTypes: [
      'application/vnd.google-apps.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/vnd.google-apps.presentation'",
      "mimeType = 'application/vnd.ms-powerpoint'",
      "mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'",
    ].join(' or ')})`,
    description: 'Google Slides, PowerPoint files',
  },

  image: {
    id: 'image',
    label: 'Images',
    icon: Image,
    color: 'text-purple-600',
    mimeTypes: [], // Dynamic: any mimeType containing 'image/'
    googleDriveQuery: "mimeType contains 'image/'",
    description: 'Photos, graphics, screenshots',
  },

  video: {
    id: 'video',
    label: 'Videos',
    icon: Video,
    color: 'text-red-600',
    mimeTypes: [], // Dynamic: any mimeType containing 'video/'
    googleDriveQuery: "mimeType contains 'video/'",
    description: 'Movies, recordings, animations',
  },

  audio: {
    id: 'audio',
    label: 'Audio',
    icon: Music,
    color: 'text-blue-600',
    mimeTypes: [], // Dynamic: any mimeType containing 'audio/'
    googleDriveQuery: "mimeType contains 'audio/'",
    description: 'Music, podcasts, voice recordings',
  },

  archive: {
    id: 'archive',
    label: 'Archives',
    icon: Archive,
    color: 'text-amber-600',
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-bzip2',
      'application/x-xz',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/zip'",
      "mimeType = 'application/x-zip-compressed'",
      "mimeType = 'application/x-rar-compressed'",
      "mimeType = 'application/vnd.rar'",
      "mimeType = 'application/x-7z-compressed'",
      "mimeType = 'application/x-tar'",
      "mimeType = 'application/gzip'",
      "mimeType = 'application/x-bzip2'",
      "mimeType = 'application/x-xz'",
    ].join(' or ')})`,
    description: 'ZIP, RAR, 7Z compressed files',
  },

  code: {
    id: 'code',
    label: 'Code Files',
    icon: Code,
    color: 'text-slate-600',
    mimeTypes: [
      'text/javascript',
      'application/javascript',
      'text/x-python',
      'text/x-c',
      'text/x-c++',
      'text/x-java-source',
      'application/json',
      'application/xml',
      'text/html',
      'text/css',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'text/javascript'",
      "mimeType = 'application/javascript'",
      "mimeType = 'text/x-python'",
      "mimeType = 'text/x-c'",
      "mimeType = 'text/x-c++'",
      "mimeType = 'text/x-java-source'",
      "mimeType = 'application/json'",
      "mimeType = 'application/xml'",
      "mimeType = 'text/html'",
      "mimeType = 'text/css'",
      "mimeType contains 'text/x-'",
      "mimeType contains 'application/x-'",
    ].join(' or ')})`,
    description: 'Programming source code files',
  },

  drawing: {
    id: 'drawing',
    label: 'Drawings',
    icon: Image,
    color: 'text-pink-600',
    mimeTypes: ['application/vnd.google-apps.drawing'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.drawing'",
    description: 'Google Drawings',
  },

  form: {
    id: 'form',
    label: 'Forms',
    icon: FileText,
    color: 'text-indigo-600',
    mimeTypes: ['application/vnd.google-apps.form'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.form'",
    description: 'Google Forms',
  },

  jamboard: {
    id: 'jamboard',
    label: 'Jamboards',
    icon: FileText,
    color: 'text-yellow-600',
    mimeTypes: ['application/vnd.google-apps.jam'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.jam'",
    description: 'Google Jamboard files',
  },

  script: {
    id: 'script',
    label: 'Scripts',
    icon: Code,
    color: 'text-gray-600',
    mimeTypes: ['application/vnd.google-apps.script'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.script'",
    description: 'Google Apps Scripts',
  },

  site: {
    id: 'site',
    label: 'Sites',
    icon: FileText,
    color: 'text-blue-500',
    mimeTypes: ['application/vnd.google-apps.site'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.site'",
    description: 'Google Sites',
  },

  map: {
    id: 'map',
    label: 'Maps',
    icon: FileText,
    color: 'text-green-500',
    mimeTypes: ['application/vnd.google-apps.map'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.map'",
    description: 'Google My Maps',
  },

  photo: {
    id: 'photo',
    label: 'Photos',
    icon: Image,
    color: 'text-purple-500',
    mimeTypes: ['application/vnd.google-apps.photo'],
    googleDriveQuery: "mimeType = 'application/vnd.google-apps.photo'",
    description: 'Google Photos items',
  },

  'google-native': {
    id: 'google-native',
    label: 'Google Apps',
    icon: FileText,
    color: 'text-blue-500',
    mimeTypes: [], // Dynamic: any mimeType containing 'application/vnd.google-apps'
    googleDriveQuery: "mimeType contains 'application/vnd.google-apps'",
    description: 'All Google Workspace files',
  },

  pdf: {
    id: 'pdf',
    label: 'PDF Files',
    icon: FileText,
    color: 'text-rose-600',
    mimeTypes: ['application/pdf'],
    googleDriveQuery: "mimeType = 'application/pdf'",
    description: 'Portable Document Format files',
  },

  text: {
    id: 'text',
    label: 'Text Files',
    icon: FileText,
    color: 'text-slate-600',
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values'],
    googleDriveQuery: `(${[
      "mimeType = 'text/plain'",
      "mimeType = 'text/markdown'",
      "mimeType = 'text/csv'",
      "mimeType = 'text/tab-separated-values'",
    ].join(' or ')})`,
    description: 'Plain text, markdown, CSV files',
  },

  design: {
    id: 'design',
    label: 'Design Files',
    icon: Image,
    color: 'text-pink-600',
    mimeTypes: [
      'application/vnd.google-apps.drawing',
      'image/svg+xml',
      'application/postscript',
      'application/illustrator',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/vnd.google-apps.drawing'",
      "mimeType = 'image/svg+xml'",
      "mimeType = 'application/postscript'",
      "mimeType = 'application/illustrator'",
    ].join(' or ')})`,
    description: 'Vector graphics, illustrations',
  },

  database: {
    id: 'database',
    label: 'Database Files',
    icon: HardDrive,
    color: 'text-indigo-600',
    mimeTypes: ['application/x-sqlite3', 'application/vnd.ms-access', 'application/x-dbf'],
    googleDriveQuery: `(${[
      "mimeType = 'application/x-sqlite3'",
      "mimeType = 'application/vnd.ms-access'",
      "mimeType = 'application/x-dbf'",
      "mimeType contains 'database'",
    ].join(' or ')})`,
    description: 'Database and data files',
  },

  ebook: {
    id: 'ebook',
    label: 'E-books',
    icon: FileText,
    color: 'text-teal-600',
    mimeTypes: [
      'application/epub+zip',
      'application/x-mobipocket-ebook',
      'application/vnd.amazon.ebook',
      'application/x-fictionbook+xml',
    ],
    googleDriveQuery: `(${[
      "mimeType = 'application/epub+zip'",
      "mimeType = 'application/x-mobipocket-ebook'",
      "mimeType = 'application/vnd.amazon.ebook'",
      "mimeType = 'application/x-fictionbook+xml'",
    ].join(' or ')})`,
    description: 'Electronic books and publications',
  },

  font: {
    id: 'font',
    label: 'Fonts',
    icon: FileText,
    color: 'text-gray-600',
    mimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff'],
    googleDriveQuery: `(${[
      "mimeType = 'font/ttf'",
      "mimeType = 'font/otf'",
      "mimeType = 'font/woff'",
      "mimeType = 'font/woff2'",
      "mimeType = 'application/font-woff'",
    ].join(' or ')})`,
    description: 'Typography and font files',
  },

  calendar: {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    color: 'text-blue-500',
    mimeTypes: ['text/calendar', 'application/ics'],
    googleDriveQuery: `(${["mimeType = 'text/calendar'", "mimeType = 'application/ics'"].join(
      ' or ',
    )})`,
    description: 'Calendar and event files',
  },

  contact: {
    id: 'contact',
    label: 'Contacts',
    icon: User,
    color: 'text-green-600',
    mimeTypes: ['text/vcard', 'text/x-vcard'],
    googleDriveQuery: `(${["mimeType = 'text/vcard'", "mimeType = 'text/x-vcard'"].join(' or ')})`,
    description: 'Contact and address book files',
  },

  other: {
    id: 'other',
    label: 'Other Files',
    icon: FileText,
    color: 'text-gray-500',
    mimeTypes: [], // Special case: everything not categorized
    googleDriveQuery: `(${[
      "not mimeType contains 'application/vnd.google-apps'",
      "not mimeType contains 'image/'",
      "not mimeType contains 'video/'",
      "not mimeType contains 'audio/'",
      "not mimeType contains 'text/'",
      "not mimeType contains 'application/pdf'",
      "not mimeType contains 'zip'",
      "not mimeType contains 'archive'",
    ].join(' and ')})`,
    description: 'Uncategorized file types',
  },
}

/**
 * Get Google Drive API query condition for file types
 */
export function getGoogleDriveQuery(fileTypes: string[]): string {
  if (!fileTypes.length || fileTypes.includes('all')) {
    return ''
  }

  const typeConditions: string[] = []

  fileTypes.forEach(type => {
    const category = FILE_TYPE_CATEGORIES[type.trim()]
    if (category) {
      typeConditions.push(category.googleDriveQuery)
    }
  })

  return typeConditions.length > 0 ? `(${typeConditions.join(' or ')})` : ''
}

/**
 * Check if a file matches the specified file type categories (client-side filtering)
 */
export function matchesFileType(mimeType: string, fileTypes: string[]): boolean {
  if (!fileTypes.length || fileTypes.includes('all')) {
    return true
  }

  return fileTypes.some(type => {
    const category = FILE_TYPE_CATEGORIES[type.trim()]
    if (!category) return false

    // Handle dynamic categories (image, video, audio, etc.)
    if (category.id === 'image') {
      return mimeType.includes('image/')
    }
    if (category.id === 'video') {
      return mimeType.includes('video/')
    }
    if (category.id === 'audio') {
      return mimeType.includes('audio/')
    }
    if (category.id === 'google-native') {
      return mimeType.includes('application/vnd.google-apps')
    }
    if (category.id === 'code') {
      return (
        category.mimeTypes.includes(mimeType) ||
        mimeType.includes('text/x-') ||
        mimeType.includes('application/x-')
      )
    }
    if (category.id === 'database') {
      return category.mimeTypes.includes(mimeType) || mimeType.includes('database')
    }
    if (category.id === 'other') {
      // Special logic for "other" category - exclude all known categories
      return (
        !mimeType.includes('application/vnd.google-apps') &&
        !mimeType.includes('image/') &&
        !mimeType.includes('video/') &&
        !mimeType.includes('audio/') &&
        !mimeType.includes('text/') &&
        !mimeType.includes('application/pdf') &&
        !mimeType.includes('zip') &&
        !mimeType.includes('archive')
      )
    }

    // Standard exact match for specific mimeTypes
    return category.mimeTypes.includes(mimeType)
  })
}

/**
 * Get file type category for a given mimeType
 */
export function getFileTypeCategory(mimeType: string): string {
  // Check each category to find the matching one
  for (const categoryId of Object.keys(FILE_TYPE_CATEGORIES)) {
    if (matchesFileType(mimeType, [categoryId])) {
      return categoryId
    }
  }
  return 'other'
}

/**
 * Get all available file type categories as array for UI
 */
export function getFileTypeCategories(): FileTypeCategory[] {
  return Object.values(FILE_TYPE_CATEGORIES)
}

/**
 * Get common file type categories (most used ones)
 */
export function getCommonFileTypeCategories(): FileTypeCategory[] {
  const commonTypes = [
    'folder',
    'document',
    'spreadsheet',
    'presentation',
    'image',
    'video',
    'audio',
    'archive',
    'code',
    'pdf',
  ]
  return commonTypes
    .map(id => FILE_TYPE_CATEGORIES[id as keyof typeof FILE_TYPE_CATEGORIES])
    .filter(Boolean)
}

/**
 * Count files by category for analytics/badges
 */
export function countFilesByCategory(files: Array<{ mimeType: string }>): Record<string, number> {
  const counts: Record<string, number> = {}

  // Initialize all categories with 0
  Object.keys(FILE_TYPE_CATEGORIES).forEach(category => {
    counts[category] = 0
  })

  // Count files in each category
  files.forEach(file => {
    const category = getFileTypeCategory(file.mimeType)
    if (Object.prototype.hasOwnProperty.call(counts, category)) {
      counts[category] = (counts[category] || 0) + 1
    } else {
      counts[category] = 1
    }
  })

  return counts
}

/**
 * Format category count for display with badge
 */
export function formatCategoryCount(count: number): string {
  if (count === 0) return ''
  if (count < 1000) return count.toString()
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
  return `${(count / 1000000).toFixed(1)}M`
}
