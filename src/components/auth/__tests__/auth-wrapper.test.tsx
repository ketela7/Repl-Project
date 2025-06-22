import { screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { AuthWrapper } from '../auth-wrapper'
import { render } from '../../../__tests__/test-utils'

jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('AuthWrapper', () => {
  const TestComponent = () => <div>Protected Content</div>
  const FallbackComponent = () => <div>Please sign in</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(
      <AuthWrapper fallback={<FallbackComponent />}>
        <TestComponent />
      </AuthWrapper>
    )

    expect(screen.getByText('Authenticating')).toBeInTheDocument()
    expect(screen.getByText('Verifying your Google Drive access...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Please sign in')).not.toBeInTheDocument()
  })

  it('shows fallback when user is not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(
      <AuthWrapper fallback={<FallbackComponent />}>
        <TestComponent />
      </AuthWrapper>
    )

    expect(screen.getByText('Please sign in')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('shows children when user is authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'test-id', name: 'Test User', email: 'test@example.com' },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(
      <AuthWrapper fallback={<FallbackComponent />}>
        <TestComponent />
      </AuthWrapper>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Please sign in')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('shows default fallback when no custom fallback provided', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    )

    expect(screen.getByText('Access denied. Please sign in.')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})