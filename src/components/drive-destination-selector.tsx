'use client'

import { useState, useEffect, useRef } from 'react'
import { Folder, Loader2, Check, AlertCircle, Shield } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface DriveFolder {
  id: string
  name: string
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

  // Load folders from API with search support
  const loadFolders = async (searchTerm?: string) => {
    setIsLoadingFolders(true)
    try {
      const currentFolderId = currentPath[currentPath.length - 1]?.id || 'root'

      // Build API URL with parameters
      const params = new URLSearchParams()

      if (searchTerm && searchTerm.trim()) {
        // Search mode: search across all folders
        params.append('search', searchTerm.trim())
      } else {
        // Browse mode: get folders in current directory
        params.append('parentId', currentFolderId)
      }

      const response = await fetch(`/api/drive/folders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      } else {
        setFolders([])
      }
    } catch (error) {
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



  // Load initial folders
  useEffect(() => {
    loadFolders()
  }, [currentPath])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        // Search mode: search across all folders using API
        loadFolders(searchQuery.trim())
      } else {
        // Browse mode: load folders in current directory
        loadFolders()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // No client-side filtering needed anymore - server handles search
  const filteredFolders = folders

  // Clear validation result when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'browse' | 'url')
    setValidationResult(null) // Clear validation when switching tabs
    if (value === 'browse') {
      setUrlInput('') // Clear URL input when switching to browse
    }
  }

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}>
      <Card className="mx-auto h-[400px] w-full border shadow-sm">
        <CardContent className="flex h-full flex-col overflow-hidden p-3">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex h-full min-h-0 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Folders</TabsTrigger>
              <TabsTrigger value="url">URL/ID</TabsTrigger>
            </TabsList>

            <TabsContent
              value="browse"
              className="flex flex-1 flex-col space-y-2 overflow-hidden data-[state=active]:flex"
            >
              <Input
                placeholder="Search folders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 flex-shrink-0"
              />

              <ScrollArea className="h-[280px] w-full">
                <div className="space-y-1 pr-4">
                  {isLoadingFolders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading folders...</span>
                    </div>
                  ) : filteredFolders.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-muted-foreground text-sm">No folders found</span>
                    </div>
                  ) : (
                    filteredFolders.map(folder => (
                      <div
                        key={folder.id}
                        className={cn(
                          'group hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors',
                          selectedFolderId === folder.id && 'bg-accent',
                        )}
                        onClick={() => handleFolderSelect(folder)}
                      >
                        <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium">{folder.name}</h4>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="url"
              className="flex flex-1 flex-col space-y-3 overflow-hidden data-[state=active]:flex"
            >
              <div className="space-y-3">
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

                {/* Validation Results - Only show in URL tab */}
                {validationResult && activeTab === 'url' && (
                  <div
                    className={cn(
                      'rounded-lg border-2 p-3',
                      validationResult.isValid
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-red-300 bg-red-50',
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {validationResult.isValid ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <h4
                        className={cn(
                          'text-sm font-semibold',
                          validationResult.isValid ? 'text-blue-800' : 'text-red-800',
                        )}
                      >
                        {validationResult.isValid ? 'Folder Found' : 'Validation Failed'}
                      </h4>
                    </div>

                    {validationResult.isValid ? (
                      <div className="space-y-2">
                        <div className="rounded border bg-blue-100 p-2">
                          <div className="flex items-center gap-2">
                            <Folder className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {validationResult.folderName}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={handleUrlSelect}
                          size="sm"
                          className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Choose This Target
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-red-700">{validationResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
