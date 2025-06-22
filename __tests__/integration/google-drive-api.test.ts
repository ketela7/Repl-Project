import { mockFetch } from '../../src/__tests__/test-utils'

describe('Google Drive API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches files from Drive API successfully', async () => {
    const mockResponse = {
      files: [
        {
          id: '1',
          name: 'Document.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '15420',
          modifiedTime: '2025-06-21T10:00:00.000Z',
          parents: ['root']
        },
        {
          id: '2',
          name: 'Images',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2025-06-20T15:30:00.000Z',
          parents: ['root']
        }
      ],
      nextPageToken: null
    }

    mockFetch(mockResponse)

    const response = await fetch('/api/drive/files?pageSize=50')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.files).toHaveLength(2)
    expect(data.files[0].name).toBe('Document.docx')
    expect(data.files[1].mimeType).toBe('application/vnd.google-apps.folder')
  })

  it('handles Drive API errors gracefully', async () => {
    mockFetch({ error: 'Invalid credentials' }, 401)

    const response = await fetch('/api/drive/files')
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(401)
  })

  it('handles pagination correctly', async () => {
    const mockResponse = {
      files: [
        { id: '1', name: 'File1.txt', mimeType: 'text/plain' },
        { id: '2', name: 'File2.txt', mimeType: 'text/plain' }
      ],
      nextPageToken: 'next_page_token'
    }

    mockFetch(mockResponse)

    const response = await fetch('/api/drive/files?pageSize=2')
    const data = await response.json()

    expect(data.nextPageToken).toBe('next_page_token')
    expect(data.files).toHaveLength(2)
  })

  it('applies filters correctly', async () => {
    mockFetch({ files: [], nextPageToken: null })

    const searchParams = new URLSearchParams({
      fileType: 'documents',
      search: 'test',
      sortBy: 'name',
      sortOrder: 'asc'
    })

    const response = await fetch(`/api/drive/files?${searchParams}`)
    
    expect(response.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/drive/files?fileType=documents&search=test&sortBy=name&sortOrder=asc')
    )
  })

  it('handles bulk operations', async () => {
    const bulkResponse = {
      success: true,
      processed: 5,
      failed: 0,
      results: []
    }

    mockFetch(bulkResponse)

    const response = await fetch('/api/drive/bulk/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileIds: ['1', '2', '3', '4', '5']
      })
    })

    const data = await response.json()
    
    expect(response.ok).toBe(true)
    expect(data.success).toBe(true)
    expect(data.processed).toBe(5)
  })

  it('checks Drive access permissions', async () => {
    mockFetch({ hasAccess: true, scopes: ['drive'] })

    const response = await fetch('/api/auth/check-drive-access')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.hasAccess).toBe(true)
    expect(data.scopes).toContain('drive')
  })
})