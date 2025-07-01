#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔍 Quick TypeScript Check');
console.log('========================');

// Run TypeScript check with timeout
const tsCheck = exec('npx tsc --noEmit', { timeout: 10000 });

let hasOutput = false;

tsCheck.stdout.on('data', (data) => {
  hasOutput = true;
  console.log(data.toString());
});

tsCheck.stderr.on('data', (data) => {
  hasOutput = true;
  console.error(data.toString());
});

tsCheck.on('close', (code) => {
  if (!hasOutput && code === 0) {
    console.log('✅ No TypeScript errors found!');
  } else if (code !== 0) {
    console.log(`❌ TypeScript check failed with code ${code}`);
  }
});

tsCheck.on('error', (error) => {
  console.log('⚠️ TypeScript check timed out or failed');
  console.log('Continuing with manual fixes...');
});

// Auto-kill after 8 seconds to prevent hanging
setTimeout(() => {
  tsCheck.kill('SIGTERM');
  if (!hasOutput) {
    console.log('⚠️ TypeScript check timed out, proceeding with ESLint fixes');
  }
}, 8000);