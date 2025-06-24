'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  FileVideo,
  FileText,
  FileImage,
  FileAudio,
  Archive,
  FileCode,
  FileSpreadsheet,
  Presentation,
  File,
  Folder,
  BookOpen,
  Link,
} from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
}

interface FileCategoryBadgesProps {
  files: DriveFile[]
  folders: DriveFile[]
  onCategoryClick?: (category: string) => void
  className?: string
}

interface FileCategory {
  name: string
  count: number
  color: string
  bgColor: string
  textColor: string
  icon: React.ReactNode
  mimeTypes: string[]
}

const getCategoryFromMimeType = (mimeType: string): string => {
  const mime = mimeType.toLowerCase()

  // Video files - comprehensive list
  if (
    mime.startsWith('video/') ||
    mime.includes('mp4') ||
    mime.includes('mov') ||
    mime.includes('avi') ||
    mime.includes('mkv') ||
    mime.includes('webm') ||
    mime.includes('flv') ||
    mime.includes('wmv') ||
    mime.includes('m4v') ||
    mime.includes('3gp') ||
    mime.includes('ogv') ||
    mime.includes('vob') ||
    mime.includes('ts') ||
    mime.includes('mts') ||
    mime.includes('divx') ||
    mime.includes('xvid')
  ) {
    return 'Videos'
  }

  // Audio files - comprehensive list
  if (
    mime.startsWith('audio/') ||
    mime.includes('mp3') ||
    mime.includes('wav') ||
    mime.includes('flac') ||
    mime.includes('aac') ||
    mime.includes('ogg') ||
    mime.includes('wma') ||
    mime.includes('m4a') ||
    mime.includes('opus') ||
    mime.includes('ac3') ||
    mime.includes('dts') ||
    mime.includes('amr') ||
    mime.includes('ape') ||
    mime.includes('au') ||
    mime.includes('ra') ||
    mime.includes('aiff')
  ) {
    return 'Audio'
  }

  // Image files - comprehensive list
  if (
    mime.startsWith('image/') ||
    mime.includes('jpeg') ||
    mime.includes('jpg') ||
    mime.includes('png') ||
    mime.includes('gif') ||
    mime.includes('bmp') ||
    mime.includes('svg') ||
    mime.includes('webp') ||
    mime.includes('tiff') ||
    mime.includes('tif') ||
    mime.includes('ico') ||
    mime.includes('psd') ||
    mime.includes('ai') ||
    mime.includes('eps') ||
    mime.includes('raw') ||
    mime.includes('cr2') ||
    mime.includes('nef') ||
    mime.includes('orf') ||
    mime.includes('sr2') ||
    mime.includes('heic') ||
    mime.includes('heif') ||
    mime.includes('avif')
  ) {
    return 'Images'
  }

  // Document files - comprehensive list
  if (
    mime.includes('document') ||
    mime.includes('pdf') ||
    mime.includes('msword') ||
    mime.includes('wordprocessingml') ||
    mime.includes('rtf') ||
    mime.includes('odt') ||
    mime.includes('pages') ||
    mime.includes('docx') ||
    mime.includes('doc') ||
    mime.includes('txt') ||
    mime.includes('markdown') ||
    mime.includes('md') ||
    mime.includes('tex') ||
    mime.includes('wps') ||
    mime.includes('wpd') ||
    mime.includes('abw') ||
    mime.includes('zabw')
  ) {
    return 'Documents'
  }

  // Spreadsheet files - comprehensive list
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    mime.includes('csv') ||
    mime.includes('ods') ||
    mime.includes('numbers') ||
    mime.includes('xlsx') ||
    mime.includes('xls') ||
    mime.includes('xlsm') ||
    mime.includes('xlsb') ||
    mime.includes('xltx') ||
    mime.includes('xltm') ||
    mime.includes('xlt') ||
    mime.includes('xlam') ||
    mime.includes('xla') ||
    mime.includes('xlw') ||
    mime.includes('tsv')
  ) {
    return 'Spreadsheets'
  }

  // Presentation files - comprehensive list
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    mime.includes('ppt') ||
    mime.includes('odp') ||
    mime.includes('keynote') ||
    mime.includes('pptx') ||
    mime.includes('pptm') ||
    mime.includes('potx') ||
    mime.includes('potm') ||
    mime.includes('pot') ||
    mime.includes('ppsx') ||
    mime.includes('ppsm') ||
    mime.includes('pps') ||
    mime.includes('ppam') ||
    mime.includes('ppa')
  ) {
    return 'Presentations'
  }

  // Archive files - comprehensive list
  if (
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('tar') ||
    mime.includes('gz') ||
    mime.includes('7z') ||
    mime.includes('archive') ||
    mime.includes('bz2') ||
    mime.includes('xz') ||
    mime.includes('lz') ||
    mime.includes('z') ||
    mime.includes('cab') ||
    mime.includes('deb') ||
    mime.includes('rpm') ||
    mime.includes('dmg') ||
    mime.includes('iso') ||
    mime.includes('msi') ||
    mime.includes('pkg') ||
    mime.includes('apk') ||
    mime.includes('ipa')
  ) {
    return 'Archives'
  }

  // Code files - comprehensive list
  if (
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime.includes('xml') ||
    mime.includes('yaml') ||
    mime.includes('yml') ||
    mime.includes('python') ||
    mime.includes('java') ||
    mime.includes('cpp') ||
    mime.includes('php') ||
    mime.includes('ruby') ||
    mime.includes('sql') ||
    mime.includes('js') ||
    mime.includes('ts') ||
    mime.includes('jsx') ||
    mime.includes('tsx') ||
    mime.includes('vue') ||
    mime.includes('svelte') ||
    mime.includes('go') ||
    mime.includes('rust') ||
    mime.includes('swift') ||
    mime.includes('kotlin') ||
    mime.includes('scala') ||
    mime.includes('perl') ||
    mime.includes('bash') ||
    mime.includes('shell') ||
    mime.includes('powershell') ||
    mime.includes('dockerfile') ||
    mime.includes('makefile') ||
    mime.includes('gradle') ||
    mime.includes('maven') ||
    mime.includes('npm') ||
    mime.includes('package.json') ||
    mime.includes('composer.json') ||
    mime.includes('gemfile') ||
    mime.includes('requirements.txt') ||
    mime.includes('pipfile')
  ) {
    return 'Code'
  }

  // Google Drive specific mime types
  if (mime.includes('vnd.google-apps.document')) return 'Documents'
  if (mime.includes('vnd.google-apps.spreadsheet')) return 'Spreadsheets'
  if (mime.includes('vnd.google-apps.presentation')) return 'Presentations'
  if (mime.includes('vnd.google-apps.drawing')) return 'Images'
  if (mime.includes('vnd.google-apps.form')) return 'Documents'
  if (mime.includes('vnd.google-apps.site')) return 'Documents'
  if (mime.includes('vnd.google-apps.script')) return 'Code'
  if (mime.includes('vnd.google-apps.shortcut')) return 'Shortcuts'

  // Microsoft Office mime types
  if (mime.includes('vnd.openxmlformats-officedocument.wordprocessingml'))
    return 'Documents'
  if (mime.includes('vnd.openxmlformats-officedocument.spreadsheetml'))
    return 'Spreadsheets'
  if (mime.includes('vnd.openxmlformats-officedocument.presentationml'))
    return 'Presentations'
  if (mime.includes('vnd.ms-excel')) return 'Spreadsheets'
  if (mime.includes('vnd.ms-powerpoint')) return 'Presentations'
  if (mime.includes('vnd.ms-word')) return 'Documents'

  // Default to Others
  return 'Others'
}

