#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 * Tests all Google Drive API endpoints with the new static routing structure
 */

class APIEndpointTester {
  constructor(config) {
    this.config = config
    this.results = []
  }

  async testRequest(endpoint, method = 'POST', body = null) {
    const startTime = Date.now()

    try {
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, requestOptions)
      const responseTime = Date.now() - startTime

      let data
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }

      const result = {
        endpoint,
        method,
        status: response.status,
        responseTime,
        success: response.ok,
        data,
      }

      if (!response.ok) {
        result.error = data.error || response.statusText
      }

      this.results.push(result)
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const result = {
        endpoint,
        method,
        status: 0,
        responseTime,
        success: false,
        error: error.message,
      }

      this.results.push(result)
      return result
    }
  }

  async testAllEndpoints() {
    console.log('🧪 Starting Comprehensive API Endpoint Testing...')
    console.log(`🎯 Base URL: ${this.config.baseUrl}`)
    console.log('━'.repeat(60))

    // Test sample file ID (replace with actual file ID)
    const sampleFileId = '1q5xt1XgsroFmbYL1HWO1q3DzVvynDU0B'
    const sampleFolderId = '149athC5H8cmh0QJq6xHu-cbFyS9J6fk-'

    // 1. Health Check
    console.log('\n🏥 Testing Health Endpoints...')
    await this.testRequest('/api/health', 'GET')

    // 2. Auth Endpoints
    console.log('\n🔐 Testing Auth Endpoints...')
    await this.testRequest('/api/auth/session', 'GET')
    await this.testRequest('/api/auth/providers', 'GET')

    // 3. File Listing
    console.log('\n📁 Testing File Listing...')
    await this.testRequest('/api/drive/files', 'GET')
    await this.testRequest('/api/drive/files?pageSize=10', 'GET')

    // 4. File Operation Endpoints (POST-based)
    console.log('\n🔧 Testing File Operation Endpoints...')

    // Details endpoint
    await this.testRequest('/api/drive/files/details', 'POST', {
      fileId: sampleFileId,
    })

    // Essential metadata
    await this.testRequest('/api/drive/files/essential', 'POST', {
      fileId: sampleFileId,
    })

    // Extended metadata
    await this.testRequest('/api/drive/files/extended', 'POST', {
      fileId: sampleFileId,
    })

    // Download endpoint
    await this.testRequest('/api/drive/files/download', 'POST', {
      fileId: sampleFileId,
      downloadMode: 'exportLinks',
    })

    // Export endpoint
    await this.testRequest('/api/drive/files/export', 'POST', {
      fileId: sampleFileId,
      exportFormat: 'pdf',
    })

    // 5. Bulk Operations (Read-Only Tests)
    console.log('\n📦 Testing Bulk Operations...')

    const sampleItems = [{ id: sampleFileId, name: 'test-file', isFolder: false }]

    // Bulk download links
    await this.testRequest('/api/drive/files/download', 'POST', {
      items: sampleItems,
      downloadMode: 'exportLinks',
    })

    // 6. Performance Endpoints
    console.log('\n⚡ Testing Performance Endpoints...')
    await this.testRequest('/api/drive/performance', 'GET')
    await this.testRequest('/api/drive/user', 'GET')

    // 7. Cache Management
    console.log('\n🗄️ Testing Cache Endpoints...')
    await this.testRequest('/api/cache/clear', 'POST')

    console.log('\n━'.repeat(60))
    this.printResults()
  }

  printResults() {
    console.log('📊 API Endpoint Test Results:')
    console.log('━'.repeat(60))

    const successCount = this.results.filter((r) => r.success).length
    const failCount = this.results.filter((r) => !r.success).length
    const totalCount = this.results.length

    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`📈 Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`)
    console.log(`⏱️ Average Response Time: ${Math.round(this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount)}ms`)

    console.log('\n📋 Detailed Results:')
    console.log('━'.repeat(60))

    // Group by endpoint category
    const categories = {
      health: this.results.filter((r) => r.endpoint.includes('/health')),
      auth: this.results.filter((r) => r.endpoint.includes('/auth')),
      files: this.results.filter((r) => r.endpoint.includes('/drive/files')),
      performance: this.results.filter((r) => r.endpoint.includes('/performance')),
      cache: this.results.filter((r) => r.endpoint.includes('/cache')),
    }

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        console.log(`\n📁 ${category.toUpperCase()} ENDPOINTS:`)
        results.forEach((result) => {
          const status = result.success ? '✅' : '❌'
          const statusCode = result.status === 0 ? 'ERR' : result.status
          console.log(`${status} ${result.method} ${result.endpoint} - ${statusCode} (${result.responseTime}ms)`)
          if (result.error) {
            console.log(`   Error: ${result.error}`)
          }
        })
      }
    })

    // Show failed endpoints for debugging
    const failed = this.results.filter((r) => !r.success)
    if (failed.length > 0) {
      console.log('\n🔍 Failed Endpoints Details:')
      failed.forEach((result) => {
        console.log(`\n❌ ${result.method} ${result.endpoint}`)
        console.log(`   Status: ${result.status}`)
        console.log(`   Error: ${result.error || 'Unknown error'}`)
        if (result.data && typeof result.data === 'object') {
          console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`)
        }
      })
    }

    console.log('\n━'.repeat(60))
    console.log('🎯 API Testing Complete!')

    return { successCount, failCount, totalCount }
  }

  getResults() {
    return this.results
  }
}

// Run the tests
async function runTests() {
  const tester = new APIEndpointTester({
    baseUrl: 'http://localhost:5000',
    timeout: 30000,
  })

  try {
    await tester.testAllEndpoints()
    const { failCount } = tester.printResults()
    process.exit(failCount > 0 ? 1 : 0)
  } catch (error) {
    console.error('❌ Testing failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runTests()
}
