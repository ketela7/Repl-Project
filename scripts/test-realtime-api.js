#!/usr/bin/env node
/**
 * Real-time API Testing Script with Authentic Session Cookie
 * Tests all Google Drive API endpoints using actual user session
 */

// Standalone real-time API testing without external dependencies

// Configuration with environment SESSION_COOKIE
const testConfig = {
  baseUrl: process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000',
  sessionCookie: process.env.SESSION_COOKIE || process.argv[2] || '',
  testTimeout: 30000,
  retryAttempts: 2
}

class RealTimeAPITester {
  constructor(config) {
    this.config = config
    this.results = []
    this.startTime = Date.now()
  }

  /**
   * Test all API endpoints with real session
   */
  async runRealTimeTests() {
    console.log('\n🚀 Starting Real-time API Testing with Authentic Session')
    console.log(`📍 Base URL: ${this.config.baseUrl}`)
    console.log(`🍪 Using Session Cookie: ${this.config.sessionCookie ? 'Available' : 'Missing'}`)
    
    if (!this.config.sessionCookie) {
      console.error('❌ SESSION_COOKIE is required for real-time testing')
      console.error('💡 Run: node scripts/extract-session.js for instructions')
      console.error('📝 Usage: node scripts/test-realtime-api.js "authjs.session-token=YOUR_COOKIE"')
      console.error('📖 Check REALTIME_TESTING.md for complete documentation')
      process.exit(1)
    }

    try {
      // Validate session first
      await this.validateRealSession()
      
      // Test core endpoints
      await this.testCoreEndpoints()
      
      // Test file operations
      await this.testFileOperations()
      
      // Test performance endpoints
      await this.testPerformanceEndpoints()
      
      // Generate report
      this.generateRealTimeReport()
      
    } catch (error) {
      console.error('❌ Real-time testing failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Validate real session with /api/auth/session
   */
  async validateRealSession() {
    console.log('\n📋 Validating Session...')
    
    const response = await fetch(`${this.config.baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': this.config.sessionCookie,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const session = await response.json()
      if (session.user) {
        console.log(`✅ Session Valid - User: ${session.user.email}`)
        return session
      }
    }
    
    throw new Error('Invalid or expired session cookie')
  }

  /**
   * Test core API endpoints
   */
  async testCoreEndpoints() {
    console.log('\n📂 Testing Core Drive API Endpoints...')
    
    const endpoints = [
      { path: '/api/drive/files', method: 'GET', name: 'List Files' },
      { path: '/api/drive/user', method: 'GET', name: 'User Info' },
      { path: '/api/drive/performance', method: 'GET', name: 'Performance Stats' }
    ]

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint)
    }
  }

  /**
   * Test file operation endpoints
   */
  async testFileOperations() {
    console.log('\n🔧 Testing File Operations...')
    
    // Get file list first to get real file IDs
    const filesResponse = await fetch(`${this.config.baseUrl}/api/drive/files`, {
      headers: {
        'Cookie': this.config.sessionCookie,
        'Content-Type': 'application/json'
      }
    })

    if (!filesResponse.ok) {
      console.log('⚠️ Cannot get file list, skipping file operations')
      return
    }

    const filesData = await filesResponse.json()
    const files = filesData.files || []
    
    if (files.length === 0) {
      console.log('⚠️ No files found, skipping file operations')
      return
    }

    const testFile = files[0]
    console.log(`📄 Using test file: ${testFile.name} (${testFile.id})`)

    const fileEndpoints = [
      { 
        path: '/api/drive/files/details', 
        method: 'POST', 
        body: { fileId: testFile.id },
        name: 'File Details' 
      },
      { 
        path: '/api/drive/files/essential', 
        method: 'POST', 
        body: { fileId: testFile.id },
        name: 'Essential Details' 
      }
    ]

    for (const endpoint of fileEndpoints) {
      await this.testEndpoint(endpoint)
    }
  }

  /**
   * Test performance monitoring endpoints
   */
  async testPerformanceEndpoints() {
    console.log('\n⚡ Testing Performance Endpoints...')
    
    const endpoints = [
      { path: '/api/health', method: 'GET', name: 'Health Check' },
      { path: '/api/drive/performance', method: 'GET', name: 'Performance Metrics' }
    ]

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint)
    }
  }

  /**
   * Test individual endpoint
   */
  async testEndpoint(endpoint) {
    const startTime = Date.now()
    
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Cookie': this.config.sessionCookie,
          'Content-Type': 'application/json'
        }
      }

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint.path}`, options)
      const responseTime = Date.now() - startTime
      
      const result = {
        endpoint: endpoint.path,
        name: endpoint.name,
        method: endpoint.method,
        status: response.status,
        responseTime,
        success: response.ok
      }

      if (response.ok) {
        try {
          const data = await response.json()
          result.data = data
          console.log(`  ✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`)
        } catch (e) {
          console.log(`  ✅ ${endpoint.name}: ${response.status} (${responseTime}ms) - Non-JSON response`)
        }
      } else {
        console.log(`  ❌ ${endpoint.name}: ${response.status} (${responseTime}ms)`)
        result.error = `HTTP ${response.status}`
      }

      this.results.push(result)
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.log(`  ❌ ${endpoint.name}: Error (${responseTime}ms) - ${error.message}`)
      
      this.results.push({
        endpoint: endpoint.path,
        name: endpoint.name,
        method: endpoint.method,
        status: 0,
        responseTime,
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateRealTimeReport() {
    const totalTime = Date.now() - this.startTime
    const successfulTests = this.results.filter(r => r.success).length
    const failedTests = this.results.length - successfulTests
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length

    console.log('\n' + '='.repeat(60))
    console.log('📊 REAL-TIME API TESTING REPORT')
    console.log('='.repeat(60))
    console.log(`📈 Success Rate: ${successfulTests}/${this.results.length} (${Math.round(successfulTests/this.results.length*100)}%)`)
    console.log(`⏱️ Total Time: ${totalTime}ms`)
    console.log(`⚡ Average Response: ${Math.round(averageResponseTime)}ms`)
    console.log(`✅ Successful: ${successfulTests}`)
    console.log(`❌ Failed: ${failedTests}`)

    if (failedTests > 0) {
      console.log('\n🚨 Failed Tests:')
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  • ${result.name}: ${result.error || 'Unknown error'}`)
      })
    }

    console.log('\n📋 Detailed Results:')
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`  ${status} ${result.name}: ${result.status} (${result.responseTime}ms)`)
    })

    console.log('\n🎯 API Health Status: ' + (successfulTests/this.results.length >= 0.8 ? 'HEALTHY' : 'NEEDS ATTENTION'))
    console.log('='.repeat(60))
  }
}

// Run real-time testing
async function main() {
  const tester = new RealTimeAPITester(testConfig)
  await tester.runRealTimeTests()
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Testing failed:', error)
    process.exit(1)
  })
}

module.exports = { RealTimeAPITester, testConfig }