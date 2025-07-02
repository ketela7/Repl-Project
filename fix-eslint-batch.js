#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixEslintIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unused variables in catch blocks
  content = content.replace(/} catch \((\w+)\) \{[\s\S]*?\}/g, (match, varName) => {
    if (!match.includes(varName) || match.replace(`catch (${varName})`, '').indexOf(varName) === -1) {
      modified = true;
      return match.replace(`catch (${varName})`, 'catch');
    }
    return match;
  });

  // Fix unused parameters with underscore prefix
  content = content.replace(/\(\s*(\w+):\s*[^)]+\)\s*=>\s*\{[^}]*\}/g, (match, param) => {
    if (!match.includes(param) || match.replace(new RegExp(`\\(\\s*${param}:`), '(_ignored:').indexOf(param) === -1) {
      modified = true;
      return match.replace(new RegExp(`\\(\\s*${param}:`), '(_ignored:');
    }
    return match;
  });

  // Remove unused imports (simple cases)
  const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
  content = content.replace(importRegex, (match, imports, fromPath) => {
    const importList = imports.split(',').map(i => i.trim());
    const usedImports = importList.filter(imp => {
      const cleanImp = imp.replace(/\s+as\s+\w+/, '');
      return content.replace(match, '').includes(cleanImp);
    });
    
    if (usedImports.length === 0) {
      modified = true;
      return ''; // Remove entire import
    } else if (usedImports.length !== importList.length) {
      modified = true;
      return `import { ${usedImports.join(', ')} } from '${fromPath}'`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        if (fixEslintIssues(filePath)) {
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    }
  }

  return fixedCount;
}

const srcPath = path.join(__dirname, 'src');
console.log('Starting ESLint fixes...');
const fixedCount = processDirectory(srcPath);
console.log(`Fixed ${fixedCount} files`);