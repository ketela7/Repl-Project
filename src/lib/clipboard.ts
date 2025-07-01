/**
 * Enhanced clipboard utilities with toast notifications
 */
import { successToast, errorToast } from '@/components/ui/toast'

/**
 * Copy text to clipboard with automatic toast feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const result = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (result) {
        successToast.copied()
        return true
      } else {
        throw new Error('Copy command failed')
      }
    }

    await navigator.clipboard.writeText(text)
    successToast.copied()
    return true
  } catch (error) {
    errorToast.generic('Failed to copy to clipboard', {
      description: 'Please try copying manually',
      duration: 4000,
    })
    return false
  }
}

/**
 * Copy file URL or share link to clipboard
 */
export async function copyFileLink(
  fileId: string,
  fileName: string,
  linkType: 'view' | 'download' = 'view',
): Promise<boolean> {
  try {
    const baseUrl = window.location.origin
    const link =
      linkType === 'download'
        ? `${baseUrl}/api/drive/download/${fileId}`
        : `https://drive.google.com/file/d/${fileId}/view`

    const success = await copyToClipboard(link)
    if (success) {
      successToast.generic(`${fileName} link copied to clipboard`)
    }
    return success
  } catch (error) {
    errorToast.generic(`Failed to copy ${fileName} link`)
    return false
  }
}

/**
 * Copy multiple file IDs for bulk operations
 */
export async function copyFileIds(fileIds: string[]): Promise<boolean> {
  const idsText = fileIds.join('\n')
  const success = await copyToClipboard(idsText)
  if (success) {
    successToast.copied(fileIds.length)
  }
  return success
}

/**
 * Copy folder structure as text
 */
export async function copyFolderStructure(structure: string): Promise<boolean> {
  const success = await copyToClipboard(structure)
  if (success) {
    successToast.generic('Folder structure copied to clipboard')
  }
  return success
}

/**
 * Read from clipboard (requires user permission)
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported')
    }

    return await navigator.clipboard.readText()
  } catch (error) {
    errorToast.generic('Failed to read from clipboard')
    return null
  }
}

// Unused clipboard function removed
