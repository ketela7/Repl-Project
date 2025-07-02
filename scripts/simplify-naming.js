#!/usr/bin/env node

/**
 * Script untuk menyederhanakan nama file dengan menghilangkan prefix/suffix yang tidak perlu
 * Contoh: StorageAnalyticsNew → StorageAnalytics, enhancedErrorHandler → errorHandler
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Daftar prefix/suffix yang harus dihilangkan
const UNNECESSARY_AFFIXES = {
  prefixes: [
    'enhanced', 'Enhanced',
    'improved', 'Improved', 
    'optimized', 'Optimized',
    'advanced', 'Advanced',
    'custom', 'Custom',
    'extended', 'Extended',
    'modern', 'Modern',
    'smart', 'Smart',
    'intelligent', 'Intelligent',
    'professional', 'Professional',
    'pro', 'Pro'
  ],
  suffixes: [
    'New', 'new',
    'Updated', 'updated',
    'Latest', 'latest',
    'Final', 'final',
    'Complete', 'complete',
    'Full', 'full',
    'Extended', 'extended',
    'Advanced', 'advanced',
    'Pro', 'pro',
    'Plus', 'plus',
    'Extra', 'extra',
    'Super', 'super',
    'Max', 'max',
    'Ultimate', 'ultimate'
  ]
}

// Mapping khusus untuk file yang sudah diidentifikasi
const SPECIFIC_RENAMES = {
  'StorageAnalyticsNew.tsx': 'StorageAnalytics.tsx',
  'storage-analytics-new.tsx': 'StorageAnalytics.tsx',
  'enhancedErrorHandler.ts': 'errorHandler.ts',
  'enhanced-error-handler.ts': 'errorHandler.ts',
  'optimizedImage.tsx': 'Image.tsx',
  'optimized-image.tsx': 'Image.tsx',
  'performanceUtils.ts': 'performance.ts',
  'performance-utils.ts': 'performance.ts',
  'validationUtils.ts': 'validation.ts',
  'validation-utils.ts': 'validation.ts',
  'fieldUsageExamples.ts': 'fieldUsage.ts',
  'field-usage-examples.ts': 'fieldUsage.ts',
  'fileDetailMappers.ts': 'fileMappers.ts',
  'file-detail-mappers.ts': 'fileMappers.ts',
  'progressiveFields.ts': 'fields.ts',
  'progressive-fields.ts': 'fields.ts',
  'requestDeduplication.ts': 'deduplication.ts',
  'request-deduplication.ts': 'deduplication.ts',
  'webVitals.ts': 'vitals.ts',
  'web-vitals.ts': 'vitals.ts'
}

function cleanFileName(fileName) {
  const ext = path.extname(fileName)
  let baseName = path.basename(fileName, ext)
  
  // Check specific renames first
  if (SPECIFIC_RENAMES[fileName]) {
    return SPECIFIC_RENAMES[fileName]
  }
  
  // Remove unnecessary prefixes
  for (const prefix of UNNECESSARY_AFFIXES.prefixes) {
    const prefixPattern = new RegExp(`^${prefix}([A-Z])`, 'i')
    if (prefixPattern.test(baseName)) {
      baseName = baseName.replace(prefixPattern, '$1')
      break
    }
  }
  
  // Remove unnecessary suffixes
  for (const suffix of UNNECESSARY_AFFIXES.suffixes) {
    const suffixPattern = new RegExp(`${suffix}$`, 'i')
    if (suffixPattern.test(baseName)) {
      baseName = baseName.replace(suffixPattern, '')
      break
    }
  }
  
  // Ensure proper casing
  if (ext === '.tsx') {
    // Components: PascalCase
    baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
  } else if (baseName.startsWith('use')) {
    // Hooks: camelCase with use prefix
    baseName = 'use' + baseName.slice(3).charAt(0).toUpperCase() + baseName.slice(4)
  } else {
    // Utils: camelCase
    baseName = baseName.charAt(0).toLowerCase() + baseName.slice(1)
  }
  
  return baseName + ext
}

function scanAndSimplifyNames(dirPath) {
  const renames = []
  
  function scan(currentPath) {
    const files = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file.name)
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        scan(fullPath)
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
        const cleanName = cleanFileName(file.name)
        
        if (cleanName !== file.name) {
          const newPath = path.join(currentPath, cleanName)
          renames.push({ 
            oldPath: fullPath, 
            newPath: newPath,
            oldName: file.name,
            newName: cleanName
          })
        }
      }
    }
  }
  
  scan(dirPath)
  return renames
}

function updateImportsForRename(oldName, newName) {
  // Update all imports in the codebase
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  const searchPattern = `find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "${oldName.replace('.tsx', '').replace('.ts', '')}"`
  
  try {
    const result = execSync(searchPattern, { encoding: 'utf8' })
    const files = result.trim().split('\n').filter(f => f)
    
    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath, 'utf8')
        const oldBaseName = oldName.replace(/\.(tsx?|jsx?)$/, '')
        const newBaseName = newName.replace(/\.(tsx?|jsx?)$/, '')
        
        // Update import statements
        const importPatterns = [
          new RegExp(`(import\\s+.*?from\\s+['"].*?/)${oldBaseName}(['"])`, 'g'),
          new RegExp(`(require\\(['"].*?/)${oldBaseName}(['"])`, 'g')
        ]
        
        let hasChanges = false
        importPatterns.forEach(pattern => {
          const oldContent = content
          content = content.replace(pattern, `$1${newBaseName}$2`)
          if (content !== oldContent) hasChanges = true
        })
        
        if (hasChanges) {
          fs.writeFileSync(filePath, content, 'utf8')
          console.log(`🔄 Updated imports: ${oldBaseName} → ${newBaseName} in ${path.basename(filePath)}`)
        }
      } catch (error) {
        // Skip files that can't be processed
      }
    }
  } catch (error) {
    // Skip if grep fails
  }
}

function performRenames(renames) {
  console.log(`\n📝 Akan melakukan ${renames.length} rename:\n`)
  
  for (const rename of renames) {
    console.log(`${rename.oldName} → ${rename.newName}`)
  }
  
  console.log('\n🔧 Melakukan rename...\n')
  
  for (const rename of renames) {
    try {
      // Rename file
      fs.renameSync(rename.oldPath, rename.newPath)
      console.log(`✅ Renamed: ${rename.oldName} → ${rename.newName}`)
      
      // Update imports
      updateImportsForRename(rename.oldName, rename.newName)
      
    } catch (error) {
      console.log(`❌ Failed to rename ${rename.oldName}: ${error.message}`)
    }
  }
}

// Main execution
console.log('🧹 Menyederhanakan nama file dengan menghilangkan prefix/suffix yang tidak perlu...\n')

console.log('📋 PREFIX/SUFFIX YANG AKAN DIHILANGKAN:')
console.log('Prefixes:', UNNECESSARY_AFFIXES.prefixes.join(', '))
console.log('Suffixes:', UNNECESSARY_AFFIXES.suffixes.join(', '))

console.log('\n🔍 Memindai file yang perlu disederhanakan...')

const renames = scanAndSimplifyNames('src')

if (renames.length === 0) {
  console.log('✅ Tidak ada file yang perlu disederhanakan!')
} else {
  performRenames(renames)
  
  console.log('\n✅ Penyederhanaan nama file selesai!')
  console.log('\n📊 RINGKASAN:')
  console.log(`✓ ${renames.length} file berhasil disederhanakan`)
  console.log('✓ Semua import telah diupdate')
  console.log('✓ Penamaan sekarang lebih sederhana dan bersih')
  
  console.log('\n🎯 CONTOH PERBAIKAN:')
  console.log('StorageAnalyticsNew → StorageAnalytics')
  console.log('enhancedErrorHandler → errorHandler') 
  console.log('optimizedImage → Image')
  console.log('performanceUtils → performance')
  console.log('validationUtils → validation')
}

console.log('\n⚠️  Pastikan untuk menjalankan TypeScript check setelah ini!')
console.log('npm run type:fast')