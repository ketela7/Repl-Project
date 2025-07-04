'use client'

import { useState, useEffect, useRef } from 'react'
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
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
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

  // Load folders for browsing
  const loadFolders = async (parentId: string = 'root') => {
    setIsLoadingFolders(true)
    try {
      const response = await fetch(`/api/drive/folders?parentId=${parentId}`)
      const data = await response.json()

      if (data.success) {
        setFolders(data.folders || [])
      }
    } catch {
      // console.error('Failed to load folders:', error)
    } finally {
      setIsLoadingFolders(false)
    }
  }

  // Validate parsed folder ID dengan abort controller untuk prevent race condition
  const validateFolderId = async (folderId: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setIsValidating(true)
    setValidationResult(null)
    
    try {
      const response = await fetch('/api/drive/folders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) return

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
    } catch (error: unknown) {
      // Check if abort error (bukan real error)
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
    <div className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}>
      <Card className="from-background to-muted/20 mx-auto h-full w-full flex-1 border-0 bg-gradient-to-br shadow-sm overflow-hidden">
        <CardContent className="flex h-full flex-col overflow-hidden p-3">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'browse' | 'url')}
            className="flex h-full flex-1 min-h-0 flex-col overflow-hidden"
          >
            <TabsList className="bg-muted/50 mb-3 grid h-9 w-full flex-shrink-0 grid-cols-2 p-1">
              <TabsTrigger
                value="browse"
                className="flex h-7 items-center gap-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Folder className="h-3 w-3" />
                Browse
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="flex h-7 items-center gap-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Link className="h-3 w-3" />
                URL/ID
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent
              value="browse"
              className="mt-0 flex flex-1 min-h-0 flex-col space-y-2 overflow-hidden"
            >
              {/* Breadcrumb */}
              <Card className="border-muted/50 bg-muted/20 flex-shrink-0">
                <CardContent className="p-2">
                  <div className="flex items-center gap-1 overflow-hidden text-xs">
                    <Home className="h-3 w-3 flex-shrink-0 text-blue-500" />
                    <div className="scrollbar-hide flex min-w-0 items-center gap-0.5 overflow-x-auto">
                      {currentPath.map((folder, idx) => (
                        <div key={folder.id} className="flex flex-shrink-0 items-center gap-0.5">
                          {idx > 0 && <ChevronRight className="text-muted-foreground h-2 w-2" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateBack(idx)}
                            className={cn(
                              'h-5 max-w-24 flex-shrink-0 px-1.5 text-xs transition-colors',
                              idx === currentPath.length - 1
                                ? 'bg-background text-foreground font-medium shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            <span className="truncate" title={folder.name}>
                              {folder.name}
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Folder List */}
              <Card className="border-muted/50 min-h-0 flex-1 overflow-hidden">
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="flex-1 overflow-auto">
                    <div className="space-y-1 p-3">
                      {isLoadingFolders ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="space-y-3 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-xs font-medium">Loading folders...</p>
                            <p className="text-xs text-muted-foreground">Please wait while we fetch your folders</p>
                          </div>
                        </div>
                      ) : filteredFolders.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="space-y-3 text-center">
                            <div className="bg-muted/50 rounded-full p-3 mx-auto">
                              <Folder className="text-muted-foreground h-5 w-5" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {searchQuery ? 'No folders found' : 'No folders available'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {searchQuery ? 'Try adjusting your search terms' : 'This location is empty'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredFolders.slice(0, 15).map((folder) => (
                            <div
                              key={folder.id}
                              className={cn(
                                'group relative flex items-center gap-2 overflow-hidden rounded-lg border p-2 transition-shadow duration-200 hover:shadow-md',
                                selectedFolderId === folder.id
                                  ? 'border-blue-200 bg-blue-50 shadow ring-1 ring-blue-200/50 dark:border-blue-800 dark:bg-blue-950/30'
                                  : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30'
                              )}
                            >
                              <div className="ml-2 flex w-[75px] items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFolderSelect(folder);
                                  }}
                                  className={cn(
                                    'h-6 w-6 p-0 text-xs transition-colors',
                                    selectedFolderId === folder.id
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                  )}
                                >
                                  {selectedFolderId === folder.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToFolder(folder);
                                  }}
                                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  title="Open folder"
                                >
                                  <FolderOpen className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="max-w-[calc(100%-95px)] min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center gap-1">
                                  <h4 className="truncate text-xs font-medium" title={folder.name}>
                                    {folder.name}
                                  </h4>
                                  {folder.isShared && (
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1 border-green-200 bg-green-50 px-1 py-0 text-xs text-green-700"
                                    >
                                      <Users className="h-2 w-2" />S
                                    </Badge>
                                  )}
                                </div>
                                {folder.path && (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground opacity-70" title={folder.path}>
                                    {folder.path}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          {filteredFolders.length > 15 && (
                            <div className="border-t py-3 text-center text-xs text-muted-foreground">
                              Showing first 15 of {filteredFolders.length} folders. Use search to find more.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL/ID Tab */}
            <TabsContent value="url" className="mt-0 flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                    <Label htmlFor="drive-url" className="text-xs font-medium">
                      Google Drive URL or Folder ID
                    </Label>
                  </div>
                  <Input
                    id="drive-url"
                    placeholder="Paste Google Drive URL or folder ID here..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className={cn(
                      'h-9 text-xs transition-colors',
                      parsedResult.isValid && 'border-green-500 focus:border-green-600',
                      urlInput && !parsedResult.isValid && 'border-red-500 focus:border-red-600',
                      !urlInput && 'border-muted-foreground/20'
                    )}
                  />
                </div>

                <Card className="border-muted/50 bg-muted/20">
                  <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">Supported formats:</p>
                    {[
                      'Full URLs: drive.google.com/drive/folders/FOLDER_ID',
                      'Sharing links: drive.google.com/folders/FOLDER_ID?usp=sharing',
                      'Direct IDs: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                    ].map((ex, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-0.5 w-0.5 rounded-full bg-muted-foreground flex-shrink-0" />
                        <span className="break-all">{ex}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {urlInput && (
                  <div className="space-y-3">
                    {parsedResult.isValid ? (
                      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                        <CardContent className="space-y-2 p-3">
                          <div className="flex items-start gap-2">
                            <div className="rounded-full bg-green-100 p-0.5 dark:bg-green-900/50">
                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-green-800 dark:text-green-200">Valid Format Detected</h4>
                              <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
                                The URL has been successfully parsed
                              </p>
                            </div>
                          </div>

                          <Card className="border-green-200 bg-white/60 dark:border-green-700 dark:bg-green-900/20">
                            <CardContent className="p-2">
                              <div className="flex items-center gap-1 mb-1">
                                <Shield className="h-2.5 w-2.5 text-green-600" />
                                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                  Extracted Folder ID
                                </span>
                              </div>
                              <code className="block break-all font-mono text-xs text-green-700 dark:text-green-300">
                                {parsedResult.folderId}
                              </code>
                            </CardContent>
                          </Card>

                          {!validationResult ? (
                            <Button
                              size="sm"
                              disabled={isValidating}
                              onClick={() => validateFolderId(parsedResult.folderId!)}
                              className="flex h-8 w-full items-center justify-center bg-green-600 text-white hover:bg-green-700"
                            >
                              {isValidating ? (
                                <>
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                  Validating access...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Validate Folder Access
                                </>
                              )}
                            </Button>
                          ) : validationResult.isValid ? (
                            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                              <CardContent className="space-y-2 p-3">
                                <div className="flex items-start gap-2">
                                  <div className="rounded-full bg-blue-100 p-0.5 dark:bg-blue-900/50">
                                    <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                      Folder Access Confirmed
                                    </h4>
                                    <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
                                      Successfully connected to: "{validationResult.folderName}"
                                    </p>
                                  </div>
                                </div>

                                <Card className="border-blue-200 bg-white/60 dark:border-blue-700 dark:bg-blue-900/20">
                                  <CardContent className="p-2">
                                    <div className="flex items-center gap-1 mb-2 overflow-hidden">
                                      <Folder className="h-3 w-3 text-blue-600" />
                                      <span className="truncate text-xs font-medium text-blue-800 dark:text-blue-200">
                                        {validationResult.folderName}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={handleUrlSelect}
                                      className="h-8 w-full bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Select This Folder
                                    </Button>
                                  </CardContent>
                                </Card>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                              <CardContent className="space-y-2 p-3">
                                <div className="flex items-start gap-2">
                                  <div className="rounded-full bg-red-100 p-0.5 dark:bg-red-900/50">
                                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-red-800 dark:text-red-200">
                                      Access Validation Failed
                                    </h4>
                                    <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                                      {validationResult.error}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Card>
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
