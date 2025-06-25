'use client'

import React from 'react'



interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  description?: string
  icon?: React.ReactNode
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Unused toast functions removed
