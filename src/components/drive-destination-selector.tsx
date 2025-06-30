'use client'

import { useState, useEffect } from 'react'
import { Folder, Link, Search, ExternalLink, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
 * Supports various Google Drive URL formats:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - https://drive.google.com/open?id=FOLDER_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 */
function parseDriveUrl(url: string): { folderId: string | null; isValid: boolean } {
  try {
    const cleanUrl = url.trim()

    // Direct folder ID (no URL)
    if (cleanUrl.match(/^[a-zA-Z0-9_-]{20,}$/)) {
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

  // Load folders for browsing
  const loadFolders = async (parentId: string = 'root') => {
    setIsLoadingFolders(true)
    try {
      const response = await fetch(`/api/drive/folders?parentId=${parentId}`)
      const data = await response.json()

      if (data.success) {
        setFolders(data.folders || [])
      }
    } catch (error) {
      // // // // // console.error('Failed to load folders:', error)
    } finally {
      setIsLoadingFolders(false)
    }
  }

  // Validate parsed folder ID
  const validateFolderId = async (folderId: string) => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/drive/folders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      })

      const data = await response.json()

      if (data.success && data.folder) {
        setValidationResult({
          isValid: true,
          folderName: data.folder.name,
        })
      } else {
        setValidationResult({
          isValid: false,
          error: data.error || 'Folder validation failed',
        })
      }
    } catch (error) {
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
    if (parsedResult.folderId && validationResult?.isValid) {
      onSelect(parsedResult.folderId, validationResult.folderName)
    }
  }

  // Navigate to folder
  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentPath([...currentPath, folder])
    loadFolders(folder.id)
  }

  // Navigate back
  const navigateBack = (index: number) => {
    const newPath = currentPath.slice(0, index + 1)
    setCurrentPath(newPath)
    loadFolders(newPath[newPath.length - 1].id)
  }

  // Filter folders based on search
  const filteredFolders = searchQuery
    ? folders.filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  // Load initial folders
  useEffect(() => {
    loadFolders()
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'browse' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Browse Folders
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Paste URL/ID
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            {currentPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1">
                {index > 0 && <span key={`separator-${index}`}>/</span>}
                <button
                  onClick={() => navigateBack(index)}
                  className="hover:text-foreground max-w-24 truncate transition-colors"
                  title={folder.name}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-3 w-3" />
            <Input
              placeholder="Search folders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>

          {/* Folder List */}
          <ScrollArea className="h-64 rounded-md border">
            <div className="space-y-1 p-2">
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-xs">
                  {searchQuery ? 'No folders found matching your search' : 'No folders found'}
                </div>
              ) : (
                filteredFolders.slice(0, 20).map(folder => (
                  <div
                    key={folder.id}
                    className={cn(
                      'flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors',
                      selectedFolderId === folder.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs" title={folder.name}>
                        {folder.name}
                      </div>
                      {folder.path && (
                        <div className="text-muted-foreground truncate text-[10px]">
                          {folder.path}
                        </div>
                      )}
                    </div>
                    {folder.isShared && (
                      <Badge variant="secondary" className="flex-shrink-0 px-1 py-0 text-[10px]">
                        Shared
                      </Badge>
                    )}
                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigateToFolder(folder)}
                        className="h-6 px-2 text-[10px]"
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleFolderSelect(folder)}
                        className={cn(
                          'h-6 px-2 text-[10px]',
                          selectedFolderId === folder.id
                            ? 'bg-primary text-primary-foreground'
                            : '',
                        )}
                      >
                        {selectedFolderId === folder.id ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {filteredFolders.length > 20 && (
                <div className="text-muted-foreground py-1 text-center text-xs">
                  ... and {filteredFolders.length - 20} more folders
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drive-url">Google Drive URL or Folder ID</Label>
            <Input
              id="drive-url"
              placeholder="https://drive.google.com/drive/folders/FOLDER_ID or just FOLDER_ID"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className={cn(
                parsedResult.isValid && 'border-green-500',
                urlInput && !parsedResult.isValid && 'border-red-500',
              )}
            />
            <div className="text-muted-foreground text-xs">
              Supports: Full Google Drive URLs, folder sharing links, or direct folder IDs
            </div>
          </div>

          {/* URL Parsing Result */}
          {urlInput && (
            <div className="space-y-3">
              {parsedResult.isValid ? (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      Valid format detected
                    </div>
                    <div className="rounded border bg-green-100 p-2 font-mono text-xs dark:bg-green-900/30">
                      Folder ID: {parsedResult.folderId}
                    </div>
                    {!validationResult && (
                      <Button
                        size="sm"
                        onClick={() => validateFolderId(parsedResult.folderId!)}
                        disabled={isValidating}
                        className="w-full"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Validate Folder
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    Invalid URL format. Please check the URL and try again.
                  </div>
                </div>
              )}

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border p-3',
                    validationResult.isValid
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
                  )}
                >
                  {validationResult.isValid ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div
                      className={cn(
                        'text-sm',
                        validationResult.isValid
                          ? 'text-blue-800 dark:text-blue-200'
                          : 'text-red-800 dark:text-red-200',
                      )}
                    >
                      {validationResult.isValid
                        ? `Folder found: "${validationResult.folderName}"`
                        : validationResult.error}
                    </div>
                    {validationResult.isValid && (
                      <Button size="sm" onClick={handleUrlSelect} className="w-full">
                        Select This Folder
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
