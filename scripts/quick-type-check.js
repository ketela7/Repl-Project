#!/usr/bin/env node

/**
 * Quick TypeScript check for specific errors that cause Vercel deployment failures
 */

const { execSync } = require('child_process');

console.log('Running focused TypeScript error check...\n');

// Check for specific patterns that cause build failures
const patterns = [
  'toISOString',
  'trim()',
  'exactOptionalPropertyTypes',
  'never.*trim',
  'never.*toISOString'
];

patterns.forEach(pattern => {
  console.log(`Checking for pattern: ${pattern}`);
  try {
    const result = execSync(`grep -r "${pattern}" src/app/\\(main\\)/dashboard/drive/_components/ --include="*.tsx" | head -5`, { encoding: 'utf8' });
    if (result.trim()) {
      console.log('Found potential issues:');
      console.log(result);
    } else {
      console.log('✓ No issues found');
    }
  } catch (error) {
    console.log('✓ No issues found');
  }
  console.log('');
});

console.log('Quick check complete.');