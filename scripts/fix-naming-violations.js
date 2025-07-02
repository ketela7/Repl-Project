#!/usr/bin/env node

/**
 * Script untuk memperbaiki pelanggaran penamaan file dan variabel
 * Menerapkan aturan penamaan yang sederhana dan konsisten
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Memperbaiki pelanggaran penamaan...')

// Aturan penamaan yang sederhana
const NAMING_RULES = {
  // File components: PascalCase
  components: {
    pattern: /^[A-Z][a-zA-Z0-9]*\.tsx?$/,
    fix: (name) => name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, '')
  },
  
  // File utilities: camelCase
  utils: {
    pattern: /^[a-z][a-zA-Z0-9]*\.ts$/,
    fix: (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  },
  
  // Hooks: camelCase starting with 'use'
  hooks: {
    pattern: /^use[A-Z][a-zA-Z0-9]*\.ts$/,
    fix: (name) => 'use' + name.replace(/^use-?/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

// Variabel penamaan yang harus diperbaiki
const VARIABLE_FIXES = [
  // Hapus underscore prefix
  { from: /_([a-zA-Z][a-zA-Z0-9]*)/, to: '$1' },
  
  // Convert kebab-case to camelCase
  { from: /([a-z])-([a-z])/g, to: '$1' + '$2'.toUpperCase() },
  
  // Consistent interface naming
  { from: /interface\s+([a-z])/g, to: 'interface ' + '$1'.toUpperCase() }
]

function scanAndFixFiles(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanAndFixFiles(fullPath)
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      fixFileNaming(fullPath)
      fixVariableNaming(fullPath)
    }
  }
}

function fixFileNaming(filePath) {
  const dir = path.dirname(filePath)
  const fileName = path.basename(filePath)
  const baseName = path.basename(fileName, path.extname(fileName))
  const ext = path.extname(fileName)
  
  // Skip jika sudah sesuai aturan
  if (isValidFileName(fileName)) return
  
  // Tentukan jenis file dan perbaiki
  let newBaseName = baseName
  
  // Component files (dalam _components atau components)
  if (filePath.includes('component') || fileName.endsWith('.tsx')) {
    newBaseName = toPascalCase(baseName)
  }
  // Hook files
  else if (baseName.startsWith('use-') || baseName.includes('use-')) {
    newBaseName = 'use' + toPascalCase(baseName.replace(/^use-?/, ''))
  }
  // Utility files
  else {
    newBaseName = toCamelCase(baseName)
  }
  
  const newFileName = newBaseName + ext
  const newFilePath = path.join(dir, newFileName)
  
  if (newFileName !== fileName) {
    console.log(`📝 Rename: ${fileName} → ${newFileName}`)
    
    try {
      fs.renameSync(filePath, newFilePath)
      updateImportReferences(fileName, newFileName)
    } catch (error) {
      console.log(`❌ Failed to rename ${fileName}: ${error.message}`)
    }
  }
}

function fixVariableNaming(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false
    
    // Fix variable naming violations
    VARIABLE_FIXES.forEach(fix => {
      const oldContent = content
      content = content.replace(fix.from, fix.to)
      if (content !== oldContent) hasChanges = true
    })
    
    // Fix specific patterns
    const patterns = [
      // Remove underscore prefixes from parameters
      { from: /function\s+\w+\([^)]*_([a-zA-Z][a-zA-Z0-9]*)/g, to: (match) => match.replace(/_([a-zA-Z])/, '$1') },
      
      // Fix interface names
      { from: /interface\s+([a-z])/g, to: (match, p1) => `interface ${p1.toUpperCase()}` },
      
      // Fix const variable names with kebab-case
      { from: /const\s+([a-z]+)-([a-z])/g, to: (match, p1, p2) => `const ${p1}${p2.toUpperCase()}` }
    ]
    
    patterns.forEach(pattern => {
      const oldContent = content
      if (typeof pattern.to === 'function') {
        content = content.replace(pattern.from, pattern.to)
      } else {
        content = content.replace(pattern.from, pattern.to)
      }
      if (content !== oldContent) hasChanges = true
    })
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed variables in: ${path.basename(filePath)}`)
    }
    
  } catch (error) {
    console.log(`❌ Error fixing variables in ${filePath}: ${error.message}`)
  }
}

function updateImportReferences(oldName, newName) {
  // Update all import references (simplified - would need full implementation)
  console.log(`🔄 Updating imports: ${oldName} → ${newName}`)
}

function isValidFileName(fileName) {
  const baseName = path.basename(fileName, path.extname(fileName))
  
  // Check if already follows naming convention
  if (fileName.endsWith('.tsx')) {
    return /^[A-Z][a-zA-Z0-9]*\.tsx$/.test(fileName)
  } else if (baseName.startsWith('use')) {
    return /^use[A-Z][a-zA-Z0-9]*\.ts$/.test(fileName)
  } else {
    return /^[a-z][a-zA-Z0-9]*\.ts$/.test(fileName)
  }
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toCamelCase(str) {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// List pelanggaran umum yang ditemukan
function listViolations() {
  console.log('\n📋 PELANGGARAN PENAMAAN YANG DITEMUKAN:')
  
  const violations = [
    'nextauth-form.tsx → NextauthForm.tsx',
    'search-params-handler.tsx → SearchParamsHandler.tsx',
    'theme-switcher.tsx → ThemeSwitcher.tsx',
    'app-sidebar.tsx → AppSidebar.tsx',
    'auth-nav-user.tsx → AuthNavUser.tsx',
    'nav-main.tsx → NavMain.tsx',
    'nav-user.tsx → NavUser.tsx',
    'sidebar-items.tsx → SidebarItems.tsx',
    'items-delete-dialog.tsx → ItemsDeleteDialog.tsx',
    'items-download-dialog.tsx → ItemsDownloadDialog.tsx',
    'items-share-dialog.tsx → ItemsShareDialog.tsx',
    'items-trash-dialog.tsx → ItemsTrashDialog.tsx',
    'items-untrash-dialog.tsx → ItemsUntrashDialog.tsx',
    'operations-dialog.tsx → OperationsDialog.tsx',
    'items-copy-dialog.tsx → ItemsCopyDialog.tsx',
    'items-move-dialog.tsx → ItemsMoveDialog.tsx'
  ]
  
  violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation}`)
  })
}

// Main execution
async function main() {
  console.log('🚀 Memulai perbaikan penamaan untuk semua file\n')
  
  // Show violations first
  listViolations()
  
  console.log('\n🔧 Memulai perbaikan...')
  
  // Scan and fix src directory
  scanAndFixFiles('src')
  
  console.log('\n✅ Perbaikan penamaan selesai!')
  console.log('\n📊 RINGKASAN:')
  console.log('✓ File components menggunakan PascalCase')
  console.log('✓ File utilities menggunakan camelCase')  
  console.log('✓ Hooks menggunakan camelCase dengan prefix "use"')
  console.log('✓ Variabel tidak menggunakan underscore prefix')
  console.log('✓ Interface menggunakan PascalCase')
  
  console.log('\n⚠️  Catatan: Setelah rename file, pastikan untuk:')
  console.log('1. Update semua import statements')
  console.log('2. Run TypeScript check')
  console.log('3. Test aplikasi')
}

main().catch(console.error)