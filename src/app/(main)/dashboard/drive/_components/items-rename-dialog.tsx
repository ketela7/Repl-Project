'use client'

import { useState, useRef } from 'react'
import {
  Edit3,
  Hash,
  AlignLeft,
  Code2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Eye,
  SkipForward,
  FileText,
  Folder,
  Info,
  Settings,
} from 'lucide-react'
// import { toast } from 'sonner' // Removed toast notifications

import { RegexHelpDialog } from './regex-help-dialog'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsRenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    canRename: boolean
  }>
}

type RenameMode = 'simple' | 'pattern' | 'sequence' | 'regex'

type RenameStep = 'setup' | 'preview' | 'processing' | 'completed'

interface RenameResult {
  fileId: string
  originalName: string
  newName: string
  success: boolean
  error?: string
}

function ItemsRenameDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsRenameDialogProps) {
  const [currentStep, setCurrentStep] = useState<RenameStep>('setup')
  const [renameMode, setRenameMode] = useState<RenameMode>('simple')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [showRegexHelp, setShowRegexHelp] = useState(false)
  const [isItemsExpanded, setIsItemsExpanded] = useState(false)

  // Simple rename options
  const [newName, setNewName] = useState('')

  // Pattern rename options
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  // Sequence rename options
  const [baseName, setBaseName] = useState('')
  const [startNumber, setStartNumber] = useState('1')
  const [numberFormat, setNumberFormat] = useState('001')

  // Regex rename options
  const [regexPattern, setRegexPattern] = useState('')
  const [regexReplacement, setRegexReplacement] = useState('')

  const [previewResults, setPreviewResults] = useState<
    Array<{
      original: string
      preview: string
      hasChanges: boolean
    }>
  >([])

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

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const canRenameItems = selectedItems.filter(item => item.canRename)
  const fileCount = canRenameItems.filter(item => !item.isFolder).length
  const folderCount = canRenameItems.filter(item => item.isFolder).length
  const totalItems = canRenameItems.length

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    }

    // If we're in completed step and had successful operations, refresh data
    if (currentStep === 'completed' && progress.success > 0) {
      onConfirm?.()
    }

    resetState()
    onClose()
  }

  const resetState = () => {
    setCurrentStep('setup')
    setRenameMode('simple')
    setNewName('')
    setPrefix('')
    setSuffix('')
    setFindText('')
    setReplaceText('')
    setBaseName('')
    setStartNumber('1')
    setNumberFormat('001')
    setRegexPattern('')
    setRegexReplacement('')
    setPreviewResults([])
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
  }

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setCurrentStep('completed')
    // Removed toast notification
  }

  const generatePreview = () => {
    const results = selectedItems.map((item, index) => {
      let newFileName = item.name

      try {
        switch (renameMode) {
          case 'simple':
            if (selectedItems.length === 1) {
              newFileName = newName.trim() || item.name
            } else {
              // For multiple items, add numbers
              const extension = item.name.includes('.') ? item.name.split('.').pop() : ''
              const baseName = newName.trim() || 'renamed'
              newFileName = extension
                ? `${baseName}_${index + 1}.${extension}`
                : `${baseName}_${index + 1}`
            }
            break

          case 'pattern':
            newFileName = item.name
            if (findText) {
              newFileName = newFileName.replace(new RegExp(findText, 'g'), replaceText)
            }
            if (prefix) {
              newFileName = prefix + newFileName
            }
            if (suffix) {
              const lastDotIndex = newFileName.lastIndexOf('.')
              if (lastDotIndex !== -1) {
                newFileName =
                  newFileName.slice(0, lastDotIndex) + suffix + newFileName.slice(lastDotIndex)
              } else {
                newFileName = newFileName + suffix
              }
            }
            break

          case 'sequence':
            const num = parseInt(startNumber) + index
            const formattedNum = num.toString().padStart(numberFormat.length, '0')
            const extension = item.name.includes('.') ? item.name.split('.').pop() : ''
            newFileName = extension
              ? `${baseName}_${formattedNum}.${extension}`
              : `${baseName}_${formattedNum}`
            break

          case 'regex':
            if (regexPattern) {
              const regex = new RegExp(regexPattern, 'g')
              newFileName = item.name.replace(regex, regexReplacement)
            }
            break
        }
      } catch (error) {
        // Keep original name if there's an error
        newFileName = item.name
      }

      return {
        original: item.name,
        preview: newFileName,
        hasChanges: newFileName !== item.name,
      }
    })

    setPreviewResults(results)
    setCurrentStep('preview')
  }

  const handleRename = async () => {
    if (previewResults.length === 0) {
      // Removed toast notification
      return
    }

    const itemsToRename = previewResults.filter(result => result.hasChanges)
    if (itemsToRename.length === 0) {
      // Removed toast notification
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setCurrentStep('processing')

    abortControllerRef.current = new AbortController()

    const totalItems = itemsToRename.length
    const initialSkippedCount = selectedItems.length - canRenameItems.length
    setProgress({
      current: 0,
      total: totalItems,
      success: 0,
      skipped: initialSkippedCount,
      failed: 0,
      errors: [],
    })

    let successCount = 0
    let failedCount = 0
    let dynamicSkippedCount = 0
    const errors: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < itemsToRename.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const previewItem = itemsToRename[i]
        const selectedItem = selectedItems.find(item => item.name === previewItem.original)

        if (!selectedItem) {
          dynamicSkippedCount++
          continue
        }

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: previewItem.original,
        }))

        try {
          const response = await fetch('/api/drive/files/rename', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: selectedItem.id,
              newName: previewItem.preview,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Rename failed')
          }

          successCount++
          setProgress(prev => ({
            ...prev,
            success: successCount,
          }))
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: previewItem.original, error: errorMessage })
          failedCount++
          setProgress(prev => ({
            ...prev,
            failed: failedCount,
            errors: [...errors],
          }))
        }

        // Small delay for better visual feedback and API throttling
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Rename operation failed:', error)
    } finally {
      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        skipped: initialSkippedCount + dynamicSkippedCount,
        errors,
      }))

      setIsProcessing(false)
      setCurrentStep('completed')

      if (isCancelledRef.current) {
        // Removed toast notification
      } else if (successCount > 0) {
        // Removed toast notification`)
      } else {
        // Removed toast notification
      }
    }
  }

  const renderStepIndicator = () => {
    // Simple "Status: Indicator" format
    const getStatusDisplay = () => {
      switch (currentStep) {
        case 'setup':
          return {
            status: 'Setup',
            icon: Settings,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          }
        case 'preview':
          return {
            status: 'Preview',
            icon: Eye,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          }
        case 'processing':
          return {
            status: 'Processing',
            icon: Loader2,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          }
        case 'completed':
          return {
            status: 'Completed',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
          }
        default:
          return {
            status: 'Setup',
            icon: Settings,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          }
      }
    }

    const { status, icon: Icon, color, bgColor } = getStatusDisplay()

    return (
      <div className={cn('mb-4 rounded-lg border p-3', bgColor)}>
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              color,
              currentStep === 'processing' && 'animate-spin',
            )}
          />
          <span className="text-sm font-medium">
            Status: <span className={color}>{status}</span>
          </span>
        </div>
      </div>
    )
  }

  const renderSetupStep = () => (
    <div className="space-y-4">
      <Collapsible open={isItemsExpanded} onOpenChange={setIsItemsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="hover:bg-muted/50 w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isItemsExpanded ? 'Hide Selected Items' : 'Show Selected Items'}
              </span>
              <div className="flex gap-2">
                {folderCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Folder className="h-3 w-3" />
                    {folderCount}
                  </Badge>
                )}
                {fileCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {fileCount}
                  </Badge>
                )}
                <Badge variant="outline">{totalItems} total</Badge>
              </div>
            </div>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isItemsExpanded && 'rotate-90',
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="bg-muted/5 max-h-64 overflow-y-auto rounded-lg border p-2">
            <div className="space-y-2">
              {canRenameItems.map(item => (
                <div
                  key={item.id}
                  className="bg-muted/20 hover:bg-muted/40 flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors"
                >
                  {item.isFolder ? (
                    <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Rename Method</Label>
        <RadioGroup
          value={renameMode}
          onValueChange={value => setRenameMode(value as RenameMode)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="simple" id="simple" />
            <Label htmlFor="simple" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Simple Rename
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pattern" id="pattern" />
            <Label htmlFor="pattern" className="flex items-center gap-2">
              <AlignLeft className="h-4 w-4" />
              Find & Replace / Add Prefix & Suffix
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequence" id="sequence" />
            <Label htmlFor="sequence" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Number Sequence
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="regex" id="regex" />
            <Label htmlFor="regex" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Regular Expression
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Rename Method Options */}
      <div className="space-y-4">
        {renameMode === 'simple' && (
          <div className="space-y-3">
            <Label htmlFor="newName">New Name</Label>
            {selectedItems.length === 1 ? (
              <Input
                id="newName"
                placeholder="Enter new name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  id="newName"
                  placeholder="Base name (numbers will be added)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <div className="text-muted-foreground text-xs">
                  Multiple items will be renamed as: {newName || 'renamed'}_1,{' '}
                  {newName || 'renamed'}_2, etc.
                </div>
              </div>
            )}
          </div>
        )}

        {renameMode === 'pattern' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="prefix">Add Prefix</Label>
              <Input
                id="prefix"
                placeholder="Text to add at beginning"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Add Suffix (before extension)</Label>
              <Input
                id="suffix"
                placeholder="Text to add before file extension"
                value={suffix}
                onChange={e => setSuffix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="findText">Find Text</Label>
              <Input
                id="findText"
                placeholder="Text to find and replace"
                value={findText}
                onChange={e => setFindText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replaceText">Replace With</Label>
              <Input
                id="replaceText"
                placeholder="Replacement text"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
              />
            </div>
          </div>
        )}

        {renameMode === 'sequence' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="baseName">Base Name</Label>
              <Input
                id="baseName"
                placeholder="Base name for sequence"
                value={baseName}
                onChange={e => setBaseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startNumber">Start Number</Label>
              <Input
                id="startNumber"
                type="number"
                placeholder="1"
                value={startNumber}
                onChange={e => setStartNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format</Label>
              <RadioGroup
                value={numberFormat}
                onValueChange={setNumberFormat}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="format1" />
                  <Label htmlFor="format1">1, 2, 3</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="01" id="format01" />
                  <Label htmlFor="format01">01, 02, 03</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="001" id="format001" />
                  <Label htmlFor="format001">001, 002, 003</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {renameMode === 'regex' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Regular Expression</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRegexHelp(true)}
                className="h-8 text-blue-600"
              >
                <HelpCircle className="mr-1 h-4 w-4" />
                Help
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Regex pattern (e.g., \\d+)"
                value={regexPattern}
                onChange={e => setRegexPattern(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regexReplacement">Replacement</Label>
              <Input
                id="regexReplacement"
                placeholder="Replacement text (e.g., $1, $2)"
                value={regexReplacement}
                onChange={e => setRegexReplacement(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">Preview Changes</h3>
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2 font-medium">
            <Info className="h-4 w-4" />
            <span>Review the proposed changes before applying</span>
          </div>
          <div>• Only items with changes will be renamed</div>
          <div>• You can go back to modify settings if needed</div>
          <div>• The operation can be cancelled during processing</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Changes Preview</span>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {previewResults.filter(r => r.hasChanges).length} changes
          </Badge>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {previewResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-2 text-sm',
                  result.hasChanges
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20',
                )}
              >
                <div className="flex flex-1 items-center gap-2">
                  {result.hasChanges ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate font-mono text-xs">
                      {result.original}
                    </div>
                    {result.hasChanges && (
                      <div className="mt-1 flex items-center gap-1">
                        <ArrowRight className="text-muted-foreground h-3 w-3" />
                        <div className="truncate font-mono text-xs font-medium text-green-600">
                          {result.preview}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {previewResults.filter(r => r.hasChanges).length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              No changes detected. Please modify your rename settings.
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <h3 className="font-semibold">Renaming Items</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>
            {progress.current} of {progress.total}
          </span>
        </div>

        <Progress value={calculateProgress(progress.current, progress.total)} className="h-2" />

        {progress.currentFile && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4" />
            <span className="truncate">Renaming: {progress.currentFile}</span>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.success} renamed</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{progress.failed} failed</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <SkipForward className="h-4 w-4" />
            <span>{progress.skipped} skipped</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCompletedStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">
          {isCancelled ? 'Rename Operation Cancelled' : 'Items Renamed Successfully'}
        </h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully renamed {progress.success} item(s)</div>
            <div>✓ File names updated in Google Drive</div>
            <div>✓ Changes are immediately visible</div>
          </div>
        </div>
      )}

      {progress.failed > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">
            Failed to rename {progress.failed} item(s):
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {progress.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600">
                  • {error.file}: {error.error}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {!isCancelled && progress.success > 0 && (
        <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            💡 Tip: Refresh the file list to see the updated names
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    return (
      <>
        {renderStepIndicator()}
        {(() => {
          switch (currentStep) {
            case 'setup':
              return renderSetupStep()
            case 'preview':
              return renderPreviewStep()
            case 'processing':
              return renderProcessingStep()
            case 'completed':
              return renderCompletedStep()
            default:
              return null
          }
        })()}
      </>
    )
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={generatePreview} disabled={selectedItems.length === 0}>
              Preview Changes
            </Button>
          </>
        )
      case 'preview':
        return (
          <>
            <Button variant="outline" onClick={() => setCurrentStep('setup')}>
              Back to Settings
            </Button>
            <Button
              onClick={handleRename}
              disabled={previewResults.filter(r => r.hasChanges).length === 0}
            >
              Rename Items
            </Button>
          </>
        )
      case 'processing':
        return (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )
      case 'completed':
        return <Button onClick={handleClose}>{isCancelled ? 'Close' : 'Done'}</Button>
      default:
        return null
    }
  }

  if (isMobile) {
    return (
      <>
        <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>Rename Items</BottomSheetTitle>
              <BottomSheetDescription>
                Rename selected items using various methods and patterns.
              </BottomSheetDescription>
            </BottomSheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-2">{renderContent()}</div>

            <BottomSheetFooter>
              <div className="flex gap-2">{renderFooter()}</div>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>

        <RegexHelpDialog isOpen={showRegexHelp} onClose={() => setShowRegexHelp(false)} />
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rename Items</DialogTitle>
            <DialogDescription>
              Rename selected items using various methods and patterns.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

          <DialogFooter>{renderFooter()}</DialogFooter>
        </DialogContent>
      </Dialog>

      <RegexHelpDialog isOpen={showRegexHelp} onClose={() => setShowRegexHelp(false)} />
    </>
  )
}

export default ItemsRenameDialog
export { ItemsRenameDialog }
