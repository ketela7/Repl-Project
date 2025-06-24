import { useState } from 'react'
import { DriveErrorDisplay } from '@/components/drive-error-display'
import { DrivePermissionRequired } from '@/components/drive-permission-required'

const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<boolean>(false)

const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        // Create error object with additional properties
        const error = new Error(data.error || 'Failed to fetch files')
        ;(error as any).status = response.status
        ;(error as any).needsReauth = data.needsReauth
        ;(error as any).redirect = data.redirect
        throw error
      }

} catch (err: any) {
      console.error('Error loading files:', err)

      // Handle authentication errors
      if (err.needsReauth || err.status === 401) {
        setAuthError(true)
        setError('Authentication required')

        // Redirect to login page
        if (err.redirect) {
          window.location.href = err.redirect
        } else {
          window.location.href = '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive'
        }
        return
      }

      setError('Failed to load files')
    } finally {
      setLoading(false)
    }

if (authError) {
    return (
      <DrivePermissionRequired 
        error={new Error(error || 'Authentication required')}
        onRetry={() => {
          setAuthError(false)
          setError(null)
          loadFiles()
        }}
      />
    )
  }

  if (error) {
    return (
      <DriveErrorDisplay 
        error={new Error(error)} 
        onRetry={loadFiles}
        onReconnect={() => window.location.href = '/api/auth/reauth-drive'}
      />
    )
  }