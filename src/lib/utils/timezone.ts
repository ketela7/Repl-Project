/**
 * Timezone utilities for handling client-server time synchronization
 */

/**
 * Get user's timezone from browser
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Format date to user's timezone
 */
export function formatDateToUserTimezone(
  date: string | Date,
  timezone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const userTimezone = timezone || getUserTimezone()
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options,
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      timeZone: userTimezone,
    }).format(dateObj)
  } catch {
    return dateObj.toLocaleString()
  }
}

/**
 * Convert UTC date to user's timezone
 */
export function convertUTCToUserTimezone(
  utcDate: string | Date,
  timezone?: string
): Date {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  // Create a new date adjusted for user's timezone
  const utcTime = dateObj.getTime()
  const userTime = new Date(utcTime)

  // Use timezone if provided
  if (timezone) {
    // Apply timezone offset if needed
  }

  return userTime
}

/**
 * Get relative time (e.g., "2 hours ago") in user's timezone
 */
export function getRelativeTime(
  date: string | Date,
  timezone?: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return formatDateToUserTimezone(dateObj, timezone, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}

// Unused timezone functions removed

/**
 * Format file modification time for display
 */
export function formatFileTime(dateString: string, timezone?: string): string {
  return formatDateToUserTimezone(dateString, timezone, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Set user timezone preference
 */
export function setTimezone(timezone: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-timezone', timezone)
  }
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get list of supported timezones
 */
export function getSupportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return []
  }
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(timezone?: string): string {
  const tz = timezone || getUserTimezone()
  try {
    const now = new Date()
    const timeZoneName = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long',
    })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value

    return timeZoneName || tz
  } catch {
    return tz
  }
}

/**
 * Initialize timezone detection on app load
 */
export function initializeTimezone(): string {
  if (typeof window === 'undefined') return 'UTC'

  try {
    const detectedTimezone = getUserTimezone()
    localStorage.setItem('userTimezone', detectedTimezone)
    return detectedTimezone
  } catch {
    return 'UTC'
  }
}
