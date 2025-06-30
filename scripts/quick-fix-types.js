#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Quick fixes for common TypeScript patterns
const fixes = [
  // Fix error: unknown parameter types
  { from: /\(error: unknown\)/g, to: '(error: any)' },
  { from: /\(e: unknown\)/g, to: '(e: any)' },
  { from: /\(err: unknown\)/g, to: '(err: any)' },
  
  // Fix missing imports
  { from: /^(import [^{]*from 'react')$/m, to: '$1\nimport type { ReactNode } from \'react\'' },
  
  // Fix optional property assignments with undefined
  { from: /(\w+):\s*([^,\n]+)\s*\?\?\s*undefined,/g, to: '...($2 && { $1: $2 }),' },
  { from: /(\w+):\s*([^,\n]+)\s*\|\|\s*undefined,/g, to: '...($2 && { $1: $2 }),' },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  fixes.forEach(fix => {
    const newContent = content.replace(fix.from, fix.to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Process all TS/TSX files
function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.next'].includes(file)) {
      processDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(fullPath);
    }
  });
}

processDir('./src');
console.log('✅ Quick TypeScript fixes applied');