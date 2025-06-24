'use client'

import { useState } from 'react'
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
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  Edit3,
  Hash,
  Calendar,
  AlignLeft,
  AlertTriangle,
  Info,
  Code2,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/shared/utils'

interface BulkRenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (renamePattern: string, renameType: string) => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
    mimeType?: string
  }>
}

const RENAME_TYPES = [
  {
    id: 'prefix',
    label: 'Add Prefix',
    icon: AlignLeft,
    description: 'Add text before existing name',
    example: 'NewPrefix_OriginalName.ext',
  },
  {
    id: 'suffix',
    label: 'Add Suffix',
    icon: AlignLeft,
    description: 'Add text before file extension',
    example: 'OriginalName_NewSuffix.ext',
  },
  {
    id: 'numbering',
    label: 'Sequential Numbering',
    icon: Hash,
    description: 'Replace with pattern and numbers',
    example: 'NewName_001, NewName_002, ...',
  },
  {
    id: 'timestamp',
    label: 'Add Timestamp',
    icon: Calendar,
    description: 'Add current date and time',
    example: 'OriginalName_2024-06-18_14-30.ext',
  },
  {
    id: 'regex',
    label: 'Regex Replace',
    icon: Code2,
    description: 'Find and replace using regular expressions',
    example: 'Replace patterns with custom text',
  },
]

