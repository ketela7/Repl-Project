'use client'

import { ReactNode } from 'react'
import type { ReactNode } from 'react'
import type { ReactNode } from 'react'
import type { ReactNode } from 'react'
import { Code2, Info, CheckCircle, XCircle, ArrowRight, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface RegexHelpDialogProps {
  isOpen: boolean
  onClose: () => void
}

const REGEX_EXAMPLES = [
  {
    name: 'Remove Numbers',
    pattern: '\\d+',
    replacement: '',
    description: 'Remove all numbers from filenames',
    example: 'document123.pdf → document.pdf',
    icon: '🔢',
  },
  {
    name: 'Replace Spaces with Underscores',
    pattern: ' ',
    replacement: '_',
    description: 'Replace all spaces with underscores',
    example: 'my file.txt → my_file.txt',
    icon: '🔄',
  },
  {
    name: 'Remove Special Characters',
    pattern: '[^a-zA-Z0-9._-]',
    replacement: '',
    description: 'Keep only letters, numbers, dots, underscores, and hyphens',
    example: 'file@#$.txt → file.txt',
    icon: '🧹',
  },
  {
    name: 'Add Prefix to Extension',
    pattern: '(.*)\\.(.*)$',
    replacement: '$1_backup.$2',
    description: 'Add "_backup" before file extension',
    example: 'document.pdf → document_backup.pdf',
    icon: '💾',
  },
  {
    name: 'Extract Date Pattern',
    pattern: '.*?(\\d{4}-\\d{2}-\\d{2}).*',
    replacement: 'Date_$1',
    description: 'Extract date in YYYY-MM-DD format',
    example: 'report_2024-01-15_final.pdf → Date_2024-01-15',
    icon: '📅',
  },
  {
    name: 'Lowercase Everything',
    pattern: '([A-Z])',
    replacement: (match: string) => match.toLowerCase(),
    description: 'Convert all uppercase letters to lowercase',
    example: 'MyFile.PDF → myfile.pdf',
    icon: '🔤',
  },
]

const REGEX_CHEATSHEET = [
  { symbol: '.', meaning: 'Any single character', example: 'a.c matches abc, axc' },
  { symbol: '*', meaning: 'Zero or more of previous', example: 'ab* matches a, ab, abb' },
  { symbol: '+', meaning: 'One or more of previous', example: 'ab+ matches ab, abb' },
  { symbol: '?', meaning: 'Zero or one of previous', example: 'ab? matches a, ab' },
  { symbol: '^', meaning: 'Start of string', example: '^abc matches abc at start' },
  { symbol: '$', meaning: 'End of string', example: 'abc$ matches abc at end' },
  { symbol: '\\d', meaning: 'Any digit (0-9)', example: '\\d+ matches 123' },
  { symbol: '\\w', meaning: 'Any word character', example: '\\w+ matches hello' },
  { symbol: '\\s', meaning: 'Any whitespace', example: '\\s+ matches spaces' },
  { symbol: '[abc]', meaning: 'Any character in brackets', example: '[abc] matches a or b or c' },
  { symbol: '[^abc]', meaning: 'Any character NOT in brackets', example: '[^abc] matches x, y, z' },
  { symbol: '()', meaning: 'Capture group', example: '(\\d+) captures numbers' },
]

function RegexHelpDialog({ isOpen, onClose }: RegexHelpDialogProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            Regular Expression Guide for File Renaming
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Start */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Quick Start</h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-950/30">
              <p className="mb-2">
                Regular expressions (regex) allow advanced pattern-based renaming:
              </p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>
                  <strong>Pattern:</strong> What to find in the filename
                </li>
                <li>
                  <strong>Replacement:</strong> What to replace it with
                </li>
                <li>
                  <strong>$1, $2, etc.:</strong> Use captured groups from pattern
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Common Examples */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Common Examples
            </h3>
            <div className="grid gap-3">
              {REGEX_EXAMPLES.map((example, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{example.icon}</span>
                      <span className="font-medium">{example.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${example.pattern}|${example.replacement}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{example.description}</p>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                        Pattern: {example.pattern}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700"
                      >
                        Replace:{' '}
                        {typeof example.replacement === 'function'
                          ? example.replacement('example')
                          : example.replacement}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {example.example.split(' → ')[0]}
                      </span>
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      <span className="font-medium text-green-600">
                        {example.example.split(' → ')[1]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Regex Cheatsheet */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Code2 className="h-4 w-4 text-purple-600" />
              Regex Cheatsheet
            </h3>
            <div className="grid gap-2 text-sm">
              {REGEX_CHEATSHEET.map((item, index) => (
                <div key={index} className="hover:bg-muted/50 flex items-start gap-4 rounded p-2">
                  <Badge variant="secondary" className="min-w-16 justify-center font-mono">
                    {item.symbol}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{item.meaning}</div>
                    <div className="text-muted-foreground text-xs">{item.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tips and Warnings */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4 text-orange-600" />
              Tips & Warnings
            </h3>
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <div className="font-medium text-green-800 dark:text-green-200">Tips:</div>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-green-700 dark:text-green-300">
                      <li>Test your regex on a few files first</li>
                      <li>Use the preview to verify results before applying</li>
                      <li>Escape special characters with backslash (\)</li>
                      <li>Use parentheses () to capture groups for $1, $2, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800 dark:text-red-200">Warnings:</div>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-red-700 dark:text-red-300">
                      <li>Invalid regex patterns will be ignored</li>
                      <li>Be careful with broad patterns like .* (matches everything)</li>
                      <li>Always check the preview before confirming</li>
                      <li>Backup important files before bulk operations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close Guide</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { RegexHelpDialog }
