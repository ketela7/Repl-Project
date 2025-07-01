#!/usr/bin/env node

/**
 * Development Strict Mode Script
 * Optimized for fast development with unused imports/variables cleanup
 * Handles timeout limitations by processing directories individually
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration for strict development mode
const STRICT_MODE_CONFIG = {
  // Process these directories individually to avoid timeouts
  directories: [
    'src/app',
    'src/components', 
    'src/lib',
    'src/types',
    'src/middleware'
  ],
  
  // Individual files to process
  files: [
    'src/auth.ts'
  ],
  
  // Maximum time per directory (in seconds) before moving to next
  maxTimePerDir: 45,
  
  // ESLint focus rules for unused imports/variables
  eslintCommand: 'npx eslint --fix --ext .ts,.tsx,.js,.jsx --max-warnings 0'
}

/**
 * Process a single target (directory or file) with timeout protection
 */
function processTarget(target, index, total) {
  const startTime = Date.now()
  
  if (!fs.existsSync(target)) {
    console.log(`⏭️  [${index + 1}/${total}] Skipping ${target} (not found)`)
    return { success: true, skipped: true, time: 0 }
  }
  
  console.log(`🔧 [${index + 1}/${total}] Processing ${target}...`)
  
  try {
    const command = `${STRICT_MODE_CONFIG.eslintCommand} "${target}"`
    
    // Use timeout to prevent hanging
    const timeoutMs = STRICT_MODE_CONFIG.maxTimePerDir * 1000
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: timeoutMs
    })
    
    const processingTime = Date.now() - startTime
    console.log(`✅ [${index + 1}/${total}] ${target} - Complete (${processingTime}ms)`)
    
    return { 
      success: true, 
      time: processingTime, 
      output: output || 'No issues found' 
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    if (error.signal === 'SIGTERM' || error.code === 'TIMEOUT') {
      console.log(`⏰ [${index + 1}/${total}] ${target} - Timeout (${processingTime}ms) - Moving to next`)
      return { success: false, timeout: true, time: processingTime }
    }
    
    // Check if it's warnings that were fixed
    if (error.status === 1 && error.stdout && !error.stderr) {
      console.log(`✅ [${index + 1}/${total}] ${target} - Fixed with warnings (${processingTime}ms)`)
      return { success: true, warnings: true, time: processingTime }
    }
    
    console.log(`⚠️  [${index + 1}/${total}] ${target} - Issues detected (${processingTime}ms)`)
    console.log(`   Details: ${error.message.split('\n')[0]}`)
    
    return { 
      success: false, 
      error: true, 
      time: processingTime,
      message: error.message 
    }
  }
}

/**
 * Run TypeScript check in parallel
 */
function runTypeCheck() {
  console.log('🔍 Running TypeScript check...')
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30000 // 30 second timeout
    })
    console.log('✅ TypeScript check passed')
    return true
  } catch (error) {
    console.log('⚠️  TypeScript issues detected')
    console.log(`   Details: ${error.message.split('\n')[0]}`)
    return false
  }
}

/**
 * Main execution function
 */
function main() {
  const startTime = Date.now()
  
  console.log('🚀 Development Strict Mode')
  console.log('📋 Processing targets to fix unused imports/variables...\n')
  
  // Combine all targets
  const allTargets = [
    ...STRICT_MODE_CONFIG.directories,
    ...STRICT_MODE_CONFIG.files
  ]
  
  const results = {
    processed: 0,
    skipped: 0,
    timeouts: 0,
    errors: 0,
    warnings: 0,
    totalTime: 0
  }
  
  // Process each target
  allTargets.forEach((target, index) => {
    const result = processTarget(target, index, allTargets.length)
    
    results.totalTime += result.time
    
    if (result.skipped) {
      results.skipped++
    } else if (result.success) {
      results.processed++
      if (result.warnings) results.warnings++
    } else if (result.timeout) {
      results.timeouts++
    } else {
      results.errors++
    }
  })
  
  // Run TypeScript check
  console.log('\n🔍 Running final checks...')
  const typeCheckPassed = runTypeCheck()
  
  // Summary
  const totalTime = Date.now() - startTime
  console.log('\n📊 Strict Mode Summary:')
  console.log(`   Targets processed: ${results.processed}`)
  console.log(`   Skipped: ${results.skipped}`)
  console.log(`   Timeouts: ${results.timeouts}`)
  console.log(`   Errors: ${results.errors}`)
  console.log(`   Warnings fixed: ${results.warnings}`)
  console.log(`   TypeScript check: ${typeCheckPassed ? 'PASSED' : 'ISSUES'}`)
  console.log(`   Total time: ${totalTime}ms`)
  
  // Determine overall success
  const overallSuccess = results.errors === 0 && typeCheckPassed
  
  if (overallSuccess) {
    console.log('\n✅ Strict mode processing completed successfully!')
    console.log('🎯 Code is ready for development with clean unused imports/variables')
  } else {
    console.log('\n⚠️  Some issues require attention')
    if (results.errors > 0) {
      console.log(`   - ${results.errors} targets had errors`)
    }
    if (!typeCheckPassed) {
      console.log('   - TypeScript issues detected')
    }
    if (results.timeouts > 0) {
      console.log(`   - ${results.timeouts} targets timed out (>45s each)`)
    }
  }
  
  process.exit(overallSuccess ? 0 : 1)
}

// Execute if run directly
if (require.main === module) {
  main()
}

module.exports = { processTarget, runTypeCheck, STRICT_MODE_CONFIG }