export function BulkRenameDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkRenameDialogProps) {
  const [renameType, setRenameType] = useState('prefix')
  const [renamePattern, setRenamePattern] = useState('')
  const [regexPattern, setRegexPattern] = useState('')
  const [regexReplacement, setRegexReplacement] = useState('')
  const [regexFlags, setRegexFlags] = useState('g')
  const [showRegexGuide, setShowRegexGuide] = useState(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length

  const getPreviewName = (originalName: string, index: number = 0) => {
    if (renameType === 'regex') {
      if (!regexPattern.trim()) return originalName

      try {
        const regex = new RegExp(regexPattern, regexFlags)
        return originalName.replace(regex, regexReplacement)
      } catch (error) {
        return `[Invalid Regex] ${originalName}`
      }
    }

    if (!renamePattern.trim() && renameType !== 'timestamp') return originalName

    const fileExtension = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.'))
      : ''
    const baseName = fileExtension
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName

    switch (renameType) {
      case 'prefix':
        return `${renamePattern}_${originalName}`

      case 'suffix':
        return fileExtension
          ? `${baseName}_${renamePattern}${fileExtension}`
          : `${originalName}_${renamePattern}`

      case 'numbering':
        const number = String(index + 1).padStart(3, '0')
        return fileExtension
          ? `${renamePattern}_${number}${fileExtension}`
          : `${renamePattern}_${number}`

      case 'timestamp':
        const now = new Date()
        const timestamp = now
          .toISOString()
          .slice(0, 16)
          .replace('T', '_')
          .replace(':', '-')
        return fileExtension
          ? `${baseName}_${timestamp}${fileExtension}`
          : `${originalName}_${timestamp}`

      default:
        return originalName
    }
  }

  const handleRename = () => {
    if (renameType === 'regex') {
      if (regexPattern.trim()) {
        // Pass regex data as JSON string in the pattern parameter
        const regexData = JSON.stringify({
          pattern: regexPattern.trim(),
          replacement: regexReplacement,
          flags: regexFlags,
        })
        onConfirm(regexData, renameType)
      }
    } else if (renamePattern.trim() || renameType === 'timestamp') {
      onConfirm(renamePattern.trim(), renameType)
    }
  }

  const selectedRenameType = RENAME_TYPES.find((type) => type.id === renameType)

  const renderContent = () => (
    <>
      <div className="space-y-4 pt-2">
        <div className="text-base">
          Rename <span className="font-semibold">{selectedItems.length}</span>{' '}
          item{selectedItems.length > 1 ? 's' : ''} using a consistent pattern.
        </div>

        <div className="flex flex-wrap gap-2">
          {fileCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
            >
              {fileCount} file{fileCount > 1 ? 's' : ''}
            </Badge>
          )}
          {folderCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
            >
              {folderCount} folder{folderCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Rename Type:</Label>
            <RadioGroup
              value={renameType}
              onValueChange={setRenameType}
              className="mt-2 space-y-3"
            >
              {RENAME_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div key={type.id} className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={type.id}
                      id={type.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={type.id}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </Label>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {type.description}
                      </div>
                      <div className="mt-1 font-mono text-xs text-green-600 dark:text-green-400">
                        Example: {type.example}
                      </div>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {renameType === 'regex' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Regex Configuration:
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegexGuide(!showRegexGuide)}
                  className="text-xs"
                >
                  <HelpCircle className="mr-1 h-3 w-3" />
                  Guide
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="regex-pattern"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Find Pattern (Regex):
                  </Label>
                  <Input
                    id="regex-pattern"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="e.g., \d{4} or [A-Z]+ or \s+"
                    className={`${cn('min-h-[44px]')} font-mono text-sm`}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="regex-replacement"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Replace With:
                  </Label>
                  <Input
                    id="regex-replacement"
                    value={regexReplacement}
                    onChange={(e) => setRegexReplacement(e.target.value)}
                    placeholder="e.g., NewText or $1 or leave empty to remove"
                    className={`${cn('min-h-[44px]')} font-mono text-sm`}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="regex-flags"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Flags:
                  </Label>
                  <Input
                    id="regex-flags"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="g, i, m, etc."
                    className={`${cn('min-h-[44px]')} font-mono text-sm`}
                    maxLength={10}
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    g = global, i = case insensitive, m = multiline
                  </div>
                </div>
              </div>

              {showRegexGuide && (
                <div className="space-y-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/50">
                  <div className="text-sm font-semibold">
                    Regex Guide for Beginners:
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          Common Patterns:
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              \d+
                            </code>{' '}
                            - Numbers
                          </div>
                          <div>
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              [A-Z]+
                            </code>{' '}
                            - Uppercase letters
                          </div>
                          <div>
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              [a-z]+
                            </code>{' '}
                            - Lowercase letters
                          </div>
                          <div>
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              \s+
                            </code>{' '}
                            - Spaces
                          </div>
                          <div>
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              _+
                            </code>{' '}
                            - Underscores
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          Examples:
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>
                            <strong>Remove numbers:</strong>
                          </div>
                          <div>
                            Find:{' '}
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              \d+
                            </code>
                            , Replace: <em>(empty)</em>
                          </div>
                          <div>
                            <strong>Replace spaces with dashes:</strong>
                          </div>
                          <div>
                            Find:{' '}
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              \s+
                            </code>
                            , Replace:{' '}
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              -
                            </code>
                          </div>
                          <div>
                            <strong>Remove file extension:</strong>
                          </div>
                          <div>
                            Find:{' '}
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">
                              \.[^.]+$
                            </code>
                            , Replace: <em>(empty)</em>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 border-t pt-2">
                      <div className="font-medium text-amber-600 dark:text-amber-400">
                        Pro Tips:
                      </div>
                      <div className="mt-1 space-y-1">
                        <div>
                          • Use parentheses () to capture groups, then reference
                          with $1, $2, etc.
                        </div>
                        <div>• Add 'i' flag for case-insensitive matching</div>
                        <div>
                          • Test your regex on a few files first before applying
                          to all
                        </div>
                        <div>
                          • Escape special characters with backslash: \. \+ \*
                          \? \[ \] \( \)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            renameType !== 'timestamp' && (
              <div className="space-y-2">
                <Label
                  htmlFor="rename-pattern"
                  className="text-sm font-semibold"
                >
                  {renameType === 'numbering' ? 'Base Name:' : 'Text to Add:'}
                </Label>
                <Input
                  id="rename-pattern"
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  placeholder={
                    renameType === 'prefix'
                      ? 'Enter prefix text...'
                      : renameType === 'suffix'
                        ? 'Enter suffix text...'
                        : 'Enter base name for numbering...'
                  }
                  className={`${cn('min-h-[44px]')} w-full`}
                />
              </div>
            )
          )}

          {/* Preview section */}
          {(renamePattern.trim() ||
            renameType === 'timestamp' ||
            (renameType === 'regex' && regexPattern.trim())) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">Preview:</span>
              </div>

              <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                <ul className="space-y-1 text-sm">
                  {selectedItems.slice(0, 3).map((item, index) => (
                    <li key={item.id} className="space-y-1">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                        <span className="truncate text-xs">{item.name}</span>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <span className="text-xs text-green-600 dark:text-green-400">
                          →
                        </span>
                        <span className="truncate font-medium">
                          {getPreviewName(item.name, index)}
                        </span>
                      </div>
                    </li>
                  ))}
                  {selectedItems.length > 3 && (
                    <li className="text-muted-foreground/70 flex items-center gap-2 italic">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                      and {selectedItems.length - 3} more items...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent className="max-h-[95vh] px-0">
          <BottomSheetHeader className="px-4 pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Bulk Rename</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Rename multiple items at once
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className={`${cn('grid gap-4')} px-4`}>
            <Button
              variant="outline"
              onClick={onClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={
                renameType === 'regex'
                  ? !regexPattern.trim()
                  : !renamePattern.trim() && renameType !== 'timestamp'
              }
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Rename All
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Bulk Rename</div>
              <div className="text-muted-foreground text-sm font-normal">
                Rename multiple items at once
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">{renderContent()}</div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={
              renameType === 'regex'
                ? !regexPattern.trim()
                : !renamePattern.trim() && renameType !== 'timestamp'
            }
            className="w-full sm:w-auto"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Rename All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
