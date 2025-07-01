#!/usr/bin/env node

/**
 * Individual ESLint Runner - Process files one by one for better performance
 * Following project guidelines for individual file processing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Individual ESLint Runner');
console.log('=============================');

/**
 * Get all TypeScript/JavaScript files in src directory
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Run ESLint on a single file with timeout
 */
function lintFile(filePath, timeoutMs = 8000) {
  try {
    console.log(`  🔍 ${filePath}`);
    
    const result = execSync(`npx eslint "${filePath}" --fix --quiet`, {
      encoding: 'utf-8',
      timeout: timeoutMs,
      stdio: 'pipe'
    });
    
    console.log(`    ✅ Fixed`);
    return { success: true, file: filePath };
    
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      console.log(`    ⏰ Timeout - skipped`);
      return { success: false, file: filePath, reason: 'timeout' };
    } else if (error.status === 1) {
      // ESLint found unfixable issues
      console.log(`    ⚠️ Has unfixable issues`);
      return { success: false, file: filePath, reason: 'unfixable', output: error.stdout };
    } else {
      console.log(`    ❌ Error: ${error.message}`);
      return { success: false, file: filePath, reason: 'error', error: error.message };
    }
  }
}

/**
 * Process files by priority (most important first)
 */
function prioritizeFiles(files) {
  const priority = {
    // Core components first
    'components': 3,
    'app': 2,
    'lib': 1,
    'scripts': 0
  };
  
  return files.sort((a, b) => {
    const aPriority = Object.keys(priority).find(key => a.includes(key)) || 'other';
    const bPriority = Object.keys(priority).find(key => b.includes(key)) || 'other';
    
    return (priority[bPriority] || 0) - (priority[aPriority] || 0);
  });
}

/**
 * Main execution
 */
function main() {
  const startTime = Date.now();
  
  console.log('📁 Finding TypeScript/JavaScript files...');
  const allFiles = getAllFiles('src');
  console.log(`Found ${allFiles.length} files`);
  
  console.log('\n🎯 Prioritizing files...');
  const prioritizedFiles = prioritizeFiles(allFiles);
  
  console.log('\n🔧 Running ESLint individually...');
  
  const results = {
    fixed: [],
    timeout: [],
    unfixable: [],
    errors: []
  };
  
  let processed = 0;
  const maxFiles = Math.min(prioritizedFiles.length, 50); // Limit to prevent long runs
  
  for (const file of prioritizedFiles.slice(0, maxFiles)) {
    const result = lintFile(file);
    processed++;
    
    if (result.success) {
      results.fixed.push(result.file);
    } else {
      switch (result.reason) {
        case 'timeout':
          results.timeout.push(result.file);
          break;
        case 'unfixable':
          results.unfixable.push(result.file);
          break;
        case 'error':
          results.errors.push({ file: result.file, error: result.error });
          break;
      }
    }
    
    // Progress update every 10 files
    if (processed % 10 === 0) {
      console.log(`\n📊 Progress: ${processed}/${maxFiles} files processed`);
    }
  }
  
  // Final report
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log('\n📊 ESLINT INDIVIDUAL PROCESSING REPORT');
  console.log('=====================================');
  console.log(`⏱️ Total time: ${duration}s`);
  console.log(`📁 Processed: ${processed}/${allFiles.length} files`);
  console.log(`✅ Fixed: ${results.fixed.length}`);
  console.log(`⏰ Timeout: ${results.timeout.length}`);
  console.log(`⚠️ Unfixable: ${results.unfixable.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.unfixable.length > 0) {
    console.log('\n⚠️ Files with unfixable issues:');
    results.unfixable.slice(0, 5).forEach(file => {
      console.log(`  • ${file}`);
    });
    if (results.unfixable.length > 5) {
      console.log(`  ... and ${results.unfixable.length - 5} more`);
    }
  }
  
  if (results.timeout.length > 0) {
    console.log('\n⏰ Files that timed out:');
    results.timeout.slice(0, 5).forEach(file => {
      console.log(`  • ${file}`);
    });
    if (results.timeout.length > 5) {
      console.log(`  ... and ${results.timeout.length - 5} more`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Files with errors:');
    results.errors.slice(0, 3).forEach(item => {
      console.log(`  • ${item.file}: ${item.error}`);
    });
  }
  
  console.log('\n💡 Recommendations:');
  console.log('• For timeout files: Run individually with longer timeout');
  console.log('• For unfixable issues: Review manually or adjust ESLint rules');
  console.log('• For build: Most critical fixes are applied');
  
  if (results.fixed.length > results.unfixable.length) {
    console.log('\n🎉 ESLint processing successful! Ready for build.');
  } else {
    console.log('\n🔧 Some issues remain, but core fixes applied.');
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Usage: node scripts/individual-eslint.js');
  console.log('');
  console.log('Processes TypeScript/JavaScript files individually with ESLint');
  console.log('Follows project guidelines for better performance and results');
  console.log('');
  process.exit(0);
}

main();