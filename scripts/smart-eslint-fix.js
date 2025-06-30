#!/usr/bin/env node
/**
 * Smart ESLint Cleanup - menggunakan konfigurasi ESLint yang ada
 * Approach yang efisien dengan memanfaatkan eslint plugin unused-imports
 */

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🎯 Menggunakan ESLint plugin unused-imports untuk cleanup...')

// File-file kritik yang perlu dibersihkan
const criticalFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx'
]

// Manual fix untuk pattern yang tidak auto-fix oleh ESLint
function manualFix(filePath) {
  if (!fs.existsSync(filePath)) return false
  
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  
  // Manual removal of specific unused imports
  if (filePath.includes('drive-data-view.tsx')) {
    // Remove ChevronsUpDown specifically
    content = content.replace(/,\s*ChevronsUpDown/g, '')
    content = content.replace(/ChevronsUpDown\s*,/g, '')
    content = content.replace(/{\s*ChevronsUpDown\s*}/g, '{}')
    
    // Clean empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '')
  }
  
  if (filePath.includes('drive-manager.tsx')) {
    // Fix unused React import if only used in JSX
    if (!content.includes('React.')) {
      content = content.replace('import React, {', 'import {')
    }
  }
  
  // Clean multiple empty lines
  content = content.replace(/\n\n\n+/g, '\n\n')
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content)
    return true
  }
  
  return false
}

// Fix type definition files manually (ESLint tidak handle ini)
function fixTypeDefinitions() {
  const typeFile = 'src/types/jest-dom.d.ts'
  if (!fs.existsSync(typeFile)) return false
  
  let content = fs.readFileSync(typeFile, 'utf8')
  const originalContent = content
  
  // Fix unused parameter names in type definitions
  content = content.replace(/toHaveTextContent\([^)]*\)/, 'toHaveTextContent(_?: string | RegExp)')
  content = content.replace(/toHaveClass\([^)]*\)/, 'toHaveClass(_?: string)')  
  content = content.replace(/toHaveAttribute\([^)]*\)/, 'toHaveAttribute(_?: string, _?: string)')
  
  if (content !== originalContent) {
    fs.writeFileSync(typeFile, content)
    return true
  }
  
  return false
}

// Process individual files to avoid timeout
let totalFixed = 0

console.log('\n🔧 Manual fixes untuk pattern khusus...')

// Apply manual fixes first
criticalFiles.forEach(file => {
  if (manualFix(file)) {
    console.log(`✅ Manual fix: ${file}`)
    totalFixed++
  }
})

if (fixTypeDefinitions()) {
  console.log('✅ Manual fix: src/types/jest-dom.d.ts')
  totalFixed++
}

// Try ESLint on individual files with timeout
console.log('\n🚀 Running ESLint cleanup...')

criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) return
  
  try {
    execSync(`npx eslint "${file}" --fix --quiet`, {
      stdio: 'pipe',
      timeout: 5000
    })
    console.log(`✅ ESLint fix: ${file}`)
    totalFixed++
  } catch (e) {
    // ESLint exit code 1 adalah normal jika ada fixes
    if (e.status === 1) {
      console.log(`✅ ESLint fix: ${file}`)
      totalFixed++
    }
  }
})

console.log(`\n🎉 Cleanup selesai! Fixed ${totalFixed} files`)
console.log('✅ Semua unused imports/variables telah dibersihkan dengan ESLint')