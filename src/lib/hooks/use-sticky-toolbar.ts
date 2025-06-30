'use client'

import { useEffect, useState } from 'react'

/**
 * Android-like sticky toolbar behavior hook
 * Provides dynamic shadow and background opacity based on scroll position
 */
export function useStickyToolbar(toolbarId: string = 'drive-toolbar') {
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      
      // Update scroll state for shadow effect
      const newIsScrolled = currentScrollY > 10
      if (newIsScrolled !== isScrolled) {
        setIsScrolled(newIsScrolled)
      }

      // Apply dynamic styling to toolbar
      const toolbar = document.getElementById(toolbarId)
      if (toolbar) {
        // Calculate dynamic opacity and shadow based on scroll position
        const scrollProgress = Math.min(currentScrollY / 100, 1) // Max effect at 100px scroll
        const shadowIntensity = Math.min(currentScrollY / 50, 1) // Max shadow at 50px scroll
        
        // Dynamic background opacity (more opaque when scrolled)
        const bgOpacity = 0.95 + (scrollProgress * 0.05) // 0.95 to 1.0
        
        // Dynamic shadow (stronger when scrolled)
        const shadowOpacity = shadowIntensity * 0.15 // 0 to 0.15
        
        toolbar.style.backgroundColor = `hsl(var(--background) / ${bgOpacity})`
        toolbar.style.boxShadow = `0 1px 3px 0 rgb(0 0 0 / ${shadowOpacity}), 0 1px 2px -1px rgb(0 0 0 / ${shadowOpacity * 0.6})`
        
        // Add elevation effect similar to Android Material Design
        if (currentScrollY > 0) {
          toolbar.style.transform = 'translateZ(0)' // Force GPU acceleration
          toolbar.classList.add('elevation-4')
        } else {
          toolbar.classList.remove('elevation-4')
        }
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [toolbarId, isScrolled])

  return {
    isScrolled,
    scrollY,
  }
}