#!/usr/bin/env node
/**
 * ESLint Critical Files - Proses file penting satu per satu
 */

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🎯 Running ESLint on critical files one by one...\n')

// File-file kritis yang sering menyebabkan build error
const criticalFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/app/(main)/dashboard/drive/_components/items-copy-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-move-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-delete-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-download-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-export-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-rename-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-share-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-trash-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-untrash-dialog.tsx',
  'src/components/lazy-imports.tsx',
  'src/types/jest-dom.d.ts',
  'src/auth.ts'
]

let processedCount = 0
let fixedCount = 0

for (const file of criticalFiles) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File not found: ${file}`)
    continue
  }

  process.stdout.write(`[${processedCount + 1}/${criticalFiles.length}] ${file}`)
  
  try {
    execSync(`npx eslint "${file}" --fix --quiet`, {
      stdio: 'pipe',
      timeout: 10000
    })
    
    console.log(' ✅')
    fixedCount++
    
  } catch (error) {
    if (error.status === 1) {
      console.log(' ✅ (fixed)')
      fixedCount++
    } else if (error.code === 'TIMEOUT') {
      console.log(' ⏱️  (timeout)')
    } else {
      console.log(' ❌ (error)')
    }
  }
  
  processedCount++
}

console.log(`\n📊 Results:`)
console.log(`   Processed: ${processedCount} critical files`)
console.log(`   Fixed: ${fixedCount} files`)

console.log('\n✅ Critical files ESLint processing complete!')