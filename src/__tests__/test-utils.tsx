import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  provider: 'google',
  expires: '2025-12-31',
}

// Test wrapper with essential providers only
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        <div className="light">{children}</div>
      </SessionProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper to create mock files
export const createMockFile = (overrides = {}) => ({
  id: 'mock-file-id',
  name: 'test-file.txt',
  mimeType: 'text/plain',
  size: '1024',
  modifiedTime: '2025-06-21T10:00:00.000Z',
  parents: ['mock-parent-id'],
  webViewLink: 'https://drive.google.com/file/d/mock-file-id/view',
  ...overrides,
})

// Helper to create mock folders
export const createMockFolder = (overrides = {}) => ({
  id: 'mock-folder-id',
  name: 'Test Folder',
  mimeType: 'application/vnd.google-apps.folder',
  modifiedTime: '2025-06-21T10:00:00.000Z',
  parents: ['mock-parent-id'],
  ...overrides,
})

// Mock Google Drive API responses
export const mockDriveResponse = {
  files: [
    createMockFile({ id: '1', name: 'Document.docx' }),
    createMockFile({ id: '2', name: 'Spreadsheet.xlsx' }),
    createMockFolder({ id: '3', name: 'Images' }),
  ],
  nextPageToken: null,
}

// Mock fetch for API calls
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock
}
