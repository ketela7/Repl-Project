import { drivev3 } from 'googleapis'

import { DriveFile, DriveFolder } from './types'

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes

  if (isNaN(size) || size === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(size) / Math.log(1024))

  return `${(size / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

// File size utilities
export function normalizeFileSize(size: any): number {
  if (size === null || size === undefined || size === '' || size === '-') return 0
  if (!size && size !== 0) return 0

  const sizeStr = size.toString().trim()
  if (sizeStr === '-' || sizeStr === '' || sizeStr === 'undefined' || sizeStr === 'null') return 0

  const parsedSize = parseInt(sizeStr)
  return isNaN(parsedSize) || parsedSize < 0 ? 0 : parsedSize
}

export function getSizeMultiplier(unit: 'B' | 'KB' | 'MB' | 'GB'): number {
  switch (unit) {
    case 'B':
      return 1
    case 'KB':
      return 1024
    case 'MB':
      return 1024 * 1024
    case 'GB':
      return 1024 * 1024 * 1024
    default:
      return 1
  }
}

export function isFileSizeInRange(
  fileSize: any,
  minSize?: number,
  maxSize?: number,
  unit: 'B' | 'KB' | 'MB' | 'GB' = 'MB',
): boolean {
  const normalizedFileSize = normalizeFileSize(fileSize)
  const multiplier = getSizeMultiplier(unit)
  const minBytes = minSize ? minSize * multiplier : 0
  const maxBytes = maxSize ? maxSize * multiplier : Number.MAX_SAFE_INTEGER
  return normalizedFileSize >= minBytes && normalizedFileSize <= maxBytes
}

export function getFileIconName(mimeType: string, fileName?: string): string {
  const iconMap: Record<string, string> = {
    // Google Workspace Files
    'application/vnd.googleapps.folder': 'Folder',
    'application/vnd.googleapps.document': 'FileText',
    'application/vnd.googleapps.spreadsheet': 'FileSpreadsheet',
    'application/vnd.googleapps.presentation': 'Presentation',
    'application/vnd.googleapps.form': 'FileCheck',
    'application/vnd.googleapps.drawing': 'Palette',
    'application/vnd.googleapps.map': 'MapPin',
    'application/vnd.googleapps.site': 'Globe',
    'application/vnd.googleapps.script': 'FileCode',
    'application/vnd.googleapps.shortcut': 'Link',

    // PDF and Documents
    'application/pdf': 'BookOpen',
    'text/plain': 'FileText',
    'text/markdown': 'FileText',
    'application/msword': 'FileText',
    'application/vnd.openxmlformatsofficedocument.wordprocessingml.document': 'FileText',
    'application/rtf': 'FileText',

    // Spreadsheets
    'application/vnd.msexcel': 'FileSpreadsheet',
    'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet': 'FileSpreadsheet',
    'text/csv': 'FileSpreadsheet',

    // Presentations
    'application/vnd.mspowerpoint': 'Presentation',
    'application/vnd.openxmlformatsofficedocument.presentationml.presentation': 'Presentation',

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
    'video/xmatroska': 'FileVideo',
    'video/flv': 'FileVideo',
    'video/xflv': 'FileVideo',
    'video/quicktime': 'FileVideo',
    'video/3gpp': 'FileVideo',
    'video/3gpp2': 'FileVideo',
    'video/xmsvideo': 'FileVideo',
    'video/mp2t': 'FileVideo',
    'video/mpeg': 'FileVideo',
    'video/xmswmv': 'FileVideo',
    'video/xmsasf': 'FileVideo',
    'video/ogg': 'FileVideo',
    'video/divx': 'FileVideo',
    'video/xm4v': 'FileVideo',

    // Audio
    'audio/mp3': 'Music',
    'audio/wav': 'Music',
    'audio/xwav': 'Music',
    'audio/m4a': 'Music',
    'audio/flac': 'Music',
    'audio/xflac': 'Music',
    'audio/aac': 'Music',
    'audio/ogg': 'Music',
    'audio/vorbis': 'Music',
    'audio/wma': 'Music',
    'audio/xmswma': 'Music',
    'audio/opus': 'Music',
    'audio/mpeg': 'Music',
    'audio/mp4': 'Music',
    'audio/xm4a': 'Music',
    'audio/ac3': 'Music',
    'audio/xaiff': 'Music',
    'audio/aiff': 'Music',
    'audio/midi': 'Music',
    'audio/xmidi': 'Music',
    'audio/amr': 'Music',
    'audio/3gpp': 'Music',

    // Archives
    'application/zip': 'Archive',
    'application/xzipcompressed': 'Archive',
    'application/xrarcompressed': 'Archive',
    'application/xrar': 'Archive',
    'application/rar': 'Archive',
    'application/vnd.rar': 'Archive',
    'application/x-7zcompressed': 'Archive',
    'application/x-7zip': 'Archive',
    'application/gzip': 'Archive',
    'application/xgzip': 'Archive',
    'application/xtar': 'Archive',
    'application/xcompressed': 'Archive',
    'application/xbzip2': 'Archive',
    'application/xbzip': 'Archive',
    'application/xlzh': 'Archive',
    'application/xace': 'Archive',
    'application/xcab': 'Archive',
    'application/xiso9660-image': 'Archive',
    'application/xstuffit': 'Archive',
    'application/xapplediskimageold': 'Archive',

    // Code files
    'text/javascript': 'FileCode',
    'application/javascript': 'FileCode',
    'application/xjavascript': 'FileCode',
    'application/json': 'FileCode',
    'application/ld+json': 'FileCode',
    'text/html': 'FileCode',
    'application/xhtml+xml': 'FileCode',
    'text/css': 'FileCode',
    'text/xml': 'FileCode',
    'application/xml': 'FileCode',
    'text/typescript': 'FileCode',
    'application/typescript': 'FileCode',
    'text/xpython': 'FileCode',
    'application/xpythoncode': 'FileCode',
    'text/xpythonscript': 'FileCode',
    'text/xjavasource': 'FileCode',
    'application/javaarchive': 'Package',
    'text/xc': 'FileCode',
    'text/xc++': 'FileCode',
    'text/xcsharp': 'FileCode',
    'text/xphp': 'FileCode',
    'application/xphp': 'FileCode',
    'text/xruby': 'FileCode',
    'application/xruby': 'FileCode',
    'text/xgo': 'FileCode',
    'text/xrust': 'FileCode',
    'text/xswift': 'FileCode',
    'text/xkotlin': 'FileCode',
    'text/xscala': 'FileCode',
    'text/xperl': 'FileCode',
    'application/xperl': 'FileCode',
    'application/xsh': 'Terminal',
    'text/xshellscript': 'Terminal',
    'application/xbash': 'Terminal',
    'text/xbatch': 'Terminal',
    'application/xpowershell': 'Terminal',
    'text/xdockerfile': 'Box',
    'text/xmakefile': 'Settings',
    'text/xyaml': 'Settings',
    'application/xyaml': 'Settings',
    'text/yaml': 'Settings',
    'application/yaml': 'Settings',
    'text/xtoml': 'Settings',
    'application/toml': 'Settings',
    'text/xini': 'Settings',
    'text/xproperties': 'Settings',
    'text/xconfig': 'Settings',

    // Database
    'application/xsqlite3': 'Database',
    'application/sql': 'Database',
    'text/xsql': 'Database',

    // Design files
    'application/xphotoshop': 'Palette',
    'image/vnd.adobe.photoshop': 'Palette',
    'image/psd': 'Palette',
    'application/postscript': 'Palette',
    'application/illustrator': 'Palette',
    'image/vnd.adobe.illustrator': 'Palette',
    'application/xindesign': 'Palette',
    'image/xxcf': 'Palette',
    'application/xsketch': 'Palette',
    'application/figma': 'Palette',
    'image/xcanoncr2': 'Palette',
    'image/xcanoncrw': 'Palette',
    'image/xnikonnef': 'Palette',
    'image/xadobedng': 'Palette',
    'image/xsonyarw': 'Palette',

    // Font files
    'font/ttf': 'FileText',
    'font/otf': 'FileText',
    'font/woff': 'FileText',
    'font/woff2': 'FileText',
    'application/fontwoff': 'FileText',
    'application/fontwoff2': 'FileText',
    'application/xfontttf': 'FileText',
    'application/xfontotf': 'FileText',
    'application/vnd.msfontobject': 'FileText',

    // E-book formats
    'application/epub+zip': 'BookOpen',
    'application/xmobipocketebook': 'BookOpen',
    'application/xkindle': 'BookOpen',
    'application/vnd.amazon.ebook': 'BookOpen',
    'text/xfb2+xml': 'BookOpen',

    // CAD and 3D files
    'application/sla': 'FileImage',
    'model/stl': 'FileImage',
    'model/obj': 'FileImage',
    'model/3mf': 'FileImage',
    'application/xautocad': 'FileImage',
    'image/vnd.dwg': 'FileImage',
    'image/vnd.dxf': 'FileImage',

    // Executable files
    'application/xmsdownload': 'File',
    'application/xexecutable': 'File',
    'application/xmachbinary': 'File',
    'application/xdeb': 'Archive',
    'application/xrpm': 'Archive',
    'application/vnd.microsoft.portableexecutable': 'File',
    'application/xapplediskimagedmg': 'Archive',

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
    'audio/xmswax': 'Music',
    'audio/xrealaudio': 'Music',
    'video/xf4v': 'FileVideo',
    'video/xmsvob': 'FileVideo',
    'application/vnd.rnrealmedia': 'FileVideo',

    // Mobile app formats
    'application/vnd.android.packagearchive': 'Smartphone',
    'application/xiosapp': 'Smartphone',
    'application/vnd.apple.installer+xml': 'Smartphone',

    // System and executable
    'application/xsharedlib': 'HardDrive',
    'application/xobject': 'HardDrive',
    'application/xcore': 'HardDrive',
    'application/xmsdosexecutable': 'Monitor',

    // Virtual machine and disk images
    'application/xvirtualboxvdi': 'HardDrive',
    'application/xvmwarevmdk': 'HardDrive',
    'application/xqemudisk': 'HardDrive',

    // Others
    'application/octetstream': 'File',
    'text/calendar': 'FileText',
    'text/vcard': 'FileText',
    'application/xbittorrent': 'Package',
    'message/rfc822': 'FileText',
    'application/vnd.mscabcompressed': 'Archive',
    'application/xlha': 'Archive',
    'application/xlzma': 'Archive',
    'application/xxz': 'Archive',
  }

  // Check by MIME type first
  if (iconMap[mimeType]) {
    return iconMap[mimeType]
  }

  // Fallback: check by file extension if fileName is provided
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const extensionMap: Record<string, string> = {
      // Code files
      js: 'FileCode',
      ts: 'FileCode',
      jsx: 'FileCode',
      tsx: 'FileCode',
      vue: 'FileCode',
      svelte: 'FileCode',
      py: 'FileCode',
      java: 'FileCode',
      kotlin: 'FileCode',
      kt: 'FileCode',
      scala: 'FileCode',
      cpp: 'FileCode',
      cc: 'FileCode',
      cxx: 'FileCode',
      c: 'FileCode',
      h: 'FileCode',
      hpp: 'FileCode',
      cs: 'FileCode',
      php: 'FileCode',
      rb: 'FileCode',
      go: 'FileCode',
      rs: 'FileCode',
      swift: 'FileCode',
      sh: 'FileCode',
      bash: 'FileCode',
      zsh: 'FileCode',
      fish: 'FileCode',
      bat: 'FileCode',
      cmd: 'FileCode',
      ps1: 'FileCode',
      pl: 'FileCode',
      perl: 'FileCode',
      r: 'FileCode',
      lua: 'FileCode',
      dart: 'FileCode',
      elm: 'FileCode',
      ex: 'FileCode',
      exs: 'FileCode',
      clj: 'FileCode',
      cljs: 'FileCode',
      hs: 'FileCode',
      ml: 'FileCode',
      fs: 'FileCode',
      nim: 'FileCode',

      // Config files
      json: 'FileCode',
      json5: 'FileCode',
      jsonc: 'FileCode',
      xml: 'FileCode',
      yaml: 'FileCode',
      yml: 'FileCode',
      toml: 'FileCode',
      ini: 'FileCode',
      conf: 'FileCode',
      config: 'FileCode',
      env: 'FileCode',
      properties: 'FileCode',
      gradle: 'FileCode',
      cmake: 'FileCode',
      makefile: 'FileCode',
      dockerfile: 'FileCode',
      gitignore: 'FileCode',
      editorconfig: 'FileCode',
      eslintrc: 'FileCode',

      // Documentation
      md: 'FileText',
      markdown: 'FileText',
      mdown: 'FileText',
      mkd: 'FileText',
      readme: 'FileText',
      txt: 'FileText',
      doc: 'FileText',
      docx: 'FileText',
      rtf: 'FileText',
      odt: 'FileText',

      // Archives by extension
      rar: 'Archive',
      zip: 'Archive',
      '7z': 'Archive',
      tar: 'Archive',
      gz: 'Archive',
      bz2: 'Archive',
      xz: 'Archive',
      dmg: 'Archive',
      iso: 'Archive',
      deb: 'Archive',
      rpm: 'Archive',
      pkg: 'Archive',
      msi: 'Archive',

      // Design
      psd: 'Palette',
      psb: 'Palette',
      ai: 'Palette',
      eps: 'Palette',
      sketch: 'Palette',
      fig: 'Palette',
      figma: 'Palette',
      xd: 'Palette',
      indd: 'Palette',
      idml: 'Palette',
      xcf: 'Palette',

      // Fonts
      ttf: 'FileText',
      otf: 'FileText',
      woff: 'FileText',
      woff2: 'FileText',
      eot: 'FileText',

      // E-books
      epub: 'BookOpen',
      mobi: 'BookOpen',
      azw: 'BookOpen',
      azw3: 'BookOpen',
      fb2: 'BookOpen',

      // 3D and CAD
      stl: 'FileImage',
      obj: 'FileImage',
      '3mf': 'FileImage',
      dwg: 'FileImage',
      dxf: 'FileImage',
      step: 'FileImage',
      iges: 'FileImage',

      // Raw image formats
      cr2: 'Camera',
      crw: 'Camera',
      nef: 'Camera',
      dng: 'Camera',
      arw: 'Camera',
      orf: 'Camera',
      rw2: 'Camera',
      raw: 'Camera',
      heic: 'FileImage',
      heif: 'FileImage',
      avif: 'FileImage',
      jxl: 'FileImage',

      // Mobile app formats
      apk: 'Smartphone',
      ipa: 'Smartphone',
      app: 'Smartphone',

      // System files
      dll: 'HardDrive',
      so: 'HardDrive',
      dylib: 'HardDrive',
      exe: 'Monitor',
      com: 'Monitor',
      scr: 'Monitor',

      // Virtual machine formats
      vdi: 'HardDrive',
      vmdk: 'HardDrive',
      vhd: 'HardDrive',
      vhdx: 'HardDrive',
      qcow2: 'HardDrive',

      // Additional archives
      cab: 'Archive',
      lha: 'Archive',
      lzh: 'Archive',
      ace: 'Archive',
      arj: 'Archive',

      // Torrent and download files
      torrent: 'Package',
    }

    if (extension && extensionMap[extension]) {
      return extensionMap[extension]
    }
  }

  return 'File'
}

export function getFileIconColor(mimeType: string, fileName?: string): string {
  const colorMap: Record<string, string> = {
    // Google Workspace Files
    'application/vnd.googleapps.folder': 'textblue-600 dark:textblue-400',
    'application/vnd.googleapps.document': 'textblue-500 dark:textblue-400',
    'application/vnd.googleapps.spreadsheet': 'textgreen-600 dark:textgreen-400',
    'application/vnd.googleapps.presentation': 'textorange-600 dark:textorange-400',
    'application/vnd.googleapps.form': 'textpurple-600 dark:textpurple-400',
    'application/vnd.googleapps.drawing': 'textpink-600 dark:textpink-400',
    'application/vnd.googleapps.map': 'textemerald-600 dark:textemerald-400',
    'application/vnd.googleapps.site': 'textcyan-600 dark:textcyan-400',
    'application/vnd.googleapps.script': 'textamber-600 dark:textamber-400',
    'application/vnd.googleapps.shortcut': 'textslate-600 dark:textslate-400',

    // PDF and Documents
    'application/pdf': 'textred-600 dark:textred-400',
    'text/plain': 'textgray-600 dark:textgray-400',
    'text/markdown': 'textslate-600 dark:textslate-400',
    'application/msword': 'textblue-600 dark:textblue-400',
    'application/vnd.openxmlformatsofficedocument.wordprocessingml.document': 'textblue-600 dark:textblue-400',
    'application/rtf': 'textblue-600 dark:textblue-400',

    // Spreadsheets
    'application/vnd.msexcel': 'textgreen-600 dark:textgreen-400',
    'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet': 'textgreen-600 dark:textgreen-400',
    'text/csv': 'textgreen-600 dark:textgreen-400',

    // Presentations
    'application/vnd.mspowerpoint': 'textorange-600 dark:textorange-400',
    'application/vnd.openxmlformatsofficedocument.presentationml.presentation': 'textorange-600 dark:textorange-400',

    // Images
    'image/jpeg': 'textpurple-600 dark:textpurple-400',
    'image/jpg': 'textpurple-600 dark:textpurple-400',
    'image/png': 'textpurple-600 dark:textpurple-400',
    'image/gif': 'textpurple-600 dark:textpurple-400',
    'image/svg+xml': 'textpurple-600 dark:textpurple-400',
    'image/webp': 'textpurple-600 dark:textpurple-400',
    'image/bmp': 'textpurple-600 dark:textpurple-400',
    'image/tiff': 'textpurple-600 dark:textpurple-400',
    'image/ico': 'textpurple-600 dark:textpurple-400',

    // Videos
    'video/mp4': 'textred-600 dark:textred-400',
    'video/avi': 'textred-600 dark:textred-400',
    'video/mov': 'textred-600 dark:textred-400',
    'video/wmv': 'textred-600 dark:textred-400',
    'video/webm': 'textred-600 dark:textred-400',
    'video/mkv': 'textred-600 dark:textred-400',
    'video/xmatroska': 'textred-600 dark:textred-400',
    'video/flv': 'textred-600 dark:textred-400',
    'video/xflv': 'textred-600 dark:textred-400',
    'video/quicktime': 'textred-600 dark:textred-400',
    'video/3gpp': 'textred-600 dark:textred-400',
    'video/3gpp2': 'textred-600 dark:textred-400',
    'video/xmsvideo': 'textred-600 dark:textred-400',
    'video/mp2t': 'textred-600 dark:textred-400',
    'video/mpeg': 'textred-600 dark:textred-400',
    'video/xmswmv': 'textred-600 dark:textred-400',
    'video/xmsasf': 'textred-600 dark:textred-400',
    'video/ogg': 'textred-600 dark:textred-400',
    'video/divx': 'textred-600 dark:textred-400',
    'video/xm4v': 'textred-600 dark:textred-400',

    // Audio
    'audio/mp3': 'textindigo-600 dark:textindigo-400',
    'audio/wav': 'textindigo-600 dark:textindigo-400',
    'audio/xwav': 'textindigo-600 dark:textindigo-400',
    'audio/m4a': 'textindigo-600 dark:textindigo-400',
    'audio/flac': 'textindigo-600 dark:textindigo-400',
    'audio/xflac': 'textindigo-600 dark:textindigo-400',
    'audio/aac': 'textindigo-600 dark:textindigo-400',
    'audio/ogg': 'textindigo-600 dark:textindigo-400',
    'audio/vorbis': 'textindigo-600 dark:textindigo-400',
    'audio/wma': 'textindigo-600 dark:textindigo-400',
    'audio/xmswma': 'textindigo-600 dark:textindigo-400',
    'audio/opus': 'textindigo-600 dark:textindigo-400',
    'audio/mpeg': 'textindigo-600 dark:textindigo-400',
    'audio/mp4': 'textindigo-600 dark:textindigo-400',
    'audio/xm4a': 'textindigo-600 dark:textindigo-400',
    'audio/ac3': 'textindigo-600 dark:textindigo-400',
    'audio/xaiff': 'textindigo-600 dark:textindigo-400',
    'audio/aiff': 'textindigo-600 dark:textindigo-400',
    'audio/midi': 'textindigo-600 dark:textindigo-400',
    'audio/xmidi': 'textindigo-600 dark:textindigo-400',
    'audio/amr': 'textindigo-600 dark:textindigo-400',
    'audio/3gpp': 'textindigo-600 dark:textindigo-400',

    // Archives
    'application/zip': 'textyellow-600 dark:textyellow-400',
    'application/xzipcompressed': 'textyellow-600 dark:textyellow-400',
    'application/xrarcompressed': 'textyellow-600 dark:textyellow-400',
    'application/xrar': 'textyellow-600 dark:textyellow-400',
    'application/rar': 'textyellow-600 dark:textyellow-400',
    'application/vnd.rar': 'textyellow-600 dark:textyellow-400',
    'application/x-7zcompressed': 'textyellow-600 dark:textyellow-400',
    'application/x-7zip': 'textyellow-600 dark:textyellow-400',
    'application/gzip': 'textyellow-600 dark:textyellow-400',
    'application/xgzip': 'textyellow-600 dark:textyellow-400',
    'application/xtar': 'textyellow-600 dark:textyellow-400',
    'application/xcompressed': 'textyellow-600 dark:textyellow-400',
    'application/xbzip2': 'textyellow-600 dark:textyellow-400',
    'application/xbzip': 'textyellow-600 dark:textyellow-400',
    'application/xlzh': 'textyellow-600 dark:textyellow-400',
    'application/xace': 'textyellow-600 dark:textyellow-400',
    'application/xcab': 'textyellow-600 dark:textyellow-400',
    'application/xiso9660-image': 'textyellow-600 dark:textyellow-400',
    'application/xstuffit': 'textyellow-600 dark:textyellow-400',
    'application/xapplediskimageold': 'textyellow-600 dark:textyellow-400',

    // Code files - More specific colors
    'text/javascript': 'textyellow-500 dark:textyellow-400',
    'application/json': 'textamber-500 dark:textamber-400',
    'text/html': 'textorange-500 dark:textorange-400',
    'text/css': 'textsky-500 dark:textsky-400',
    'text/xml': 'textemerald-500 dark:textemerald-400',
    'application/javascript': 'textyellow-500 dark:textyellow-400',
    'text/typescript': 'textblue-500 dark:textblue-400',
    'application/typescript': 'textblue-500 dark:textblue-400',
    'text/xpython': 'textgreen-500 dark:textgreen-400',
    'application/xpythoncode': 'textgreen-500 dark:textgreen-400',
    'text/xjavasource': 'textred-500 dark:textred-400',
    'text/xc': 'textslate-500 dark:textslate-400',
    'text/xc++': 'textslate-500 dark:textslate-400',
    'application/xsh': 'textgray-500 dark:textgray-400',
    'text/xshellscript': 'textgray-500 dark:textgray-400',

    // Database
    'application/xsqlite3': 'textslate-600 dark:textslate-400',
    'application/sql': 'textslate-600 dark:textslate-400',
    'text/xsql': 'textslate-600 dark:textslate-400',

    // Design files
    'application/xphotoshop': 'textblue-600 dark:textblue-400',
    'image/vnd.adobe.photoshop': 'textblue-600 dark:textblue-400',
    'image/psd': 'textblue-600 dark:textblue-400',
    'application/postscript': 'textpink-600 dark:textpink-600 dark:textpink-400',
    'application/illustrator': 'textorange-600 dark:textorange-400',
    'image/vnd.adobe.illustrator': 'textorange-600 dark:textorange-400',
    'application/xindesign': 'textpurple-600 dark:textpurple-400',
    'image/xxcf': 'textcyan-600 dark:textcyan-400',
    'application/xsketch': 'textpink-600 dark:textpink-400',
    'application/figma': 'textviolet-600 dark:textviolet-400',
    'image/xcanoncr2': 'textemerald-600 dark:textemerald-400',
    'image/xcanoncrw': 'textemerald-600 dark:textemerald-400',
    'image/xnikonnef': 'textemerald-600 dark:textemerald-400',
    'image/xadobedng': 'textemerald-600 dark:textemerald-400',
    'image/xsonyarw': 'textemerald-600 dark:textemerald-400',

    // Font files
    'font/ttf': 'textslate-600 dark:textslate-400',
    'font/otf': 'textslate-600 dark:textslate-400',
    'font/woff': 'textslate-600 dark:textslate-400',
    'font/woff2': 'textslate-600 dark:textslate-400',
    'application/fontwoff': 'textslate-600 dark:textslate-400',
    'application/fontwoff2': 'textslate-600 dark:textslate-400',
    'application/xfontttf': 'textslate-600 dark:textslate-400',
    'application/xfontotf': 'textslate-600 dark:textslate-400',
    'application/vnd.msfontobject': 'textslate-600 dark:textslate-400',

    // E-book formats
    'application/epub+zip': 'textpurple-600 dark:textpurple-400',
    'application/xmobipocketebook': 'textpurple-600 dark:textpurple-400',
    'application/xkindle': 'textpurple-600 dark:textpurple-400',
    'application/vnd.amazon.ebook': 'textpurple-600 dark:textpurple-400',
    'text/xfb2+xml': 'textpurple-600 dark:textpurple-400',

    // CAD and 3D files
    'application/sla': 'textcyan-600 dark:textcyan-400',
    'model/stl': 'textcyan-600 dark:textcyan-400',
    'model/obj': 'textcyan-600 dark:textcyan-400',
    'model/3mf': 'textcyan-600 dark:textcyan-400',
    'application/xautocad': 'textcyan-600 dark:textcyan-400',
    'image/vnd.dwg': 'textcyan-600 dark:textcyan-400',
    'image/vnd.dxf': 'textcyan-600 dark:textcyan-400',

    // Executable files
    'application/xmsdownload': 'textgray-600 dark:textgray-400',
    'application/xexecutable': 'textgray-600 dark:textgray-400',
    'application/xmachbinary': 'textgray-600 dark:textgray-400',
    'application/xdeb': 'textyellow-600 dark:textyellow-400',
    'application/xrpm': 'textyellow-600 dark:textyellow-400',
    'application/vnd.microsoft.portableexecutable': 'textgray-600 dark:textgray-400',

    // Office formats (additional)
    'application/vnd.oasis.opendocument.text': 'textblue-600 dark:textblue-400',
    'application/vnd.oasis.opendocument.spreadsheet': 'textgreen-600 dark:textgreen-400',
    'application/vnd.oasis.opendocument.presentation': 'textorange-600 dark:textorange-400',
    'application/vnd.sun.xml.writer': 'textblue-600 dark:textblue-400',
    'application/vnd.sun.xml.calc': 'textgreen-600 dark:textgreen-400',
    'application/vnd.sun.xml.impress': 'textorange-600 dark:textorange-400',

    // Media formats (additional)
    'image/heic': 'textpurple-600 dark:textpurple-400',
    'image/heif': 'textpurple-600 dark:textpurple-400',
    'image/avif': 'textpurple-600 dark:textpurple-400',
    'image/jxl': 'textpurple-600 dark:textpurple-400',
    'image/raw': 'textemerald-600 dark:textemerald-400',
    'audio/xmswax': 'textindigo-600 dark:textindigo-400',
    'audio/xrealaudio': 'textindigo-600 dark:textindigo-400',
    'video/xf4v': 'textred-600 dark:textred-400',
    'video/xmsvob': 'textred-600 dark:textred-400',
    'application/vnd.rnrealmedia': 'textred-600 dark:textred-400',

    // Mobile app formats
    'application/vnd.android.packagearchive': 'textgreen-600 dark:textgreen-400',
    'application/xiosapp': 'textblue-600 dark:textblue-400',
    'application/vnd.apple.installer+xml': 'textblue-600 dark:textblue-400',

    // System and executable
    'application/xsharedlib': 'textgray-600 dark:textgray-400',
    'application/xobject': 'textgray-600 dark:textgray-400',
    'application/xcore': 'textgray-600 dark:textgray-400',
    'application/xmsdosexecutable': 'textgray-600 dark:textgray-400',

    // Virtual machine and disk images
    'application/xvirtualboxvdi': 'textslate-600 dark:textslate-400',
    'application/xvmwarevmdk': 'textslate-600 dark:textslate-400',
    'application/xqemudisk': 'textslate-600 dark:textslate-400',

    // Others
    'text/calendar': 'textgreen-600 dark:textgreen-400',
    'text/vcard': 'textblue-600 dark:textblue-400',
    'application/xbittorrent': 'textred-600 dark:textred-400',
    'message/rfc822': 'textslate-600 dark:textslate-400',
    'application/vnd.mscabcompressed': 'textyellow-600 dark:textyellow-400',
    'application/xlha': 'textyellow-600 dark:textyellow-400',
    'application/xlzma': 'textyellow-600 dark:textyellow-400',
    'application/xxz': 'textyellow-600 dark:textyellow-400',
  }

  // Check by MIME type first
  if (colorMap[mimeType]) {
    return colorMap[mimeType]
  }

  // Fallback: check by file extension if fileName is provided
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const extensionColorMap: Record<string, string> = {
      // Programming languages with specific colors
      js: 'textyellow-500 dark:textyellow-400',
      ts: 'textblue-500 dark:textblue-400',
      jsx: 'textcyan-500 dark:textcyan-400',
      tsx: 'textcyan-500 dark:textcyan-400',
      vue: 'textgreen-500 dark:textgreen-400',
      svelte: 'textorange-500 dark:textorange-400',
      py: 'textgreen-500 dark:textgreen-400',
      java: 'textred-500 dark:textred-400',
      kotlin: 'textpurple-500 dark:textpurple-400',
      kt: 'textpurple-500 dark:textpurple-400',
      scala: 'textred-500 dark:textred-400',
      cpp: 'textslate-500 dark:textslate-400',
      cc: 'textslate-500 dark:textslate-400',
      cxx: 'textslate-500 dark:textslate-400',
      c: 'textslate-500 dark:textslate-400',
      h: 'textslate-500 dark:textslate-400',
      hpp: 'textslate-500 dark:textslate-400',
      cs: 'textpurple-500 dark:textpurple-400',
      php: 'textviolet-500 dark:textviolet-400',
      rb: 'textred-500 dark:textred-400',
      go: 'textcyan-500 dark:textcyan-400',
      rs: 'textorange-500 dark:textorange-400',
      swift: 'textorange-500 dark:textorange-400',
      sh: 'textgray-500 dark:textgray-400',
      bash: 'textgray-500 dark:textgray-400',
      zsh: 'textgray-500 dark:textgray-400',
      fish: 'textblue-500 dark:textblue-400',
      bat: 'textgray-500 dark:textgray-400',
      cmd: 'textgray-500 dark:textgray-400',
      ps1: 'textblue-500 dark:textblue-400',
      pl: 'textblue-500 dark:textblue-400',
      perl: 'textblue-500 dark:textblue-400',
      r: 'textblue-500 dark:textblue-400',
      lua: 'textblue-500 dark:textblue-400',
      dart: 'textblue-500 dark:textblue-400',
      elm: 'textgreen-500 dark:textgreen-400',
      ex: 'textpurple-500 dark:textpurple-400',
      exs: 'textpurple-500 dark:textpurple-400',
      clj: 'textgreen-500 dark:textgreen-400',
      cljs: 'textgreen-500 dark:textgreen-400',
      hs: 'textpurple-500 dark:textpurple-400',
      ml: 'textorange-500 dark:textorange-400',
      fs: 'textblue-500 dark:textblue-400',
      nim: 'textyellow-500 dark:textyellow-400',

      // Archives
      rar: 'textyellow-600 dark:textyellow-400',
      zip: 'textyellow-600 dark:textyellow-400',
      '7z': 'textyellow-600 dark:textyellow-400',
      tar: 'textyellow-600 dark:textyellow-400',
      gz: 'textyellow-600 dark:textyellow-400',
      bz2: 'textyellow-600 dark:textyellow-400',
      xz: 'textyellow-600 dark:textyellow-400',
      dmg: 'textyellow-600 dark:textyellow-400',
      iso: 'textyellow-600 dark:textyellow-400',
      deb: 'textyellow-600 dark:textyellow-400',
      rpm: 'textyellow-600 dark:textyellow-400',
      pkg: 'textyellow-600 dark:textyellow-400',
      msi: 'textyellow-600 dark:textyellow-400',

      // Design files
      psd: 'textblue-600 dark:textblue-400',
      psb: 'textblue-600 dark:textblue-400',
      ai: 'textorange-600 dark:textorange-400',
      eps: 'textorange-600 dark:textorange-400',
      sketch: 'textpink-600 dark:textpink-400',
      fig: 'textviolet-600 dark:textviolet-400',
      figma: 'textviolet-600 dark:textviolet-400',
      xd: 'textpurple-600 dark:textpurple-400',
      indd: 'textpurple-600 dark:textpurple-400',
      idml: 'textpurple-600 dark:textpurple-400',
      xcf: 'textcyan-600 dark:textcyan-400',

      // Fonts
      ttf: 'textslate-600 dark:textslate-400',
      otf: 'textslate-600 dark:textslate-400',
      woff: 'textslate-600 dark:textslate-400',
      woff2: 'textslate-600 dark:textslate-400',
      eot: 'textslate-600 dark:textslate-400',

      // E-books
      epub: 'textpurple-600 dark:textpurple-400',
      mobi: 'textpurple-600 dark:textpurple-400',
      azw: 'textpurple-600 dark:textpurple-400',
      azw3: 'textpurple-600 dark:textpurple-400',
      fb2: 'textpurple-600 dark:textpurple-400',

      // 3D and CAD
      stl: 'textcyan-600 dark:textcyan-400',
      obj: 'textcyan-600 dark:textcyan-400',
      '3mf': 'textcyan-600 dark:textcyan-400',
      dwg: 'textcyan-600 dark:textcyan-400',
      dxf: 'textcyan-600 dark:textcyan-400',
      step: 'textcyan-600 dark:textcyan-400',
      iges: 'textcyan-600 dark:textcyan-400',

      // Raw image formats
      cr2: 'textemerald-600 dark:textemerald-400',
      crw: 'textemerald-600 dark:textemerald-400',
      nef: 'textemerald-600 dark:textemerald-400',
      dng: 'textemerald-600 dark:textemerald-400',
      arw: 'textemerald-600 dark:textemerald-400',
      orf: 'textemerald-600 dark:textemerald-400',
      rw2: 'textemerald-600 dark:textemerald-400',
      raw: 'textemerald-600 dark:textemerald-400',
      heic: 'textpurple-600 dark:textpurple-400',
      heif: 'textpurple-600 dark:textpurple-400',
      avif: 'textpurple-600 dark:textpurple-400',
      jxl: 'textpurple-600 dark:textpurple-400',

      // Mobile app formats
      apk: 'textgreen-600 dark:textgreen-400',
      ipa: 'textblue-600 dark:textblue-400',
      app: 'textblue-600 dark:textblue-400',

      // System files
      dll: 'textgray-600 dark:textgray-400',
      so: 'textgray-600 dark:textgray-400',
      dylib: 'textgray-600 dark:textgray-400',
      exe: 'textgray-600 dark:textgray-400',
      com: 'textgray-600 dark:textgray-400',
      scr: 'textgray-600 dark:textgray-400',

      // Virtual machine formats
      vdi: 'textslate-600 dark:textslate-400',
      vmdk: 'textslate-600 dark:textslate-400',
      vhd: 'textslate-600 dark:textslate-400',
      vhdx: 'textslate-600 dark:textslate-400',
      qcow2: 'textslate-600 dark:textslate-400',

      // Additional archives
      cab: 'textyellow-600 dark:textyellow-400',
      lha: 'textyellow-600 dark:textyellow-400',
      lzh: 'textyellow-600 dark:textyellow-400',
      ace: 'textyellow-600 dark:textyellow-400',
      arj: 'textyellow-600 dark:textyellow-400',

      // Torrent and download files
      torrent: 'textred-600 dark:textred-400',

      // Config and markup
      json: 'textamber-500 dark:textamber-400',
      xml: 'textemerald-500 dark:textemerald-400',
      yaml: 'textred-500 dark:textred-400',
      yml: 'textred-500 dark:textred-400',
      toml: 'textorange-500 dark:textorange-400',
      html: 'textorange-500 dark:textorange-400',
      css: 'textsky-500 dark:textsky-400',
      scss: 'textpink-500 dark:textpink-400',
      sass: 'textpink-500 dark:textpink-400',
      md: 'textgray-600 dark:textgray-400',
    }

    if (extension && extensionColorMap[extension]) {
      return extensionColorMap[extension]
    }
  }

  return 'textgray-500 dark:textgray-400'
}

export function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.googleapps.')
}

/**
 * Extract folder ID from Google Drive URL or return the input if it's already an ID
 * Supports formats:
 * - https://drive.google.com/drive/folders/1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 * - https://drive.google.com/drive/u/0/folders/1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 * - Direct folder ID: 1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
 */
export function extractFolderIdFromUrl(input: string): string | null {
  if (!input) return null

  // Remove whitespace
  const cleanInput = input.trim()

  // If it's already a folder ID (no URL format), return it
  if (!cleanInput.includes('drive.google.com') && cleanInput.length > 10) {
    return cleanInput
  }

  // Extract from various Google Drive URL formats
  const urlPatterns = [
    /\/drive\/folders\/([azA-Z0-9_-]+)/, // Standard folder URL
    /\/drive\/u\/\d+\/folders\/([azA-Z0-9_-]+)/, // Userspecific folder URL
    /id=([azA-Z0-9_-]+)/, // Query parameter format
  ]

  for (const pattern of urlPatterns) {
    const match = cleanInput.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Validate if a string is a valid Google Drive folder ID
 */
export function isValidFolderId(id: string): boolean {
  if (!id) return false
  // Google Drive IDs are typically 28-44 characters long and contain letters, numbers, hyphens, and underscores
  return /^[azA-Z0-9_-]{10,50}$/.test(id)
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformatsofficedocument.wordprocessingml.document',
    'application/vnd.googleapps.document',
  ]
  return documentTypes.includes(mimeType)
}

export function isShortcutFile(mimeType: string): boolean {
  return mimeType === 'application/vnd.googleapps.shortcut'
}

// Removed isPreviewable function - simplified to use getPreviewUrl directly

/**
 * Generate preview URL for different media types
 */
export function getPreviewUrl(fileId: string): string {
  // Universal Google Drive preview - supports all file types
  // If Google Drive can't preview the file, it will show appropriate message
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function convertGoogleDriveFile(file: drivev3.Schema$File): DriveFile {
  return {
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    ...(file.size && { size: file.size }),
    createdTime: file.createdTime!,
    modifiedTime: file.modifiedTime!,
    ...(file.webViewLink && { webViewLink: file.webViewLink }),
    ...(file.webContentLink && { webContentLink: file.webContentLink }),
    ...(file.thumbnailLink && { thumbnailLink: file.thumbnailLink }),
    ...(file.parents && { parents: file.parents }),
    owners:
      file.owners?.map(owner => ({
        displayName: owner.displayName!,
        emailAddress: owner.emailAddress!,
        ...(owner.photoLink && { photoLink: owner.photoLink }),
      })) || [],
    shared: file.shared ?? false,
    starred: file.starred ?? false,
    trashed: file.trashed ?? false,
    ownedByMe: file.ownedByMe ?? true,
    ...(file.viewedByMeTime && { viewedByMeTime: file.viewedByMeTime }),
    viewedByMe: file.viewedByMe ?? false,
    capabilities: {
      canCopy: file.capabilities?.canCopy ?? false,
      canDelete: file.capabilities?.canDelete ?? false,
      canDownload: file.capabilities?.canDownload ?? false,
      canEdit: file.capabilities?.canEdit ?? false,
      canRename: file.capabilities?.canRename ?? false,
      canShare: file.capabilities?.canShare ?? false,
      canTrash: file.capabilities?.canTrash ?? false,
      canUntrash: file.capabilities?.canUntrash ?? false,
      canMoveItemWithinDrive: file.capabilities?.canMoveItemWithinDrive ?? false,
      canMoveItemOutOfDrive: file.capabilities?.canMoveItemOutOfDrive ?? false,
      canAddChildren: file.capabilities?.canAddChildren ?? false,
      canListChildren: file.capabilities?.canListChildren ?? false,
      canRemoveChildren: file.capabilities?.canRemoveChildren ?? false,
    },
  }
}

export function convertGoogleDriveFolder(folder: drivev3.Schema$File): DriveFolder {
  return {
    id: folder.id!,
    name: folder.name!,
    mimeType: 'application/vnd.googleapps.folder',
    createdTime: folder.createdTime!,
    modifiedTime: folder.modifiedTime!,
    ...(folder.parents && { parents: folder.parents }),
    shared: folder.shared ?? false,
    starred: folder.starred ?? false,
    trashed: folder.trashed ?? false,
    ownedByMe: folder.ownedByMe ?? true,
    owners:
      folder.owners?.map(owner => ({
        displayName: owner.displayName || '',
        emailAddress: owner.emailAddress || '',
        ...(owner.photoLink && { photoLink: owner.photoLink }),
      })) || [],
    capabilities: {
      canCopy: folder.capabilities?.canCopy ?? false,
      canDelete: folder.capabilities?.canDelete ?? false,
      canDownload: folder.capabilities?.canDownload ?? false,
      canEdit: folder.capabilities?.canEdit ?? false,
      canRename: folder.capabilities?.canRename ?? false,
      canShare: folder.capabilities?.canShare ?? false,
      canTrash: folder.capabilities?.canTrash ?? false,
      canUntrash: folder.capabilities?.canUntrash ?? false,
      canMoveItemWithinDrive: folder.capabilities?.canMoveItemWithinDrive ?? false,
      canMoveItemOutOfDrive: folder.capabilities?.canMoveItemOutOfDrive ?? false,
      canAddChildren: folder.capabilities?.canAddChildren ?? false,
      canListChildren: folder.capabilities?.canListChildren ?? false,
      canRemoveChildren: folder.capabilities?.canRemoveChildren ?? false,
    },
  }
}

export function buildSearchQuery(options: {
  name?: string
  mimeType?: string
  parentId?: string
  trashed?: boolean
  shared?: boolean
}): string {
  const conditions: string[] = []

  if (options.name) {
    conditions.push(`name contains '${options.name.replace(/'/g, "\\'")}'`)
  }

  if (options.mimeType) {
    conditions.push(`mimeType='${options.mimeType}'`)
  }

  if (options.parentId) {
    conditions.push(`'${options.parentId}' in parents`)
  }

  if (options.trashed !== undefined) {
    conditions.push(`trashed=${options.trashed}`)
  }

  if (options.shared !== undefined) {
    conditions.push(`sharedWithMe=${options.shared}`)
  }

  return conditions.join(' and ')
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: userTimezone,
      })
    }
  } catch {
    return 'Invalid date'
  }
}