const getCategoryConfig = (
  categoryName: string
): Omit<FileCategory, 'count' | 'mimeTypes'> => {
  const configs = {
    Videos: {
      name: 'Videos',
      color: 'border-red-200 dark:border-red-800',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      textColor: 'text-red-700 dark:text-red-300',
      icon: <FileVideo className="h-4 w-4" />,
    },
    Documents: {
      name: 'Documents',
      color: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: <FileText className="h-4 w-4" />,
    },
    Images: {
      name: 'Images',
      color: 'border-purple-200 dark:border-purple-800',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: <FileImage className="h-4 w-4" />,
    },
    Audio: {
      name: 'Audio',
      color: 'border-orange-200 dark:border-orange-800',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      textColor: 'text-orange-700 dark:text-orange-300',
      icon: <FileAudio className="h-4 w-4" />,
    },
    Spreadsheets: {
      name: 'Spreadsheets',
      color: 'border-green-200 dark:border-green-800',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      textColor: 'text-green-700 dark:text-green-300',
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    Presentations: {
      name: 'Presentations',
      color: 'border-yellow-200 dark:border-yellow-800',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      icon: <Presentation className="h-4 w-4" />,
    },
    Archives: {
      name: 'Archives',
      color: 'border-gray-200 dark:border-gray-700',
      bgColor: 'bg-gray-50 dark:bg-gray-950/50',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: <Archive className="h-4 w-4" />,
    },
    Code: {
      name: 'Code',
      color: 'border-indigo-200 dark:border-indigo-800',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      icon: <FileCode className="h-4 w-4" />,
    },
    Others: {
      name: 'Others',
      color: 'border-slate-200 dark:border-slate-700',
      bgColor: 'bg-slate-50 dark:bg-slate-950/50',
      textColor: 'text-slate-700 dark:text-slate-300',
      icon: <File className="h-4 w-4" />,
    },
    Folders: {
      name: 'Folders',
      color: 'border-cyan-200 dark:border-cyan-800',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      icon: <Folder className="h-4 w-4" />,
    },
    Shortcuts: {
      name: 'Shortcuts',
      color: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: <Link className="h-4 w-4" />,
    },
    PDF: {
      name: 'PDF',
      color: 'border-rose-200 dark:border-rose-800',
      bgColor: 'bg-rose-50 dark:bg-rose-950/50',
      textColor: 'text-rose-700 dark:text-rose-300',
      icon: <FileText className="h-4 w-4" />,
    },
    Design: {
      name: 'Design',
      color: 'border-pink-200 dark:border-pink-800',
      bgColor: 'bg-pink-50 dark:bg-pink-950/50',
      textColor: 'text-pink-700 dark:text-pink-300',
      icon: <FileImage className="h-4 w-4" />,
    },
    'E-books': {
      name: 'E-books',
      color: 'border-teal-200 dark:border-teal-800',
      bgColor: 'bg-teal-50 dark:bg-teal-950/50',
      textColor: 'text-teal-700 dark:text-teal-300',
      icon: <BookOpen className="h-4 w-4" />,
    },
    Fonts: {
      name: 'Fonts',
      color: 'border-gray-200 dark:border-gray-700',
      bgColor: 'bg-gray-50 dark:bg-gray-950/50',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: <FileText className="h-4 w-4" />,
    },
    Calendar: {
      name: 'Calendar',
      color: 'border-emerald-200 dark:border-emerald-800',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      icon: <FileText className="h-4 w-4" />,
    },
    Contacts: {
      name: 'Contacts',
      color: 'border-cyan-200 dark:border-cyan-800',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      icon: <FileText className="h-4 w-4" />,
    },
    Database: {
      name: 'Database',
      color: 'border-indigo-200 dark:border-indigo-800',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      icon: <FileText className="h-4 w-4" />,
    },
  }

  return configs[categoryName as keyof typeof configs] || configs['Others']
}

export function FileCategoryBadges({
  files,
  folders,
  onCategoryClick,
  className = '',
}: FileCategoryBadgesProps) {
  const categories = React.useMemo(() => {
    // Count files by category
    const fileCounts = files.reduce(
      (acc, file) => {
        const category = getCategoryFromMimeType(file.mimeType)
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Add folders if they exist
    if (folders.length > 0) {
      fileCounts['Folders'] = folders.length
    }

    // Convert to category objects and sort by count (descending)
    return Object.entries(fileCounts)
      .map(([categoryName, count]) => ({
        ...getCategoryConfig(categoryName),
        count,
        mimeTypes: [], // We don't need to track specific mime types here
      }))
      .sort((a, b) => b.count - a.count)
  }, [files, folders])

  if (categories.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-background/50 flex flex-wrap gap-2 rounded-lg border p-2 sm:gap-3 sm:p-3">
        {categories.slice(0, 6).map((category) => (
          <Badge
            key={category.name}
            variant="outline"
            className={`cursor-pointer px-3 py-2 transition-all duration-200 select-none hover:scale-105 hover:shadow-md active:scale-95 sm:px-4 sm:py-2.5 ${category.color} ${category.bgColor} ${category.textColor} focus:ring-primary/20 flex max-w-fit min-w-fit touch-manipulation items-center gap-1.5 rounded-full border-2 text-xs font-semibold shadow-sm backdrop-blur-sm hover:shadow-lg focus:ring-2 focus:outline-none sm:gap-2 sm:text-sm`}
            onClick={() => onCategoryClick?.(category.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCategoryClick?.(category.name)
              }
            }}
          >
            <span className="flex-shrink-0 text-current">{category.icon}</span>
            <span className="font-semibold whitespace-nowrap text-current">
              {category.name} {category.count}
            </span>
          </Badge>
        ))}
        {categories.length > 6 && (
          <Badge
            variant="outline"
            className="text-muted-foreground border-dashed px-3 py-2 text-xs"
          >
            +{categories.length - 6} more
          </Badge>
        )}
      </div>
    </div>
  )
}

export default FileCategoryBadges
