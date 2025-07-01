'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { useSessionDuration } from '@/lib/hooks/use-session-duration'

interface AuthWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isServerOnline, setIsServerOnline] = useState(true)
  const [hasStoredSession, setHasStoredSession] = useState(false)
  
  // Handle session duration based on remember me preference
  useSessionDuration()

  // Check if user has stored session data (indicating they were previously logged in)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextAuthSession =
        localStorage.getItem('next-auth.session-token') ||
        localStorage.getItem('__Secure-next-auth.session-token') ||
        document.cookie.includes('next-auth.session-token') ||
        document.cookie.includes('__Secure-next-auth.session-token')
      setHasStoredSession(!!nextAuthSession)
    }
  }, [])

  // Check server connectivity when status is unauthenticated
  useEffect(() => {
    // Don't redirect during tests
    if (process.env.NODE_ENV === 'test') {
      return
    }

    if (status === 'unauthenticated' && hasStoredSession) {
      const checkServerStatus = async () => {
        try {
          const response = await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000),
          })

          if (!response.ok) {
            setIsServerOnline(false)
            router.push('/server-offline')
            return
          }

          setIsServerOnline(true)
          // If server is online but user is unauthenticated, redirect to login
          if (!fallback) {
            router.push('/auth/v1/login')
          }
        } catch (error) {
          setIsServerOnline(false)
          router.push('/server-offline')
        }
      }

      checkServerStatus()
    } else if (status === 'unauthenticated' && !hasStoredSession && !fallback) {
      // No stored session and unauthenticated - direct to login
      router.push('/auth/v1/login')
    }
  }, [status, fallback, router, hasStoredSession])

  if (status === 'loading') {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="mx-auto max-w-sm space-y-4 px-6 text-center">
          <div className="relative">
            <div className="border-muted border-t-primary mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
            <div className="border-primary/20 absolute inset-0 mx-auto h-12 w-12 animate-pulse rounded-full border-4"></div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-lg font-medium">Authenticating</p>
            <p className="text-muted-foreground text-sm">Verifying your Google Drive access...</p>
          </div>
          <div className="bg-muted mx-auto h-1 w-48 overflow-hidden rounded-full">
            <div className="bg-primary h-full animate-pulse rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    if (fallback) {
      return <>{fallback}</>
    }

    // If we have stored session but are unauthenticated, likely server issue
    if (hasStoredSession && !isServerOnline) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
            <p>Checking server connection...</p>
          </div>
        </div>
      )
    }

    // Show access denied message for users without stored session
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p>Access denied. Please sign in.</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && session) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
    </div>
  )
}
