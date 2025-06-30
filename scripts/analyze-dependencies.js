#!/usr/bin/env node

/**
 * Dependency Analyzer for Google Drive Pro
 * Identifies unused dependencies and suggests cleanup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing dependencies usage...\n');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

// Packages that might be unused (need verification)
const suspiciousPackages = [
  '@dnd-kit/core',
  '@dnd-kit/modifiers', 
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  '@hookform/resolvers',
  '@radix-ui/react-accordion',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@tanstack/react-query',
  '@tanstack/react-table',
  '@testing-library/jest-dom',
  '@testing-library/react', 
  '@testing-library/user-event',
  '@types/jest',
  '@types/mime-types',
  '@types/uuid',
  'axios',
  'cmdk',
  'date-fns',
  'embla-carousel-react',
  'initials',
  'input-otp',
  'jscpd',
  'mime-types',
  'npm',
  'react-day-picker',
  'react-hook-form',
  'react-resizable-panels',
  'recharts',
  'tw-animate-css',
  'uuid',
  'vaul',
  'zod'
];

function searchInFiles(directory, searchStrings) {
  const results = {};
  searchStrings.forEach(str => results[str] = false);
  
  function searchFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      searchStrings.forEach(searchStr => {
        if (content.includes(searchStr)) {
          results[searchStr] = true;
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function traverseDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
          traverseDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          searchFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  traverseDirectory(directory);
  return results;
}

// Search for usage patterns
const srcUsage = searchInFiles('./src', suspiciousPackages);

// Check imports specifically
const importPatterns = [
  '@dnd-kit',
  '@hookform',
  '@tanstack',
  '@testing-library',
  'axios',
  'cmdk',
  'date-fns',
  'embla-carousel',
  'initials',
  'input-otp',
  'mime-types',
  'react-day-picker',
  'react-hook-form',
  'react-resizable-panels',
  'recharts',
  'uuid',
  'vaul',
  'zod'
];

const importUsage = searchInFiles('./src', importPatterns);

// Analysis results
const unusedDependencies = [];
const maybeUnused = [];

suspiciousPackages.forEach(pkg => {
  const isUsed = srcUsage[pkg] || importPatterns.some(pattern => 
    pkg.includes(pattern) && importUsage[pattern]
  );
  
  if (!isUsed) {
    unusedDependencies.push(pkg);
  } else {
    // Double check for specific patterns
    const specificCheck = searchInFiles('./src', [
      pkg.replace('@', '').replace('/', ''),
      pkg.split('/').pop()
    ]);
    
    if (!Object.values(specificCheck).some(used => used)) {
      maybeUnused.push(pkg);
    }
  }
});

// Output results
console.log('📊 DEPENDENCY ANALYSIS RESULTS\n');

if (unusedDependencies.length > 0) {
  console.log(`❌ Definitely Unused (${unusedDependencies.length}):`);
  unusedDependencies.forEach(pkg => {
    console.log(`  • ${pkg}`);
  });
  console.log();
}

if (maybeUnused.length > 0) {
  console.log(`⚠️  Possibly Unused (${maybeUnused.length}):`);
  maybeUnused.forEach(pkg => {
    console.log(`  • ${pkg}`);
  });
  console.log();
}

// Generate cleanup commands
const allUnused = [...unusedDependencies, ...maybeUnused];
if (allUnused.length > 0) {
  console.log('🧹 CLEANUP COMMANDS:\n');
  console.log('# Remove unused dependencies:');
  console.log(`npm uninstall ${allUnused.join(' ')}`);
  console.log('\n# Or remove individually:');
  allUnused.forEach(pkg => {
    console.log(`npm uninstall ${pkg}`);
  });
}

console.log(`\n✅ Analysis complete. Found ${allUnused.length} potentially unused dependencies.`);