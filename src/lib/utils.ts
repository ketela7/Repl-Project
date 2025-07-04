import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function successToast(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

export function errorToast(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 6000,
  })
}

export function loadingToast(message: string, description?: string) {
  return toast.loading(message, {
    description,
  })
}

// Extended toast utility functions
loadingToast.start = (message: string, id?: string) => {
  return toast.loading(message, id ? { id } : {})
}

loadingToast.success = (message: string, id?: string) => {
  toast.success(message, id ? { id } : {})
}

loadingToast.error = (message: string, id?: string) => {
  toast.error(message, id ? { id } : {})
}

loadingToast.dismiss = (id?: string) => {
  toast.dismiss(id)
}

successToast.generic = (message: string, options?: Record<string, unknown>) => {
  toast.success(message, options)
}

successToast.shared = (count: number) => {
  toast.success(`Successfully shared ${count} item${count > 1 ? 's' : ''}`)
}

errorToast.generic = (message: string, options?: Record<string, unknown>) => {
  toast.error(message, options)
}

errorToast.apiError = (message: string, details?: string) => {
  toast.error(message, { description: details })
}

errorToast.driveAccessDenied = () => {
  toast.error('Google Drive access denied', {
    description: 'Please reconnect your Google Drive account',
  })
}

errorToast.permissionDenied = () => {
  toast.error('Permission denied', {
    description: 'You do not have permission to perform this action',
  })
}

export function infoToast(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
  })
}

export function formatFileTime(dateString: string, timezone?: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone ?? 'UTC',
    }).format(date)
  } catch {
    return 'Invalid date'
  }
}

export function formatCreationTime(dateString: string, timezone?: string): string {
  return formatFileTime(dateString, timezone)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const toastUtils = {
  success: successToast,
  error: errorToast,
  loading: loadingToast,
  info: infoToast,
}

/**
 * Calculate progress percentage from current and total values
 */
export function calculateProgress(current: number, total: number): number {
  return total > 0 ? Math.round((current / total) * 100) : 0
}

/**
 * Generate timestamp for file naming
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
}

/**
 * Generate filename with current date
 */
export function generateDateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}-${date}.${extension}`
}

/**
 * Format duration from milliseconds to readable format
 */
export function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Convert size in bytes with multiplier
 */
export function convertSizeWithMultiplier(value: number, multiplier: number): number {
  return Math.floor(value * multiplier)
}

/**
 * Get current ISO date string for export data
 */
export function getCurrentISODate(): string {
  return new Date().toISOString()
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes

  if (isNaN(size) || size === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  const value = size / Math.pow(1024, i)

  // For bytes, don't show decimal places; for larger units, show 1 decimal place
  const formatted = i === 0 ? Math.round(value) : value.toFixed(1)
  return `${formatted} ${units[i]}`
}
