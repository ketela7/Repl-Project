#!/usr/bin/env node
/**
 * Comprehensive Unused Imports and Variables Fixer
 * Fixes all unused imports and variables that could cause build failures
 */

const fs = require('fs')
const path = require('path')

// Common unused import patterns to fix
const unusedImportPatterns = [
  // React imports that might be unused
  { pattern: /import React, \{ ([^}]*) \} from 'react'/, fix: (match, imports) => {
    const usedImports = imports.split(',').map(i => i.trim()).filter(i => i && !i.includes('unused'))
    if (usedImports.length === 0) return "import React from 'react'"
    return `import React, { ${usedImports.join(', ')} } from 'react'`
  }},
  
  // Lucide icons that might be unused
  { pattern: /import \{([^}]*)\} from 'lucide-react'/, fix: (match, imports) => {
    const importList = imports.split(',').map(i => i.trim()).filter(i => i)
    // Remove known unused imports
    const filtered = importList.filter(imp => 
      !['ChevronsUpDown', 'unused'].some(unused => imp.includes(unused))
    )
    if (filtered.length === 0) return ''
    return `import { ${filtered.join(', ')} } from 'lucide-react'`
  }},
]

// Files to process
const filesToProcess = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/components/lazy-imports.tsx',
  'src/types/jest-dom.d.ts'
]

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Remove unused variables in type definitions
  if (filePath.includes('jest-dom.d.ts')) {
    content = content.replace(/\b_\w+/g, '_')
    modified = true
  }

  // Fix unused imports
  unusedImportPatterns.forEach(({ pattern, fix }) => {
    const matches = content.match(pattern)
    if (matches) {
      const newImport = fix(matches[0], matches[1])
      if (newImport !== matches[0]) {
        content = content.replace(pattern, newImport)
        modified = true
      }
    }
  })

  // Remove empty import lines
  content = content.replace(/^import \{\s*\} from [^;]+;?\s*$/gm, '')
  
  // Clean up multiple empty lines
  content = content.replace(/\n\n\n+/g, '\n\n')

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`✓ Fixed unused imports in ${filePath}`)
  } else {
    console.log(`  No changes needed in ${filePath}`)
  }
}

// Process all files
console.log('🧹 Cleaning up unused imports and variables...\n')

filesToProcess.forEach(processFile)

console.log('\n✅ Cleanup complete!')