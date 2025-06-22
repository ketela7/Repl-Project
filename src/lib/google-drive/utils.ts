import { drive_v3 } from 'googleapis';
import { DriveFile, DriveFolder, DriveFileCapabilities } from './types';

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

  if (isNaN(size) || size === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getFileIconName(mimeType: string, fileName?: string): string {
  const iconMap: Record<string, string> = {
    // Google Workspace Files
    'application/vnd.google-apps.folder': 'Folder',
    'application/vnd.google-apps.document': 'FileText',
    'application/vnd.google-apps.spreadsheet': 'FileSpreadsheet',
    'application/vnd.google-apps.presentation': 'Presentation',
    'application/vnd.google-apps.form': 'FileCheck',
    'application/vnd.google-apps.drawing': 'Palette',
    'application/vnd.google-apps.map': 'MapPin',
    'application/vnd.google-apps.site': 'Globe',
    'application/vnd.google-apps.script': 'FileCode',
    'application/vnd.google-apps.shortcut': 'Link',

    // PDF and Documents
    'application/pdf': 'BookOpen',
    'text/plain': 'FileText',
    'text/markdown': 'FileText',
    'application/msword': 'FileText',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
    'application/rtf': 'FileText',

    // Spreadsheets
    'application/vnd.ms-excel': 'FileSpreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'FileSpreadsheet',
    'text/csv': 'FileSpreadsheet',

    // Presentations
    'application/vnd.ms-powerpoint': 'Presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentation',

    // Images
    'image/jpeg': 'FileImage',
    'image/jpg': 'FileImage',
    'image/png': 'FileImage',
    'image/gif': 'FileImage',
    'image/svg+xml': 'FileImage',
    'image/webp': 'FileImage',
    'image/bmp': 'FileImage',
    'image/tiff': 'FileImage',
    'image/ico': 'FileImage',

    // Videos
    'video/mp4': 'FileVideo',
    'video/avi': 'FileVideo',
    'video/mov': 'FileVideo',
    'video/wmv': 'FileVideo',
    'video/webm': 'FileVideo',
    'video/mkv': 'FileVideo',
    'video/x-matroska': 'FileVideo',
    'video/flv': 'FileVideo',
    'video/x-flv': 'FileVideo',
    'video/quicktime': 'FileVideo',
    'video/3gpp': 'FileVideo',
    'video/3gpp2': 'FileVideo',
    'video/x-msvideo': 'FileVideo',
    'video/mp2t': 'FileVideo',
    'video/mpeg': 'FileVideo',
    'video/x-ms-wmv': 'FileVideo',
    'video/x-ms-asf': 'FileVideo',
    'video/ogg': 'FileVideo',
    'video/divx': 'FileVideo',
    'video/x-m4v': 'FileVideo',

    // Audio
    'audio/mp3': 'Music',
    'audio/wav': 'Music',
    'audio/x-wav': 'Music',
    'audio/m4a': 'Music',
    'audio/flac': 'Music',
    'audio/x-flac': 'Music',
    'audio/aac': 'Music',
    'audio/ogg': 'Music',
    'audio/vorbis': 'Music',
    'audio/wma': 'Music',
    'audio/x-ms-wma': 'Music',
    'audio/opus': 'Music',
    'audio/mpeg': 'Music',
    'audio/mp4': 'Music',
    'audio/x-m4a': 'Music',
    'audio/ac3': 'Music',
    'audio/x-aiff': 'Music',
    'audio/aiff': 'Music',
    'audio/midi': 'Music',
    'audio/x-midi': 'Music',
    'audio/amr': 'Music',
    'audio/3gpp': 'Music',

    // Archives
    'application/zip': 'Archive',
    'application/x-zip-compressed': 'Archive',
    'application/x-rar-compressed': 'Archive',
    'application/x-rar': 'Archive',
    'application/rar': 'Archive',
    'application/vnd.rar': 'Archive',
    'application/x-7z-compressed': 'Archive',
    'application/x-7zip': 'Archive',
    'application/gzip': 'Archive',
    'application/x-gzip': 'Archive',
    'application/x-tar': 'Archive',
    'application/x-compressed': 'Archive',
    'application/x-bzip2': 'Archive',
    'application/x-bzip': 'Archive',
    'application/x-lzh': 'Archive',
    'application/x-ace': 'Archive',
    'application/x-cab': 'Archive',
    'application/x-iso9660-image': 'Archive',
    'application/x-stuffit': 'Archive',
    'application/x-apple-diskimage': 'Archive',

    // Code files
    'text/javascript': 'FileCode',
    'application/javascript': 'FileCode',
    'application/x-javascript': 'FileCode',
    'application/json': 'FileCode',
    'application/ld+json': 'FileCode',
    'text/html': 'FileCode',
    'application/xhtml+xml': 'FileCode',
    'text/css': 'FileCode',
    'text/xml': 'FileCode',
    'application/xml': 'FileCode',
    'text/typescript': 'FileCode',
    'application/typescript': 'FileCode',
    'text/x-python': 'FileCode',
    'application/x-python-code': 'FileCode',
    'text/x-python-script': 'FileCode',
    'text/x-java-source': 'FileCode',
    'application/java-archive': 'Package',
    'text/x-c': 'FileCode',
    'text/x-c++': 'FileCode',
    'text/x-csharp': 'FileCode',
    'text/x-php': 'FileCode',
    'application/x-php': 'FileCode',
    'text/x-ruby': 'FileCode',
    'application/x-ruby': 'FileCode',
    'text/x-go': 'FileCode',
    'text/x-rust': 'FileCode',
    'text/x-swift': 'FileCode',
    'text/x-kotlin': 'FileCode',
    'text/x-scala': 'FileCode',
    'text/x-perl': 'FileCode',
    'application/x-perl': 'FileCode',
    'application/x-sh': 'Terminal',
    'text/x-shellscript': 'Terminal',
    'application/x-bash': 'Terminal',
    'text/x-batch': 'Terminal',
    'application/x-powershell': 'Terminal',
    'text/x-dockerfile': 'Box',
    'text/x-makefile': 'Settings',
    'text/x-yaml': 'Settings',
    'application/x-yaml': 'Settings',
    'text/yaml': 'Settings',
    'application/yaml': 'Settings',
    'text/x-toml': 'Settings',
    'application/toml': 'Settings',
    'text/x-ini': 'Settings',
    'text/x-properties': 'Settings',
    'text/x-config': 'Settings',

    // Database
    'application/x-sqlite3': 'Database',
    'application/sql': 'Database',
    'text/x-sql': 'Database',

    // Design files
    'application/x-photoshop': 'Palette',
    'image/vnd.adobe.photoshop': 'Palette',
    'image/psd': 'Palette',
    'application/postscript': 'Palette',
    'application/illustrator': 'Palette',
    'image/vnd.adobe.illustrator': 'Palette',
    'application/x-indesign': 'Palette',
    'image/x-xcf': 'Palette',
    'application/x-sketch': 'Palette',
    'application/figma': 'Palette',
    'image/x-canon-cr2': 'Palette',
    'image/x-canon-crw': 'Palette',
    'image/x-nikon-nef': 'Palette',
    'image/x-adobe-dng': 'Palette',
    'image/x-sony-arw': 'Palette',

    // Font files
    'font/ttf': 'FileText',
    'font/otf': 'FileText',
    'font/woff': 'FileText',
    'font/woff2': 'FileText',
    'application/font-woff': 'FileText',
    'application/font-woff2': 'FileText',
    'application/x-font-ttf': 'FileText',
    'application/x-font-otf': 'FileText',
    'application/vnd.ms-fontobject': 'FileText',

    // E-book formats
    'application/epub+zip': 'BookOpen',
    'application/x-mobipocket-ebook': 'BookOpen',
    'application/x-kindle': 'BookOpen',
    'application/vnd.amazon.ebook': 'BookOpen',
    'text/x-fb2+xml': 'BookOpen',

    // CAD and 3D files
    'application/sla': 'FileImage',
    'model/stl': 'FileImage',
    'model/obj': 'FileImage',
    'model/3mf': 'FileImage',
    'application/x-autocad': 'FileImage',
    'image/vnd.dwg': 'FileImage',
    'image/vnd.dxf': 'FileImage',

    // Executable files
    'application/x-msdownload': 'File',
    'application/x-executable': 'File',
    'application/x-mach-binary': 'File',
    'application/x-deb': 'Archive',
    'application/x-rpm': 'Archive',
    'application/vnd.microsoft.portable-executable': 'File',
    'application/x-apple-diskimage': 'Archive',

    // Office formats (additional)
    'application/vnd.oasis.opendocument.text': 'FileText',
    'application/vnd.oasis.opendocument.spreadsheet': 'FileSpreadsheet',
    'application/vnd.oasis.opendocument.presentation': 'Presentation',
    'application/vnd.sun.xml.writer': 'FileText',
    'application/vnd.sun.xml.calc': 'FileSpreadsheet',
    'application/vnd.sun.xml.impress': 'Presentation',

    // Media formats (additional)
    'image/heic': 'FileImage',
    'image/heif': 'FileImage',
    'image/avif': 'FileImage',
    'image/jxl': 'FileImage',
    'image/raw': 'Camera',
    'audio/x-ms-wax': 'Music',
    'audio/x-realaudio': 'Music',
    'video/x-f4v': 'FileVideo',
    'video/x-ms-vob': 'FileVideo',
    'application/vnd.rn-realmedia': 'FileVideo',

    // Mobile app formats
    'application/vnd.android.package-archive': 'Smartphone',
    'application/x-ios-app': 'Smartphone',
    'application/vnd.apple.installer+xml': 'Smartphone',

    // System and executable
    'application/x-sharedlib': 'HardDrive',
    'application/x-object': 'HardDrive',
    'application/x-core': 'HardDrive',
    'application/x-ms-dos-executable': 'Monitor',

    // Virtual machine and disk images
    'application/x-virtualbox-vdi': 'HardDrive',
    'application/x-vmware-vmdk': 'HardDrive',
    'application/x-qemu-disk': 'HardDrive',

    // Others
    'application/octet-stream': 'File',
    'text/calendar': 'FileText',
    'text/vcard': 'FileText',
    'application/x-bittorrent': 'Package',
    'message/rfc822': 'FileText',
    'application/vnd.ms-cab-compressed': 'Archive',
    'application/x-lha': 'Archive',
    'application/x-lzma': 'Archive',
    'application/x-xz': 'Archive',
  };

  // Check by MIME type first
  if (iconMap[mimeType]) {
    return iconMap[mimeType];
  }

  // Fallback: check by file extension if fileName is provided
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const extensionMap: Record<string, string> = {
      // Code files
      'js': 'FileCode',
      'ts': 'FileCode',
      'jsx': 'FileCode',
      'tsx': 'FileCode',
      'vue': 'FileCode',
      'svelte': 'FileCode',
      'py': 'FileCode',
      'java': 'FileCode',
      'kotlin': 'FileCode',
      'kt': 'FileCode',
      'scala': 'FileCode',
      'cpp': 'FileCode',
      'cc': 'FileCode',
      'cxx': 'FileCode',
      'c': 'FileCode',
      'h': 'FileCode',
      'hpp': 'FileCode',
      'cs': 'FileCode',
      'php': 'FileCode',
      'rb': 'FileCode',
      'go': 'FileCode',
      'rs': 'FileCode',
      'swift': 'FileCode',
      'sh': 'FileCode',
      'bash': 'FileCode',
      'zsh': 'FileCode',
      'fish': 'FileCode',
      'bat': 'FileCode',
      'cmd': 'FileCode',
      'ps1': 'FileCode',
      'pl': 'FileCode',
      'perl': 'FileCode',
      'r': 'FileCode',
      'lua': 'FileCode',
      'dart': 'FileCode',
      'elm': 'FileCode',
      'ex': 'FileCode',
      'exs': 'FileCode',
      'clj': 'FileCode',
      'cljs': 'FileCode',
      'hs': 'FileCode',
      'ml': 'FileCode',
      'fs': 'FileCode',
      'nim': 'FileCode',

      // Config files
      'json': 'FileCode',
      'json5': 'FileCode',
      'jsonc': 'FileCode',
      'xml': 'FileCode',
      'yaml': 'FileCode',
      'yml': 'FileCode',
      'toml': 'FileCode',
      'ini': 'FileCode',
      'conf': 'FileCode',
      'config': 'FileCode',
      'env': 'FileCode',
      'properties': 'FileCode',
      'gradle': 'FileCode',
      'cmake': 'FileCode',
      'makefile': 'FileCode',
      'dockerfile': 'FileCode',
      'gitignore': 'FileCode',
      'editorconfig': 'FileCode',
      'eslintrc': 'FileCode',

      // Documentation
      'md': 'FileText',
      'markdown': 'FileText',
      'mdown': 'FileText',
      'mkd': 'FileText',
      'readme': 'FileText',
      'txt': 'FileText',
      'doc': 'FileText',
      'docx': 'FileText',
      'rtf': 'FileText',
      'odt': 'FileText',

      // Archives by extension
      'rar': 'Archive',
      'zip': 'Archive',
      '7z': 'Archive',
      'tar': 'Archive',
      'gz': 'Archive',
      'bz2': 'Archive',
      'xz': 'Archive',
      'dmg': 'Archive',
      'iso': 'Archive',
      'deb': 'Archive',
      'rpm': 'Archive',
      'pkg': 'Archive',
      'msi': 'Archive',

      // Design
      'psd': 'Palette',
      'psb': 'Palette',
      'ai': 'Palette',
      'eps': 'Palette',
      'sketch': 'Palette',
      'fig': 'Palette',
      'figma': 'Palette',
      'xd': 'Palette',
      'indd': 'Palette',
      'idml': 'Palette',
      'xcf': 'Palette',

      // Fonts
      'ttf': 'FileText',
      'otf': 'FileText',
      'woff': 'FileText',
      'woff2': 'FileText',
      'eot': 'FileText',

      // E-books
      'epub': 'BookOpen',
      'mobi': 'BookOpen',
      'azw': 'BookOpen',
      'azw3': 'BookOpen',
      'fb2': 'BookOpen',

      // 3D and CAD
      'stl': 'FileImage',
      'obj': 'FileImage',
      '3mf': 'FileImage',
      'dwg': 'FileImage',
      'dxf': 'FileImage',
      'step': 'FileImage',
      'iges': 'FileImage',

      // Raw image formats
      'cr2': 'Camera',
      'crw': 'Camera',
      'nef': 'Camera',
      'dng': 'Camera',
      'arw': 'Camera',
      'orf': 'Camera',
      'rw2': 'Camera',
      'raw': 'Camera',
      'heic': 'FileImage',
      'heif': 'FileImage',
      'avif': 'FileImage',
      'jxl': 'FileImage',

      // Mobile app formats
      'apk': 'Smartphone',
      'ipa': 'Smartphone',
      'app': 'Smartphone',

      // System files
      'dll': 'HardDrive',
      'so': 'HardDrive',
      'dylib': 'HardDrive',
      'exe': 'Monitor',
      'com': 'Monitor',
      'scr': 'Monitor',

      // Virtual machine formats
      'vdi': 'HardDrive',
      'vmdk': 'HardDrive',
      'vhd': 'HardDrive',
      'vhdx': 'HardDrive',
      'qcow2': 'HardDrive',

      // Additional archives
      'cab': 'Archive',
      'lha': 'Archive',
      'lzh': 'Archive',
      'ace': 'Archive',
      'arj': 'Archive',

      // Torrent and download files
      'torrent': 'Package',
    };

    if (extension && extensionMap[extension]) {
      return extensionMap[extension];
    }
  }

  return 'File';
}

