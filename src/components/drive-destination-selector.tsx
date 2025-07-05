'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Folder,
  Search,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  ExternalLink,
  Users,
  Home,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface DriveFolder {
  id: string
  name: string
  path?: string
  isShared?: boolean
}

interface DriveDestinationSelectorProps {
  onSelect: (folderId: string, folderName?: string) => void
  selectedFolderId?: string
  className?: string
}

/**
 * Parse Google Drive URL to extract folder ID
 */
function parseDriveUrl(url: string): { folderId: string | null; isValid: boolean } {
  try {
    const cleanUrl = url.trim()

    // Direct folder ID (no URL)
    if (cleanUrl.match(/^[a-zA-Z0-9_-]{20,}$/)) {
      console.log('Parsed folder ID from direct ID:', cleanUrl)
      return { folderId: cleanUrl, isValid: true }
    }

    // Google Drive URL patterns
    const patterns = [
      /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        console.log('Parsed folder ID from URL:', match[1])
        return { folderId: match[1], isValid: true }
      }
    }

    return { folderId: null, isValid: false }
  } catch {
    return { folderId: null, isValid: false }
  }
}

export function DriveDestinationSelector({
  onSelect,
  selectedFolderId = 'root',
  className,
}: DriveDestinationSelectorProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'url'>('browse')
  const [urlInput, setUrlInput] = useState('')
  const [parsedResult, setParsedResult] = useState<{ folderId: string | null; isValid: boolean }>({
    folderId: null,
    isValid: false,
  })
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    folderName?: string
    error?: string
  } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Folder browsing state
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPath, setCurrentPath] = useState<DriveFolder[]>([{ id: 'root', name: 'My Drive' }])

  // Parse URL input in real-time
  useEffect(() => {
    if (urlInput.trim()) {
      const result = parseDriveUrl(urlInput)
      setParsedResult(result)
      setValidationResult(null)
    } else {
      setParsedResult({ folderId: null, isValid: false })
      setValidationResult(null)
    }
  }, [urlInput])

  // Load folders from API
  const loadFolders = async () => {
    setIsLoadingFolders(true)
    try {
      const currentFolderId = currentPath[currentPath.length - 1]?.id || 'root'
      const response = await fetch(`/api/drive/folders?parentId=${currentFolderId}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
      setFolders([])
    } finally {
      setIsLoadingFolders(false)
    }
  }

  // Validate folder ID
  const validateFolderId = async (folderId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsValidating(true)
    setValidationResult(null)

    console.log('Validating folder ID:', folderId)

    try {
      const response = await fetch('/api/drive/folders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()
      console.log('Validation response:', data)

      if (abortControllerRef.current.signal.aborted) return

      if (data.success && data.folder) {
        setValidationResult({
          isValid: true,
          folderName: data.folder.name,
        })
      } else {
        setValidationResult({
          isValid: false,
          error:
            data.error ||
            'Target folder not found or access denied. Please check the folder ID and permissions.',
        })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return

      setValidationResult({
        isValid: false,
        error: 'Failed to validate folder ID',
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Handle folder selection
  const handleFolderSelect = (folder: DriveFolder) => {
    onSelect(folder.id, folder.name)
  }

  // Handle URL selection
  const handleUrlSelect = () => {
    if (validationResult?.isValid && parsedResult.folderId) {
      onSelect(parsedResult.folderId, validationResult.folderName)
    }
  }

  // Navigate to folder
  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentPath(prev => [...prev, folder])
    setSearchQuery('')
  }

  // Load initial folders
  useEffect(() => {
    loadFolders()
  }, [currentPath])

  // Filter folders based on search
  const filteredFolders = searchQuery
    ? folders.filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}>
      <Card className="mx-auto max-h-[400px] min-h-[300px] w-full border shadow-sm">
        <CardContent className="flex h-full flex-col overflow-hidden p-3">
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as 'browse' | 'url')}
            className="flex h-full min-h-0 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Folders</TabsTrigger>
              <TabsTrigger value="url">URL/ID</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-2 flex-1 space-y-2">
              <div className="space-y-2">
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {isLoadingFolders ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading folders...</span>
                    </div>
                  ) : (
                    filteredFolders.map(folder => (
                      <div
                        key={folder.id}
                        className="group hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md p-2"
                        onClick={() => handleFolderSelect(folder)}
                      >
                        <Folder className="h-4 w-4 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium">{folder.name}</h4>
                        </div>
                        {folder.isShared && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="mr-1 h-2 w-2" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="url" className="mt-2 flex-1 space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="Paste Google Drive URL or folder ID here..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="h-9"
                />

                {parsedResult.isValid && !validationResult && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => validateFolderId(parsedResult.folderId!)}
                    disabled={isValidating}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        Validate Folder Access
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Validation Results - Prominent Display Outside Card */}
      {validationResult && (
        <div
          className="mt-4 rounded-lg border-2 p-4 shadow-lg"
          style={{
            backgroundColor: validationResult.isValid ? '#ebf8ff' : '#fef2f2',
            borderColor: validationResult.isValid ? '#3b82f6' : '#ef4444',
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            {validationResult.isValid ? (
              <Check className="h-6 w-6 text-blue-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600" />
            )}
            <h3
              className="text-lg font-bold"
              style={{
                color: validationResult.isValid ? '#1e40af' : '#dc2626',
              }}
            >
              {validationResult.isValid ? 'FOLDER FOUND ✓' : 'VALIDATION FAILED ❌'}
            </h3>
          </div>

          {validationResult.isValid ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-300 bg-blue-100 p-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  <span className="text-base font-semibold text-blue-800">
                    {validationResult.folderName}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleUrlSelect}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-lg font-bold text-white hover:bg-blue-700"
              >
                <Check className="mr-2 h-5 w-5" />
                CHOOSE THIS TARGET
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-red-300 bg-red-100 p-3">
              <p className="text-base font-semibold text-red-800">{validationResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { DriveDestinationSelector }
