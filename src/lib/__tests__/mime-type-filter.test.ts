/**
 * Tests for shared mimeType filtering utility
 * Verifies consistency between backend and frontend filtering
 */

import {
  getGoogleDriveQuery,
  matchesFileType,
  getFileTypeCategory,
  countFilesByCategory,
  formatCategoryCount,
  FILE_TYPE_CATEGORIES,
} from '../mime-type-filter'

describe('MimeType Filter Utility', () => {
  describe('getGoogleDriveQuery', () => {
    test('generates correct query for single file type', () => {
      const query = getGoogleDriveQuery(['document'])
      expect(query).toContain("mimeType = 'application/vnd.google-apps.document'")
      expect(query).toContain("mimeType = 'application/pdf'")
    })

    test('generates correct query for multiple file types', () => {
      const query = getGoogleDriveQuery(['image', 'video'])
      expect(query).toContain("mimeType contains 'image/'")
      expect(query).toContain("mimeType contains 'video/'")
      expect(query).toContain(' or ')
    })

    test('returns empty string for empty or all filter', () => {
      expect(getGoogleDriveQuery([])).toBe('')
      expect(getGoogleDriveQuery(['all'])).toBe('')
    })

    test('handles unknown file types gracefully', () => {
      const query = getGoogleDriveQuery(['unknown-type'])
      expect(query).toBe('')
    })
  })

  describe('matchesFileType', () => {
    test('matches image files correctly', () => {
      expect(matchesFileType('image/jpeg', ['image'])).toBe(true)
      expect(matchesFileType('image/png', ['image'])).toBe(true)
      expect(matchesFileType('video/mp4', ['image'])).toBe(false)
    })

    test('matches Google Workspace files correctly', () => {
      expect(matchesFileType('application/vnd.google-apps.document', ['document'])).toBe(true)
      expect(matchesFileType('application/vnd.google-apps.spreadsheet', ['spreadsheet'])).toBe(true)
      expect(matchesFileType('application/vnd.google-apps.folder', ['folder'])).toBe(true)
    })

    test('matches archive files correctly', () => {
      expect(matchesFileType('application/zip', ['archive'])).toBe(true)
      expect(matchesFileType('application/x-rar-compressed', ['archive'])).toBe(true)
      expect(matchesFileType('text/plain', ['archive'])).toBe(false)
    })

    test('matches code files correctly', () => {
      expect(matchesFileType('text/javascript', ['code'])).toBe(true)
      expect(matchesFileType('application/json', ['code'])).toBe(true)
      expect(matchesFileType('text/x-python', ['code'])).toBe(true)
      expect(matchesFileType('image/jpeg', ['code'])).toBe(false)
    })

    test('handles multiple file types', () => {
      expect(matchesFileType('image/jpeg', ['image', 'video'])).toBe(true)
      expect(matchesFileType('video/mp4', ['image', 'video'])).toBe(true)
      expect(matchesFileType('text/plain', ['image', 'video'])).toBe(false)
    })

    test('returns true for all filter', () => {
      expect(matchesFileType('image/jpeg', ['all'])).toBe(true)
      expect(matchesFileType('video/mp4', ['all'])).toBe(true)
    })

    test('returns true for empty filter array', () => {
      expect(matchesFileType('image/jpeg', [])).toBe(true)
      expect(matchesFileType('video/mp4', [])).toBe(true)
    })
  })

  describe('getFileTypeCategory', () => {
    test('categorizes files correctly', () => {
      expect(getFileTypeCategory('image/jpeg')).toBe('image')
      expect(getFileTypeCategory('video/mp4')).toBe('video')
      expect(getFileTypeCategory('application/vnd.google-apps.document')).toBe('document')
      expect(getFileTypeCategory('application/vnd.google-apps.folder')).toBe('folder')
      expect(getFileTypeCategory('application/zip')).toBe('archive')
      expect(getFileTypeCategory('text/javascript')).toBe('code')
    })

    test('returns other for unknown types', () => {
      expect(getFileTypeCategory('application/unknown')).toBe('other')
      expect(getFileTypeCategory('unknown/type')).toBe('other')
    })
  })

  describe('countFilesByCategory', () => {
    const testFiles = [
      { mimeType: 'image/jpeg' },
      { mimeType: 'image/png' },
      { mimeType: 'video/mp4' },
      { mimeType: 'application/vnd.google-apps.document' },
      { mimeType: 'application/vnd.google-apps.folder' },
      { mimeType: 'application/zip' },
      { mimeType: 'text/javascript' },
      { mimeType: 'unknown/type' },
    ]

    test('counts files by category correctly', () => {
      const counts = countFilesByCategory(testFiles)
      expect(counts.image).toBe(2)
      expect(counts.video).toBe(1)
      expect(counts.document).toBe(1)
      expect(counts.folder).toBe(1)
      expect(counts.archive).toBe(1)
      expect(counts.code).toBe(1)
      expect(counts.other).toBe(1)
    })

    test('initializes all categories with zero counts', () => {
      const counts = countFilesByCategory([])
      Object.keys(FILE_TYPE_CATEGORIES).forEach(category => {
        expect(counts[category]).toBe(0)
      })
    })
  })

  describe('formatCategoryCount', () => {
    test('formats small numbers correctly', () => {
      expect(formatCategoryCount(0)).toBe('')
      expect(formatCategoryCount(5)).toBe('5')
      expect(formatCategoryCount(999)).toBe('999')
    })

    test('formats thousands correctly', () => {
      expect(formatCategoryCount(1000)).toBe('1.0K')
      expect(formatCategoryCount(1500)).toBe('1.5K')
      expect(formatCategoryCount(999999)).toBe('1000.0K')
    })

    test('formats millions correctly', () => {
      expect(formatCategoryCount(1000000)).toBe('1.0M')
      expect(formatCategoryCount(1500000)).toBe('1.5M')
    })
  })

  describe('Backend-Frontend Consistency', () => {
    test('backend query and frontend filter produce consistent results', () => {
      const fileTypes = ['document', 'image']

      // Backend query generation
      const backendQuery = getGoogleDriveQuery(fileTypes)
      expect(backendQuery).toBeTruthy()

      // Frontend filtering
      const testFiles = [
        'application/vnd.google-apps.document',
        'application/pdf',
        'image/jpeg',
        'video/mp4',
        'text/plain',
      ]

      const frontendResults = testFiles.filter(mimeType => matchesFileType(mimeType, fileTypes))

      // Should match document and image files only
      expect(frontendResults).toContain('application/vnd.google-apps.document')
      expect(frontendResults).toContain('application/pdf')
      expect(frontendResults).toContain('image/jpeg')
      expect(frontendResults).toContain('text/plain') // text/plain is a document type
      expect(frontendResults).not.toContain('video/mp4')
    })

    test('all file type categories have consistent definitions', () => {
      Object.entries(FILE_TYPE_CATEGORIES).forEach(([categoryId, category]) => {
        expect(category.id).toBe(categoryId)
        expect(category.label).toBeTruthy()
        expect(category.googleDriveQuery).toBeTruthy()
        expect(category.color).toBeTruthy()
        expect(Array.isArray(category.mimeTypes)).toBe(true)
      })
    })
  })
})