export function getFileIconColor(mimeType: string, fileName?: string): string {
  const colorMap: Record<string, string> = {
    // Google Workspace Files
    'application/vnd.google-apps.folder': 'text-blue-600 dark:text-blue-400',
    'application/vnd.google-apps.document': 'text-blue-500 dark:text-blue-400',
    'application/vnd.google-apps.spreadsheet': 'text-green-600 dark:text-green-400',
    'application/vnd.google-apps.presentation': 'text-orange-600 dark:text-orange-400',
    'application/vnd.google-apps.form': 'text-purple-600 dark:text-purple-400',
    'application/vnd.google-apps.drawing': 'text-pink-600 dark:text-pink-400',
    'application/vnd.google-apps.map': 'text-emerald-600 dark:text-emerald-400',
    'application/vnd.google-apps.site': 'text-cyan-600 dark:text-cyan-400',
    'application/vnd.google-apps.script': 'text-amber-600 dark:text-amber-400',
    'application/vnd.google-apps.shortcut': 'text-slate-600 dark:text-slate-400',

    // PDF and Documents
    'application/pdf': 'text-red-600 dark:text-red-400',
    'text/plain': 'text-gray-600 dark:text-gray-400',
    'text/markdown': 'text-slate-600 dark:text-slate-400',
    'application/msword': 'text-blue-600 dark:text-blue-400',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-600 dark:text-blue-400',
    'application/rtf': 'text-blue-600 dark:text-blue-400',

    // Spreadsheets
    'application/vnd.ms-excel': 'text-green-600 dark:text-green-400',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-600 dark:text-green-400',
    'text/csv': 'text-green-600 dark:text-green-400',

    // Presentations
    'application/vnd.ms-powerpoint': 'text-orange-600 dark:text-orange-400',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'text-orange-600 dark:text-orange-400',

    // Images
    'image/jpeg': 'text-purple-600 dark:text-purple-400',
    'image/jpg': 'text-purple-600 dark:text-purple-400',
    'image/png': 'text-purple-600 dark:text-purple-400',
    'image/gif': 'text-purple-600 dark:text-purple-400',
    'image/svg+xml': 'text-purple-600 dark:text-purple-400',
    'image/webp': 'text-purple-600 dark:text-purple-400',
    'image/bmp': 'text-purple-600 dark:text-purple-400',
    'image/tiff': 'text-purple-600 dark:text-purple-400',
    'image/ico': 'text-purple-600 dark:text-purple-400',

    // Videos
    'video/mp4': 'text-red-600 dark:text-red-400',
    'video/avi': 'text-red-600 dark:text-red-400',
    'video/mov': 'text-red-600 dark:text-red-400',
    'video/wmv': 'text-red-600 dark:text-red-400',
    'video/webm': 'text-red-600 dark:text-red-400',
    'video/mkv': 'text-red-600 dark:text-red-400',
    'video/x-matroska': 'text-red-600 dark:text-red-400',
    'video/flv': 'text-red-600 dark:text-red-400',
    'video/x-flv': 'text-red-600 dark:text-red-400',
    'video/quicktime': 'text-red-600 dark:text-red-400',
    'video/3gpp': 'text-red-600 dark:text-red-400',
    'video/3gpp2': 'text-red-600 dark:text-red-400',
    'video/x-msvideo': 'text-red-600 dark:text-red-400',
    'video/mp2t': 'text-red-600 dark:text-red-400',
    'video/mpeg': 'text-red-600 dark:text-red-400',
    'video/x-ms-wmv': 'text-red-600 dark:text-red-400',
    'video/x-ms-asf': 'text-red-600 dark:text-red-400',
    'video/ogg': 'text-red-600 dark:text-red-400',
    'video/divx': 'text-red-600 dark:text-red-400',
    'video/x-m4v': 'text-red-600 dark:text-red-400',

    // Audio
    'audio/mp3': 'text-indigo-600 dark:text-indigo-400',
    'audio/wav': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-wav': 'text-indigo-600 dark:text-indigo-400',
    'audio/m4a': 'text-indigo-600 dark:text-indigo-400',
    'audio/flac': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-flac': 'text-indigo-600 dark:text-indigo-400',
    'audio/aac': 'text-indigo-600 dark:text-indigo-400',
    'audio/ogg': 'text-indigo-600 dark:text-indigo-400',
    'audio/vorbis': 'text-indigo-600 dark:text-indigo-400',
    'audio/wma': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-ms-wma': 'text-indigo-600 dark:text-indigo-400',
    'audio/opus': 'text-indigo-600 dark:text-indigo-400',
    'audio/mpeg': 'text-indigo-600 dark:text-indigo-400',
    'audio/mp4': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-m4a': 'text-indigo-600 dark:text-indigo-400',
    'audio/ac3': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-aiff': 'text-indigo-600 dark:text-indigo-400',
    'audio/aiff': 'text-indigo-600 dark:text-indigo-400',
    'audio/midi': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-midi': 'text-indigo-600 dark:text-indigo-400',
    'audio/amr': 'text-indigo-600 dark:text-indigo-400',
    'audio/3gpp': 'text-indigo-600 dark:text-indigo-400',

    // Archives
    'application/zip': 'text-yellow-600 dark:text-yellow-400',
    'application/x-zip-compressed': 'text-yellow-600 dark:text-yellow-400',
    'application/x-rar-compressed': 'text-yellow-600 dark:text-yellow-400',
    'application/x-rar': 'text-yellow-600 dark:text-yellow-400',
    'application/rar': 'text-yellow-600 dark:text-yellow-400',
    'application/vnd.rar': 'text-yellow-600 dark:text-yellow-400',
    'application/x-7z-compressed': 'text-yellow-600 dark:text-yellow-400',
    'application/x-7zip': 'text-yellow-600 dark:text-yellow-400',
    'application/gzip': 'text-yellow-600 dark:text-yellow-400',
    'application/x-gzip': 'text-yellow-600 dark:text-yellow-400',
    'application/x-tar': 'text-yellow-600 dark:text-yellow-400',
    'application/x-compressed': 'text-yellow-600 dark:text-yellow-400',
    'application/x-bzip2': 'text-yellow-600 dark:text-yellow-400',
    'application/x-bzip': 'text-yellow-600 dark:text-yellow-400',
    'application/x-lzh': 'text-yellow-600 dark:text-yellow-400',
    'application/x-ace': 'text-yellow-600 dark:text-yellow-400',
    'application/x-cab': 'text-yellow-600 dark:text-yellow-400',
    'application/x-iso9660-image': 'text-yellow-600 dark:text-yellow-400',
    'application/x-stuffit': 'text-yellow-600 dark:text-yellow-400',
    'application/x-apple-diskimage': 'text-yellow-600 dark:text-yellow-400',

    // Code files - More specific colors
    'text/javascript': 'text-yellow-500 dark:text-yellow-400',
    'application/json': 'text-amber-500 dark:text-amber-400',
    'text/html': 'text-orange-500 dark:text-orange-400',
    'text/css': 'text-sky-500 dark:text-sky-400',
    'text/xml': 'text-emerald-500 dark:text-emerald-400',
    'application/javascript': 'text-yellow-500 dark:text-yellow-400',
    'text/typescript': 'text-blue-500 dark:text-blue-400',
    'application/typescript': 'text-blue-500 dark:text-blue-400',
    'text/x-python': 'text-green-500 dark:text-green-400',
    'application/x-python-code': 'text-green-500 dark:text-green-400',
    'text/x-java-source': 'text-red-500 dark:text-red-400',
    'text/x-c': 'text-slate-500 dark:text-slate-400',
    'text/x-c++': 'text-slate-500 dark:text-slate-400',
    'application/x-sh': 'text-gray-500 dark:text-gray-400',
    'text/x-shellscript': 'text-gray-500 dark:text-gray-400',

    // Database
    'application/x-sqlite3': 'text-slate-600 dark:text-slate-400',
    'application/sql': 'text-slate-600 dark:text-slate-400',
    'text/x-sql': 'text-slate-600 dark:text-slate-400',

    // Design files
    'application/x-photoshop': 'text-blue-600 dark:text-blue-400',
    'image/vnd.adobe.photoshop': 'text-blue-600 dark:text-blue-400',
    'image/psd': 'text-blue-600 dark:text-blue-400',
    'application/postscript': 'text-pink-600 dark:text-pink-400',
    'application/illustrator': 'text-orange-600 dark:text-orange-400',
    'image/vnd.adobe.illustrator': 'text-orange-600 dark:text-orange-400',
    'application/x-indesign': 'text-purple-600 dark:text-purple-400',
    'image/x-xcf': 'text-cyan-600 dark:text-cyan-400',
    'application/x-sketch': 'text-pink-600 dark:text-pink-400',
    'application/figma': 'text-violet-600 dark:text-violet-400',
    'image/x-canon-cr2': 'text-emerald-600 dark:text-emerald-400',
    'image/x-canon-crw': 'text-emerald-600 dark:text-emerald-400',
    'image/x-nikon-nef': 'text-emerald-600 dark:text-emerald-400',
    'image/x-adobe-dng': 'text-emerald-600 dark:text-emerald-400',
    'image/x-sony-arw': 'text-emerald-600 dark:text-emerald-400',

    // Font files
    'font/ttf': 'text-slate-600 dark:text-slate-400',
    'font/otf': 'text-slate-600 dark:text-slate-400',
    'font/woff': 'text-slate-600 dark:text-slate-400',
    'font/woff2': 'text-slate-600 dark:text-slate-400',
    'application/font-woff': 'text-slate-600 dark:text-slate-400',
    'application/font-woff2': 'text-slate-600 dark:text-slate-400',
    'application/x-font-ttf': 'text-slate-600 dark:text-slate-400',
    'application/x-font-otf': 'text-slate-600 dark:text-slate-400',
    'application/vnd.ms-fontobject': 'text-slate-600 dark:text-slate-400',

    // E-book formats
    'application/epub+zip': 'text-purple-600 dark:text-purple-400',
    'application/x-mobipocket-ebook': 'text-purple-600 dark:text-purple-400',
    'application/x-kindle': 'text-purple-600 dark:text-purple-400',
    'application/vnd.amazon.ebook': 'text-purple-600 dark:text-purple-400',
    'text/x-fb2+xml': 'text-purple-600 dark:text-purple-400',

    // CAD and 3D files
    'application/sla': 'text-cyan-600 dark:text-cyan-400',
    'model/stl': 'text-cyan-600 dark:text-cyan-400',
    'model/obj': 'text-cyan-600 dark:text-cyan-400',
    'model/3mf': 'text-cyan-600 dark:text-cyan-400',
    'application/x-autocad': 'text-cyan-600 dark:text-cyan-400',
    'image/vnd.dwg': 'text-cyan-600 dark:text-cyan-400',
    'image/vnd.dxf': 'text-cyan-600 dark:text-cyan-400',

    // Executable files
    'application/x-msdownload': 'text-gray-600 dark:text-gray-400',
    'application/x-executable': 'text-gray-600 dark:text-gray-400',
    'application/x-mach-binary': 'text-gray-600 dark:text-gray-400',
    'application/x-deb': 'text-yellow-600 dark:text-yellow-400',
    'application/x-rpm': 'text-yellow-600 dark:text-yellow-400',
    'application/vnd.microsoft.portable-executable': 'text-gray-600 dark:text-gray-400',

    // Office formats (additional)
    'application/vnd.oasis.opendocument.text': 'text-blue-600 dark:text-blue-400',
    'application/vnd.oasis.opendocument.spreadsheet': 'text-green-600 dark:text-green-400',
    'application/vnd.oasis.opendocument.presentation': 'text-orange-600 dark:text-orange-400',
    'application/vnd.sun.xml.writer': 'text-blue-600 dark:text-blue-400',
    'application/vnd.sun.xml.calc': 'text-green-600 dark:text-green-400',
    'application/vnd.sun.xml.impress': 'text-orange-600 dark:text-orange-400',

    // Media formats (additional)
    'image/heic': 'text-purple-600 dark:text-purple-400',
    'image/heif': 'text-purple-600 dark:text-purple-400',
    'image/avif': 'text-purple-600 dark:text-purple-400',
    'image/jxl': 'text-purple-600 dark:text-purple-400',
    'image/raw': 'text-emerald-600 dark:text-emerald-400',
    'audio/x-ms-wax': 'text-indigo-600 dark:text-indigo-400',
    'audio/x-realaudio': 'text-indigo-600 dark:text-indigo-400',
    'video/x-f4v': 'text-red-600 dark:text-red-400',
    'video/x-ms-vob': 'text-red-600 dark:text-red-400',
    'application/vnd.rn-realmedia': 'text-red-600 dark:text-red-400',

    // Mobile app formats
    'application/vnd.android.package-archive': 'text-green-600 dark:text-green-400',
    'application/x-ios-app': 'text-blue-600 dark:text-blue-400',
    'application/vnd.apple.installer+xml': 'text-blue-600 dark:text-blue-400',

    // System and executable
    'application/x-sharedlib': 'text-gray-600 dark:text-gray-400',
    'application/x-object': 'text-gray-600 dark:text-gray-400',
    'application/x-core': 'text-gray-600 dark:text-gray-400',
    'application/x-ms-dos-executable': 'text-gray-600 dark:text-gray-400',

    // Virtual machine and disk images
    'application/x-virtualbox-vdi': 'text-slate-600 dark:text-slate-400',
    'application/x-vmware-vmdk': 'text-slate-600 dark:text-slate-400',
    'application/x-qemu-disk': 'text-slate-600 dark:text-slate-400',

    // Others
    'text/calendar': 'text-green-600 dark:text-green-400',
    'text/vcard': 'text-blue-600 dark:text-blue-400',
    'application/x-bittorrent': 'text-red-600 dark:text-red-400',
    'message/rfc822': 'text-slate-600 dark:text-slate-400',
    'application/vnd.ms-cab-compressed': 'text-yellow-600 dark:text-yellow-400',
    'application/x-lha': 'text-yellow-600 dark:text-yellow-400',
    'application/x-lzma': 'text-yellow-600 dark:text-yellow-400',
    'application/x-xz': 'text-yellow-600 dark:text-yellow-400',
  };

  // Check by MIME type first
  if (colorMap[mimeType]) {
    return colorMap[mimeType];
  }

  // Fallback: check by file extension if fileName is provided
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const extensionColorMap: Record<string, string> = {
      // Programming languages with specific colors
      'js': 'text-yellow-500 dark:text-yellow-400',
      'ts': 'text-blue-500 dark:text-blue-400',
      'jsx': 'text-cyan-500 dark:text-cyan-400',
      'tsx': 'text-cyan-500 dark:text-cyan-400',
      'vue': 'text-green-500 dark:text-green-400',
      'svelte': 'text-orange-500 dark:text-orange-400',
      'py': 'text-green-500 dark:text-green-400',
      'java': 'text-red-500 dark:text-red-400',
      'kotlin': 'text-purple-500 dark:text-purple-400',
      'kt': 'text-purple-500 dark:text-purple-400',
      'scala': 'text-red-500 dark:text-red-400',
      'cpp': 'text-slate-500 dark:text-slate-400',
      'cc': 'text-slate-500 dark:text-slate-400',
      'cxx': 'text-slate-500 dark:text-slate-400',
      'c': 'text-slate-500 dark:text-slate-400',
      'h': 'text-slate-500 dark:text-slate-400',
      'hpp': 'text-slate-500 dark:text-slate-400',
      'cs': 'text-purple-500 dark:text-purple-400',
      'php': 'text-violet-500 dark:text-violet-400',
      'rb': 'text-red-500 dark:text-red-400',
      'go': 'text-cyan-500 dark:text-cyan-400',
      'rs': 'text-orange-500 dark:text-orange-400',
      'swift': 'text-orange-500 dark:text-orange-400',
      'sh': 'text-gray-500 dark:text-gray-400',
      'bash': 'text-gray-500 dark:text-gray-400',
      'zsh': 'text-gray-500 dark:text-gray-400',
      'fish': 'text-blue-500 dark:text-blue-400',
      'bat': 'text-gray-500 dark:text-gray-400',
      'cmd': 'text-gray-500 dark:text-gray-400',
      'ps1': 'text-blue-500 dark:text-blue-400',
      'pl': 'text-blue-500 dark:text-blue-400',
      'perl': 'text-blue-500 dark:text-blue-400',
      'r': 'text-blue-500 dark:text-blue-400',
      'lua': 'text-blue-500 dark:text-blue-400',
      'dart': 'text-blue-500 dark:text-blue-400',
      'elm': 'text-green-500 dark:text-green-400',
      'ex': 'text-purple-500 dark:text-purple-400',
      'exs': 'text-purple-500 dark:text-purple-400',
      'clj': 'text-green-500 dark:text-green-400',
      'cljs': 'text-green-500 dark:text-green-400',
      'hs': 'text-purple-500 dark:text-purple-400',
      'ml': 'text-orange-500 dark:text-orange-400',
      'fs': 'text-blue-500 dark:text-blue-400',
      'nim': 'text-yellow-500 dark:text-yellow-400',

      // Archives
      'rar': 'text-yellow-600 dark:text-yellow-400',
      'zip': 'text-yellow-600 dark:text-yellow-400',
      '7z': 'text-yellow-600 dark:text-yellow-400',
      'tar': 'text-yellow-600 dark:text-yellow-400',
      'gz': 'text-yellow-600 dark:text-yellow-400',
      'bz2': 'text-yellow-600 dark:text-yellow-400',
      'xz': 'text-yellow-600 dark:text-yellow-400',
      'dmg': 'text-yellow-600 dark:text-yellow-400',
      'iso': 'text-yellow-600 dark:text-yellow-400',
      'deb': 'text-yellow-600 dark:text-yellow-400',
      'rpm': 'text-yellow-600 dark:text-yellow-400',
      'pkg': 'text-yellow-600 dark:text-yellow-400',
      'msi': 'text-yellow-600 dark:text-yellow-400',

      // Design files
      'psd': 'text-blue-600 dark:text-blue-400',
      'psb': 'text-blue-600 dark:text-blue-400',
      'ai': 'text-orange-600 dark:text-orange-400',
      'eps': 'text-orange-600 dark:text-orange-400',
      'sketch': 'text-pink-600 dark:text-pink-400',
      'fig': 'text-violet-600 dark:text-violet-400',
      'figma': 'text-violet-600 dark:text-violet-400',
      'xd': 'text-purple-600 dark:text-purple-400',
      'indd': 'text-purple-600 dark:text-purple-400',
      'idml': 'text-purple-600 dark:text-purple-400',
      'xcf': 'text-cyan-600 dark:text-cyan-400',

      // Fonts
      'ttf': 'text-slate-600 dark:text-slate-400',
      'otf': 'text-slate-600 dark:text-slate-400',
      'woff': 'text-slate-600 dark:text-slate-400',
      'woff2': 'text-slate-600 dark:text-slate-400',
      'eot': 'text-slate-600 dark:text-slate-400',

      // E-books
      'epub': 'text-purple-600 dark:text-purple-400',
      'mobi': 'text-purple-600 dark:text-purple-400',
      'azw': 'text-purple-600 dark:text-purple-400',
      'azw3': 'text-purple-600 dark:text-purple-400',
      'fb2': 'text-purple-600 dark:text-purple-400',

      // 3D and CAD
      'stl': 'text-cyan-600 dark:text-cyan-400',
      'obj': 'text-cyan-600 dark:text-cyan-400',
      '3mf': 'text-cyan-600 dark:text-cyan-400',
      'dwg': 'text-cyan-600 dark:text-cyan-400',
      'dxf': 'text-cyan-600 dark:text-cyan-400',
      'step': 'text-cyan-600 dark:text-cyan-400',
      'iges': 'text-cyan-600 dark:text-cyan-400',

      // Raw image formats
      'cr2': 'text-emerald-600 dark:text-emerald-400',
      'crw': 'text-emerald-600 dark:text-emerald-400',
      'nef': 'text-emerald-600 dark:text-emerald-400',
      'dng': 'text-emerald-600 dark:text-emerald-400',
      'arw': 'text-emerald-600 dark:text-emerald-400',
      'orf': 'text-emerald-600 dark:text-emerald-400',
      'rw2': 'text-emerald-600 dark:text-emerald-400',
      'raw': 'text-emerald-600 dark:text-emerald-400',
      'heic': 'text-purple-600 dark:text-purple-400',
      'heif': 'text-purple-600 dark:text-purple-400',
      'avif': 'text-purple-600 dark:text-purple-400',
      'jxl': 'text-purple-600 dark:text-purple-400',

      // Mobile app formats
      'apk': 'text-green-600 dark:text-green-400',
      'ipa': 'text-blue-600 dark:text-blue-400',
      'app': 'text-blue-600 dark:text-blue-400',

      // System files
      'dll': 'text-gray-600 dark:text-gray-400',
      'so': 'text-gray-600 dark:text-gray-400',
      'dylib': 'text-gray-600 dark:text-gray-400',
      'exe': 'text-gray-600 dark:text-gray-400',
      'com': 'text-gray-600 dark:text-gray-400',
      'scr': 'text-gray-600 dark:text-gray-400',

      // Virtual machine formats
      'vdi': 'text-slate-600 dark:text-slate-400',
      'vmdk': 'text-slate-600 dark:text-slate-400',
      'vhd': 'text-slate-600 dark:text-slate-400',
      'vhdx': 'text-slate-600 dark:text-slate-400',
      'qcow2': 'text-slate-600 dark:text-slate-400',

      // Additional archives
      'cab': 'text-yellow-600 dark:text-yellow-400',
      'lha': 'text-yellow-600 dark:text-yellow-400',
      'lzh': 'text-yellow-600 dark:text-yellow-400',
      'ace': 'text-yellow-600 dark:text-yellow-400',
      'arj': 'text-yellow-600 dark:text-yellow-400',

      // Torrent and download files
      'torrent': 'text-red-600 dark:text-red-400',

      // Config and markup
      'json': 'text-amber-500 dark:text-amber-400',
      'xml': 'text-emerald-500 dark:text-emerald-400',
      'yaml': 'text-red-500 dark:text-red-400',
      'yml': 'text-red-500 dark:text-red-400',
      'toml': 'text-orange-500 dark:text-orange-400',
      'html': 'text-orange-500 dark:text-orange-400',
      'css': 'text-sky-500 dark:text-sky-400',
      'scss': 'text-pink-500 dark:text-pink-400',
      'sass': 'text-pink-500 dark:text-pink-400',
      'md': 'text-gray-600 dark:text-gray-400',
    };

    if (extension && extensionColorMap[extension]) {
      return extensionColorMap[extension];
    }
  }

  return 'text-gray-500 dark:text-gray-400';
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

