'use client'

import { useState } from 'react'
import {
  Code2,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  Copy,
  Play,
  TestTube,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [testPattern, setTestPattern] = useState('')
  const [testReplacement, setTestReplacement] = useState('')
  const [testFilenames, setTestFilenames] = useState(
    'document123.pdf\nmy file.txt\nreport_2024-01-15_final.pdf\nIMG_20240115_143022.jpg',
  )
  const [testResults, setTestResults] = useState<
    Array<{
      original: string
      result: string
      success: boolean
      error?: string
    }>
  >([])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const runRegexTest = () => {
    if (!testPattern.trim()) {
      toast.error('Please enter a regex pattern')
      return
    }

    const filenames = testFilenames.split('\n').filter(name => name.trim())
    if (filenames.length === 0) {
      toast.error('Please enter some test filenames')
      return
    }

    const results = filenames.map(filename => {
      try {
        const regex = new RegExp(testPattern, 'g')
        const result = filename.replace(regex, testReplacement)
        return {
          original: filename,
          result: result,
          success: true,
        }
      } catch (error) {
        return {
          original: filename,
          result: filename,
          success: false,
          error: error instanceof Error ? error.message : 'Invalid regex pattern',
        }
      }
    })

    setTestResults(results)

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    if (errorCount > 0) {
      toast.error(`${errorCount} error(s) in regex pattern`)
    } else {
      toast.success(`Successfully tested ${successCount} filename(s)`)
    }
  }

  const loadExample = (example: (typeof REGEX_EXAMPLES)[0]) => {
    setTestPattern(example.pattern)
    setTestReplacement(typeof example.replacement === 'string' ? example.replacement : '')
    runRegexTest()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            Regular Expression Guide for File Renaming
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Guide & Examples
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Regex Tester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="mt-4 space-y-6">
            {/* Guide content */}
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadExample(example)}
                          className="h-8 w-8 p-0"
                          title="Test this example"
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(`${example.pattern}|${example.replacement}`)
                          }
                          className="h-8 w-8 p-0"
                          title="Copy pattern and replacement"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
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
          </TabsContent>

          <TabsContent value="tester" className="mt-4 space-y-6">
            {/* Regex Tester */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Interactive Regex Tester</h3>
              </div>

              <div className="rounded-lg border bg-purple-50 p-4 dark:bg-purple-950/20">
                <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                  <div className="flex items-center gap-2 font-medium">
                    <Info className="h-4 w-4" />
                    <span>Test your regex patterns before using them on real files</span>
                  </div>
                  <div>• Enter your regex pattern and replacement text</div>
                  <div>• Add sample filenames to test against</div>
                  <div>• Preview the results instantly</div>
                  <div>• Click the ⚡ button on examples to test them</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Regex Pattern</Label>
                    <Input
                      id="pattern"
                      placeholder="e.g., \\d+"
                      value={testPattern}
                      onChange={e => setTestPattern(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="replacement">Replacement Text</Label>
                    <Input
                      id="replacement"
                      placeholder="e.g., _NUMBER_"
                      value={testReplacement}
                      onChange={e => setTestReplacement(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filenames">Test Filenames (one per line)</Label>
                    <Textarea
                      id="filenames"
                      rows={6}
                      placeholder="document123.pdf&#10;my file.txt&#10;report_2024-01-15.pdf"
                      value={testFilenames}
                      onChange={e => setTestFilenames(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button onClick={runRegexTest} disabled={!testPattern.trim()} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Test Regex
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Test Results</Label>
                    <div className="min-h-[300px] rounded-lg border bg-gray-50 p-4 dark:bg-gray-950/50">
                      {testResults.length === 0 ? (
                        <div className="text-muted-foreground flex h-full items-center justify-center">
                          <div className="text-center">
                            <TestTube className="mx-auto mb-2 h-8 w-8 opacity-50" />
                            <p>Enter pattern and click "Test Regex" to see results</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-4 text-sm">
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700"
                            >
                              ✓ {testResults.filter(r => r.success).length} success
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-700"
                            >
                              ✗ {testResults.filter(r => !r.success).length} errors
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {testResults.map((result, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-muted-foreground font-mono text-xs">
                                    {result.original}
                                  </span>
                                </div>

                                {result.success ? (
                                  <div className="ml-6 flex items-center gap-2 text-sm">
                                    <ArrowRight className="text-muted-foreground h-3 w-3" />
                                    <span className="font-mono text-xs font-medium text-green-600">
                                      {result.result}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="ml-6 text-xs text-red-600">
                                    Error: {result.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close Guide</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { RegexHelpDialog }
export default RegexHelpDialog
