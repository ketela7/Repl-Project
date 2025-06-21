#!/usr/bin/env node

/**
 * Development utilities for improved workflow
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const commands = {
  clean: () => {
    console.log('🧹 Cleaning build artifacts...');
    exec('rm -rf .next out coverage .tsbuildinfo .jest-cache', (error) => {
      if (error) {
        console.error('❌ Clean failed:', error);
      } else {
        console.log('✅ Clean completed');
      }
    });
  },

  typecheck: () => {
    console.log('🔍 Running TypeScript check...');
    exec('npm run typecheck', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Type check failed');
        console.error(stderr);
      } else {
        console.log('✅ Type check passed');
      }
    });
  },

  bundleSize: () => {
    console.log('📦 Analyzing bundle size...');
    exec('npm run build:analyze', (error) => {
      if (error) {
        console.error('❌ Bundle analysis failed:', error);
      } else {
        console.log('✅ Bundle analysis complete - check your browser');
      }
    });
  },

  findAnyTypes: () => {
    console.log('🔍 Finding "any" types...');
    exec('find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -n ": any"', (error, stdout) => {
      if (stdout) {
        console.log('⚠️ Found "any" types:');
        console.log(stdout);
      } else {
        console.log('✅ No "any" types found');
      }
    });
  },

  performance: () => {
    console.log('⚡ Performance check...');
    const startTime = Date.now();
    exec('npm run typecheck && npm run lint', (error) => {
      const duration = Date.now() - startTime;
      if (error) {
        console.error('❌ Performance check failed');
      } else {
        console.log(`✅ Performance check completed in ${duration}ms`);
      }
    });
  },

  help: () => {
    console.log(`
🚀 Development Utilities

Available commands:
  clean       - Clean all build artifacts
  typecheck   - Run TypeScript type checking
  bundleSize  - Analyze bundle size
  findAnyTypes - Find remaining "any" types
  performance - Run performance checks
  help        - Show this help

Usage: node scripts/dev-utils.js <command>
    `);
  }
};

const command = process.argv[2];
if (commands[command]) {
  commands[command]();
} else {
  commands.help();
}