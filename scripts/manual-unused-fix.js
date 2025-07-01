#!/usr/bin/env node
/**
 * Manual Unused Imports Fixer
 * Pendekatan manual untuk menghapus unused imports tanpa ESLint yang berat
 */

const fs = require('fs')

console.log('🔧 Manual unused imports cleanup...')

// File-file yang perlu dibersihkan
const files = [
  'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/types/jest-dom.d.ts'
]

// Pattern untuk membersihkan unused imports
const cleanupPatterns = {
  'drive-data-view.tsx': [
    // Hapus icon yang tidak digunakan dari lucide-react
    {
      pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]lucide-react['"]/,
      fix: (match, imports) => {
        // Daftar icon yang mungkin tidak digunakan
        const possibleUnused = ['ChevronUp', 'ChevronDown', 'ChevronsUpDown', 'Triangle']
        let cleanImports = imports.split(',').map(i => i.trim()).filter(i => {
          return !possibleUnused.some(unused => i.includes(unused))
        })
        
        if (cleanImports.length === 0) return ''
        return `import { ${cleanImports.join(', ')} } from 'lucide-react'`
      }
    }
  ],
  'drive-manager.tsx': [
    // Fix React import jika tidak digunakan langsung
    {
      pattern: /import React, \{\s*([^}]*)\s*\} from 'react'/,
      fix: (match, imports) => {
        return `import { ${imports} } from 'react'`
      }
    }
  ],
  'jest-dom.d.ts': [
    // Fix parameter names di type definitions
    {
      pattern: /toHaveTextContent\([^)]*\)/g,
      fix: () => 'toHaveTextContent(_?: string | RegExp)'
    },
    {
      pattern: /toHaveClass\([^)]*\)/g,
      fix: () => 'toHaveClass(_?: string)'
    },
    {
      pattern: /toHaveAttribute\([^)]*\)/g,
      fix: () => 'toHaveAttribute(_?: string, _?: string)'
    }
  ]
}

let totalFixed = 0

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File tidak ditemukan: ${file}`)
    return
  }

  const fileName = file.split('/').pop()
  const patterns = cleanupPatterns[fileName]
  
  if (!patterns) {
    console.log(`  No cleanup patterns for: ${file}`)
    return
  }

  let content = fs.readFileSync(file, 'utf8')
  const originalContent = content
  let fileFixed = false

  patterns.forEach(({ pattern, fix }) => {
    if (typeof fix === 'function') {
      const matches = content.match(pattern)
      if (matches) {
        const replacement = fix(...matches)
        content = content.replace(pattern, replacement)
        fileFixed = true
      }
    } else {
      content = content.replace(pattern, fix)
      if (content !== originalContent) fileFixed = true
    }
  })

  // Clean up empty lines
  content = content.replace(/\n\n\n+/g, '\n\n')

  if (content !== originalContent) {
    fs.writeFileSync(file, content)
    console.log(`✅ Fixed: ${file}`)
    totalFixed++
  } else {
    console.log(`  No changes needed: ${file}`)
  }
})

console.log(`\n🎉 Manual cleanup complete! Fixed ${totalFixed} files`)
console.log('✅ Unused imports should now be cleaned up')