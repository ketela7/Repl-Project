/**
 * Advanced duplicate detection system with multiple strategies
 * Provides comprehensive analysis beyond simple filename matching
 */

export interface DuplicateFile {
  id: string
  name: string
  size: number
  md5Checksum?: string
  mimeType: string
  modifiedTime: string
  webViewLink?: string
  parents?: string[]
}

export interface DuplicateGroup {
  type: DuplicateType
  reason: string
  files: DuplicateFile[]
  wastedBytes: number
  confidence: number // 0-100
  suggestedAction: SuggestedAction
  canAutoResolve: boolean
}

export enum DuplicateType {
  IDENTICAL_MD5 = 'identical_md5',
  EXACT_NAME = 'exact_name',
  VERSION_PATTERN = 'version_pattern',
  SIMILAR_NAME = 'similar_name',
  SIZE_TIME_CLUSTER = 'size_time_cluster',
  BACKUP_PATTERN = 'backup_pattern',
}

export enum SuggestedAction {
  KEEP_LATEST = 'keep_latest',
  KEEP_ORIGINAL = 'keep_original',
  MANUAL_REVIEW = 'manual_review',
  MERGE_FOLDERS = 'merge_folders',
  DELETE_BACKUPS = 'delete_backups',
}

export class AdvancedDuplicateDetector {
  private files: DuplicateFile[] = []

  constructor(files: DuplicateFile[]) {
    this.files = files
  }

  /**
   * Comprehensive duplicate detection using multiple strategies
   */
  detectDuplicates(): DuplicateGroup[] {
    const groups: DuplicateGroup[] = []

    // Strategy 1: Identical MD5 (highest confidence)
    groups.push(...this.detectIdenticalMD5())

    // Strategy 2: Version patterns (Document_v1, Document_v2, etc.)
    groups.push(...this.detectVersionPatterns())

    // Strategy 3: Backup patterns (filename_backup, filename_copy)
    groups.push(...this.detectBackupPatterns())

    // Strategy 4: Similar names with fuzzy matching
    groups.push(...this.detectSimilarNames())

    // Strategy 5: Size and time clustering
    groups.push(...this.detectSizeTimeClusters())

    // Strategy 6: Exact filename duplicates (current implementation)
    groups.push(...this.detectExactNames())

    return this.rankAndFilterGroups(groups)
  }

  private detectIdenticalMD5(): DuplicateGroup[] {
    const md5Groups = new Map<string, DuplicateFile[]>()

    this.files.forEach(file => {
      if (file.md5Checksum) {
        if (!md5Groups.has(file.md5Checksum)) {
          md5Groups.set(file.md5Checksum, [])
        }
        md5Groups.get(file.md5Checksum)!.push(file)
      }
    })

    return Array.from(md5Groups.entries())
      .filter(([, files]) => files.length > 1)
      .map(([md5, files]) => ({
        type: DuplicateType.IDENTICAL_MD5,
        reason: `Files with identical content (MD5: ${md5.substring(0, 8)}...)`,
        files,
        wastedBytes: this.calculateWastedBytes(files),
        confidence: 100,
        suggestedAction: SuggestedAction.KEEP_LATEST,
        canAutoResolve: true,
      }))
  }