export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformatsofficedocument.wordprocessingml.document',
    xls: 'application/vnd.msexcel',
    xlsx: 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.mspowerpoint',
    pptx: 'application/vnd.openxmlformatsofficedocument.presentationml.presentation',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    avi: 'video/avi',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    zip: 'application/zip',
    rar: 'application/xrarcompressed',
  }

  return mimeTypes[extension || ''] || 'application/octetstream'
}

/**
 * Get available actions for a file based on its capabilities and current view
 */
export function getFileActions(fileInfo: {
  capabilities?: any
  trashed?: boolean
  mimeType?: string
  itemType?: 'file' | 'folder'
}): {
  canCopy: boolean
  canDelete: boolean
  canDownload: boolean
  canTrash: boolean
  canUntrash: boolean
  canRename: boolean
  canShare: boolean
  canMove: boolean
  canExport: boolean
} {
  const { capabilities, trashed, mimeType, itemType } = fileInfo
  const isFolder = mimeType === 'application/vnd.googleapps.folder' || itemType === 'folder'

  // Match the logic from selectedItemsWithDetails that's working correctly
  return {
    canCopy: !trashed, // Allow copy for nontrashed items
    canDelete: capabilities?.canDelete === true, // Only if explicitly allowed
    canDownload: !trashed && !isFolder && capabilities?.canDownload !== false,
    canTrash: !trashed && capabilities?.canTrash !== false,
    canUntrash: Boolean(trashed && capabilities?.canUntrash !== false),
    canRename: !trashed && capabilities?.canRename !== false,
    canShare: !trashed, // Allow share for nontrashed items
    canMove: !trashed && capabilities?.canMoveItemWithinDrive !== false,
    canExport:
      !trashed &&
      ['document', 'spreadsheet', 'presentation', 'drawing'].some(type =>
        mimeType?.includes(`application/vnd.googleapps.${type}`),
      ), // Allow export for nontrashed files
  }
}

