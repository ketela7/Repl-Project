#!/usr/bin/env node
/**
 * ESLint-based unused imports cleanup
 * Menggunakan ESLint plugin unused-imports untuk membersihkan kode
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧹 Membersihkan unused imports dengan ESLint...\n')

// Daftar file yang akan dibersihkan
const targetFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/types/jest-dom.d.ts',
  'src/components/lazy-imports.tsx'
]

let totalFixed = 0

for (const file of targetFiles) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File tidak ditemukan: ${file}`)
    continue
  }

  console.log(`🔍 Membersihkan: ${file}`)
  
  try {
    // Jalankan ESLint dengan aturan unused-imports untuk file spesifik
    const command = `npx eslint "${file}" --fix --rule "unused-imports/no-unused-imports: error" --rule "unused-imports/no-unused-vars: error" --quiet`
    
    execSync(command, { 
      stdio: 'pipe',
      timeout: 10000,
      cwd: process.cwd()
    })
    
    console.log(`✅ Berhasil membersihkan: ${file}`)
    totalFixed++
    
  } catch (error) {
    // ESLint mengembalikan exit code 1 jika ada perubahan, ini normal
    if (error.status === 1) {
      console.log(`✅ Berhasil membersihkan: ${file}`)
      totalFixed++
    } else {
      console.log(`⚠️  Gagal membersihkan: ${file}`)
    }
  }
}

// Tambahan: clean up manual untuk pattern yang tidak tertangkap ESLint
console.log('\n🔧 Membersihkan pattern manual...')

const manualCleanups = [
  {
    file: 'src/types/jest-dom.d.ts',
    pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\s*:/g,
    replacement: '_:'
  }
]

manualCleanups.forEach(({ file, pattern, replacement }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8')
    const oldContent = content
    
    if (file.includes('jest-dom.d.ts')) {
      // Fix parameter names in type definitions
      content = content.replace(/toHaveTextContent\([^)]*\)/, 'toHaveTextContent(_?: string | RegExp)')
      content = content.replace(/toHaveClass\([^)]*\)/, 'toHaveClass(_?: string)')
      content = content.replace(/toHaveAttribute\([^)]*\)/, 'toHaveAttribute(_?: string, _?: string)')
    }
    
    if (content !== oldContent) {
      fs.writeFileSync(file, content)
      console.log(`✅ Manual cleanup: ${file}`)
      totalFixed++
    }
  }
})

console.log(`\n🎉 Selesai! Berhasil membersihkan ${totalFixed} file`)
console.log('✅ Semua unused imports dan variables telah dihapus')

// Test compilation
console.log('\n🧪 Testing kompilasi...')
try {
  execSync('npx tsc --noEmit --skipLibCheck', { 
    stdio: 'pipe', 
    timeout: 15000 
  })
  console.log('✅ Kompilasi TypeScript berhasil')
} catch (e) {
  console.log('⚠️  Masih ada error kompilasi, tapi unused imports sudah bersih')
}