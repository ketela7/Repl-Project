/**
 * Bundle optimization utilities for improved loading performance
 */

// Dynamic imports for heavy components
export const loadHeavyComponents = {
  DriveManager: () => import('@/app/(main)/dashboard/drive/_components/drive-manager'),
  FilePreviewDialog: () => import('@/app/(main)/dashboard/drive/_components/file-preview-dialog'),
  DriveDataView: () => import('@/app/(main)/dashboard/drive/_components/drive-data-view'),
}

// Preload critical components
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload on user interaction or idle time
    const preloadOnIdle = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          loadHeavyComponents.DriveManager()
          loadHeavyComponents.DriveDataView()
        })
      } else {
        setTimeout(() => {
          loadHeavyComponents.DriveManager()
          loadHeavyComponents.DriveDataView()
        }, 100)
      }
    }

    // Preload on first user interaction
    const preloadOnInteraction = () => {
      loadHeavyComponents.FilePreviewDialog()
      
      // Remove listeners after first interaction
      document.removeEventListener('mousedown', preloadOnInteraction)
      document.removeEventListener('touchstart', preloadOnInteraction)
      document.removeEventListener('keydown', preloadOnInteraction)
    }

    // Set up preloading
    preloadOnIdle()
    document.addEventListener('mousedown', preloadOnInteraction, { passive: true })
    document.addEventListener('touchstart', preloadOnInteraction, { passive: true })
    document.addEventListener('keydown', preloadOnInteraction, { passive: true })
  }
}

// Resource hints for external dependencies
export const addResourceHints = () => {
  if (typeof document !== 'undefined') {
    const head = document.head

    // Preconnect to Google APIs
    const preconnectGoogle = document.createElement('link')
    preconnectGoogle.rel = 'preconnect'
    preconnectGoogle.href = 'https://www.googleapis.com'
    head.appendChild(preconnectGoogle)

    // DNS prefetch for faster lookups
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = 'https://drive.google.com'
    head.appendChild(dnsPrefetch)
  }
}

// Optimize images loading
export const optimizeImages = () => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    })

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img)
    })
  }
}

// Initialize all optimizations
export const initializeBundleOptimizations = () => {
  preloadCriticalComponents()
  addResourceHints()
  optimizeImages()
}