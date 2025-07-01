'use client'

import { useState } from 'react'
import { HardDrive, Shield, AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DrivePermissionRequiredProps {
  error?: any
  onRetry?: () => void
  compact?: boolean
}

export function DrivePermissionRequired({ error, onRetry, compact = false }: DrivePermissionRequiredProps) {
  const [connecting, setConnecting] = useState(false)

  const handleReconnect = async () => {
    setConnecting(true)

    try {
      // Sign out first, then redirect to login
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      // Redirect to login with reauth parameter
      window.location.href = '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive'
    } catch (error) {
      // Fallback: direct redirect to login
      window.location.href = '/auth/v1/login?reauth=drive&callbackUrl=/dashboard/drive'
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
  }

  if (compact) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Google Drive access required</span>
          <div className="ml-4 flex gap-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            )}
            <Button size="sm" onClick={handleReconnect} disabled={connecting}>
              <Shield className="mr-1 h-3 w-3" />
              {connecting ? 'Connecting...' : 'Grant Access'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Google Drive Access Required</CardTitle>
          <CardDescription>We need permission to access your Google Drive to manage your files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error.message || error.toString()}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <HardDrive className="text-muted-foreground h-4 w-4" />
              <span>View and manage your Drive files</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="text-muted-foreground h-4 w-4" />
              <span>Secure access with OAuth 2.0</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button onClick={handleReconnect} disabled={connecting} className="flex-1">
              {connecting ? (
                <>
                  <HardDrive className="mr-2 h-4 w-4 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Grant Access
                </>
              )}
            </Button>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            You&rsquo;ll be redirected to Google to authorize Drive permissions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
