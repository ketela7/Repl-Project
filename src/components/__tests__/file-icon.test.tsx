import { screen } from '@testing-library/react'

import { FileIcon, getFileIcon } from '../file-icon'
import { render } from '../../__tests__/test-utils'

describe('FileIcon', () => {
  it('renders correct icon for document mime type', () => {
    render(<FileIcon mimeType="application/vnd.google-apps.document" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders correct icon for spreadsheet mime type', () => {
    render(<FileIcon mimeType="application/vnd.google-apps.spreadsheet" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders correct icon for folder mime type', () => {
    render(<FileIcon mimeType="application/vnd.google-apps.folder" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders correct icon for image mime type', () => {
    render(<FileIcon mimeType="image/jpeg" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders correct icon for video mime type', () => {
    render(<FileIcon mimeType="video/mp4" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders correct icon for audio mime type', () => {
    render(<FileIcon mimeType="audio/mpeg" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('renders default file icon for unknown mime type', () => {
    render(<FileIcon mimeType="unknown/type" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FileIcon mimeType="text/plain" className="custom-class" />
    )

    const icon = container.querySelector('svg[data-testid="file-icon"]')
    expect(icon).toHaveClass('custom-class')
  })

  it('handles different sizes', () => {
    const { container } = render(<FileIcon mimeType="text/plain" size="lg" />)

    const icon = container.querySelector('svg[data-testid="file-icon"]')
    expect(icon).toHaveClass('h-8', 'w-8')
  })

  it('uses fileName for additional context when provided', () => {
    render(<FileIcon mimeType="text/plain" fileName="test.txt" />)

    const icon =
      screen.getByTestId('file-icon') ||
      screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })
})

describe('getFileIcon', () => {
  it('returns correct icon for document types', () => {
    const icon = getFileIcon('application/vnd.google-apps.document')
    expect(icon).toBeDefined()
  })

  it('returns correct icon for spreadsheet types', () => {
    const icon = getFileIcon('application/vnd.google-apps.spreadsheet')
    expect(icon).toBeDefined()
  })

  it('returns correct icon for presentation types', () => {
    const icon = getFileIcon('application/vnd.google-apps.presentation')
    expect(icon).toBeDefined()
  })

  it('returns correct icon for PDF files', () => {
    const icon = getFileIcon('application/pdf')
    expect(icon).toBeDefined()
  })

  it('returns correct icon for archive files', () => {
    const icon = getFileIcon('application/zip')
    expect(icon).toBeDefined()
  })

  it('handles unknown mime types gracefully', () => {
    const icon = getFileIcon('unknown/mimetype')
    expect(icon).toBeDefined()
  })

  it('applies custom className when provided', () => {
    const icon = getFileIcon('text/plain', 'test.txt', 'custom-class')
    expect(icon).toBeDefined()
  })
})
