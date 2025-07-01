#!/usr/bin/env node

/**
 * ESLint Directory-by-Directory Processor
 * Runs ESLint on each directory individually for better error tracking
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all directories containing TypeScript files
function getDirectories(srcPath) {
  const directories = new Set();
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        directories.add(currentPath);
      }
    }
  }
  
  traverse(srcPath);
  return Array.from(directories).sort();
}

// Run ESLint on a directory
function lintDirectory(directory) {
  try {
    console.log(`\n📁 Checking: ${directory}`);
    
    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
      .map(file => path.join(directory, file));
    
    if (files.length === 0) {
      console.log('  📄 No TypeScript files found');
      return { success: true, errors: 0, warnings: 0 };
    }
    
    console.log(`  📄 Found ${files.length} file(s)`);
    
    const result = execSync(
      `npx eslint ${files.join(' ')} --format compact`,
      { 
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe'
      }
    );
    
    console.log('  ✅ No errors found');
    return { success: true, errors: 0, warnings: 0 };
    
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n').filter(line => line.trim());
    
    let errors = 0;
    let warnings = 0;
    let fixableErrors = 0;
    
    console.log('  ❌ Issues found:');
    
    for (const line of lines) {
      if (line.includes(': error ')) {
        errors++;
        if (line.includes('(fixable)') || 
            line.includes('@typescript-eslint/no-unused-vars') ||
            line.includes('unused-imports')) {
          fixableErrors++;
        }
        console.log(`    🔴 ${line.split(': error ')[1] || line}`);
      } else if (line.includes(': warning ')) {
        warnings++;
        console.log(`    🟡 ${line.split(': warning ')[1] || line}`);
      }
    }
    
    console.log(`  📊 Errors: ${errors}, Warnings: ${warnings}, Fixable: ${fixableErrors}`);
    
    // Try auto-fix if possible
    if (fixableErrors > 0) {
      try {
        console.log('  🔧 Attempting auto-fix...');
        execSync(
          `npx eslint ${files.join(' ')} --fix --quiet`,
          { timeout: 15000, stdio: 'pipe' }
        );
        console.log('  ✅ Auto-fix completed');
        return { success: true, errors: errors - fixableErrors, warnings, fixed: fixableErrors };
      } catch (fixError) {
        console.log('  ⚠️ Auto-fix partial or failed');
      }
    }
    
    return { success: false, errors, warnings, fixableErrors };
  }
}

// Main execution
async function main() {
  console.log('🔧 ESLint Directory-by-Directory Analysis');
  console.log('==========================================');
  
  const srcDirectories = getDirectories('src');
  console.log(`📂 Found ${srcDirectories.length} directories with TypeScript files`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalFixed = 0;
  const problemDirectories = [];
  
  for (const directory of srcDirectories) {
    const result = lintDirectory(directory);
    
    totalErrors += result.errors || 0;
    totalWarnings += result.warnings || 0;
    totalFixed += result.fixed || 0;
    
    if (!result.success) {
      problemDirectories.push({
        directory,
        errors: result.errors,
        warnings: result.warnings
      });
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log(`Auto-fixed: ${totalFixed}`);
  console.log(`Problem Directories: ${problemDirectories.length}`);
  
  if (problemDirectories.length > 0) {
    console.log('\n🎯 Directories needing attention:');
    for (const item of problemDirectories) {
      console.log(`  📁 ${item.directory} - ${item.errors} errors, ${item.warnings} warnings`);
    }
  }
  
  if (totalErrors === 0) {
    console.log('\n🎉 All directories passed ESLint checks!');
  } else {
    console.log('\n🔧 Manual fixes needed for remaining errors');
  }
}

main().catch(console.error);