/**
 * Format Google Drive file dates with user timezone
 */
export const formatDriveFileDate = (dateString: string, timezone?: string, showRelative: boolean = true): string => {
  if (!dateString) return 'Unknown'

  try {
    const date = new Date(dateString)
    const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

    if (showRelative) {
      const now = new Date()
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

      // Show relative time for recent files (within 7 days)
      if (diffInHours < 168) {
        return formatDate(dateString)
      }
    }

    // For older files, show formatted date with timezone
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone,
    })
  } catch {
    return 'Invalid date format'
  }
}

/**
 * Get file icon properties (name and color) in a single call
 */
export function getFileIconProps(
  mimeType: string,
  fileName?: string,
): {
  iconName: string
  colorClass: string
} {
  return {
    iconName: getFileIconName(mimeType, fileName),
    colorClass: getFileIconColor(mimeType, fileName),
  }
}

/**
 * Get categorybased icon for file type filters and badges
 */
export function getCategoryIcon(category: string): string {
  const categoryIconMap: Record<string, string> = {
    folder: 'Folder',
    document: 'FileText',
    spreadsheet: 'FileSpreadsheet',
    presentation: 'Presentation',
    image: 'FileImage',
    video: 'FileVideo',
    audio: 'Music',
    archive: 'Archive',
    code: 'FileCode',
    pdf: 'BookOpen',
    text: 'FileText',
    design: 'Palette',
    database: 'Database',
    shortcut: 'Link',
    other: 'File',
  }

  return categoryIconMap[category] || 'File'
}

