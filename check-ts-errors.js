#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking TypeScript Errors');
console.log('============================');

// Check specific patterns that commonly cause issues
const patterns = [
  'exactOptionalPropertyTypes',
  'never',
  'toISOString',
  'trim()',
  'Property.*does not exist',
  'not assignable to type'
];

// Target files we've been working on
const targetFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-toolbar.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-skeleton.tsx',
  'src/app/(main)/dashboard/drive/_components/file-details-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/filters-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/operations-dialog.tsx'
];

// Quick syntax check for each file
targetFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ Found: ${file}`);
    
    // Quick text search for common error patterns
    const content = fs.readFileSync(file, 'utf8');
    patterns.forEach(pattern => {
      if (content.includes(pattern.replace(/\.\*/g, ''))) {
        console.log(`  ⚠️  Contains pattern: ${pattern}`);
      }
    });
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

// Try a quick TypeScript check on one file
console.log('\n🔧 Quick TypeScript Check...');
const quickCheck = exec('npx tsc --noEmit --skipLibCheck src/app/layout.tsx', { timeout: 8000 });

quickCheck.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Basic TypeScript compilation working');
  } else {
    console.log('⚠️  TypeScript issues detected');
  }
});

quickCheck.on('error', () => {
  console.log('⏰ TypeScript check timed out');
});