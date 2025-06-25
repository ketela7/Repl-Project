/**
 * Performance utilities for lazy loading and compilation optimization
 */

// Preload critical components when idle
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Preload most commonly used bulk dialogs
      import('@/app/(main)/dashboard/drive/_components/bulk-operations-dialog')
        .then(() => console.log('Bulk dialogs preloaded'))
        .catch(() => {})
    })
  }
}

// Lazy load component with retry
export const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return new Promise((resolve, reject) => {
    const retry = (retries = 3) => {
      componentImport()
        .then(resolve)
        .catch((error) => {
          if (retries > 0) {
            setTimeout(() => retry(retries - 1), 1000)
          } else {
            reject(error)
          }
        })
    }
    retry()
  })
}

// Optimized loading states for different component sizes
export const getLoaderClassName = (
  size: 'small' | 'default' | 'large' = 'default'
) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  }

  return `animate-pulse bg-gray-200 rounded ${sizeClasses[size]}`
}

// Optimize bundle loading
export const optimizeBundleLoading = () => {
  if (typeof window !== 'undefined') {
    // Prefetch DNS for external resources
    const prefetchDNS = (hostname: string) => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${hostname}`
      document.head.appendChild(link)
    }

    // Prefetch critical external resources
    prefetchDNS('accounts.google.com')
    prefetchDNS('apis.google.com')
    prefetchDNS('www.googleapis.com')
  }
}
