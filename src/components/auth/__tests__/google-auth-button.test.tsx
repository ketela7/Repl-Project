import { screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'

import { GoogleAuthButton } from '../google-auth-button'
import { render } from '../../../__tests__/test-utils'

// Mock next-auth
jest.mock('next-auth/react')
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('GoogleAuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default props', () => {
    render(<GoogleAuthButton />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent(/sign in with google/i)
  })

  it('triggers Google sign in when clicked', async () => {
    mockSignIn.mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: null,
      code: undefined,
    })

    render(<GoogleAuthButton />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard/drive',
      })
    })
  })

  it('calls custom onClick handler when provided', async () => {
    const mockOnClick = jest.fn()

    render(<GoogleAuthButton onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  it('applies custom className', () => {
    const customClass = 'custom-button-class'

    render(<GoogleAuthButton className={customClass} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass(customClass)
  })

  it('handles sign in error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSignIn.mockRejectedValue(new Error('Sign in failed'))

    render(<GoogleAuthButton />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })

  it('is accessible with proper ARIA attributes', () => {
    render(<GoogleAuthButton />)

    const button = screen.getByRole('button')
    expect(button).toBeVisible()
    expect(button).not.toHaveAttribute('aria-disabled')
  })
})
