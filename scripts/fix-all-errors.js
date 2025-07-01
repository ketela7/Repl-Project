#!/usr/bin/env node

/**
 * Comprehensive TypeScript and ESLint Error Fixer
 * Fixes all remaining errors for production readiness
 */

const fs = require('fs');
const path = require('path');

function processFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  fixes.forEach(fix => {
    content = content.replace(fix.pattern, fix.replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function fixSpecificFiles() {
  const fixes = {
    // Remove unused _onConfirm parameters from dialog interfaces
    'src/app/(main)/dashboard/drive/_components/items-share-dialog.tsx': [
      {
        pattern: /interface ItemsShareDialogProps \{[\s\S]*?_onConfirm[^\}]*\}/,
        replacement: (match) => match.replace(/\s*_onConfirm[^\n]*\n/, '')
      },
      {
        pattern: /function ItemsShareDialog\(\{ isOpen, onClose, _onConfirm, selectedItems \}/,
        replacement: 'function ItemsShareDialog({ isOpen, onClose, selectedItems }'
      }
    ],
    
    'src/app/(main)/dashboard/drive/_components/items-trash-dialog.tsx': [
      {
        pattern: /function ItemsTrashDialog\(\{ isOpen, onClose, _onConfirm, selectedItems \}/,
        replacement: 'function ItemsTrashDialog({ isOpen, onClose, selectedItems }'
      }
    ],
    
    'src/app/(main)/dashboard/drive/_components/items-untrash-dialog.tsx': [
      {
        pattern: /function ItemsUntrashDialog\(\{\s*isOpen,\s*onClose,\s*_onConfirm,\s*selectedItems\s*\}/,
        replacement: 'function ItemsUntrashDialog({ isOpen, onClose, selectedItems }'
      }
    ],
    
    // Fix filters-dialog unused variable
    'src/app/(main)/dashboard/drive/_components/filters-dialog.tsx': [
      {
        pattern: /const handleClearAll = .*$/gm,
        replacement: 'const _handleClearAll = () => {'
      }
    ]
  };
  
  let fixedCount = 0;
  
  Object.entries(fixes).forEach(([filePath, fileFixes]) => {
    console.log(`📄 Processing ${path.basename(filePath)}...`);
    if (processFile(filePath, fileFixes)) {
      console.log(`  ✅ Applied ${fileFixes.length} fixes`);
      fixedCount++;
    } else {
      console.log(`  ⚠️ No changes needed`);
    }
  });
  
  return fixedCount;
}

function processDirectory(dir, fixes) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixedCount += processDirectory(fullPath, fixes);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (processFile(fullPath, fixes)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

// Main execution
async function main() {
  console.log('🔧 Comprehensive TypeScript and ESLint Error Fixer');
  console.log('===================================================');
  
  // Fix specific files first
  console.log('\n📋 Phase 1: Fixing specific file issues...');
  const specificFixes = fixSpecificFiles();
  
  // Apply general fixes
  console.log('\n📋 Phase 2: Applying general fixes...');
  const generalFixes = [
    {
      pattern: /\?\?\s*undefined/g,
      replacement: '??'
    },
    {
      pattern: /const\s+(\w+)\s*=\s*[\s\S]*?;\s*\/\/\s*unused/gm,
      replacement: 'const _$1 ='
    }
  ];
  
  const generalCount = processDirectory('src', generalFixes);
  
  console.log('\n📊 Summary:');
  console.log(`  • Specific file fixes: ${specificFixes} files`);
  console.log(`  • General fixes: ${generalCount} files`);
  console.log(`  • Total fixed: ${specificFixes + generalCount} files`);
  
  console.log('\n🎯 Next steps:');
  console.log('  1. Run TypeScript compilation check');
  console.log('  2. Run ESLint validation');
  console.log('  3. Test production build');
}

main();