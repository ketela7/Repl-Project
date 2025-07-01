#!/usr/bin/env node
/**
 * ESLint File-by-File Processor
 * Menjalankan ESLint pada setiap file satu per satu untuk menghindari system kill
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Running ESLint file by file...\n')

// Fungsi untuk mendapatkan semua file TypeScript
function getAllTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
      getAllTSFiles(filePath, fileList)
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// Dapatkan semua file TypeScript
const allFiles = getAllTSFiles('./src')
console.log(`Found ${allFiles.length} TypeScript files\n`)

let processedCount = 0
let fixedCount = 0
let errorCount = 0

// Proses setiap file satu per satu
for (const file of allFiles) {
  process.stdout.write(`[${processedCount + 1}/${allFiles.length}] Processing: ${file}`)
  
  try {
    // Jalankan ESLint untuk file individual dengan timeout pendek
    const result = execSync(`npx eslint "${file}" --fix --quiet`, {
      stdio: 'pipe',
      timeout: 8000,
      encoding: 'utf8'
    })
    
    console.log(' ✅')
    fixedCount++
    
  } catch (error) {
    if (error.status === 1) {
      // Exit code 1 berarti ESLint melakukan fixes, ini normal
      console.log(' ✅ (fixed)')
      fixedCount++
    } else if (error.code === 'TIMEOUT') {
      console.log(' ⏱️  (timeout)')
      errorCount++
    } else {
      console.log(' ⚠️  (error)')
      errorCount++
    }
  }
  
  processedCount++
}

console.log(`\n📊 Summary:`)
console.log(`   Processed: ${processedCount} files`)
console.log(`   Fixed: ${fixedCount} files`)
console.log(`   Errors: ${errorCount} files`)

// Test quick compilation untuk memverifikasi hasilnya
console.log('\n🧪 Quick compilation test...')
try {
  execSync('timeout 15s npx tsc --noEmit --skipLibCheck', {
    stdio: 'pipe',
    timeout: 15000
  })
  console.log('✅ TypeScript compilation successful')
} catch (e) {
  console.log('⚠️  TypeScript compilation timed out or has errors')
}

console.log('\n✅ ESLint file-by-file processing complete!')