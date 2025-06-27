/**
 * API Testing Setup with Cookie-Based Authentication
 * Comprehensive testing infrastructure for all Google Drive API endpoints
 */

export interface TestConfig {
  baseUrl: string
  sessionCookie: string
  testTimeout: number
  retryAttempts: number
}

export interface TestResult {
  endpoint: string
  method: string
  status: number
  responseTime: number
  success: boolean
  error?: string
  data?: any
}

export interface TestSession {
  cookie: string
  userId: string
  email: string
  accessToken?: string
  expiresAt: number
}

export class APITester {
  private config: TestConfig
  private results: TestResult[] = []
  private session: TestSession | null = null

  constructor(config: TestConfig) {
    this.config = config
  }

  /**
   * Extract session cookie from browser or environment
   */
  async extractSessionCookie(): Promise<string> {
    return this.config.sessionCookie
  }

  /**
   * Validate session and extract user info
   */
  async validateSession(): Promise<TestSession | null> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Cookie': this.config.sessionCookie,
          'Content-Type': 'application/json',
        },
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const sessionData = await response.json()
        
        this.session = {
          cookie: this.config.sessionCookie,
          userId: sessionData.user?.id || '',
          email: sessionData.user?.email || '',
          accessToken: sessionData.accessToken,
          expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour default
        }

        this.logResult({
          endpoint: '/api/auth/session',
          method: 'GET',
          status: response.status,
          responseTime,
          success: true,
          data: { email: this.session.email, userId: this.session.userId },
        })

        return this.session
      } else {
        this.logResult({
          endpoint: '/api/auth/session',
          method: 'GET',
          status: response.status,
          responseTime,
          success: false,
          error: 'Session validation failed',
        })
        return null
      }
    } catch (error) {
      this.logResult({
        endpoint: '/api/auth/session',
        method: 'GET',
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Generic API request method with session cookie
   */
  async apiRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const headers: Record<string, string> = {
        'Cookie': this.config.sessionCookie,
        'Content-Type': 'application/json',
        ...customHeaders,
      }

      const requestConfig: RequestInit = {
        method,
        headers,
      }

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.body = JSON.stringify(body)
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, requestConfig)
      const responseTime = Date.now() - startTime
      
      let responseData
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        responseTime,
        success: response.ok,
        data: responseData,
      }

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`
      }

      this.logResult(result)
      return result

    } catch (error) {
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }

      this.logResult(result)
      return result
    }
  }

  /**
   * Test all Files API endpoints
   */
  async testFilesAPI(): Promise<TestResult[]> {
    const filesTests: TestResult[] = []

    // Test basic file listing
    filesTests.push(await this.apiRequest('/api/drive/files', 'GET'))
    
    // Test with various parameters
    filesTests.push(await this.apiRequest('/api/drive/files?pageSize=10&sortBy=name', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?sortBy=modified&sortOrder=desc', 'GET'))
    filesTests.push(await this.apiRequest('/api/drive/files?pageSize=5&sortBy=size', 'GET'))

    // Test folder navigation (using folder from real data)
    filesTests.push(await this.apiRequest('/api/drive/files?folderId=149athC5H8cmh0QJq6xHu-cbFyS9J6fk-', 'GET'))

    return filesTests
  }

  /**
   * Test individual file operations
   */
  async testFileOperations(): Promise<TestResult[]> {
    const operationsTests: TestResult[] = []

    // Get file details (using real file ID from Drive)
    const fileId = '1q5xt1XgsroFmbYL1HWO1q3DzVvynDU0B' // Video file from your Drive
    
    operationsTests.push(await this.apiRequest(`/api/drive/files/${fileId}`, 'GET'))
    operationsTests.push(await this.apiRequest(`/api/drive/files/${fileId}/essential`, 'GET'))
    operationsTests.push(await this.apiRequest(`/api/drive/files/${fileId}/extended`, 'GET'))

    return operationsTests
  }

  /**
   * Test bulk operations (safe operations only)
   */
  async testBulkOperations(): Promise<TestResult[]> {
    const bulkTests: TestResult[] = []
    
    // Test bulk operations with real file IDs (read-only operations)
    const testFileIds = [
      '1q5xt1XgsroFmbYL1HWO1q3DzVvynDU0B', // Video file
      '149athC5H8cmh0QJq6xHu-cbFyS9J6fk-', // Folder "00"
    ]

    // Test download operations (safe)
    bulkTests.push(await this.apiRequest('/api/drive/files/bulk/download', 'POST', {
      items: testFileIds.map(id => ({ id, name: `test-${id}`, isFolder: false })),
      mode: 'export-links'
    }))

    return bulkTests
  }

  /**
   * Test search and filter functionality
   */
  async testSearchAndFilters(): Promise<TestResult[]> {
    const searchTests: TestResult[] = []

    // Test various search queries
    searchTests.push(await this.apiRequest('/api/drive/files?q=type:video', 'GET'))
    searchTests.push(await this.apiRequest('/api/drive/files?q=type:folder', 'GET'))
    searchTests.push(await this.apiRequest('/api/drive/files?viewStatus=my-drive', 'GET'))

    return searchTests
  }

  /**
   * Test health and performance endpoints
   */
  async testHealthEndpoints(): Promise<TestResult[]> {
    const healthTests: TestResult[] = []

    healthTests.push(await this.apiRequest('/api/health', 'GET'))
    healthTests.push(await this.apiRequest('/api/drive/performance', 'GET'))

    return healthTests
  }

  /**
   * Log test result
   */
  private logResult(result: TestResult): void {
    this.results.push(result)
    
    const status = result.success ? '✅' : '❌'
    const timing = `${result.responseTime}ms`
    
    console.log(`${status} ${result.method} ${result.endpoint} - ${result.status} (${timing})`)
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runAllTests(): Promise<{
    total: number
    passed: number
    failed: number
    results: TestResult[]
    performance: {
      averageResponseTime: number
      slowestEndpoint: string
      fastestEndpoint: string
    }
  }> {
    console.log('🧪 Starting comprehensive API testing...')
    
    // Validate session first
    const session = await this.validateSession()
    if (!session) {
      throw new Error('Session validation failed - cannot proceed with testing')
    }

    console.log(`📧 Testing with session: ${session.email}`)

    // Run all test suites
    const allTests = [
      ...(await this.testFilesAPI()),
      ...(await this.testFileOperations()),
      ...(await this.testBulkOperations()),
      ...(await this.testSearchAndFilters()),
      ...(await this.testHealthEndpoints()),
    ]

    // Calculate statistics
    const passed = allTests.filter(t => t.success).length
    const failed = allTests.length - passed
    const responseTimes = allTests.map(t => t.responseTime)
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

    const slowest = allTests.reduce((prev, curr) => 
      prev.responseTime > curr.responseTime ? prev : curr
    )
    const fastest = allTests.reduce((prev, curr) => 
      prev.responseTime < curr.responseTime ? prev : curr
    )

    const summary = {
      total: allTests.length,
      passed,
      failed,
      results: allTests,
      performance: {
        averageResponseTime: Math.round(averageResponseTime),
        slowestEndpoint: `${slowest.endpoint} (${slowest.responseTime}ms)`,
        fastestEndpoint: `${fastest.endpoint} (${fastest.responseTime}ms)`,
      }
    }

    console.log('\n📊 Test Summary:')
    console.log(`   Total: ${summary.total}`)
    console.log(`   Passed: ${summary.passed}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   Average Response Time: ${summary.performance.averageResponseTime}ms`)
    console.log(`   Slowest: ${summary.performance.slowestEndpoint}`)
    console.log(`   Fastest: ${summary.performance.fastestEndpoint}`)

    return summary
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = []
  }
}

export default APITester