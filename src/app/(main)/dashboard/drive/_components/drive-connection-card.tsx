'use client'

import { useState } from 'react'
import { HardDrive, Shield, Upload, Search, Folder } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DriveConnectionCard() {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    // Direct OAuth flow without intermediate page
    window.location.href = '/api/auth/signin/google?callbackUrl=/dashboard/drive'
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <HardDrive className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Connect to Google Drive</CardTitle>
          <CardDescription className="text-base">
            Securely connect to manage your Google Drive files and folders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-center">
              <Upload className="text-muted-foreground mx-auto h-8 w-8 opacity-60" />
              <p className="text-sm font-medium">Upload Files</p>
              <p className="text-muted-foreground text-xs">Coming soon</p>
            </div>
            <div className="space-y-2 text-center">
              <Folder className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-sm font-medium">Organize Folders</p>
              <p className="text-muted-foreground text-xs">Create and manage folder structure</p>
            </div>
            <div className="space-y-2 text-center">
              <Search className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-sm font-medium">Search Files</p>
              <p className="text-muted-foreground text-xs">Find files quickly with search</p>
            </div>
            <div className="space-y-2 text-center">
              <Shield className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-sm font-medium">Secure Access</p>
              <p className="text-muted-foreground text-xs">Protected with OAuth 2.0</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              You'll be redirected to Google to securely authorize access to your Drive files.
            </p>

            <Button onClick={handleConnect} disabled={connecting} size="lg" className="w-full">
              {connecting ? (
                <>
                  <Shield className="mr-2 h-4 w-4 animate-pulse" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Connect Drive
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DriveConnectionCard
