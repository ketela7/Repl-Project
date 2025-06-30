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

      // Apply dynamic styling to fixed toolbar
      const toolbar = document.getElementById(toolbarId)
      if (toolbar) {
        // Calculate dynamic opacity and shadow for fixed toolbar
        const scrollProgress = Math.min(currentScrollY / 80, 1) // Faster effect for fixed position
        const shadowIntensity = Math.min(currentScrollY / 30, 1) // Quick shadow response
        
        // Dynamic background opacity for fixed toolbar
        const bgOpacity = 0.95 + (scrollProgress * 0.05) // 0.95 to 1.0
        
        // Enhanced shadow for better separation when fixed
        const shadowOpacity = shadowIntensity * 0.2 // 0 to 0.2 (stronger for fixed)
        
        toolbar.style.backgroundColor = `hsl(var(--background) / ${bgOpacity})`
        toolbar.style.boxShadow = `0 2px 8px 0 rgb(0 0 0 / ${shadowOpacity}), 0 1px 4px -1px rgb(0 0 0 / ${shadowOpacity * 0.8})`
        
        // Enhanced elevation for fixed positioning
        if (currentScrollY > 10) {
          toolbar.style.transform = 'translateZ(0)' // GPU acceleration
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