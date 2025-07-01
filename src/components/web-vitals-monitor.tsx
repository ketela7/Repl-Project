'use client'

/**
 * Web Vitals monitoring component for performance tracking
 * Must be client-side to access browser APIs
 */

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/web-vitals'

export function WebVitalsMonitor() {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals()

    // Track route changes if using Next.js router
    const handleRouteChange = (url: string) => {
      // Mark when new route starts loading
      if (typeof window !== 'undefined' && 'performance' in window) {
        window.performance.mark('route-change-start')
      }
    }

    // Listen for route changes in development
    if (process.env.NODE_ENV === 'development') {
      handleRouteChange(window.location.pathname)
    }
  }, [])

  // Component doesn't render anything - just monitoring
  return null
}
