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
      // console.error('Failed to load folders:', error)
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
    <div className={cn('w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {/* Header Section */}
      <div className="space-y-4 mb-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Select Destination Folder</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Choose where you want to save your files in Google Drive
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'browse' | 'url')}>
            {/* Enhanced Tab List */}
            <TabsList className="bg-muted/50 mb-8 grid h-12 w-full grid-cols-2 p-1">
              <TabsTrigger
                value="browse"
                className="flex h-10 items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Folder className="h-4 w-4" />
                Browse Folders
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="flex h-10 items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Link className="h-4 w-4" />
                Paste URL/ID
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab Content */}
            <TabsContent value="browse" className="mt-0 space-y-6">
              {/* Breadcrumb Navigation */}
              <Card className="border-muted/50 bg-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {currentPath.map((folder, index) => (
                        <div key={folder.id} className="flex flex-shrink-0 items-center gap-1">
                          {index > 0 && <ChevronRight className="text-muted-foreground h-3 w-3" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateBack(index)}
                            className={cn(
                              'h-7 px-3 text-sm transition-colors',
                              index === currentPath.length - 1
                                ? 'bg-background text-foreground font-medium shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            )}
                          >
                            <span className="max-w-32 truncate">{folder.name}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search Section */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    placeholder="Search folders by name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-background border-muted-foreground/20 h-11 pl-10 focus:border-blue-500 focus:ring-blue-200"
                  />
                </div>
                {searchQuery && (
                  <div className="text-muted-foreground px-1 text-xs">
                    {filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''} found
                  </div>
                )}
              </div>

              {/* Folder List */}
              <Card className="border-muted/50">
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 p-4">
                      {isLoadingFolders ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-medium">Loading folders...</p>
                            <p className="text-muted-foreground text-xs">Please wait while we fetch your folders</p>
                          </div>
                        </div>
                      ) : filteredFolders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16">
                          <div className="bg-muted/50 rounded-full p-4">
                            <Folder className="text-muted-foreground h-8 w-8" />
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="text-muted-foreground text-sm font-medium">
                              {searchQuery ? 'No folders found' : 'No folders available'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {searchQuery ? 'Try adjusting your search terms' : 'This location is empty'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredFolders.slice(0, 50).map(folder => (
                            <div
                              key={folder.id}
                              className={cn(
                                'group relative flex items-center gap-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
                                selectedFolderId === folder.id
                                  ? 'border-blue-200 bg-blue-50 shadow-sm ring-2 ring-blue-200/50 dark:border-blue-800 dark:bg-blue-950/30'
                                  : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30',
                              )}
                            >
                              {/* Folder Icon */}
                              <div className="flex-shrink-0">
                                <Folder
                                  className={cn(
                                    'h-6 w-6 transition-colors',
                                    selectedFolderId === folder.id ? 'text-blue-600' : 'text-blue-500',
                                  )}
                                />
                              </div>

                              {/* Folder Info */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="truncate text-sm font-medium" title={folder.name}>
                                    {folder.name}
                                  </h4>
                                  {folder.isShared && (
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1 border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700"
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

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation()
                                    navigateToFolder(folder)
                                  }}
                                  className="h-8 px-3 text-xs opacity-70 transition-opacity group-hover:opacity-100"
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
                                    'h-8 px-4 text-xs transition-all',
                                    selectedFolderId === folder.id
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-primary hover:bg-primary/90 text-primary-foreground',
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

                          {filteredFolders.length > 50 && (
                            <div className="border-muted border-t py-4 text-center">
                              <p className="text-muted-foreground text-xs">
                                Showing first 50 of {filteredFolders.length} folders
                              </p>
                              <p className="text-muted-foreground mt-1 text-xs">Use search to find specific folders</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL Tab Content */}
            <TabsContent value="url" className="mt-0 space-y-6">
              <div className="space-y-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="drive-url" className="text-sm font-medium">
                      Google Drive URL or Folder ID
                    </Label>
                  </div>

                  <Input
                    id="drive-url"
                    placeholder="Paste Google Drive URL or folder ID here..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className={cn(
                      'h-12 text-sm transition-all duration-200',
                      parsedResult.isValid && 'border-green-500 focus:border-green-600',
                      urlInput && !parsedResult.isValid && 'border-red-500 focus:border-red-600',
                      !urlInput && 'border-muted-foreground/20',
                    )}
                  />

                  {/* Format Examples */}
                  <Card className="border-muted/50 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-muted-foreground mb-3 text-xs font-medium">Supported formats:</p>
                      <div className="space-y-2">
                        {[
                          'Full URLs: https://drive.google.com/drive/folders/FOLDER_ID',
                          'Sharing links: https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing',
                          'Direct folder IDs: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                        ].map((example, index) => (
                          <div key={index} className="text-muted-foreground flex items-start gap-2 text-xs">
                            <div className="bg-muted-foreground mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                            <span className="leading-relaxed">{example}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* URL Parsing Results */}
                {urlInput && (
                  <div className="space-y-4">
                    {parsedResult.isValid ? (
                      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                        <CardContent className="p-4">
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

                              <Card className="border-green-200 bg-white/60 dark:border-green-700 dark:bg-green-900/20">
                                <CardContent className="p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                      Extracted Folder ID
                                    </span>
                                  </div>
                                  <code className="block font-mono text-xs break-all text-green-700 dark:text-green-300">
                                    {parsedResult.folderId}
                                  </code>
                                </CardContent>
                              </Card>

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
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/50">
                              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Invalid URL Format</h4>
                              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                Please check the URL format and try again. Make sure it&apos;s a valid Google Drive
                                folder URL or ID.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Validation Results */}
                    {validationResult && (
                      <Card
                        className={cn(
                          'border transition-all duration-200',
                          validationResult.isValid
                            ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
                            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
                        )}
                      >
                        <CardContent className="p-4">
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
                                <Card className="border-blue-200 bg-white/60 dark:border-blue-700 dark:bg-blue-900/20">
                                  <CardContent className="p-3">
                                    <div className="mb-3 flex items-center gap-2">
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
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        </CardContent>
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