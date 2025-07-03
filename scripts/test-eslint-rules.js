#!/usr/bin/env node

/**
 * Script untuk testing custom ESLint rules untuk Async State Issues
 * Memverifikasi bahwa rules mendeteksi masalah dengan benar
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test cases untuk setiap rule
const testCases = {
  'no-immediate-state-access': {
    bad: `
      function Component() {
        const [count, setCount] = useState(0);
        
        const handleClick = () => {
          setCount(5);
          if (count === 5) { // Should trigger error
            console.log('immediate access detected');
          }
        };
      }
    `,
    good: `
      function Component() {
        const [count, setCount] = useState(0);
        
        const handleClick = () => {
          setCount(prev => {
            if (prev === 5) { // Good: functional update
              console.log('safe access');
            }
            return 5;
          });
        };
      }
    `
  },

  'require-abort-controller': {
    bad: `
      const fetchData = async () => {
        const response = await fetch('/api/data', {
          method: 'POST',
          body: formData
        }); // Should trigger warning: missing signal
      };
    `,
    good: `
      const fetchData = async () => {
        const response = await fetch('/api/data', {
          method: 'POST',
          body: formData,
          signal: abortController.signal // Good: has signal
        });
      };
    `
  },

  'state-collection-needs-ref': {
    bad: `
      function Component() {
        const [selectedItems, setSelectedItems] = useState(new Set());
        // Should trigger warning: Set without corresponding ref
      }
    `,
    good: `
      function Component() {
        const [selectedItems, setSelectedItems] = useState(new Set());
        const selectedItemsRef = useRef(new Set()); // Good: has ref
      }
    `
  },

  'require-search-debounce': {
    bad: `
      <input 
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
      // Should trigger warning: search without debounce
    `,
    good: `
      <input 
        onChange={e => {
          const query = e.target.value;
          setTimeout(() => setSearchQuery(query), 300);
        }}
        placeholder="Search..."
      />
      // Good: has setTimeout debounce
    `
  },

  'complex-state-needs-reducer': {
    bad: `
      const [dialogState, setDialogState] = useState({
        upload: false,
        createFolder: false,
        details: false,
        preview: false
      }); // Should trigger warning: 4 properties, use useReducer
    `,
    good: `
      const [dialogState, dispatch] = useReducer(dialogReducer, {
        upload: false,
        createFolder: false,
        details: false,
        preview: false
      }); // Good: uses useReducer
    `
  }
};

function createTestFile(ruleName, code, type) {
  const fileName = `test-${ruleName}-${type}.tsx`;
  const filePath = path.join(__dirname, '..', 'temp', fileName);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(filePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const fullCode = `
import React, { useState, useRef, useReducer } from 'react';

${code}

export default Component;
  `;
  
  fs.writeFileSync(filePath, fullCode);
  return filePath;
}

function runESLintOnFile(filePath) {
  try {
    execSync(`npx eslint "${filePath}" --config .eslintrc.strict.js --format json`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { errors: [], warnings: [] };
  } catch (error) {
    try {
      const result = JSON.parse(error.stdout);
      if (result && result[0] && result[0].messages) {
        const errors = result[0].messages.filter(msg => msg.severity === 2);
        const warnings = result[0].messages.filter(msg => msg.severity === 1);
        return { errors, warnings };
      }
    } catch (parseError) {
      console.error('Failed to parse ESLint output:', parseError);
    }
    return { errors: [], warnings: [] };
  }
}

function cleanupTempFiles() {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function testRule(ruleName, testCase) {
  console.log(`\n🧪 Testing rule: ${ruleName}`);
  
  // Test bad code (should have violations)
  const badFilePath = createTestFile(ruleName, testCase.bad, 'bad');
  const badResult = runESLintOnFile(badFilePath);
  
  // Test good code (should have no violations for this rule)
  const goodFilePath = createTestFile(ruleName, testCase.good, 'good');
  const goodResult = runESLintOnFile(goodFilePath);
  
  // Check results
  const badViolations = [...badResult.errors, ...badResult.warnings];
  const goodViolations = [...goodResult.errors, ...goodResult.warnings];
  
  const badHasRuleViolation = badViolations.some(v => 
    v.ruleId && v.ruleId.includes(ruleName.replace(/-/g, '/'))
  );
  
  const goodHasRuleViolation = goodViolations.some(v => 
    v.ruleId && v.ruleId.includes(ruleName.replace(/-/g, '/'))
  );
  
  console.log(`  ❌ Bad code violations: ${badViolations.length} (should have > 0)`);
  console.log(`  ✅ Good code violations: ${goodViolations.length} (should have 0)`);
  
  if (badHasRuleViolation) {
    console.log(`  ✅ Rule correctly detected issue in bad code`);
  } else {
    console.log(`  ❌ Rule failed to detect issue in bad code`);
  }
  
  if (!goodHasRuleViolation) {
    console.log(`  ✅ Rule correctly passed good code`);
  } else {
    console.log(`  ❌ Rule incorrectly flagged good code`);
  }
  
  return {
    ruleName,
    badDetected: badHasRuleViolation,
    goodPassed: !goodHasRuleViolation,
    success: badHasRuleViolation && !goodHasRuleViolation
  };
}

function main() {
  console.log('🚀 Testing Custom ESLint Rules for Async State Issues\n');
  
  const results = [];
  
  // Test each rule
  for (const [ruleName, testCase] of Object.entries(testCases)) {
    try {
      const result = testRule(ruleName, testCase);
      results.push(result);
    } catch (error) {
      console.error(`Error testing rule ${ruleName}:`, error.message);
      results.push({
        ruleName,
        badDetected: false,
        goodPassed: false,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful rules: ${successful.length}/${results.length}`);
  console.log(`❌ Failed rules: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed rules:');
    failed.forEach(r => {
      console.log(`  - ${r.ruleName}: ${r.error || 'Detection failed'}`);
    });
  }
  
  console.log(`\n🎯 Overall success rate: ${Math.round((successful.length / results.length) * 100)}%`);
  
  // Cleanup
  cleanupTempFiles();
  
  // Exit with appropriate code
  process.exit(failed.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { testRule, testCases };