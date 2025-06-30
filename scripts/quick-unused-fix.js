#!/usr/bin/env node
/**
 * Quick fix for critical unused imports/variables causing build failures
 */

const fs = require('fs')
const path = require('path')

// Direct fixes for known issues
const fixes = [
  {
    file: 'src/app/(main)/dashboard/drive/_components/drive-data-view.tsx',
    fixes: [
      // Remove any remaining unused lucide imports
      { from: /,\s*ChevronsUpDown/g, to: '' },
      { from: /ChevronsUpDown,\s*/g, to: '' },
      { from: /import\s*{\s*ChevronsUpDown\s*}\s*from\s*['"]lucide-react['"];?\s*/g, to: '' },
    ]
  },
  {
    file: 'src/types/jest-dom.d.ts',
    fixes: [
      // Fix unused parameter names in type definitions
      { from: /toHaveTextContent\([^)]*\)/, to: 'toHaveTextContent(_?: string | RegExp)' },
      { from: /toHaveClass\([^)]*\)/, to: 'toHaveClass(_?: string)' },
      { from: /toHaveAttribute\([^)]*\)/, to: 'toHaveAttribute(_?: string, _?: string)' },
    ]
  }
]

// Apply fixes to each file
fixes.forEach(({ file, fixes: fileFixes }) => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - not found`)
    return
  }

  let content = fs.readFileSync(file, 'utf8')
  let modified = false

  fileFixes.forEach(({ from, to }) => {
    const oldContent = content
    content = content.replace(from, to)
    if (content !== oldContent) {
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(file, content)
    console.log(`✓ Fixed ${file}`)
  } else {
    console.log(`  ${file} - no changes needed`)
  }
})

// Clean up common patterns across all TypeScript files
function cleanAllFiles() {
  const srcDir = './src'
  
  function processDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      
      if (item.isDirectory() && !item.name.startsWith('.')) {
        processDir(fullPath)
      } else if (item.isFile() && /\.(ts|tsx)$/.test(item.name)) {
        processFile(fullPath)
      }
    }
  }
  
  function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Remove empty import statements
    const oldContent = content
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '')
    
    // Clean up multiple empty lines
    content = content.replace(/\n\n\n+/g, '\n\n')
    
    if (content !== oldContent) {
      fs.writeFileSync(filePath, content)
      modified = true
    }
    
    return modified
  }
  
  processDir(srcDir)
}

cleanAllFiles()
console.log('✅ All unused imports cleaned up')