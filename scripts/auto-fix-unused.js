#!/usr/bin/env node

/**
 * Auto-fix unused variables and imports using ESLint
 * Configured for the Google Drive Pro project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Auto-fixing unused variables and imports...');

// Priority files that need immediate fixing
const priorityFiles = [
  'src/components/ui/simple-date-picker.tsx',
  'src/components/ui/slider.tsx', 
  'src/components/ui/sonner.tsx',
  'src/lib/google-drive/service.ts'
];

// ESLint rules for unused variables
const unusedVarRules = [
  'unused-imports/no-unused-imports',
  'unused-imports/no-unused-vars',
  '@typescript-eslint/no-unused-vars'
];

function runESLintFix(filePath, rules = []) {
  try {
    const ruleArgs = rules.length > 0 
      ? rules.map(rule => `--rule "${rule}: error"`).join(' ')
      : '';
    
    const command = `npx eslint "${filePath}" --fix --quiet ${ruleArgs}`;
    console.log(`🔧 Fixing: ${filePath}`);
    
    const result = execSync(command, { 
      encoding: 'utf8', 
      timeout: 10000,
      stdio: 'pipe'
    });
    
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`⚠️  Skipped: ${filePath} (${error.message.split('\n')[0]})`);
    return false;
  }
}

function fixPriorityFiles() {
  console.log('\n🎯 Fixing priority files...');
  let fixedCount = 0;
  
  for (const filePath of priorityFiles) {
    if (fs.existsSync(filePath)) {
      if (runESLintFix(filePath, unusedVarRules)) {
        fixedCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }
  
  return fixedCount;
}

function fixAllComponents() {
  console.log('\n🔄 Auto-fixing all UI components...');
  const patterns = [
    'src/components/ui/*.tsx',
    'src/app/**/components/*.tsx'
  ];
  
  let fixedCount = 0;
  
  for (const pattern of patterns) {
    try {
      const command = `npx eslint "${pattern}" --fix --quiet --rule "unused-imports/no-unused-imports: error"`;
      execSync(command, { 
        encoding: 'utf8', 
        timeout: 15000,
        stdio: 'pipe'
      });
      fixedCount++;
      console.log(`✅ Fixed pattern: ${pattern}`);
    } catch (error) {
      console.log(`⚠️  Pattern failed: ${pattern}`);
    }
  }
  
  return fixedCount;
}

function main() {
  console.log('Starting auto-fix process...\n');
  
  const startTime = Date.now();
  
  // Fix priority files first
  const priorityFixed = fixPriorityFiles();
  
  // Fix all components
  const allFixed = fixAllComponents();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Auto-fix Summary:');
  console.log(`✅ Priority files fixed: ${priorityFixed}/${priorityFiles.length}`);
  console.log(`🔧 Component patterns processed: ${allFixed}`);
  console.log(`⏱️  Total time: ${duration}s`);
  
  if (priorityFixed === priorityFiles.length) {
    console.log('\n🎉 All priority files have been auto-fixed!');
    console.log('💡 Run "npm run build" to verify compilation');
  } else {
    console.log('\n⚠️  Some files need manual attention');
    console.log('💡 Check the output above for details');
  }
}

if (require.main === module) {
  main();
}

module.exports = { runESLintFix, fixPriorityFiles, fixAllComponents };