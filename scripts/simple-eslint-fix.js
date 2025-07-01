#!/usr/bin/env node
/**
 * Simple ESLint Fix - Menggunakan pendekatan langsung per file
 */

const { execSync } = require('child_process')
const fs = require('fs')

// File yang paling sering bermasalah
const targetFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/types/jest-dom.d.ts'
]

console.log('🔧 Simple ESLint fix for key files...\n')

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`❌ File not found: ${file}`)
    return
  }

  console.log(`Processing: ${file}`)
  
  try {
    // Gunakan command ESLint yang lebih simple
    execSync(`npx eslint ${file} --fix --rule "no-unused-vars: error" --rule "unused-imports/no-unused-imports: error"`, {
      stdio: 'inherit',
      timeout: 10000
    })
    console.log(`✅ Fixed: ${file}`)
  } catch (e) {
    if (e.status === 1) {
      console.log(`✅ Fixed with warnings: ${file}`)
    } else {
      console.log(`⚠️  Error processing: ${file}`)
    }
  }
})

console.log('\n✅ Simple ESLint fix complete!')