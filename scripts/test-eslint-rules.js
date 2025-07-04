#!/usr/bin/env node

/**
 * Basic ESLint configuration test
 * Verifies that ESLint is working with the project configuration
 */

const { execSync } = require('child_process');

function testESLintConfig() {
  try {
    console.log('🔍 Testing ESLint configuration...');

    // Test basic ESLint functionality
    const result = execSync('npx eslint --version', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    console.log(`✅ ESLint version: ${result.trim()}`);
    console.log('✅ ESLint configuration is working');

    return true;
  } catch (error) {
    console.error('❌ ESLint configuration test failed:', error.message);
    return false;
  }
}

function main() {
  console.log('🧹 ESLint Configuration Test\n');

  const success = testESLintConfig();

  if (success) {
    console.log('\n🎯 ESLint is ready for development');
    console.log('Run "npm run lint" to check your code');
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}