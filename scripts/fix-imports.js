#!/usr/bin/env node

/**
 * Script untuk memperbaiki import references setelah rename file
 * Mengganti semua import yang lama dengan yang baru
 */

const fs = require('fs')
const path = require('path')

// Mapping dari nama file lama ke nama baru
const RENAME_MAPPING = {
  // Hooks
  'use-mobile': 'useMobile',
  'use-timezone': 'useTimezone', 
  'use-session-duration': 'useSessionDuration',
  
  // Utils
  'request-deduplication': 'requestDeduplication',
  'performance-utils': 'performanceUtils',
  'web-vitals': 'webVitals',
  'validation-utils': 'validationUtils',
  'progressive-fields': 'progressiveFields',
  
  // Types
  'jest-dom.d': 'jestDom.d',
  
  // Components (kebab-case to PascalCase)
  'nextauth-form': 'NextauthForm',
  'search-params-handler': 'SearchParamsHandler',
  'theme-switcher': 'ThemeSwitcher',
  'app-sidebar': 'AppSidebar',
  'auth-nav-user': 'AuthNavUser',
  'nav-main': 'NavMain',
  'nav-user': 'NavUser',
  'sidebar-items': 'SidebarItems',
  'items-delete-dialog': 'ItemsDeleteDialog',
  'items-download-dialog': 'ItemsDownloadDialog',
  'items-share-dialog': 'ItemsShareDialog',
  'items-trash-dialog': 'ItemsTrashDialog',
  'items-untrash-dialog': 'ItemsUntrashDialog',
  'operations-dialog': 'OperationsDialog',
  'items-copy-dialog': 'ItemsCopyDialog',
  'items-move-dialog': 'ItemsMoveDialog',
  'items-rename-dialog': 'ItemsRenameDialog',
  'items-export-dialog': 'ItemsExportDialog'
}

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false
    
    // Fix each import mapping
    for (const [oldName, newName] of Object.entries(RENAME_MAPPING)) {
      // Pattern untuk import statements
      const importPatterns = [
        // import { something } from './old-name'
        new RegExp(`(import\\s+.*?from\\s+['"].*?/)${oldName}(['"])`, 'g'),
        // import something from './old-name'
        new RegExp(`(import\\s+.*?from\\s+['"].*?/)${oldName}(['"])`, 'g'),
        // require('./old-name')
        new RegExp(`(require\\(['"].*?/)${oldName}(['"])`, 'g')
      ]
      
      importPatterns.forEach(pattern => {
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

function scanAndFixImports(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanAndFixImports(fullPath)
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      fixImportsInFile(fullPath)
    }
  }
}

console.log('🔧 Memperbaiki import references...')
scanAndFixImports('src')
console.log('✅ Selesai memperbaiki import references!')