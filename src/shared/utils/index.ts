// Re-export from cn.ts for compatibility
export { cn } from './cn'


export const getInitials = (str: string): string => {
  if (typeof str !== 'string' || !str.trim()) return '?'

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'
  )
}

// Toast utilities
export * from './toast'

// Timezone utilities
export * from './timezone'
