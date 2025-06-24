'use client'

import { useEffect } from 'react'

export function LoadingOptimization() {
  useEffect(() => {
    // Preconnect to Google APIs
    const preconnectLink = document.createElement('link')
    preconnectLink.rel = 'preconnect'
    preconnectLink.href = 'https://www.googleapis.com'
    document.head.appendChild(preconnectLink)

    // DNS prefetch for faster lookups
    const dnsPrefetchLink = document.createElement('link')
    dnsPrefetchLink.rel = 'dns-prefetch'
    dnsPrefetchLink.href = 'https://drive.google.com'
    document.head.appendChild(dnsPrefetchLink)

    // Preload critical resources on idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        import('@/app/(main)/dashboard/drive/_components/drive-manager')
        import('@/app/(main)/dashboard/drive/_components/drive-data-view')
      })
    }

    return () => {
      document.head.removeChild(preconnectLink)
      document.head.removeChild(dnsPrefetchLink)
    }
  }, [])

  return null
}