#!/usr/bin/env npx tsx

/**
 * Continuous API Testing Runner
 * Runs comprehensive API tests with session cookie extraction
 */

import ComprehensiveAPITester from '../__tests__/api/comprehensive-api-test'

// Session cookie extraction helper
function extractSessionCookie(): string {
  // In production, this would extract from browser DevTools or environment
  // For now, we'll use a placeholder that needs to be updated
  const cookie = process.env.TEST_SESSION_COOKIE || ''
  
  if (!cookie) {
    console.error('❌ No session cookie found!')
    console.log('🔧 To get session cookie:')
    console.log('   1. Open browser DevTools (F12)')
    console.log('   2. Go to Application > Cookies > localhost:5000')
    console.log('   3. Copy "next-auth.session-token" value')
    console.log('   4. Set TEST_SESSION_COOKIE environment variable')
    console.log('   5. Or update this script with the cookie value')
    process.exit(1)
  }
  
  return `next-auth.session-token=${cookie}`
}

async function runContinuousTests() {
  console.log('🚀 Starting Continuous API Testing System')
  console.log('📱 Google Drive Pro API Test Suite')
  console.log('⏰ ' + new Date().toISOString())
  
  try {
    // Extract session cookie
    const sessionCookie = extractSessionCookie()
    
    // Initialize comprehensive tester
    const tester = new ComprehensiveAPITester({
      baseUrl: 'http://localhost:5000',
      sessionCookie,
      testTimeout: 30000,
      retryAttempts: 3,
    })

    // Run comprehensive test suite
    const results = await tester.runComprehensiveTests()

    // Log results to file for continuous monitoring
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logFile = `test-results-${timestamp}.json`
    
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(logFile, JSON.stringify(results, null, 2))
      console.log(`📄 Results saved to: ${logFile}`)
    } catch (error) {
      console.warn('⚠️  Could not save results to file:', error)
    }

    // Exit with appropriate code
    if (results.failed > 0) {
      console.log(`❌ Testing completed with ${results.failed} failures`)
      process.exit(1)
    } else {
      console.log('✅ All tests passed successfully!')
      process.exit(0)
    }

  } catch (error) {
    console.error('💥 Testing failed with error:', error)
    process.exit(1)
  }
}

// Run tests immediately
runContinuousTests().catch(console.error)