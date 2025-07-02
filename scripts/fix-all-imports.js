#!/usr/bin/env node

/**
 * Script untuk memperbaiki semua import yang rusak setelah simplify naming
 */

const fs = require('fs')
const path = require('path')

// Mapping lengkap dari nama lama ke nama baru
const IMPORT_MAPPING = {
  // File yang baru direname
  'StorageAnalyticsNew': 'StorageAnalytics',
  'storage-analytics-new': 'StorageAnalytics',
  'OptimizedImage': 'Image',
  'optimized-image': 'Image',
  'enhancedErrorHandler': 'errorHandler',
  'enhanced-error-handler': 'errorHandler',
  'fieldUsageExamples': 'fieldUsage',
  'field-usage-examples': 'fieldUsage',
  'fileDetailMappers': 'fileMappers',
  'file-detail-mappers': 'fileMappers',
  'progressiveFields': 'fields',
  'progressive-fields': 'fields',
  'validationUtils': 'validation',
  'validation-utils': 'validation',
  'requestDeduplication': 'deduplication',
  'request-deduplication': 'deduplication',
  'performanceUtils': 'performance',
  'performance-utils': 'performance',
  'webVitals': 'vitals',
  'web-vitals': 'vitals',
  
  // Progress fix
  'Gress': 'Progress'
}

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false
    
    for (const [oldName, newName] of Object.entries(IMPORT_MAPPING)) {
      // Pattern untuk berbagai format import
      const patterns = [
        // import { Component } from './old-name'
        new RegExp(`(import\\s+.*?from\\s+['"].*?/)${oldName}(['"])`, 'g'),
        // import Component from './old-name'
        new RegExp(`(import\\s+.*?from\\s+['"].*?/)${oldName}(['"])`, 'g'),
        // require('./old-name')
        new RegExp(`(require\\(['"].*?/)${oldName}(['"])`, 'g'),
        // lazy import
        new RegExp(`(lazy\\(\\(\\)\\s*=>\\s*import\\(['"].*?/)${oldName}(['"])`, 'g'),
        // dynamic import
        new RegExp(`(import\\(['"].*?/)${oldName}(['"])`, 'g')
      ]
      
      patterns.forEach(pattern => {
        const oldContent = content
        content = content.replace(pattern, `$1${newName}$2`)
        if (content !== oldContent) {
          hasChanges = true
          console.log(`🔄 Fixed import: ${oldName} → ${newName} in ${path.basename(filePath)}`)
        }
      })
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated imports in: ${path.basename(filePath)}`)
    }
    
  } catch (error) {
    console.log(`❌ Error fixing imports in ${filePath}: ${error.message}`)
  }
}

function scanAndFixAllImports(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanAndFixAllImports(fullPath)
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      fixImportsInFile(fullPath)
    }
  }
}

// Fix specific files that we know have issues
function fixSpecificIssues() {
  console.log('🔧 Memperbaiki masalah spesifik...')
  
  // Fix analytics page import
  const analyticsPagePath = 'src/app/(main)/dashboard/analytics/page.tsx'
  if (fs.existsSync(analyticsPagePath)) {
    let content = fs.readFileSync(analyticsPagePath, 'utf8')
    content = content.replace('storage-analytics-new', 'StorageAnalytics')
    content = content.replace('EnhancedStorageAnalytics', 'StorageAnalytics')
    fs.writeFileSync(analyticsPagePath, content, 'utf8')
    console.log('✅ Fixed analytics page imports')
  }
  
  // Fix any file that imports the old OptimizedImage
  const componentFiles = [
    'src/components/file-icon.tsx',
    'src/components/optimized-image.tsx'
  ]
  
  componentFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      content = content.replace(/OptimizedImage/g, 'Image')
      content = content.replace(/optimized-image/g, 'Image')
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed ${path.basename(filePath)}`)
    }
  })
}

console.log('🔧 Memperbaiki semua import setelah simplify naming...')

// Fix specific issues first
fixSpecificIssues()

// Then scan and fix all imports
scanAndFixAllImports('src')

console.log('✅ Selesai memperbaiki semua import!')