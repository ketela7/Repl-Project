import { formatFileSize, getFileExtension, isImageFile, isVideoFile, getFileTypeCategory } from '../utils'

describe('Google Drive Utils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should handle undefined size', () => {
      expect(formatFileSize(undefined)).toBe('0 B')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.jpeg')).toBe('jpeg')
      expect(getFileExtension('file.tar.gz')).toBe('gz')
      expect(getFileExtension('noextension')).toBe('')
    })

    it('should handle empty or invalid filenames', () => {
      expect(getFileExtension('')).toBe('')
      expect(getFileExtension('.')).toBe('')
      expect(getFileExtension('.hidden')).toBe('hidden')
    })
  })

  describe('isImageFile', () => {
    it('should identify image files by extension', () => {
      expect(isImageFile('photo.jpg')).toBe(true)
      expect(isImageFile('image.png')).toBe(true)
      expect(isImageFile('graphic.gif')).toBe(true)
      expect(isImageFile('document.pdf')).toBe(false)
    })

    it('should identify image files by mime type', () => {
      expect(isImageFile('image/jpeg')).toBe(true)
      expect(isImageFile('image/png')).toBe(true)
      expect(isImageFile('application/pdf')).toBe(false)
    })
  })

  describe('isVideoFile', () => {
    it('should identify video files', () => {
      expect(isVideoFile('movie.mp4')).toBe(true)
      expect(isVideoFile('video.avi')).toBe(true)
      expect(isVideoFile('clip.mov')).toBe(true)
      expect(isVideoFile('image.jpg')).toBe(false)
    })

    it('should identify video files by mime type', () => {
      expect(isVideoFile('video/mp4')).toBe(true)
      expect(isVideoFile('video/quicktime')).toBe(true)
      expect(isVideoFile('image/jpeg')).toBe(false)
    })
  })

  describe('getFileTypeCategory', () => {
    it('should categorize files correctly', () => {
      expect(getFileTypeCategory('document.pdf')).toBe('document')
      expect(getFileTypeCategory('photo.jpg')).toBe('image')
      expect(getFileTypeCategory('song.mp3')).toBe('audio')
      expect(getFileTypeCategory('video.mp4')).toBe('video')
      expect(getFileTypeCategory('archive.zip')).toBe('archive')
      expect(getFileTypeCategory('unknown.xyz')).toBe('other')
    })

    it('should handle Google Apps files', () => {
      expect(getFileTypeCategory('', 'application/vnd.googleapps.document')).toBe('document')
      expect(getFileTypeCategory('', 'application/vnd.googleapps.spreadsheet')).toBe('document')
      expect(getFileTypeCategory('', 'application/vnd.googleapps.folder')).toBe('folder')
    })
  })
})
