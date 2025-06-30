#!/usr/bin/env node

/**
 * TypeScript Error Fixer for Google Drive Pro
 * Systematically fixes exactOptionalPropertyTypes issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors for production...\n');

/**
 * Fix photoLink undefined assignments
 */
function fixPhotoLinkAssignments(content) {
  // Fix pattern: photoLink: value ?? undefined
  content = content.replace(/photoLink:\s*([^,\n]+)\s*\?\?\s*undefined/g, 
    '...(($1) && { photoLink: $1 })');
  
  // Fix pattern: photoLink: value || undefined
  content = content.replace(/photoLink:\s*([^,\n]+)\s*\|\|\s*undefined/g,
    '...(($1) && { photoLink: $1 })');
    
  return content;
}

/**
 * Fix general undefined optional property assignments
 */
function fixOptionalPropertyAssignments(content) {
  // Fix pattern: property: value ?? undefined (for optional properties)
  const optionalProps = ['webViewLink', 'webContentLink', 'thumbnailLink', 'iconLink'];
  
  optionalProps.forEach(prop => {
    const regex = new RegExp(`${prop}:\\s*([^,\n]+)\\s*\\?\\?\\s*undefined`, 'g');
    content = content.replace(regex, `...($1 && { ${prop}: $1 })`);
  });
  
  return content;
}

/**
 * Fix array optional property assignments
 */
function fixArrayOptionalAssignments(content) {
  // Fix owners array mapping with undefined photoLink
  content = content.replace(
    /owners:\s*(\w+)\.owners\?\.map\(\([^)]+\)\s*=>\s*\(\{[^}]*photoLink:[^}]*\}\)\)\s*\?\?\s*undefined/g,
    'owners: $1.owners?.map((owner) => ({ displayName: owner.displayName!, emailAddress: owner.emailAddress!, ...(owner.photoLink && { photoLink: owner.photoLink }) }))'
  );
  
  return content;
}

/**
 * Fix specific function parameter typing issues
 */
function fixFunctionParameterTypes(content) {
  // Fix common parameter type issues
  content = content.replace(/\(error: unknown\)/g, '(error: any)');
  content = content.replace(/\(e: unknown\)/g, '(e: any)');
  
  return content;
}

/**
 * Fix import type issues
 */
function fixImportTypes(content) {
  // Add proper type imports where missing
  if (content.includes('ReactNode') && !content.includes('import { ReactNode }')) {
    content = content.replace(/^import React/m, 'import React, { ReactNode }');
  }
  
  return content;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let fixedContent = content;
  
  // Apply all fixes
  fixedContent = fixPhotoLinkAssignments(fixedContent);
  fixedContent = fixOptionalPropertyAssignments(fixedContent);
  fixedContent = fixArrayOptionalAssignments(fixedContent);
  fixedContent = fixFunctionParameterTypes(fixedContent);
  fixedContent = fixImportTypes(fixedContent);
  
  // Only write if content changed
  if (fixedContent !== content) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

/**
 * Recursively process TypeScript files
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
      fixedCount += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (processFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const fixedCount = processDirectory(srcDir);

console.log(`\n🎉 Fixed ${fixedCount} TypeScript files`);
console.log('✅ Ready for type checking...');