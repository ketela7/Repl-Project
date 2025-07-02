import { render, screen } from '@testing-library/react'
import { FileIcon } from '../file-icon'

describe('FileIcon', () => {
  it('should render with default props', () => {
    render(<FileIcon />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should render with file extension', () => {
    render(<FileIcon fileName="document.pdf" />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should render with mime type', () => {
    render(<FileIcon mimeType="image/jpeg" />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should handle unknown file types', () => {
    render(<FileIcon fileName="unknown.xyz" />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should render with custom size', () => {
    render(<FileIcon size={32} />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should render folder icon', () => {
    render(<FileIcon mimeType="application/vnd.google-apps.folder" />)

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })
})
