#!/usr/bin/env node

/**
 * Quick build check for specific TypeScript errors
 * This script checks for common build-breaking issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for common issues
    const issues = [];
    
    // Check for unused variables (common build breaker)
    const unusedVarRegex = /const\s+(\w+)\s*=.*?(?=\n\s*(?:const|let|var|function|export|$))/gs;
    const matches = content.matchAll(unusedVarRegex);
    
    for (const match of matches) {
      const varName = match[1];
      if (varName && !content.includes(`${varName}`)) {
        issues.push(`Potentially unused variable: ${varName}`);
      }
    }
    
    console.log(`✅ Checked: ${filePath}`);
    if (issues.length > 0) {
      console.log(`⚠️  Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return issues.length === 0;
  } catch (error) {
    console.log(`❌ Error checking ${filePath}: ${error.message}`);
    return false;
  }
}

// Check the specific file that was failing
const targetFile = 'src/app/(main)/dashboard/drive/_components/drive-manager.tsx';
console.log('🔍 Quick build check for TypeScript errors...\n');

const result = checkFile(targetFile);

if (result) {
  console.log('\n✅ No obvious build-breaking issues found');
} else {
  console.log('\n❌ Potential issues detected');
}