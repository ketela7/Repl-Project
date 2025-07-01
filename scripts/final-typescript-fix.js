#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final TypeScript exactOptionalPropertyTypes Fix');
console.log('==================================================');

// Define all the known fixes for exactOptionalPropertyTypes errors
const fixes = [
  {
    file: 'src/components/ui/bottom-sheet.tsx',
    patterns: [
      {
        search: /(\s+<Drawer\.Root[^>]*?)onOpenChange=\{onOpenChange\}/g,
        replace: '$1{...(onOpenChange && { onOpenChange })}'
      }
    ]
  },
  {
    file: 'src/components/ui/simple-date-picker.tsx',
    patterns: [
      {
        search: /value=\{months\[currentMonth\] \|\| undefined\}/g,
        replace: '{...(months[currentMonth] && { value: months[currentMonth] })}'
      }
    ]
  },
  {
    file: 'src/components/ui/slider.tsx',
    patterns: [
      {
        search: /value=\{value \|\| undefined\}/g,
        replace: '{...(value && { value })}'
      }
    ]
  },
  {
    file: 'src/components/ui/sonner.tsx',
    patterns: [
      {
        search: /theme=\{theme !== undefined \? theme as ToasterProps\["theme"\] : "system"\}/g,
        replace: 'theme={(theme as ToasterProps["theme"]) || "system"}'
      }
    ]
  },
  {
    file: 'src/components/file-icon.tsx',
    patterns: [
      {
        search: /return <FileIcon mimeType=\{mimeType\} fileName=\{fileName\} className=\{className\} \/>/g,
        replace: 'return <FileIcon mimeType={mimeType} {...(fileName && { fileName })} {...(className && { className })} />'
      }
    ]
  },
  {
    file: 'src/components/ui/context-menu.tsx',
    patterns: [
      {
        search: /checked=\{checked\}/g,
        replace: 'checked={checked || false}'
      }
    ]
  },
  {
    file: 'src/components/ui/dropdown-menu.tsx',
    patterns: [
      {
        search: /checked=\{checked\}/g,
        replace: 'checked={checked || false}'
      }
    ]
  }
];

// Apply fixes
let totalFixes = 0;

fixes.forEach(({ file, patterns }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = false;

    patterns.forEach(({ search, replace }) => {
      const matches = content.match(search);
      if (matches) {
        content = content.replace(search, replace);
        fileFixed = true;
        totalFixes += matches.length;
      }
    });

    if (fileFixed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`📊 Applied ${totalFixes} exactOptionalPropertyTypes fixes`);

// Clean up duplicate imports
const importCleanupFiles = [
  'src/components/file-icon.tsx',
  'src/components/drive-error-display.tsx',
  'src/components/drive-permission-required.tsx'
];

importCleanupFiles.forEach(file => {
  try {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove duplicate ReactNode imports
    const lines = content.split('\n');
    const seenImports = new Set();
    const cleanedLines = lines.filter(line => {
      if (line.includes("import type { ReactNode } from 'react'")) {
        if (seenImports.has('ReactNode')) {
          return false; // Skip duplicate
        }
        seenImports.add('ReactNode');
      }
      return true;
    });

    // Remove unused ReactNode import if not used in file
    const finalContent = cleanedLines.join('\n');
    if (!finalContent.includes(': ReactNode') && !finalContent.includes('<ReactNode>')) {
      const withoutUnusedImport = finalContent.replace(/import type \{ ReactNode \} from 'react'\n?/g, '');
      fs.writeFileSync(filePath, withoutUnusedImport);
      console.log(`🧹 Cleaned imports: ${file}`);
    } else {
      fs.writeFileSync(filePath, finalContent);
    }
  } catch (error) {
    console.log(`❌ Error cleaning imports in ${file}:`, error.message);
  }
});

console.log('✅ All exactOptionalPropertyTypes fixes completed');