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
