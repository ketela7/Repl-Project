'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Hook to manage session duration based on remember me preference
 * Updates session with remember me preference from localStorage
 */
export function useSessionDuration() {
  const { data: session, update } = useSession()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if user has a valid session
    if (!session?.user) return

    // Check if remember me preference is stored in localStorage
    const storedRememberMe = localStorage.getItem('nextauth-remember-me')
    
    if (storedRememberMe) {
      const rememberMe = JSON.parse(storedRememberMe)
      
      // Only update if the session's remember me preference doesn't match
      if (session.rememberMe !== rememberMe) {
        // Update session with remember me preference
        update({ rememberMe })
          .then(() => {
            // Clear the localStorage flag after successful update
            localStorage.removeItem('nextauth-remember-me')
          })
          .catch(console.error)
      }
    }
  }, [session, update])

  return {
    isRememberMe: session?.rememberMe || false,
    sessionDuration: session?.rememberMe ? '30 days' : '1 day'
  }
}