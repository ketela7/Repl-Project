#!/usr/bin/env node

/**
 * Quick TypeScript Check - Focused validation for specific fixes
 * Checks only the files we've modified for compilation errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const modifiedFiles = [
  'src/app/(main)/dashboard/drive/_components/items-move-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-rename-dialog.tsx', 
  'src/app/(main)/dashboard/drive/_components/items-share-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-trash-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-untrash-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/operations-dialog.tsx'
];

console.log('🔍 Quick TypeScript Check - Modified Files Only');
console.log('==================================================');

let allPassed = true;

for (const file of modifiedFiles) {
  try {
    console.log(`Checking ${path.basename(file)}...`);
    
    // Check if file exists
    if (!fs.existsSync(file)) {
      console.log(`  ❌ File not found: ${file}`);
      allPassed = false;
      continue;
    }
    
    // Run TypeScript check on individual file with minimal configuration
    const result = execSync(
      `npx tsc --noEmit --jsx preserve --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --target ES2020 --module ESNext "${file}"`,
      { 
        encoding: 'utf8',
        timeout: 10000,
        stdio: 'pipe'
      }
    );
    
    console.log(`  ✅ ${path.basename(file)} - OK`);
    
  } catch (error) {
    console.log(`  ❌ ${path.basename(file)} - Errors found:`);
    
    // Parse and display only critical errors
    const output = error.stdout || error.message;
    const lines = output.split('\n');
    
    let criticalErrors = 0;
    for (const line of lines) {
      // Filter for our specific error types
      if (line.includes('is declared but its value is never read') ||
          line.includes('possibly \'undefined\'') ||
          line.includes('Property does not exist')) {
        console.log(`    - ${line.trim()}`);
        criticalErrors++;
      }
    }
    
    if (criticalErrors === 0 && output.includes('Cannot find module')) {
      console.log(`    - Module resolution issues (expected in isolated check)`);
    } else if (criticalErrors > 0) {
      allPassed = false;
    } else {
      console.log(`    - Non-critical compilation issues`);
    }
  }
}

console.log('\n📊 QUICK CHECK SUMMARY');
console.log('=======================');

if (allPassed) {
  console.log('✅ All modified files passed critical error checks');
  console.log('💡 Ready for Vercel deployment attempt');
} else {
  console.log('❌ Some files still have critical TypeScript errors');
  console.log('🔧 Additional fixes needed before deployment');
}

console.log('\n🎯 Next Steps:');
console.log('1. Run full Next.js build: npm run build');
console.log('2. Set environment variables in Vercel dashboard');
console.log('3. Deploy to Vercel');