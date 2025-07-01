#!/usr/bin/env node

/**
 * Auto-fix unused imports and variables
 * Fast cleanup script for development workflow
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Directories to process individually to avoid timeout
const TARGET_DIRS = [
  'src/app',
  'src/components', 
  'src/lib',
  'src/types',
  'src/hooks',
  'src/utils',
  'src/middleware'
]

// Individual files that might exist
const TARGET_FILES = [
  'src/auth.ts',
  'src/config.ts'
]

/**
 * Process a single directory or file
 */
function processTarget(target) {
  if (!fs.existsSync(target)) {
    console.log(`⏭️  Skipping ${target} (not found)`)
    return { success: true, skipped: true }
  }
  
  console.log(`🔧 Processing ${target}...`)
  
  try {
    // Use ESLint with existing configuration but focus on unused imports/variables
    const command = `npx eslint "${target}" --fix --ext .ts,.tsx,.js,.jsx`
    
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8'
    })
    
    console.log(`✅ ${target} - Processed successfully`)
    return { success: true, output }
  } catch (error) {
    // Check if it's just warnings or actual errors
    if (error.status === 1 && error.stdout) {
      console.log(`✅ ${target} - Fixed with warnings`)
      return { success: true, warnings: error.stdout }
    } else {
      console.log(`⚠️  ${target} - Error: ${error.message.split('\n')[0]}`)
      return { success: false, error: error.message }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Auto-fix Unused Imports & Variables')
  console.log('📁 Processing directories individually to avoid timeouts...\n')
  
  let totalProcessed = 0
  let totalSkipped = 0
  let totalErrors = 0
  
  // Process directories
  TARGET_DIRS.forEach(dir => {
    const result = processTarget(dir)
    if (result.skipped) {
      totalSkipped++
    } else if (result.success) {
      totalProcessed++
    } else {
      totalErrors++
    }
  })
  
  // Process individual files
  TARGET_FILES.forEach(file => {
    const result = processTarget(file)
    if (result.skipped) {
      totalSkipped++
    } else if (result.success) {
      totalProcessed++
    } else {
      totalErrors++
    }
  })
  
  // Summary
  console.log('\n📊 Auto-fix Summary:')
  console.log(`   Processed: ${totalProcessed}`)
  console.log(`   Skipped: ${totalSkipped}`)
  console.log(`   Errors: ${totalErrors}`)
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some targets had errors - manual review needed')
    process.exit(1)
  } else {
    console.log('\n✅ Auto-fix completed successfully!')
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}

module.exports = { processTarget }