  private detectVersionPatterns(): DuplicateGroup[] {
    const versionGroups = new Map<string, DuplicateFile[]>()

    this.files.forEach(file => {
      const basePattern = this.extractVersionBase(file.name)
      if (basePattern) {
        if (!versionGroups.has(basePattern)) {
          versionGroups.set(basePattern, [])
        }
        versionGroups.get(basePattern)!.push(file)
      }
    })

    return Array.from(versionGroups.entries())
      .filter(([, files]) => files.length > 1)
      .map(([pattern, files]) => ({
        type: DuplicateType.VERSION_PATTERN,
        reason: `Files following version pattern: ${pattern}`,
        files: files.sort(
          (a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime(),
        ),
        wastedBytes: this.calculateWastedBytes(files.slice(1)), // Keep latest
        confidence: 85,
        suggestedAction: SuggestedAction.KEEP_LATEST,
        canAutoResolve: true,
      }))
  }

  private detectBackupPatterns(): DuplicateGroup[] {
    const backupGroups = new Map<string, DuplicateFile[]>()

    this.files.forEach(file => {
      const basePattern = this.extractBackupBase(file.name)
      if (basePattern) {
        if (!backupGroups.has(basePattern)) {
          backupGroups.set(basePattern, [])
        }
        backupGroups.get(basePattern)!.push(file)
      }
    })

    return Array.from(backupGroups.entries())
      .filter(([, files]) => files.length > 1)
      .map(([pattern, files]) => ({
        type: DuplicateType.BACKUP_PATTERN,
        reason: `Backup files detected for: ${pattern}`,
        files: files.sort(
          (a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime(),
        ),
        wastedBytes: this.calculateWastedBytes(files.slice(1)),
        confidence: 90,
        suggestedAction: SuggestedAction.DELETE_BACKUPS,
        canAutoResolve: false, // Manual review recommended for backups
      }))
  }

  private detectSimilarNames(): DuplicateGroup[] {
    const groups: DuplicateGroup[] = []
    const processed = new Set<string>()

    this.files.forEach((file1, index) => {
      if (processed.has(file1.id)) return

      const similarFiles = [file1]

      this.files.slice(index + 1).forEach(file2 => {
        if (!processed.has(file2.id) && this.calculateSimilarity(file1.name, file2.name) > 0.8) {
          similarFiles.push(file2)
          processed.add(file2.id)
        }
      })

      if (similarFiles.length > 1) {
        processed.add(file1.id)
        groups.push({
          type: DuplicateType.SIMILAR_NAME,
          reason: `Files with similar names (typos or variations)`,
          files: similarFiles,
          wastedBytes: this.calculateWastedBytes(similarFiles.slice(1)),
          confidence: 70,
          suggestedAction: SuggestedAction.MANUAL_REVIEW,
          canAutoResolve: false,
        })
      }
    })

    return groups
  }

  private detectSizeTimeClusters(): DuplicateGroup[] {
    const groups: DuplicateGroup[] = []
    const sizeGroups = new Map<number, DuplicateFile[]>()

    // Group by exact size
    this.files.forEach(file => {
      if (!sizeGroups.has(file.size)) {
        sizeGroups.set(file.size, [])
      }
      sizeGroups.get(file.size)!.push(file)
    })

    // Find size groups with multiple files uploaded within 1 hour
    sizeGroups.forEach((files, size) => {
      if (files.length > 1 && size > 1024 * 1024) {
        // Only for files > 1MB
        const timeClusters = this.clusterByTime(files, 60 * 60 * 1000) // 1 hour

        timeClusters.forEach(cluster => {
          if (cluster.length > 1) {
            groups.push({
              type: DuplicateType.SIZE_TIME_CLUSTER,
              reason: `Files with same size (${this.formatBytes(size)}) uploaded within 1 hour`,
              files: cluster,
              wastedBytes: this.calculateWastedBytes(cluster.slice(1)),
              confidence: 60,
              suggestedAction: SuggestedAction.MANUAL_REVIEW,
              canAutoResolve: false,
            })
          }
        })
      }
    })

    return groups
  }

  private detectExactNames(): DuplicateGroup[] {
    const nameGroups = new Map<string, DuplicateFile[]>()

    this.files.forEach(file => {
      if (!nameGroups.has(file.name)) {
        nameGroups.set(file.name, [])
      }
      nameGroups.get(file.name)!.push(file)
    })

    return Array.from(nameGroups.entries())
      .filter(([, files]) => files.length > 1)
      .map(([name, files]) => ({
        type: DuplicateType.EXACT_NAME,
        reason: `Files with identical filename: ${name}`,
        files,
        wastedBytes: this.calculateWastedBytes(files.slice(1)),
        confidence: 80,
        suggestedAction: SuggestedAction.KEEP_LATEST,
        canAutoResolve: false,
      }))
  }

  /**
   * Extract base pattern for version detection
   * Examples: "Document_v1.pdf" -> "Document", "Report (2).xlsx" -> "Report"
   */
  private extractVersionBase(filename: string): string | null {
    const patterns = [
      /^(.+?)[-_\s]*(?:v\d+|version\s*\d+)(?:\.\w+)?$/i,
      /^(.+?)[-_\s]*\(\d+\)(?:\.\w+)?$/i,
      /^(.+?)[-_\s]*copy(?:\s*\d+)?(?:\.\w+)?$/i,
      /^(.+?)[-_\s]*\d+(?:\.\w+)?$/i,
    ]

    for (const pattern of patterns) {
      const match = filename.match(pattern)
      if (match && match[1].trim().length > 2) {
        return match[1].trim().toLowerCase()
      }
    }

    return null
  }

  /**
   * Extract base pattern for backup detection
   */
  private extractBackupBase(filename: string): string | null {
    const patterns = [
      /^(.+?)[-_\s]*(?:backup|bak|old|temp|tmp)(?:\.\w+)?$/i,
      /^(?:backup|bak|old|temp|tmp)[-_\s]*(.+?)(?:\.\w+)?$/i,
      /^(.+?)[-_\s]*\d{4}-\d{2}-\d{2}(?:\.\w+)?$/i, // Date pattern
    ]

    for (const pattern of patterns) {
      const match = filename.match(pattern)
      if (match && match[1].trim().length > 2) {
        return match[1].trim().toLowerCase()
      }
    }

    return null
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(null))

    for (let i = 0; i <= len1; i++) matrix[0][i] = i
    for (let j = 0; j <= len2; j++) matrix[j][0] = j

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        )
      }
    }

    const distance = matrix[len2][len1]
    return 1 - distance / Math.max(len1, len2)
  }

  /**
   * Cluster files by upload time
   */
  private clusterByTime(files: DuplicateFile[], maxGapMs: number): DuplicateFile[][] {
    const sorted = files.sort(
      (a, b) => new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime(),
    )
    const clusters: DuplicateFile[][] = []
    let currentCluster: DuplicateFile[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const timeDiff =
        new Date(sorted[i].modifiedTime).getTime() - new Date(sorted[i - 1].modifiedTime).getTime()

      if (timeDiff <= maxGapMs) {
        currentCluster.push(sorted[i])
      } else {
        if (currentCluster.length > 1) {
          clusters.push(currentCluster)
        }
        currentCluster = [sorted[i]]
      }
    }

    if (currentCluster.length > 1) {
      clusters.push(currentCluster)
    }

    return clusters
  }

  private calculateWastedBytes(files: DuplicateFile[]): number {
    return files.reduce((total, file) => total + file.size, 0)
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Rank groups by confidence and impact, remove overlapping duplicates
   */
  private rankAndFilterGroups(groups: DuplicateGroup[]): DuplicateGroup[] {
    // Sort by confidence and wasted bytes
    const sorted = groups.sort((a, b) => {
      if (a.confidence !== b.confidence) return b.confidence - a.confidence
      return b.wastedBytes - a.wastedBytes
    })

    // Remove overlapping groups (files that appear in multiple groups)
    const usedFileIds = new Set<string>()
    const filtered: DuplicateGroup[] = []

    sorted.forEach(group => {
      const newFiles = group.files.filter(file => !usedFileIds.has(file.id))
      if (newFiles.length > 1) {
        group.files.forEach(file => usedFileIds.add(file.id))
        group.files = newFiles
        group.wastedBytes = this.calculateWastedBytes(newFiles.slice(1))
        filtered.push(group)
      }
    })

    return filtered
  }
}

