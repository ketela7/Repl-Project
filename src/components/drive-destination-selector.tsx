'use client'

import { useState, useEffect } from 'react'
import {
  Folder,
  Link,
  Search,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Home,
  ChevronRight,
  FolderOpen,
  Users,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    loadFolders(newPath[newPath.length - 1]?.id)
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
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-blue-500" />
          Select Destination Folder
        </CardTitle>
        <p className="text-muted-foreground text-sm">Choose where you want to save your files in Google Drive</p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'browse' | 'url')}>
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger
              value="browse"
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Folder className="h-4 w-4" />
              Browse Folders
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Link className="h-4 w-4" />
              Paste URL/ID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Enhanced Breadcrumb Navigation */}
            <div className="bg-muted/30 flex items-center gap-2 rounded-lg px-3 py-2">
              <Home className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <div className="flex items-center gap-1 overflow-x-auto">
                {currentPath.map((folder, index) => (
                  <div key={folder.id} className="flex flex-shrink-0 items-center gap-1">
                    {index > 0 && <ChevronRight className="text-muted-foreground h-3 w-3 flex-shrink-0" />}
                    <button
                      onClick={() => navigateBack(index)}
                      className={cn(
                        'hover:bg-muted rounded px-2 py-1 text-sm transition-colors',
                        index === currentPath.length - 1
                          ? 'text-foreground bg-background font-medium shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      title={folder.name}
                    >
                      {folder.name === 'My Drive' && index === 0 ? (
                        <span className="flex items-center gap-1">
                          <span>My Drive</span>
                        </span>
                      ) : (
                        <span className="max-w-24 truncate">{folder.name}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                placeholder="Search folders by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-muted/30 border-muted focus:bg-background h-10 pl-10"
              />
              {searchQuery && (
                <div className="text-muted-foreground mt-1 px-1 text-xs">
                  {filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            {/* Enhanced Folder List */}
            <div className="relative">
              <ScrollArea className="bg-background/50 h-80 rounded-lg border">
                <div className="space-y-2 p-3">
                  {isLoadingFolders ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-muted-foreground text-sm">Loading folders...</p>
                    </div>
                  ) : filteredFolders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <div className="bg-muted/50 rounded-full p-3">
                        <Folder className="text-muted-foreground h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm font-medium">
                          {searchQuery ? 'No folders found' : 'No folders available'}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {searchQuery ? 'Try adjusting your search terms' : 'This location is empty'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {filteredFolders.slice(0, 20).map(folder => (
                        <div
                          key={folder.id}
                          className={cn(
                            'group relative flex min-w-0 items-center gap-3 rounded-lg border p-3 transition-all duration-200',
                            selectedFolderId === folder.id
                              ? 'border-blue-200 bg-blue-50 shadow-sm ring-1 ring-blue-200 dark:border-blue-800 dark:bg-blue-950/20'
                              : 'hover:bg-muted/50 hover:border-muted-foreground/20 hover:shadow-sm',
                          )}
                        >
                          <div className="flex-shrink-0">
                            <Folder
                              className={cn(
                                'h-5 w-5 transition-colors',
                                selectedFolderId === folder.id ? 'text-blue-600' : 'text-blue-500',
                              )}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="truncate text-sm font-medium" title={folder.name}>
                                {folder.name}
                              </h4>
                              {folder.isShared && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-green-200 bg-green-50 px-2 py-0 text-xs text-green-700"
                                >
                                  <Users className="h-3 w-3" />
                                  Shared
                                </Badge>
                              )}
                            </div>
                            {folder.path && (
                              <p className="text-muted-foreground truncate text-xs" title={folder.path}>
                                {folder.path}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={e => {
                                e.stopPropagation()
                                navigateToFolder(folder)
                              }}
                              className="hover:bg-background h-7 px-2 text-xs"
                            >
                              <FolderOpen className="mr-1 h-3 w-3" />
                              Open
                            </Button>
                            <Button
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleFolderSelect(folder)
                              }}
                              className={cn(
                                'h-7 px-3 text-xs',
                                selectedFolderId === folder.id
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
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
                      ))}

                      {filteredFolders.length > 20 && (
                        <div className="border-t py-3 text-center">
                          <p className="text-muted-foreground text-xs">
                            Showing first 20 of {filteredFolders.length} folders
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">Use search to find specific folders</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <Label htmlFor="drive-url" className="font-medium">
                  Google Drive URL or Folder ID
                </Label>
              </div>

              <div className="space-y-3">
                <Input
                  id="drive-url"
                  placeholder="Paste Google Drive URL or folder ID here..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className={cn(
                    'h-12 text-sm transition-all duration-200',
                    parsedResult.isValid && 'border-green-500 focus:border-green-600 focus:ring-green-200',
                    urlInput && !parsedResult.isValid && 'border-red-500 focus:border-red-600 focus:ring-red-200',
                    !urlInput && 'bg-muted/30 border-muted',
                  )}
                />

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">Supported formats:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground h-1 w-1 rounded-full" />
                      Full URLs: https://drive.google.com/drive/folders/FOLDER_ID
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground h-1 w-1 rounded-full" />
                      Sharing links: https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground h-1 w-1 rounded-full" />
                      Direct folder IDs: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enhanced URL Parsing Result */}
            {urlInput && (
              <div className="space-y-4">
                {parsedResult.isValid ? (
                  <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-green-100 p-1 dark:bg-green-900/50">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                            Valid Format Detected
                          </h4>
                          <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                            The URL has been successfully parsed
                          </p>
                        </div>

                        <div className="rounded-md border border-green-200 bg-white/60 p-3 dark:border-green-700 dark:bg-green-900/20">
                          <div className="mb-1 flex items-center gap-2">
                            <Shield className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-800 dark:text-green-200">
                              Extracted Folder ID
                            </span>
                          </div>
                          <code className="font-mono text-xs break-all text-green-700 dark:text-green-300">
                            {parsedResult.folderId}
                          </code>
                        </div>

                        {!validationResult && (
                          <Button
                            size="sm"
                            onClick={() => validateFolderId(parsedResult.folderId!)}
                            disabled={isValidating}
                            className="w-full bg-green-600 text-white hover:bg-green-700"
                          >
                            {isValidating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating access...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Validate Folder Access
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 dark:border-red-800 dark:from-red-950/20 dark:to-rose-950/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/50">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Invalid URL Format</h4>
                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                          Please check the URL format and try again. Make sure it's a valid Google Drive folder URL or
                          ID.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Validation Result */}
                {validationResult && (
                  <div
                    className={cn(
                      'rounded-lg border p-4 transition-all duration-200',
                      validationResult.isValid
                        ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-sky-950/20'
                        : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:border-red-800 dark:from-red-950/20 dark:to-rose-950/20',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex-shrink-0 rounded-full p-1',
                          validationResult.isValid
                            ? 'bg-blue-100 dark:bg-blue-900/50'
                            : 'bg-red-100 dark:bg-red-900/50',
                        )}
                      >
                        {validationResult.isValid ? (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <h4
                            className={cn(
                              'text-sm font-medium',
                              validationResult.isValid
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-red-800 dark:text-red-200',
                            )}
                          >
                            {validationResult.isValid ? 'Folder Access Confirmed' : 'Access Validation Failed'}
                          </h4>
                          <p
                            className={cn(
                              'mt-1 text-xs',
                              validationResult.isValid
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-red-700 dark:text-red-300',
                            )}
                          >
                            {validationResult.isValid
                              ? `Successfully connected to: "${validationResult.folderName}"`
                              : validationResult.error}
                          </p>
                        </div>

                        {validationResult.isValid && (
                          <div className="rounded-md border border-blue-200 bg-white/60 p-3 dark:border-blue-700 dark:bg-blue-900/20">
                            <div className="mb-2 flex items-center gap-2">
                              <Folder className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {validationResult.folderName}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleUrlSelect}
                              className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Select This Folder
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