export function isShortcutFile(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.shortcut';
}

/**
 * Check if a file type supports preview functionality
 */
export const isPreviewable = (mimeType: string): boolean => {
  // Shortcuts should not be previewable - they should be opened directly
  if (isShortcutFile(mimeType)) {
    return false;
  }
  
  // Use proper mimeType category checking instead of specific formats
  return isImageFile(mimeType) ||
         isVideoFile(mimeType) ||
         isAudioFile(mimeType) ||
         isDocumentFile(mimeType) ||
         mimeType.startsWith('text/') ||
         mimeType === 'application/pdf' ||
         mimeType === 'application/json' ||
         mimeType.includes('google-apps');
};









/**
 * Generate preview URL for different media types
 */
export function getPreviewUrl(fileId: string, mimeType: string, webContentLink?: string): string {
  // Universal Google Drive preview - supports all file types
  // If Google Drive can't preview the file, it will show appropriate message
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
    capabilities: file.capabilities ? {
      canCopy: file.capabilities.canCopy ?? false,
      canDelete: file.capabilities.canDelete ?? false,
      canDownload: file.capabilities.canDownload ?? false,
      canEdit: file.capabilities.canEdit ?? false,
      canRename: file.capabilities.canRename ?? false,
      canShare: file.capabilities.canShare ?? false,
      canTrash: file.capabilities.canTrash ?? false,
      canUntrash: file.capabilities.canUntrash ?? false,
      canMoveItemWithinDrive: file.capabilities.canMoveItemWithinDrive ?? false,
      canMoveItemOutOfDrive: file.capabilities.canMoveItemOutOfDrive ?? false,
      canAddChildren: file.capabilities.canAddChildren ?? false,
      canListChildren: file.capabilities.canListChildren ?? false,
      canRemoveChildren: file.capabilities.canRemoveChildren ?? false,
    } : undefined,
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
    capabilities: folder.capabilities ? {
      canCopy: folder.capabilities.canCopy ?? false,
      canDelete: folder.capabilities.canDelete ?? false,
      canDownload: folder.capabilities.canDownload ?? false,
      canEdit: folder.capabilities.canEdit ?? false,
      canRename: folder.capabilities.canRename ?? false,
      canShare: folder.capabilities.canShare ?? false,
      canTrash: folder.capabilities.canTrash ?? false,
      canUntrash: folder.capabilities.canUntrash ?? false,
      canMoveItemWithinDrive: folder.capabilities.canMoveItemWithinDrive ?? false,
      canMoveItemOutOfDrive: folder.capabilities.canMoveItemOutOfDrive ?? false,
      canAddChildren: folder.capabilities.canAddChildren ?? false,
      canListChildren: folder.capabilities.canListChildren ?? false,
      canRemoveChildren: folder.capabilities.canRemoveChildren ?? false,
    } : undefined,
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
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: userTimezone
      });
    }
  } catch (error) {
    return 'Invalid date';
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

/**
 * Get available actions for a file based on its capabilities and current view
 */
export function getFileActions(
  file: { capabilities?: DriveFileCapabilities; trashed?: boolean; mimeType?: string; itemType?: string }, 
  activeView: string
): {
  canPreview: boolean;
  canDownload: boolean;
  canRename: boolean;
  canMove: boolean;
  canCopy: boolean;
  canShare: boolean;
  canDetails: boolean;
  canTrash: boolean;
  canRestore: boolean;
  canPermanentDelete: boolean;
} {
  const isTrashView = activeView === 'trash';
  const isSharedView = activeView === 'shared';
  const isTrashed = file.trashed === true;
  const isFolder = file.itemType === 'folder' || file.mimeType === 'application/vnd.google-apps.folder';
  const capabilities = file.capabilities || {} as DriveFileCapabilities;

  // If we don't have capabilities data, provide conservative defaults
  const defaultCapabilities = {
    canDownload: true,
    canCopy: false,
    canDelete: false,
    canEdit: false,
    canRename: false,
    canShare: false,
    canTrash: false,
    canUntrash: false,
    canMoveItemWithinDrive: false,
  };

  const finalCapabilities: DriveFileCapabilities = Object.keys(capabilities).length > 0 ? capabilities : defaultCapabilities;

  return {
    // Preview available for all files (not folders)
    canPreview: !isFolder,

    // Download - always available, API handles restrictions
    canDownload: Boolean(finalCapabilities.canDownload),

    // Details - always available  
    canDetails: true,

    // All other actions: use direct API capabilities without extra logic
    canRename: Boolean(finalCapabilities.canRename),
    canMove: Boolean(finalCapabilities.canMoveItemWithinDrive),
    canCopy: Boolean(finalCapabilities.canCopy),
    canShare: Boolean(finalCapabilities.canShare),
    canTrash: Boolean(finalCapabilities.canTrash),
    canRestore: Boolean(isTrashed && finalCapabilities.canUntrash),
    canPermanentDelete: Boolean(finalCapabilities.canDelete),
  };
}



/**
 * Format Google Drive file dates with user timezone
 */
export const formatDriveFileDate = (
  dateString: string, 
  timezone?: string,
  showRelative: boolean = true
): string => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (showRelative) {
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

      // Show relative time for recent files (within 7 days)
      if (diffInHours < 168) {
        return formatDate(dateString);
      }
    }

    // For older files, show formatted date with timezone
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    });

  } catch (error) {
    return 'Invalid date format';
  }
};

