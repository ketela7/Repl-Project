'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  HardDrive,
  Trash2,
  Eye,
  ExternalLink,
  Download,
  Shield,
  Zap,
  Target,
} from 'lucide-react'
import { formatFileSize } from '@/lib/google-drive/utils'
import {
  AdvancedDuplicateDetector,
  DuplicateGroup,
  DuplicateType,
  SuggestedAction,
  generateRecommendations,
  type DuplicateFile,
  type DuplicateRecommendation,
} from '@/lib/analytics/duplicate-detector'

interface EnhancedDuplicateAnalysisProps {
  files?: DuplicateFile[]
  isLoading?: boolean
}

const DUPLICATE_TYPE_ICONS = {
  [DuplicateType.IDENTICAL_MD5]: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  [DuplicateType.EXACT_NAME]: { icon: Copy, color: 'text-blue-600', bg: 'bg-blue-50' },
  [DuplicateType.VERSION_PATTERN]: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  [DuplicateType.SIMILAR_NAME]: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  [DuplicateType.SIZE_TIME_CLUSTER]: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  [DuplicateType.BACKUP_PATTERN]: { icon: HardDrive, color: 'text-gray-600', bg: 'bg-gray-50' },
}

const ACTION_ICONS = {
  [SuggestedAction.KEEP_LATEST]: Shield,
  [SuggestedAction.KEEP_ORIGINAL]: Target,
  [SuggestedAction.MANUAL_REVIEW]: Eye,
  [SuggestedAction.MERGE_FOLDERS]: Copy,
  [SuggestedAction.DELETE_BACKUPS]: Trash2,
}

export function EnhancedDuplicateAnalysis({
  files = [],
  isLoading = false,
}: EnhancedDuplicateAnalysisProps) {
  const [analyzer] = useState(() => new AdvancedDuplicateDetector(files))
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [recommendations, setRecommendations] = useState<DuplicateRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const runAdvancedAnalysis = () => {
    setIsAnalyzing(true)

    // Simulate async processing for better UX
    setTimeout(() => {
      const groups = analyzer.detectDuplicates()
      const recs = generateRecommendations(groups)

      setDuplicateGroups(groups)
      setRecommendations(recs)
      setIsAnalyzing(false)
    }, 1500)
  }

  const getTotalWastedSpace = () => {
    return duplicateGroups.reduce((total, group) => total + group.wastedBytes, 0)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50'
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'bg-green-100 text-green-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'risky':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Duplicate Analysis
          </CardTitle>
          <CardDescription>Advanced AI-powered duplicate detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span>Loading file data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Duplicate Analysis
          </CardTitle>
          <CardDescription>
            Advanced multi-strategy duplicate detection with actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                Analyzing {files.length.toLocaleString()} files with 6 detection strategies
              </p>
              {duplicateGroups.length > 0 && (
                <p className="text-sm font-medium">
                  Found {duplicateGroups.length} duplicate groups •{' '}
                  {formatFileSize(getTotalWastedSpace())} potential savings
                </p>
              )}
            </div>

            <Button
              onClick={runAdvancedAnalysis}
              disabled={isAnalyzing || files.length === 0}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {duplicateGroups.length > 0 ? 'Re-analyze' : 'Start Analysis'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>AI-generated actions to optimize your storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          rec.priority === 'high'
                            ? 'destructive'
                            : rec.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getRiskBadgeColor(rec.riskLevel)}>{rec.riskLevel}</Badge>
                      {rec.autoExecutable && (
                        <Badge variant="outline" className="text-green-600">
                          Auto-safe
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      Save {formatFileSize(rec.potentialSavings)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium">{rec.action}</h4>
                    <p className="text-muted-foreground text-sm">{rec.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" disabled={!rec.autoExecutable}>
                      {rec.autoExecutable ? 'Execute Safely' : 'Review Required'}
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Groups */}
      {duplicateGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicate Groups ({duplicateGroups.length})
            </CardTitle>
            <CardDescription>Grouped by detection strategy and confidence level</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3 pr-3">
                {duplicateGroups.map((group, groupIndex) => {
                  const typeConfig = DUPLICATE_TYPE_ICONS[group.type]
                  const TypeIcon = typeConfig.icon
                  const ActionIcon = ACTION_ICONS[group.suggestedAction]
                  const isSelected = selectedGroup === `group-${groupIndex}`

                  return (
                    <Collapsible
                      key={groupIndex}
                      open={isSelected}
                      onOpenChange={open => setSelectedGroup(open ? `group-${groupIndex}` : null)}
                    >
                      <div
                        className={`rounded-lg border transition-colors ${isSelected ? 'border-primary' : 'border-border'}`}
                      >
                        <CollapsibleTrigger className="hover:bg-muted/50 w-full p-4 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-md p-2 ${typeConfig.bg}`}>
                                <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-medium">{group.reason}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {group.files.length} files
                                  </Badge>
                                  <Badge
                                    className={`text-xs ${getConfidenceColor(group.confidence)}`}
                                  >
                                    {group.confidence}% confidence
                                  </Badge>
                                  {group.canAutoResolve && (
                                    <Badge variant="outline" className="text-xs text-green-600">
                                      Auto-resolvable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-red-600">
                                {formatFileSize(group.wastedBytes)} wasted
                              </span>
                              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="space-y-3 px-4 pb-4">
                            <Separator />

                            {/* Suggested Action */}
                            <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                              <ActionIcon className="text-muted-foreground h-4 w-4" />
                              <span className="text-sm font-medium">Suggested: </span>
                              <span className="text-muted-foreground text-sm capitalize">
                                {group.suggestedAction.replace('_', ' ')}
                              </span>
                            </div>

                            {/* File List */}
                            <div className="space-y-2">
                              {group.files.map((file, fileIndex) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between rounded border p-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="truncate text-sm font-medium"
                                        title={file.name}
                                      >
                                        {file.name}
                                      </span>
                                      {fileIndex === 0 &&
                                        group.suggestedAction === SuggestedAction.KEEP_LATEST && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs text-green-600"
                                          >
                                            Keep
                                          </Badge>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-muted-foreground text-xs">
                                        {formatFileSize(file.size)}
                                      </span>
                                      {file.md5Checksum && (
                                        <span className="text-muted-foreground font-mono text-xs">
                                          MD5: {file.md5Checksum.substring(0, 8)}...
                                        </span>
                                      )}
                                      <span className="text-muted-foreground text-xs">
                                        {new Date(file.modifiedTime).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {file.webViewLink && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(file.webViewLink, '_blank')}
                                        className="h-8 w-8 p-0"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline">
                                Preview Resolution
                              </Button>
                              {group.canAutoResolve ? (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Auto-Resolve Safely
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary">
                                  Manual Review
                                </Button>
                              )}
                              <Button size="sm" variant="ghost">
                                Ignore Group
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {duplicateGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{duplicateGroups.length}</div>
                <div className="text-muted-foreground text-sm">Duplicate Groups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {duplicateGroups.reduce((sum, g) => sum + g.files.length, 0)}
                </div>
                <div className="text-muted-foreground text-sm">Duplicate Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatFileSize(getTotalWastedSpace())}
                </div>
                <div className="text-muted-foreground text-sm">Space Wasted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {duplicateGroups.filter(g => g.canAutoResolve).length}
                </div>
                <div className="text-muted-foreground text-sm">Auto-Resolvable</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
