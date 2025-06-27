/**
 * Comprehensive API Testing Suite
 * Tests all Google Drive API endpoints with real session cookies
 */

import APITester, { TestConfig } from './test-setup'

// Test configuration
const testConfig: TestConfig = {
  baseUrl: 'http://localhost:5000',
  sessionCookie: '', // Will be extracted from browser
  testTimeout: 30000,
  retryAttempts: 3,
}

/**
 * Extended API Tester with comprehensive endpoint coverage
 */
class ComprehensiveAPITester extends APITester {
  
  /**
   * Test all authentication endpoints
   */
  async testAuthEndpoints(): Promise<any[]> {
    console.log('\n🔐 Testing Authentication Endpoints...')
    const authTests = []

    authTests.push(await this.apiRequest('/api/auth/session', 'GET'))
    authTests.push(await this.apiRequest('/api/auth/providers', 'GET'))

    return authTests
  }

  /**
   * Test complete Files API with all parameters
   */
  async testCompleteFilesAPI(): Promise<any[]> {
    console.log('\n📁 Testing Complete Files API...')
    const filesTests = []

    // Basic file listing with various parameters
    filesTests.push(await this.apiRequest('/api/drive/files', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?pageSize=10', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?pageSize=50', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?pageSize=100', 'GET'))

    // Sorting variations
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=name&sortOrder=asc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=name&sortOrder=desc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=modified&sortOrder=asc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=modified&sortOrder=desc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=created&sortOrder=asc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=size&sortOrder=desc', 'GET'))

    // View status filters
    filesTests.push(await this.apiRequest('/api/drive/files?viewStatus=all', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?viewStatus=my-drive', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?viewStatus=shared', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?viewStatus=starred', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?viewStatus=trash', 'GET'))

    // File type filters
    filesTests.push(await this.apiRequest('/api/drive/files?fileType=folder', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?fileType=document', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?fileType=image', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?fileType=video', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?fileType=audio', 'GET'))

    // Search queries
    filesTests.push(await this.apiRequest('/api/drive/files?q=type:video', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?q=type:folder', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?search=mp4', 'GET'))

    // Folder navigation (using real folder IDs from Drive)
    filesTests.push(await this.apiRequest('/api/drive/files?folderId=149athC5H8cmh0QJq6xHu-cbFyS9J6fk-', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?folderId=1r-sGh52GdpwLYGvay85I999Wekr5XqVh', 'GET'))

    return filesTests
  }

  /**
   * Test individual file detail endpoints
   */
  async testFileDetailEndpoints(): Promise<any[]> {
    console.log('\n📄 Testing File Detail Endpoints...')
    const detailTests = []

    // Using real file IDs from your Drive
    const testFiles = [
      '1q5xt1XgsroFmbYL1HWO1q3DzVvynDU0B', // Video file
      '149athC5H8cmh0QJq6xHu-cbFyS9J6fk-', // Folder "00"
      '1r-sGh52GdpwLYGvay85I999Wekr5XqVh', // Another folder
    ]

    for (const fileId of testFiles) {
      // Full file details
      detailTests.push(await this.apiRequest(`/api/drive/files/${fileId}`, 'GET'))
      
      // Progressive loading endpoints
      detailTests.push(await this.apiRequest(`/api/drive/files/${fileId}/essential`, 'GET'))
      detailTests.push(await this.apiRequest(`/api/drive/files/${fileId}/extended`, 'GET'))
    }

    return detailTests
  }

  /**
   * Test all bulk operation endpoints (safe operations only)
   */
  async testBulkOperationEndpoints(): Promise<any[]> {
    console.log('\n🔄 Testing Bulk Operation Endpoints...')
    const bulkTests = []

    const testItems = [
      { id: '1q5xt1XgsroFmbYL1HWO1q3DzVvynDU0B', name: 'test-video.mp4', isFolder: false },
      { id: '149athC5H8cmh0QJq6xHu-cbFyS9J6fk-', name: 'test-folder', isFolder: true },
    ]

    // Download operations (safe, read-only)
    bulkTests.push(await this.apiRequest('/api/drive/files/bulk/download', 'POST', {
      items: testItems,
      mode: 'export-links'
    }))

    // Test individual operation endpoints (without actually performing destructive operations)
    const fileId = testItems[0].id

    // These endpoints should be tested with GET requests to check availability
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/move`, 'GET'))
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/copy`, 'GET'))
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/trash`, 'GET'))
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/share`, 'GET'))
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/rename`, 'GET'))
    bulkTests.push(await this.apiRequest(`/api/drive/files/${fileId}/download`, 'GET'))

    return bulkTests
  }

  /**
   * Test performance and monitoring endpoints
   */
  async testPerformanceEndpoints(): Promise<any[]> {
    console.log('\n⚡ Testing Performance Endpoints...')
    const perfTests = []

    perfTests.push(await this.apiRequest('/api/health', 'GET'))
    perfTests.push(await this.apiRequest('/api/drive/performance', 'GET'))
    
    // Cache management endpoints
    perfTests.push(await this.apiRequest('/api/cache/clear', 'POST'))

    return perfTests
  }

  /**
   * Test error handling and edge cases
   */
  async testErrorHandling(): Promise<any[]> {
    console.log('\n❌ Testing Error Handling...')
    const errorTests = []

    // Test with invalid file IDs
    errorTests.push(await this.apiRequest('/api/drive/files/invalid-file-id', 'GET'))
    errorTests.push(await this.apiRequest('/api/drive/files/invalid-file-id/essential', 'GET'))
    
    // Test with invalid parameters
    errorTests.push(await this.apiRequest('/api/drive/files?pageSize=invalid', 'GET'))
    errorTests.push(await this.apiRequest('/api/drive/files?sortBy=invalid', 'GET'))
    errorTests.push(await this.apiRequest('/api/drive/files?viewStatus=invalid', 'GET'))

    // Test with invalid folder IDs
    errorTests.push(await this.apiRequest('/api/drive/files?folderId=invalid-folder', 'GET'))

    return errorTests
  }

  /**
   * Test rate limiting and concurrent requests
   */
  async testConcurrentRequests(): Promise<any[]> {
    console.log('\n🚀 Testing Concurrent Requests...')
    const concurrentTests = []

    // Create multiple concurrent requests
    const concurrentPromises = []
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(this.apiRequest('/api/drive/files?pageSize=10', 'GET'))
    }

    const results = await Promise.all(concurrentPromises)
    concurrentTests.push(...results)

    return concurrentTests
  }

  /**
   * Run complete comprehensive test suite
   */
  async runComprehensiveTests(): Promise<any> {
    console.log('🧪 Starting Comprehensive API Testing Suite...')
    console.log('🎯 Target: All Google Drive Pro API endpoints')
    console.log('📧 Using real session with Drive access')
    
    const startTime = Date.now()

    try {
      // Validate session first
      const session = await this.validateSession()
      if (!session) {
        throw new Error('Session validation failed - cannot proceed with testing')
      }

      console.log(`✅ Session validated for: ${session.email}`)

      // Run all test suites
      const allTests = [
        ...(await this.testAuthEndpoints()),
        ...(await this.testCompleteFilesAPI()),
        ...(await this.testFileDetailEndpoints()),
        ...(await this.testBulkOperationEndpoints()),
        ...(await this.testPerformanceEndpoints()),
        ...(await this.testErrorHandling()),
        ...(await this.testConcurrentRequests()),
      ]

      const totalTime = Date.now() - startTime

      // Calculate comprehensive statistics
      const passed = allTests.filter(t => t.success).length
      const failed = allTests.length - passed
      const responseTimes = allTests.map(t => t.responseTime)
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

      // Group results by endpoint category
      const categoryStats = this.categorizeResults(allTests)

      // Performance analysis
      const slowest = allTests.reduce((prev, curr) => 
        prev.responseTime > curr.responseTime ? prev : curr
      )
      const fastest = allTests.reduce((prev, curr) => 
        prev.responseTime < curr.responseTime ? prev : curr
      )

      const summary = {
        totalTests: allTests.length,
        passed,
        failed,
        successRate: Math.round((passed / allTests.length) * 100),
        totalTime: Math.round(totalTime / 1000),
        performance: {
          averageResponseTime: Math.round(averageResponseTime),
          slowestEndpoint: `${slowest.endpoint} (${slowest.responseTime}ms)`,
          fastestEndpoint: `${fastest.endpoint} (${fastest.responseTime}ms)`,
        },
        categoryStats,
        results: allTests,
      }

      this.printComprehensiveSummary(summary)
      return summary

    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error)
      throw error
    }
  }

  /**
   * Categorize test results by endpoint type
   */
  private categorizeResults(results: any[]): Record<string, any> {
    const categories = {
      auth: { total: 0, passed: 0, avgTime: 0 },
      files: { total: 0, passed: 0, avgTime: 0 },
      details: { total: 0, passed: 0, avgTime: 0 },
      bulk: { total: 0, passed: 0, avgTime: 0 },
      performance: { total: 0, passed: 0, avgTime: 0 },
      errors: { total: 0, passed: 0, avgTime: 0 },
    }

    results.forEach(result => {
      let category = 'files' // default
      
      if (result.endpoint.includes('/auth/')) category = 'auth'
      else if (result.endpoint.includes('/bulk/') || result.endpoint.includes('/move') || 
               result.endpoint.includes('/copy') || result.endpoint.includes('/trash')) category = 'bulk'
      else if (result.endpoint.includes('/essential') || result.endpoint.includes('/extended')) category = 'details'
      else if (result.endpoint.includes('/health') || result.endpoint.includes('/performance') || 
               result.endpoint.includes('/cache')) category = 'performance'
      else if (result.endpoint.includes('invalid')) category = 'errors'

      categories[category].total++
      if (result.success) categories[category].passed++
      categories[category].avgTime += result.responseTime
    })

    // Calculate averages
    Object.keys(categories).forEach(cat => {
      const category = categories[cat]
      if (category.total > 0) {
        category.avgTime = Math.round(category.avgTime / category.total)
        category.successRate = Math.round((category.passed / category.total) * 100)
      }
    })

    return categories
  }

  /**
   * Print comprehensive test summary
   */
  private printComprehensiveSummary(summary: any): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE API TEST SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`🧪 Total Tests: ${summary.totalTests}`)
    console.log(`✅ Passed: ${summary.passed}`)
    console.log(`❌ Failed: ${summary.failed}`)
    console.log(`📈 Success Rate: ${summary.successRate}%`)
    console.log(`⏱️  Total Time: ${summary.totalTime}s`)
    
    console.log('\n📈 Performance Metrics:')
    console.log(`   Average Response Time: ${summary.performance.averageResponseTime}ms`)
    console.log(`   Slowest: ${summary.performance.slowestEndpoint}`)
    console.log(`   Fastest: ${summary.performance.fastestEndpoint}`)

    console.log('\n📂 Category Breakdown:')
    Object.entries(summary.categoryStats).forEach(([category, stats]: [string, any]) => {
      if (stats.total > 0) {
        console.log(`   ${category.toUpperCase()}: ${stats.passed}/${stats.total} (${stats.successRate}%) - Avg: ${stats.avgTime}ms`)
      }
    })

    console.log('\n' + '='.repeat(60))
  }
}

export default ComprehensiveAPITester