/**
 * Get file icon properties (name and color) in a single call
 */
export function getFileIconProps(mimeType: string, fileName?: string): {
  iconName: string;
  colorClass: string;
} {
  return {
    iconName: getFileIconName(mimeType, fileName),
    colorClass: getFileIconColor(mimeType, fileName)
  };
}

/**
 * Get category-based icon for file type filters and badges
 */
export function getCategoryIcon(category: string): string {
  const categoryIconMap: Record<string, string> = {
    'folder': 'Folder',
    'document': 'FileText',
    'spreadsheet': 'FileSpreadsheet', 
    'presentation': 'Presentation',
    'image': 'FileImage',
    'video': 'FileVideo',
    'audio': 'Music',
    'archive': 'Archive',
    'code': 'FileCode',
    'pdf': 'BookOpen',
    'text': 'FileText',
    'design': 'Palette',
    'database': 'Database',
    'shortcut': 'Link',
    'other': 'File'
  };

  return categoryIconMap[category] || 'File';
}

/**
 * Get category-based color for file type filters and badges
 */
export function getCategoryColor(category: string): string {
  const categoryColorMap: Record<string, string> = {
    'folder': 'text-blue-600 dark:text-blue-400',
    'document': 'text-blue-500 dark:text-blue-400',
    'spreadsheet': 'text-green-600 dark:text-green-400',
    'presentation': 'text-orange-600 dark:text-orange-400',
    'image': 'text-purple-600 dark:text-purple-400',
    'video': 'text-red-600 dark:text-red-400',
    'audio': 'text-indigo-600 dark:text-indigo-400',
    'archive': 'text-yellow-600 dark:text-yellow-400',
    'code': 'text-emerald-600 dark:text-emerald-400',
    'pdf': 'text-red-600 dark:text-red-400',
    'text': 'text-gray-600 dark:text-gray-400',
    'design': 'text-pink-600 dark:text-pink-400',
    'database': 'text-slate-600 dark:text-slate-400',
    'other': 'text-gray-500 dark:text-gray-400'
  };

  return categoryColorMap[category] || 'text-gray-500 dark:text-gray-400';
}

