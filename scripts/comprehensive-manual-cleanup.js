#!/usr/bin/env node
/**
 * Comprehensive Manual Cleanup untuk semua file penting
 * Menghindari ESLint yang berat dengan cleanup manual
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Comprehensive manual cleanup starting...\n')

// Fungsi untuk mendapatkan semua file TypeScript di folder components
function getComponentFiles() {
  const componentsDir = 'src/app/(main)/dashboard/drive/_components'
  if (!fs.existsSync(componentsDir)) return []
  
  return fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(componentsDir, file))
}

// Pattern cleanup yang umum
function cleanupFile(filePath) {
  if (!fs.existsSync(filePath)) return false
  
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  let hasChanges = false
  
  // 1. Clean up unused React imports
  if (content.includes('import React,') && !content.includes('React.')) {
    content = content.replace(/import React, \{([^}]+)\}/, 'import {$1}')
    hasChanges = true
  }
  
  // 2. Clean up unused lucide-react imports (common unused icons)
  const unusedIcons = [
    'ChevronUp', 'ChevronDown', 'ChevronsUpDown', 'Triangle',
    'ArrowUp', 'ArrowDown', 'Plus', 'Minus', 'Settings'
  ]
  
  const lucideImportMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/)
  if (lucideImportMatch) {
    const imports = lucideImportMatch[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => {
        // Cek apakah import benar-benar digunakan di file
        const iconName = imp.trim()
        return content.split('\n').slice(1).some(line => 
          line.includes(`<${iconName}`) || 
          line.includes(`{${iconName}}`) ||
          line.includes(`${iconName}`)
        )
      })
    
    if (imports.length !== lucideImportMatch[1].split(',').length) {
      content = content.replace(
        lucideImportMatch[0], 
        imports.length > 0 ? `import { ${imports.join(', ')} } from 'lucide-react'` : ''
      )
      hasChanges = true
    }
  }
  
  // 3. Remove empty import statements
  content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n/g, '')
  
  // 4. Clean up multiple empty lines
  content = content.replace(/\n\n\n+/g, '\n\n')
  
  // 5. Remove unused variable declarations (basic pattern)
  content = content.replace(/^\s*const\s+\w+\s*=\s*[^;]+;\s*\/\/\s*(unused|eslint-disable)/gm, '')
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content)
    return true
  }
  
  return false
}

// Cleanup khusus untuk type definitions
function cleanupTypeDefinitions() {
  const typeFile = 'src/types/jest-dom.d.ts'
  if (!fs.existsSync(typeFile)) return false
  
  let content = fs.readFileSync(typeFile, 'utf8')
  const originalContent = content
  
  // Fix parameter names dalam type definitions
  content = content.replace(/toHaveTextContent\([^)]*\)/g, 'toHaveTextContent(_?: string | RegExp)')
  content = content.replace(/toHaveClass\([^)]*\)/g, 'toHaveClass(_?: string)')
  content = content.replace(/toHaveAttribute\([^)]*\)/g, 'toHaveAttribute(_?: string, _?: string)')
  
  if (content !== originalContent) {
    fs.writeFileSync(typeFile, content)
    return true
  }
  
  return false
}

// Process semua file components
const componentFiles = getComponentFiles()
let totalFixed = 0

console.log(`Found ${componentFiles.length} component files to process`)

componentFiles.forEach(file => {
  if (cleanupFile(file)) {
    console.log(`✅ Cleaned: ${file}`)
    totalFixed++
  } else {
    console.log(`  No changes: ${path.basename(file)}`)
  }
})

// Process type definitions
if (cleanupTypeDefinitions()) {
  console.log('✅ Cleaned: src/types/jest-dom.d.ts')
  totalFixed++
}

// Process beberapa file kritis lainnya
const otherFiles = [
  'src/auth.ts',
  'src/components/lazy-imports.tsx'
]

otherFiles.forEach(file => {
  if (cleanupFile(file)) {
    console.log(`✅ Cleaned: ${file}`)
    totalFixed++
  }
})

console.log(`\n📊 Summary:`)
console.log(`   Total files processed: ${componentFiles.length + otherFiles.length + 1}`)
console.log(`   Files fixed: ${totalFixed}`)

console.log('\n✅ Comprehensive manual cleanup complete!')
console.log('🎯 Ready for build testing')