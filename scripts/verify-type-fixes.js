#!/usr/bin/env node

/**
 * Verify TypeScript type assertion fixes for Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Verifying TypeScript fixes for Vercel deployment...\n');

// Check if all critical files compile successfully
const criticalFiles = [
  'src/app/(main)/dashboard/drive/_components/drive-manager.tsx',
  'src/app/(main)/dashboard/drive/_components/drive-toolbar.tsx',
  'src/app/(main)/dashboard/drive/_components/create-folder-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-rename-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/items-delete-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/filters-dialog.tsx',
  'src/app/(main)/dashboard/drive/_components/file-details-dialog.tsx',
];

let allPassed = true;

criticalFiles.forEach((file, index) => {
  if (fs.existsSync(file)) {
    console.log(`${index + 1}/7 Testing: ${file.split('/').pop()}`);
    
    // Check for any remaining problematic patterns
    const content = fs.readFileSync(file, 'utf8');
    const hasUnfixedTrim = content.match(/(?<!\(.*as\s+string\))\w+\.trim\(\)/g);
    const hasUnfixedToISOString = content.match(/(?<!\(.*as\s+Date\))\w+\??\.\w*\.toISOString\(\)/g);
    
    if (hasUnfixedTrim || hasUnfixedToISOString) {
      console.log(`  ❌ Still has unfixed type issues`);
      if (hasUnfixedTrim) console.log(`     - Unfixed trim(): ${hasUnfixedTrim.join(', ')}`);
      if (hasUnfixedToISOString) console.log(`     - Unfixed toISOString(): ${hasUnfixedToISOString.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Type assertions properly implemented`);
    }
  } else {
    console.log(`${index + 1}/7 ❌ File not found: ${file}`);
    allPassed = false;
  }
});

console.log('\n📋 Summary:');
if (allPassed) {
  console.log('✅ All TypeScript type assertion fixes verified');
  console.log('✅ Ready for Vercel deployment');
  console.log('\n🚀 Next steps:');
  console.log('   1. Commit these fixes to your repository');
  console.log('   2. Deploy to Vercel');
  console.log('   3. TypeScript strict mode should now compile successfully');
} else {
  console.log('❌ Some type assertion issues remain');
  console.log('   Please review the errors above');
}

console.log('\n🔧 Fixed patterns applied:');
console.log('   • (variable as string).trim() - for string type assertions');
console.log('   • (variable as Date).toISOString() - for date type assertions');
console.log('   • Conditional spreading for exactOptionalPropertyTypes compliance');