/**
 * Determine file category from MIME type for consistent categorization
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return 'spreadsheet';
  if (mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('document') || mimeType.startsWith('text/')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return 'code';
  if (mimeType.includes('sql') || mimeType.includes('database')) return 'database';
  if (mimeType.includes('photoshop') || mimeType.includes('illustrator')) return 'design';

  return 'other';
}

/**
 * Get all available file type categories with their icon and color info
 */
export function getFileTypeCategories(): Array<{
  key: string;
  label: string;
  iconName: string;
  colorClass: string;
  description: string;
}> {
  return [
    {
      key: 'folder',
      label: 'Folders',
      iconName: getCategoryIcon('folder'),
      colorClass: getCategoryColor('folder'),
      description: 'Google Drive folders'
    },
    {
      key: 'document',
      label: 'Documents',
      iconName: getCategoryIcon('document'),
      colorClass: getCategoryColor('document'),
      description: 'Text documents, PDFs, Word files'
    },
    {
      key: 'spreadsheet',
      label: 'Spreadsheets',
      iconName: getCategoryIcon('spreadsheet'),
      colorClass: getCategoryColor('spreadsheet'),
      description: 'Excel files, Google Sheets, CSV'
    },
    {
      key: 'presentation',
      label: 'Presentations',
      iconName: getCategoryIcon('presentation'),
      colorClass: getCategoryColor('presentation'),
      description: 'PowerPoint, Google Slides'
    },
    {
      key: 'image',
      label: 'Images',
      iconName: getCategoryIcon('image'),
      colorClass: getCategoryColor('image'),
      description: 'Photos, graphics, icons'
    },
    {
      key: 'video',
      label: 'Videos',
      iconName: getCategoryIcon('video'),
      colorClass: getCategoryColor('video'),
      description: 'Movies, clips, recordings'
    },
    {
      key: 'audio',
      label: 'Audio',
      iconName: getCategoryIcon('audio'),
      colorClass: getCategoryColor('audio'),
      description: 'Music, podcasts, recordings'
    },
    {
      key: 'shortcut',
      label: 'Shortcuts',
      iconName: getCategoryIcon('shortcut'),
      colorClass: getCategoryColor('shortcut'),
      description: 'Google Drive shortcuts'
    },
    {
      key: 'archive',
      label: 'Archives',
      iconName: getCategoryIcon('archive'),
      colorClass: getCategoryColor('archive'),
      description: 'ZIP, RAR, compressed files'
    },
    {
      key: 'code',
      label: 'Code Files',
      iconName: getCategoryIcon('code'),
      colorClass: getCategoryColor('code'),
      description: 'Programming files, scripts'
    },
    {
      key: 'pdf',
      label: 'PDF Files',
      iconName: getCategoryIcon('pdf'),
      colorClass: getCategoryColor('pdf'),
      description: 'PDF documents'
    },
    {
      key: 'design',
      label: 'Design Files',
      iconName: getCategoryIcon('design'),
      colorClass: getCategoryColor('design'),
      description: 'Photoshop, Illustrator, design files'
    },
    {
      key: 'database',
      label: 'Database Files',
      iconName: getCategoryIcon('database'),
      colorClass: getCategoryColor('database'),
      description: 'SQL, database files'
    }
  ];
}

/**
 * Enhanced file icon rendering with consistent props
 */
export function renderFileIcon(
  mimeType: string, 
  fileName?: string,
  options: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    strokeWidth?: number;
  } = {}
): { iconName: string; colorClass: string; sizeClass: string } {
  const { iconName, colorClass } = getFileIconProps(mimeType, fileName);

  const sizeMap = {
    'sm': 'h-3 w-3',
    'md': 'h-4 w-4', 
    'lg': 'h-5 w-5',
    'xl': 'h-6 w-6'
  };

  const sizeClass = options.className || sizeMap[options.size || 'md'];

  return {
    iconName,
    colorClass,
    sizeClass
  };
}