/**
 * Generate actionable recommendations based on duplicate analysis
 */
export interface DuplicateRecommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
  description: string
  potentialSavings: number
  riskLevel: 'safe' | 'moderate' | 'risky'
  autoExecutable: boolean
}

export function generateRecommendations(groups: DuplicateGroup[]): DuplicateRecommendation[] {
  const recommendations: DuplicateRecommendation[] = []

  // High priority: Identical MD5 files
  const identicalGroups = groups.filter(g => g.type === DuplicateType.IDENTICAL_MD5)
  if (identicalGroups.length > 0) {
    const totalSavings = identicalGroups.reduce((sum, g) => sum + g.wastedBytes, 0)
    recommendations.push({
      priority: 'high',
      action: `Delete ${identicalGroups.length} groups of identical files`,
      description: 'These files have identical content (same MD5 hash) and can be safely removed',
      potentialSavings: totalSavings,
      riskLevel: 'safe',
      autoExecutable: true,
    })
  }

  // Medium priority: Version patterns
  const versionGroups = groups.filter(g => g.type === DuplicateType.VERSION_PATTERN)
  if (versionGroups.length > 0) {
    const totalSavings = versionGroups.reduce((sum, g) => sum + g.wastedBytes, 0)
    recommendations.push({
      priority: 'medium',
      action: `Clean up ${versionGroups.length} versioned file groups`,
      description: 'Keep only the latest version of these files',
      potentialSavings: totalSavings,
      riskLevel: 'moderate',
      autoExecutable: false,
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.potentialSavings - a.potentialSavings
  })
}