/**
 * Get categorybased color for file type filters and badges
 */
export function getCategoryColor(category: string): string {
  const categoryColorMap: Record<string, string> = {
    folder: 'textblue-600 dark:textblue-400',
    document: 'textblue-500 dark:textblue-400',
    spreadsheet: 'textgreen-600 dark:textgreen-400',
    presentation: 'textorange-600 dark:textorange-400',
    image: 'textpurple-600 dark:textpurple-400',
    video: 'textred-600 dark:textred-400',
    audio: 'textindigo-600 dark:textindigo-400',
    archive: 'textyellow-600 dark:textyellow-400',
    code: 'textemerald-600 dark:textemerald-400',
    pdf: 'textred-600 dark:textred-400',
    text: 'textgray-600 dark:textgray-400',
    design: 'textpink-600 dark:textpink-400',
    database: 'textslate-600 dark:textslate-400',
    other: 'textgray-500 dark:textgray-400',
  }

  return categoryColorMap[category] || 'textgray-500 dark:textgray-400'
}

/**
 * Determine file category from MIME type for consistent categorization
 */
export function getFileCategory(mimeType: string): string {
  if (!mimeType) return 'other'
  if (mimeType === 'application/vnd.googleapps.folder') return 'folder'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return 'spreadsheet'
  if (mimeType.includes('presentation')) return 'presentation'
  if (mimeType.includes('document') || mimeType.startsWith('text/')) return 'document'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive'
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('html') ||
    mimeType.includes('css')
  )
    return 'code'
  if (mimeType.includes('sql') || mimeType.includes('database')) return 'database'
  if (mimeType.includes('photoshop') || mimeType.includes('illustrator')) return 'design'

  return 'other'
}

/**
 * Get all available file type categories with their icon and color info
 */

/**
 * Enhanced file icon rendering with consistent props
 */
export function renderFileIcon(
  mimeType: string,
  fileName?: string,
  options: {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    strokeWidth?: number
  } = {},
): { iconName: string; colorClass: string; sizeClass: string } {
  const { iconName, colorClass } = getFileIconProps(mimeType, fileName)

  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const sizeClass = options.className || sizeMap[options.size || 'md']

  return {
    iconName,
    colorClass,
    sizeClass,
  }
}
