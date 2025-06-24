import { screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn, useSession } from 'next-auth/react'
import { GoogleAuthButton } from '../../src/components/auth/google-auth-button'
import { AuthWrapper } from '../../src/components/auth/auth-wrapper'
import { render, mockFetch } from '../../src/__tests__/test-utils'

jest.mock('next-auth/react')
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch({ success: true })
  })

  it('completes full authentication flow', async () => {
    // Start with unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { rerender } = render(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    // Should show sign in prompt
    expect(
      screen.getByText('Access denied. Please sign in.')
    ).toBeInTheDocument()

    // Render Google Auth Button
    rerender(
      <div>
        <GoogleAuthButton />
        <AuthWrapper>
          <div>Protected Content</div>
        </AuthWrapper>
      </div>
    )

    // Click sign in button
    mockSignIn.mockResolvedValue({
      ok: true,
      error: undefined,
      status: 200,
      url: null,
      code: undefined,
    } as any)
    const signInButton = screen.getByRole('button')
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard/drive',
      })
    })

    // Simulate successful authentication
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    rerender(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    // Should now show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(
      screen.queryByText('Access denied. Please sign in.')
    ).not.toBeInTheDocument()
  })

  it('handles authentication loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    expect(screen.getByText('Authenticating')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('handles sign in errors gracefully', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    mockSignIn.mockRejectedValue(new Error('Authentication failed'))

    render(<GoogleAuthButton />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    // Should not crash and remain functional
    expect(button).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
