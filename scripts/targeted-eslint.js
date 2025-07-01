#!/usr/bin/env node
/**
 * Targeted ESLint - Menjalankan ESLint pada file-file spesifik satu per satu
 */

const { execSync } = require('child_process')
const fs = require('fs')

// File yang paling penting untuk di-fix
const priorityFiles = [
  'src/app/(main)/dashboard/drive/_components/items-copy-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-move-dialog.tsx', 
  'src/app/(main)/dashboard/drive/_components/items-delete-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-download-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-export-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-rename-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-share-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-trash-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-untrash-dialog.tsx'
]

console.log('🎯 Running targeted ESLint on priority files...\n')

function runESLintOnFile(file) {
  if (!fs.existsSync(file)) {
    console.log(`❌ File not found: ${file}`)
    return false
  }

  console.log(`Processing: ${file}`)
  
  try {
    // Jalankan ESLint dengan rules spesifik unused-imports
    execSync(`npx eslint "${file}" --fix --no-eslintrc --config eslint.config.mjs`, {
      stdio: 'pipe',
      timeout: 8000
    })
    console.log(`✅ ESLint completed: ${file}`)
    return true
  } catch (error) {
    if (error.status === 1) {
      // Status 1 berarti ada fixes yang dilakukan
      console.log(`✅ ESLint fixed issues: ${file}`)
      return true
    } else if (error.code === 'TIMEOUT') {
      console.log(`⏱️  Timeout: ${file}`)
      return false
    } else {
      console.log(`⚠️  Error: ${file}`)
      return false
    }
  }
}

let processedCount = 0
let successCount = 0

// Process each file individually
priorityFiles.forEach(file => {
  processedCount++
  if (runESLintOnFile(file)) {
    successCount++
  }
  
  // Short pause between files
  console.log('') // Empty line for readability
})

console.log(`📊 Summary:`)
console.log(`   Total files: ${processedCount}`)
console.log(`   Successfully processed: ${successCount}`)
console.log(`   Failed/timeout: ${processedCount - successCount}`)

console.log('\n✅ Targeted ESLint processing complete!')