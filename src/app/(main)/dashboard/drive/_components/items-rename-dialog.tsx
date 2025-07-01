'use client'

import React, { useState, useRef } from 'react'
import {
  Edit3,
  Hash,
  Calendar,
  AlignLeft,
  Code2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { RegexHelpDialog } from './regex-help-dialog'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface ItemsRenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
  }>
}

const RENAME_MODES = [
  {
    id: 'prefix',
    label: 'Add Prefix',
    description: 'Add text before the filename',
    icon: AlignLeft,
  },
  {
    id: 'suffix',
    label: 'Add Suffix',
    description: 'Add text after the filename (before extension)',
    icon: AlignLeft,
  },
  {
    id: 'numbering',
    label: 'Sequential Numbering',
    description: 'Add numbers in sequence (1, 2, 3...)',
    icon: Hash,
  },
  {
    id: 'timestamp',
    label: 'Add Timestamp',
    description: 'Add current date and time',
    icon: Calendar,
  },
  {
    id: 'replace',
    label: 'Find & Replace',
    description: 'Replace specific text in filenames',
    icon: Edit3,
  },
  {
    id: 'regex',
    label: 'Regular Expression',
    description: 'Advanced pattern matching with regex (click help for examples)',
    icon: Code2,
  },
]

function ItemsRenameDialog({ isOpen, onClose, onConfirm: _onConfirm, selectedItems }: ItemsRenameDialogProps) {
  const [selectedMode, setSelectedMode] = useState('prefix')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    currentFile?: string
    success: number
    skipped: number
    failed: number
    errors: Array<{ file: string; error: string }>
  }>({
    current: 0,
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  })

  // Use ref for immediate cancellation control
  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)

  // Rename parameters
  const [renameText, setRenameText] = useState('')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [regexPattern, setRegexPattern] = useState('')
  const [regexReplace, setRegexReplace] = useState('')
  const [numberingStart, setNumberingStart] = useState(1)
  const [numberingPadding, setNumberingPadding] = useState(2)

  // Preview states
  const [previews, setPreviews] = useState<Array<{ original: string; preview: string; valid: boolean }>>([])
  const [showRegexHelp, setShowRegexHelp] = useState(false)

  const isMobile = useIsMobile()

  const handleCancel = () => {
    // Immediately set cancellation flags
    isCancelledRef.current = true
    setIsCancelled(true)

    // Abort any ongoing network requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Stop processing immediately
    setIsProcessing(false)

    toast.info('Rename operation cancelled by user')
  }

  const generatePreview = () => {
    const newPreviews = selectedItems.map((item, index) => {
      let newName = item.name
      let valid = true

      try {
        switch (selectedMode) {
          case 'prefix':
            if ((renameText as string).trim()) {
              newName = `${(renameText as string).trim()}${item.name}`
            }
            break

          case 'suffix':
            if ((renameText as string).trim()) {
              const lastDotIndex = item.name.lastIndexOf('.')
              if (lastDotIndex > 0) {
                const nameWithoutExt = item.name.substring(0, lastDotIndex)
                const extension = item.name.substring(lastDotIndex)
                newName = `${nameWithoutExt}${(renameText as string).trim()}${extension}`
              } else {
                newName = `${item.name}${(renameText as string).trim()}`
              }
            }
            break

          case 'numbering':
            const number = (numberingStart + index).toString().padStart(numberingPadding, '0')
            const lastDotIndex2 = item.name.lastIndexOf('.')
            if (lastDotIndex2 > 0) {
              const nameWithoutExt = item.name.substring(0, lastDotIndex2)
              const extension = item.name.substring(lastDotIndex2)
              newName = `${nameWithoutExt}_${number}${extension}`
            } else {
              newName = `${item.name}_${number}`
            }
            break

          case 'timestamp':
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
            const lastDotIndex3 = item.name.lastIndexOf('.')
            if (lastDotIndex3 > 0) {
              const nameWithoutExt = item.name.substring(0, lastDotIndex3)
              const extension = item.name.substring(lastDotIndex3)
              newName = `${nameWithoutExt}_${timestamp}${extension}`
            } else {
              newName = `${item.name}_${timestamp}`
            }
            break

          case 'replace':
            if ((findText as string).trim()) {
              newName = item.name.replace(new RegExp((findText as string).trim(), 'g'), replaceText)
            }
            break

          case 'regex':
            if ((regexPattern as string).trim()) {
              const regex = new RegExp((regexPattern as string).trim(), 'g')
              newName = item.name.replace(regex, regexReplace)
            }
            break
        }

        // Validate filename
        if (!(newName as string).trim() || newName === item.name) {
          valid = false
        }
      } catch (err) {
        valid = false
        newName = item.name
      }

      return {
        original: item.name,
        preview: newName,
        valid,
      }
    })

    setPreviews(newPreviews)
  }

  // Generate preview whenever parameters change
  React.useEffect(() => {
    generatePreview()
  }, [
    selectedMode,
    renameText,
    findText,
    replaceText,
    regexPattern,
    regexReplace,
    numberingStart,
    numberingPadding,
    selectedItems,
  ])

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for renaming')
      return
    }

    const validPreviews = previews.filter(p => p.valid)
    if (validPreviews.length === 0) {
      toast.error('No valid rename patterns found')
      return
    }

    // Reset cancellation flags
    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setIsCompleted(false)

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setProgress({
      current: 0,
      total: selectedItems.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })

    try {
      let successCount = 0
      let failedCount = 0
      let skippedCount = 0
      const errors: Array<{ file: string; error: string }> = []

      for (let i = 0; i < selectedItems.length; i++) {
        if (isCancelledRef.current) break

        const item = selectedItems[i]
        const preview = previews[i]
        if (!item) continue

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.name,
        }))

        if (!preview?.valid || preview.preview === item.name) {
          skippedCount++
          setProgress(prev => ({
            ...prev,
            skipped: skippedCount,
          }))
          continue
        }

        try {
          const response = await fetch('/api/drive/files/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [
                {
                  id: item.id,
                  name: item.name,
                },
              ],
              newName: preview.preview,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.error || errorData.message || `Server error ${response.status}: ${response.statusText}`,
            )
          }

          const result = await response.json()

          if (result.success) {
            successCount++
          } else {
            failedCount++
            // Extract detailed error from API response
            let errorMessage = 'Unknown error'
            if (result.errors && result.errors.length > 0) {
              errorMessage = result.errors[0].error || result.errors[0].message || 'Operation failed'
            } else if (result.error) {
              errorMessage = result.error
            } else if (result.message) {
              errorMessage = result.message
            }

            errors.push({
              file: item.name,
              error: errorMessage,
            })
          }
        } catch (err: any) {
          if (abortControllerRef.current?.signal.aborted) {
            break
          }
          failedCount++

          // Provide more detailed error messages
          let errorMessage = 'Network error'
          if (err.name === 'AbortError') {
            errorMessage = 'Operation was cancelled'
          } else if (err.message) {
            if (err.message.includes('HTTP 401')) {
              errorMessage = 'Authentication failed - please re-login to Google Drive'
            } else if (err.message.includes('HTTP 403')) {
              errorMessage = 'Permission denied - insufficient Drive access'
            } else if (err.message.includes('HTTP 404')) {
              errorMessage = 'File not found - may have been deleted or moved'
            } else if (err.message.includes('HTTP 429')) {
              errorMessage = 'Too many requests - please wait and try again'
            } else if (err.message.includes('HTTP 500')) {
              errorMessage = 'Google Drive server error - please try again later'
            } else if (err.message.includes('Failed to fetch')) {
              errorMessage = 'Network connection failed - check your internet'
            } else {
              errorMessage = err.message
            }
          }

          errors.push({
            file: item.name,
            error: errorMessage,
          })
        }

        setProgress(prev => ({
          ...prev,
          success: successCount,
          failed: failedCount,
          errors,
        }))
      }

      if (!isCancelledRef.current) {
        if (successCount > 0) {
          const messages = [`${successCount} files renamed successfully`]
          if (failedCount > 0) messages.push(`${failedCount} failed`)
          if (skippedCount > 0) messages.push(`${skippedCount} skipped`)
          toast.success(messages.join(', '))
        } else if (failedCount > 0) {
          toast.error(`All rename operations failed`)
        } else {
          toast.info('No files were renamed')
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        // Operation was cancelled, don't show error
        return
      }
      // // // // // console.error(err)
      toast.error('Rename operation failed')
    } finally {
      // Clean up only if not cancelled
      if (!isCancelledRef.current) {
        setIsCompleted(true)
      }
      abortControllerRef.current = null
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    // If processing, force cancel first
    if (isProcessing) {
      handleCancel()
      return
    }

    // Reset all states when closing
    setIsCompleted(false)
    setIsCancelled(false)
    isCancelledRef.current = false
    abortControllerRef.current = null
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
    setRenameText('')
    setFindText('')
    setReplaceText('')
    setRegexPattern('')
    setRegexReplace('')
    setNumberingStart(1)
    setNumberingPadding(2)
    setPreviews([])
    onClose()
  }

  const handleCloseAndRefresh = () => {
    if (!isProcessing) {
      // Refresh immediately to show results
      window.location.reload()
    }
  }

  // Render different content based on state
  const renderContent = () => {
    // 1. Initial State - Show selection and mode options
    if (!isProcessing && !isCompleted) {
      return (
        <div className="space-y-6">
          {/* File Summary */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected Items:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {selectedItems.length} items
                </Badge>
              </div>
            </div>
          </div>

          {/* Rename Mode Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Rename Mode</Label>
            <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="space-y-3">
              {RENAME_MODES.map(mode => {
                const IconComponent = mode.icon
                return (
                  <div
                    key={mode.id}
                    className={cn(
                      'flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors',
                      selectedMode === mode.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                    )}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    <RadioGroupItem value={mode.id} className="mt-1" />
                    <div className="flex flex-1 items-start gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <IconComponent className="text-primary h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-muted-foreground text-sm">{mode.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Rename Parameters */}
          <div className="space-y-4">
            {selectedMode === 'prefix' && (
              <div className="space-y-2">
                <Label htmlFor="prefix-text">Prefix Text</Label>
                <Input
                  id="prefix-text"
                  placeholder="Enter prefix text..."
                  value={renameText}
                  onChange={e => setRenameText(e.target.value)}
                />
              </div>
            )}

            {selectedMode === 'suffix' && (
              <div className="space-y-2">
                <Label htmlFor="suffix-text">Suffix Text</Label>
                <Input
                  id="suffix-text"
                  placeholder="Enter suffix text..."
                  value={renameText}
                  onChange={e => setRenameText(e.target.value)}
                />
              </div>
            )}

            {selectedMode === 'numbering' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number-start">Start Number</Label>
                  <Input
                    id="number-start"
                    type="number"
                    min="1"
                    value={numberingStart}
                    onChange={e => setNumberingStart(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number-padding">Zero Padding</Label>
                  <Input
                    id="number-padding"
                    type="number"
                    min="1"
                    max="10"
                    value={numberingPadding}
                    onChange={e => setNumberingPadding(parseInt(e.target.value) || 2)}
                  />
                </div>
              </div>
            )}

            {selectedMode === 'replace' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="find-text">Find Text</Label>
                  <Input
                    id="find-text"
                    placeholder="Text to find..."
                    value={findText}
                    onChange={e => setFindText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replace-text">Replace With</Label>
                  <Input
                    id="replace-text"
                    placeholder="Replacement text..."
                    value={replaceText}
                    onChange={e => setReplaceText(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedMode === 'regex' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Regular Expression</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRegexHelp(true)}
                    className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" />
                    Help & Examples
                  </Button>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <div className="font-medium">Advanced Feature</div>
                      <div className="text-amber-700 dark:text-amber-300">
                        Use regular expressions for complex pattern matching. Click &quot;Help &amp; Examples&quot; for
                        guidance.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regex-pattern">Pattern to Find</Label>
                  <Input
                    id="regex-pattern"
                    placeholder="e.g., \\d+ (finds numbers) or [a-z]+ (finds lowercase letters)"
                    value={regexPattern}
                    onChange={e => setRegexPattern(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regex-replace">Replacement Text</Label>
                  <Input
                    id="regex-replace"
                    placeholder="e.g., $1 (use captured group) or NEW_ (literal text)"
                    value={regexReplace}
                    onChange={e => setRegexReplace(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="bg-muted/30 max-h-32 space-y-1 overflow-y-auto rounded-lg border p-3">
                {previews.slice(0, 5).map((preview, index) => (
                  <div
                    key={`preview-${preview.original}-${index}`}
                    className={cn('text-sm', preview.valid ? 'text-foreground' : 'text-muted-foreground line-through')}
                  >
                    <span className="text-muted-foreground">{preview.original}</span>
                    <span className="mx-2">→</span>
                    <span className={preview.valid ? 'font-medium text-green-600' : 'text-red-500'}>
                      {preview.preview}
                    </span>
                  </div>
                ))}
                {previews.length > 5 && (
                  <div className="text-muted-foreground text-xs">... and {previews.length - 5} more items</div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 2. Processing State - Show progress
    if (isProcessing) {
      return (
        <div className="space-y-6">
          {/* Processing Header */}
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">Renaming Files...</div>
            <div className="text-muted-foreground text-sm">Please wait while we process your rename operation</div>
          </div>

          {/* Progress Display */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>
                  {progress.current} of {progress.total} items
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            </div>

            {/* Current File */}
            {progress.currentFile && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Currently renaming:</span>
                </div>
                <div className="truncate text-sm text-blue-700 dark:text-blue-300">{progress.currentFile}</div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-semibold text-green-600">{progress.success}</div>
                <div className="text-muted-foreground text-xs">Success</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-orange-600">{progress.skipped}</div>
                <div className="text-muted-foreground text-xs">Skipped</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-red-600">{progress.failed}</div>
                <div className="text-muted-foreground text-xs">Failed</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Completed State - Show results
    if (isCompleted) {
      const hasErrors = progress.errors.length > 0
      const wasSuccessful = progress.success > 0
      const wasCancelled = isCancelled

      return (
        <div className="space-y-6">
          {/* Completion Header */}
          <div className="text-center">
            {wasCancelled ? (
              <div className="space-y-2">
                <XCircle className="mx-auto h-12 w-12 text-orange-500" />
                <div className="text-lg font-semibold text-orange-600">Operation Cancelled</div>
                <div className="text-muted-foreground text-sm">Rename operation was cancelled by user</div>
              </div>
            ) : wasSuccessful ? (
              <div className="space-y-2">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <div className="text-lg font-semibold text-green-600">Rename Completed!</div>
                <div className="text-muted-foreground text-sm">Your files have been successfully renamed</div>
              </div>
            ) : (
              <div className="space-y-2">
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <div className="text-lg font-semibold text-red-600">Rename Failed</div>
                <div className="text-muted-foreground text-sm">No files could be renamed</div>
              </div>
            )}
          </div>

          {/* Final Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">{progress.success}</div>
              <div className="text-muted-foreground text-xs">Renamed</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">{progress.current}</div>
              <div className="text-muted-foreground text-xs">Processed</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-red-600">{progress.failed}</div>
              <div className="text-muted-foreground text-xs">Failed</div>
            </div>
          </div>

          {/* Error Details */}
          {hasErrors && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-red-600">Issues found during rename:</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
                {progress.errors.map((error, index) => (
                  <div key={`error-${error.file}-${index}`} className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      <div className="space-y-1">
                        <div className="font-medium text-red-800 dark:text-red-200">{error.file}</div>
                        <div className="text-red-700 dark:text-red-300">{error.error}</div>
                        {/* Provide helpful suggestions based on error type */}
                        {error.error.includes('Authentication') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Try refreshing the page and logging in again
                          </div>
                        )}
                        {error.error.includes('Permission denied') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Check if you own this file or have edit access
                          </div>
                        )}
                        {error.error.includes('already exists') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Try a different filename or add a number suffix
                          </div>
                        )}
                        {error.error.includes('invalid characters') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Remove special characters like {'< > : " / \\ | ? *'}
                          </div>
                        )}
                        {error.error.includes('too long') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Use a shorter filename (max 255 characters)
                          </div>
                        )}
                        {error.error.includes('Too many requests') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Wait a few seconds and try again
                          </div>
                        )}
                        {error.error.includes('File not found') && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            → Refresh the file list - file may have been moved or deleted
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Notice */}
          {(progress.success > 0 || progress.failed > 0) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Click the button below to refresh and see your updated files.
              </p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Rename Items</BottomSheetTitle>
          </BottomSheetHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
          <BottomSheetFooter>
            <div className="flex gap-2">
              {!isProcessing && !isCompleted && (
                <>
                  <Button onClick={handleConfirm} className="flex-1">
                    Rename
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                </>
              )}
              {isProcessing && (
                <Button onClick={handleCancel} variant="outline" disabled={isCancelled} className="flex-1">
                  {isCancelled ? 'Cancelling...' : 'Cancel Operation'}
                </Button>
              )}
              {isCompleted && (
                <>
                  {progress.success > 0 || progress.failed > 0 ? (
                    <Button onClick={handleCloseAndRefresh} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Refresh Now
                    </Button>
                  ) : (
                    <Button onClick={handleClose} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  )}
                  {(progress.success > 0 || progress.failed > 0) && (
                    <Button onClick={handleClose} variant="outline" className="flex-1">
                      Close Without Refresh
                    </Button>
                  )}
                </>
              )}
            </div>
          </BottomSheetFooter>
        </BottomSheetContent>

        <RegexHelpDialog isOpen={showRegexHelp} onClose={() => setShowRegexHelp(false)} />
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rename Items</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">{renderContent()}</div>
        <DialogFooter>
          <div className="flex w-full gap-2">
            {isProcessing ? (
              <Button variant="outline" onClick={handleCancel} disabled={isCancelled} className="flex-1">
                {isCancelled ? 'Cancelling...' : 'Cancel Operation'}
              </Button>
            ) : (
              <>
                {!isCompleted && !isCancelled && (
                  <>
                    <Button onClick={handleConfirm} className="flex-1">
                      Rename
                    </Button>
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <>
                    {progress.success > 0 || progress.failed > 0 ? (
                      <Button onClick={handleCloseAndRefresh} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Refresh Now
                      </Button>
                    ) : (
                      <Button onClick={handleClose} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    )}
                    {(progress.success > 0 || progress.failed > 0) && (
                      <Button onClick={handleClose} variant="outline" className="flex-1">
                        Close Without Refresh
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <RegexHelpDialog isOpen={showRegexHelp} onClose={() => setShowRegexHelp(false)} />
    </Dialog>
  )
}

export { ItemsRenameDialog }
export default ItemsRenameDialog
