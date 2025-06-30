
/**
 * Comprehensive Real-time API Testing Script with Full Arguments
 * Tests all Google Drive API endpoints with detailed parameters and scenarios
 */

// Configuration with environment SESSION_COOKIE
const testConfig = {
  baseUrl: process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000',
  sessionCookie: process.env.SESSION_COOKIE || process.argv[2] || '',
  testTimeout: 60000,
  retryAttempts: 3,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  testDataSets: {
    small: 10,
    medium: 50,
    large: 100
  }
}

class ComprehensiveAPITester {
  constructor(config) {
    this.config = config
    this.results = []
    this.startTime = Date.now()
    this.testData = {
      files: [],
      folders: [],
      testFiles: [],
      performanceMetrics: {},
      errorLog: []
    }
  }

  /**
   * Run comprehensive real-time API testing
   */
  async runComprehensiveTests() {
    console.log('\n🚀 Starting Comprehensive Real-time API Testing')
    console.log('=' .repeat(80))
    console.log(`📍 Base URL: ${this.config.baseUrl}`)
    console.log(`🍪 Session: ${this.config.sessionCookie ? 'Available' : 'Missing'}`)
    console.log(`⏱️ Timeout: ${this.config.testTimeout}ms`)
    console.log(`🔄 Retries: ${this.config.retryAttempts}`)
    
    if (!this.config.sessionCookie) {
      console.error('\n❌ SESSION_COOKIE is required for comprehensive testing')
      console.error('💡 Usage: SESSION_COOKIE="your_cookie" node scripts/test-realtime-api.js')
      console.error('📖 Or: node scripts/test-realtime-api.js "authjs.session-token=YOUR_COOKIE"')
      process.exit(1)
    }

    try {
      // Phase 1: Authentication & Session Validation
      await this.testAuthenticationFlow()
      
      // Phase 2: Core API Endpoints
      await this.testCoreAPIEndpoints()
      
      // Phase 3: File Operations with All Parameters
      await this.testFileOperationsComprehensive()
      
      // Phase 4: Folder Operations
      await this.testFolderOperations()
      
      // Phase 5: Advanced File Operations
      await this.testAdvancedFileOperations()
      
      // Phase 6: Bulk Operations
      await this.testBulkOperations()
      
      // Phase 7: Performance & Stress Testing
      await this.testPerformanceScenarios()
      
      // Phase 8: Error Handling & Edge Cases
      await this.testErrorHandling()
      
      // Phase 9: Cache & Optimization
      await this.testCacheOperations()
      
      // Generate comprehensive report
      this.generateComprehensiveReport()
      
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error.message)
      this.logError('CRITICAL', error.message, error.stack)
      process.exit(1)
    }
  }

  /**
   * Phase 1: Authentication Flow Testing
   */
  async testAuthenticationFlow() {
    console.log('\n📋 Phase 1: Authentication Flow Testing')
    console.log('-'.repeat(50))
    
    const authEndpoints = [
      {
        name: 'Session Validation',
        path: '/api/auth/session',
        method: 'GET',
        expectAuth: true
      },
      {
        name: 'Drive Access Check',
        path: '/api/auth/check-drive-access',
        method: 'GET',
        expectAuth: true
      },
      {
        name: 'Health Check',
        path: '/api/health',
        method: 'GET',
        expectAuth: false
      }
    ]

    for (const endpoint of authEndpoints) {
      await this.testEndpointWithRetry(endpoint)
    }

    // Validate session and store user info
    const sessionResponse = await this.makeRequest('/api/auth/session', 'GET')
    if (sessionResponse.success && sessionResponse.data.user) {
      this.testData.user = sessionResponse.data.user
      console.log(`✅ Authenticated as: ${this.testData.user.email}`)
    }
  }

  /**
   * Phase 2: Core API Endpoints Testing
   */
  async testCoreAPIEndpoints() {
    console.log('\n📂 Phase 2: Core API Endpoints Testing')
    console.log('-'.repeat(50))
    
    const coreEndpoints = [
      {
        name: 'Drive User Info',
        path: '/api/drive/user',
        method: 'GET',
        validateResponse: (data) => data.user && data.user.emailAddress
      },
      {
        name: 'Performance Metrics',
        path: '/api/drive/performance',
        method: 'GET',
        validateResponse: (data) => data.metrics
      }
    ]

    for (const endpoint of coreEndpoints) {
      const result = await this.testEndpointWithRetry(endpoint)
      if (result.success && endpoint.name === 'Drive User Info') {
        this.testData.driveUser = result.data.user
      }
    }
  }

  /**
   * Phase 3: Comprehensive File Operations Testing
   */
  async testFileOperationsComprehensive() {
    console.log('\n🔧 Phase 3: Comprehensive File Operations Testing')
    console.log('-'.repeat(50))
    
    // Test file listing with all possible parameters
    await this.testFileListingScenarios()
    
    // Load test data
    await this.loadTestData()
    
    if (this.testData.files.length === 0) {
      console.log('⚠️ No files found, creating test data...')
      await this.createTestData()
    }

    // Test file details with all field combinations
    await this.testFileDetailsScenarios()
    
    // Test file operations
    await this.testFileActionScenarios()
  }

  /**
   * Test file listing with comprehensive parameters
   */
  async testFileListingScenarios() {
    console.log('\n📄 Testing File Listing Scenarios...')
    
    const listingScenarios = [
      {
        name: 'Root Folder - Default',
        params: {}
      },
      {
        name: 'Root Folder - All Files',
        params: {
          sortBy: 'name',
          sortOrder: 'asc',
          pageSize: 50
        }
      },
      {
        name: 'Modified Date Sort',
        params: {
          sortBy: 'modifiedTime',
          sortOrder: 'desc',
          pageSize: 100
        }
      },
      {
        name: 'Size Sort',
        params: {
          sortBy: 'size',
          sortOrder: 'desc',
          pageSize: 25
        }
      },
      {
        name: 'Name Sort Ascending',
        params: {
          sortBy: 'name',
          sortOrder: 'asc',
          pageSize: 20
        }
      },
      {
        name: 'Trashed Files',
        params: {
          viewStatus: 'trashed',
          sortBy: 'trashedTime',
          sortOrder: 'desc'
        }
      },
      {
        name: 'Search Query - Documents',
        params: {
          query: 'type:document',
          sortBy: 'relevance'
        }
      },
      {
        name: 'Search Query - Images',
        params: {
          query: 'type:image',
          sortBy: 'modifiedTime',
          sortOrder: 'desc'
        }
      },
      {
        name: 'Pagination Test',
        params: {
          pageSize: 10,
          pageToken: ''
        }
      }
    ]

    for (const scenario of listingScenarios) {
      console.log(`\n🔍 Testing: ${scenario.name}`)
      const queryString = new URLSearchParams(scenario.params).toString()
      const path = `/api/drive/files${queryString ? `?${queryString}` : ''}`
      
      const result = await this.testEndpointWithRetry({
        name: scenario.name,
        path,
        method: 'GET',
        validateResponse: (data) => Array.isArray(data.files)
      })

      if (result.success) {
        console.log(`  📊 Found ${result.data.files.length} files`)
        if (scenario.name === 'Root Folder - Default') {
          this.testData.files = result.data.files.slice(0, 10) // Store sample files
        }
      }
    }
  }

  /**
   * Load test data from API
   */
  async loadTestData() {
    console.log('\n📥 Loading Test Data...')
    
    const response = await this.makeRequest('/api/drive/files?pageSize=50', 'GET')
    if (response.success && response.data.files) {
      this.testData.files = response.data.files
      this.testData.folders = response.data.files.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
      
      console.log(`✅ Loaded ${this.testData.files.length} files, ${this.testData.folders.length} folders`)
    }
  }

  /**
   * Test file details with different field combinations
   */
  async testFileDetailsScenarios() {
    if (this.testData.files.length === 0) {
      console.log('⚠️ No files available for details testing')
      return
    }

    console.log('\n📋 Testing File Details Scenarios...')
    
    const testFile = this.testData.files[0]
    console.log(`📄 Using test file: ${testFile.name} (${testFile.id})`)

    const detailEndpoints = [
      {
        name: 'Full Details',
        path: '/api/drive/files/details',
        body: { fileId: testFile.id },
        validateResponse: (data) => data.file && data.file.id === testFile.id
      },
      {
        name: 'Details with Custom Fields',
        path: '/api/drive/files/details',
        body: { 
          fileId: testFile.id,
          fields: 'id,name,mimeType,size,modifiedTime,owners,permissions'
        },
        validateResponse: (data) => data.file && data.file.id === testFile.id
      }
    ]

    for (const endpoint of detailEndpoints) {
      await this.testEndpointWithRetry({
        ...endpoint,
        method: 'POST'
      })
    }
  }

  /**
   * Test file action scenarios
   */
  async testFileActionScenarios() {
    if (this.testData.files.length === 0) return

    console.log('\n🔧 Testing File Action Scenarios...')
    
    const testFile = this.testData.files[0]
    const originalName = testFile.name

    // Test rename operations with comprehensive patterns
    await this.testComprehensiveRenameOperations(testFile, originalName)
    
    // Test copy operations
    await this.testCopyOperations(testFile)
    
    // Test move operations
    await this.testMoveOperations(testFile)
    
    // Test share operations
    await this.testShareOperations(testFile)
  }

  /**
   * Comprehensive rename operations testing
   */
  async testComprehensiveRenameOperations(testFile, originalName) {
    console.log('\n🔄 Testing Comprehensive Rename Operations...')
    
    const renameScenarios = [
      {
        name: 'Direct Rename',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          newName: `TEST_DIRECT_${Date.now()}_${originalName}`
        }
      },
      {
        name: 'Prefix Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: 'PREFIX_TEST',
          renameType: 'prefix'
        }
      },
      {
        name: 'Suffix Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: '_SUFFIX_TEST',
          renameType: 'suffix'
        }
      },
      {
        name: 'Numbering Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: 'NumberedFile',
          renameType: 'numbering',
          startNumber: 1,
          incrementBy: 1
        }
      },
      {
        name: 'Timestamp Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: 'timestamp',
          renameType: 'timestamp',
          timestampFormat: 'YYYY-MM-DD_HH-mm-ss'
        }
      },
      {
        name: 'Replace Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: 'old|new',
          renameType: 'replace',
          caseSensitive: false
        }
      },
      {
        name: 'Regex Pattern',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          namePrefix: '/[0-9]+/NUM/g',
          renameType: 'regex'
        }
      },
      {
        name: 'Case Transformation - Uppercase',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          renameType: 'case',
          caseType: 'upper'
        }
      },
      {
        name: 'Case Transformation - Lowercase',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          renameType: 'case',
          caseType: 'lower'
        }
      },
      {
        name: 'Case Transformation - Title Case',
        body: {
          items: [{ id: testFile.id, name: originalName }],
          renameType: 'case',
          caseType: 'title'
        }
      }
    ]

    for (const scenario of renameScenarios) {
      console.log(`\n🔄 Testing: ${scenario.name}`)
      console.log(`📝 Request:`, JSON.stringify(scenario.body, null, 2))
      
      const result = await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/rename',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.results
      })

      if (result.success && result.data.success && result.data.results && result.data.results[0]) {
        console.log(`✅ Renamed to: ${result.data.results[0].newName}`)
        
        // Restore original name for next test
        await this.restoreFileName(testFile.id, result.data.results[0].newName, originalName)
      }

      // Wait between tests to avoid rate limiting
      await this.sleep(1000)
    }
  }

  /**
   * Test copy operations
   */
  async testCopyOperations(testFile) {
    console.log('\n📋 Testing Copy Operations...')
    
    const copyScenarios = [
      {
        name: 'Simple Copy',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          targetFolderId: 'root'
        }
      },
      {
        name: 'Copy with Rename',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          targetFolderId: 'root',
          namePrefix: 'Copy_of_',
          renameType: 'prefix'
        }
      }
    ]

    for (const scenario of copyScenarios) {
      await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/copy',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.results
      })
    }
  }

  /**
   * Test move operations
   */
  async testMoveOperations(testFile) {
    if (this.testData.folders.length === 0) {
      console.log('⚠️ No folders available for move testing')
      return
    }

    console.log('\n📁 Testing Move Operations...')
    
    const targetFolder = this.testData.folders[0]
    
    const moveScenarios = [
      {
        name: 'Move to Folder',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          targetFolderId: targetFolder.id
        }
      }
    ]

    for (const scenario of moveScenarios) {
      const result = await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/move',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.results
      })

      // Move back to root if successful
      if (result.success) {
        await this.testEndpointWithRetry({
          name: 'Move Back to Root',
          path: '/api/drive/files/move',
          method: 'POST',
          body: {
            items: [{ id: testFile.id, name: testFile.name }],
            targetFolderId: 'root'
          }
        })
      }
    }
  }

  /**
   * Test share operations
   */
  async testShareOperations(testFile) {
    console.log('\n🔗 Testing Share Operations...')
    
    const shareScenarios = [
      {
        name: 'Get Share Link',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          linkType: 'view',
          accessLevel: 'anyone'
        }
      },
      {
        name: 'Share with Email',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          emails: ['test@example.com'],
          role: 'reader',
          message: 'Test sharing from API test'
        }
      }
    ]

    for (const scenario of shareScenarios) {
      await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/share',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.results
      })
    }
  }

  /**
   * Phase 4: Folder Operations Testing
   */
  async testFolderOperations() {
    console.log('\n📁 Phase 4: Folder Operations Testing')
    console.log('-'.repeat(50))
    
    const folderScenarios = [
      {
        name: 'Create Test Folder',
        path: '/api/drive/folders',
        method: 'POST',
        body: {
          name: `TEST_FOLDER_${Date.now()}`,
          parentId: 'root'
        },
        validateResponse: (data) => data.success && data.folder
      },
      {
        name: 'Validate Folder Path',
        path: '/api/drive/folders/validate',
        method: 'POST',
        body: {
          path: '/TEST_FOLDER_PATH',
          parentId: 'root'
        },
        validateResponse: (data) => data.isValid !== undefined
      }
    ]

    for (const scenario of folderScenarios) {
      const result = await this.testEndpointWithRetry(scenario)
      
      if (result.success && scenario.name === 'Create Test Folder') {
        this.testData.testFolder = result.data.folder
        console.log(`✅ Created test folder: ${result.data.folder.name}`)
      }
    }
  }

  /**
   * Phase 5: Advanced File Operations Testing
   */
  async testAdvancedFileOperations() {
    console.log('\n🚀 Phase 5: Advanced File Operations Testing')
    console.log('-'.repeat(50))
    
    if (this.testData.files.length === 0) return

    // Test download operations
    await this.testDownloadOperations()
    
    // Test export operations
    await this.testExportOperations()
    
    // Test trash operations
    await this.testTrashOperations()
  }

  /**
   * Test download operations
   */
  async testDownloadOperations() {
    console.log('\n⬇️ Testing Download Operations...')
    
    const downloadableFiles = this.testData.files.filter(f => 
      !f.mimeType.startsWith('application/vnd.google-apps.')
    )

    if (downloadableFiles.length === 0) {
      console.log('⚠️ No downloadable files found')
      return
    }

    const testFile = downloadableFiles[0]
    
    const downloadScenarios = [
      {
        name: 'Single File Download',
        body: {
          items: [{ id: testFile.id, name: testFile.name }]
        }
      },
      {
        name: 'Multiple Files Download',
        body: {
          items: downloadableFiles.slice(0, 3).map(f => ({ id: f.id, name: f.name }))
        }
      }
    ]

    for (const scenario of downloadScenarios) {
      await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/download',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.downloadUrl
      })
    }
  }

  /**
   * Test export operations
   */
  async testExportOperations() {
    console.log('\n📤 Testing Export Operations...')
    
    const googleDocsFiles = this.testData.files.filter(f => 
      f.mimeType.startsWith('application/vnd.google-apps.') &&
      f.mimeType !== 'application/vnd.google-apps.folder'
    )

    if (googleDocsFiles.length === 0) {
      console.log('⚠️ No Google Docs files found for export testing')
      return
    }

    const testFile = googleDocsFiles[0]
    
    const exportScenarios = [
      {
        name: 'Export as PDF',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          format: 'pdf'
        }
      },
      {
        name: 'Export as DOCX',
        body: {
          items: [{ id: testFile.id, name: testFile.name }],
          format: 'docx'
        }
      }
    ]

    for (const scenario of exportScenarios) {
      await this.testEndpointWithRetry({
        name: scenario.name,
        path: '/api/drive/files/export',
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.exportUrl
      })
    }
  }

  /**
   * Test trash operations
   */
  async testTrashOperations() {
    if (this.testData.testFolder) {
      console.log('\n🗑️ Testing Trash Operations...')
      
      const trashScenarios = [
        {
          name: 'Move to Trash',
          path: '/api/drive/files/trash',
          body: {
            items: [{ id: this.testData.testFolder.id, name: this.testData.testFolder.name }]
          }
        },
        {
          name: 'Restore from Trash',
          path: '/api/drive/files/untrash',
          body: {
            items: [{ id: this.testData.testFolder.id, name: this.testData.testFolder.name }]
          }
        },
        {
          name: 'Permanent Delete',
          path: '/api/drive/files/delete',
          body: {
            items: [{ id: this.testData.testFolder.id, name: this.testData.testFolder.name }]
          }
        }
      ]

      for (const scenario of trashScenarios) {
        await this.testEndpointWithRetry({
          name: scenario.name,
          path: scenario.path,
          method: 'POST',
          body: scenario.body,
          validateResponse: (data) => data.success || data.results
        })
      }
    }
  }

  /**
   * Phase 6: Bulk Operations Testing
   */
  async testBulkOperations() {
    console.log('\n📦 Phase 6: Bulk Operations Testing')
    console.log('-'.repeat(50))
    
    if (this.testData.files.length < 3) {
      console.log('⚠️ Not enough files for bulk operations testing')
      return
    }

    const bulkFiles = this.testData.files.slice(0, 5)
    
    const bulkScenarios = [
      {
        name: 'Bulk Rename with Numbering',
        path: '/api/drive/files/rename',
        body: {
          items: bulkFiles.map(f => ({ id: f.id, name: f.name })),
          namePrefix: 'BulkTest',
          renameType: 'numbering',
          startNumber: 1,
          incrementBy: 1
        }
      },
      {
        name: 'Bulk Details Fetch',
        path: '/api/drive/files/details',
        body: {
          fileIds: bulkFiles.map(f => f.id),
          fields: 'id,name,mimeType,size,modifiedTime'
        }
      }
    ]

    for (const scenario of bulkScenarios) {
      await this.testEndpointWithRetry({
        name: scenario.name,
        path: scenario.path,
        method: 'POST',
        body: scenario.body,
        validateResponse: (data) => data.success || data.results || data.files
      })
    }
  }

  /**
   * Phase 7: Performance & Stress Testing
   */
  async testPerformanceScenarios() {
    console.log('\n⚡ Phase 7: Performance & Stress Testing')
    console.log('-'.repeat(50))
    
    // Test with different page sizes
    const pageSizes = [10, 25, 50, 100, 200]
    
    for (const pageSize of pageSizes) {
      const startTime = Date.now()
      const result = await this.makeRequest(`/api/drive/files?pageSize=${pageSize}`, 'GET')
      const responseTime = Date.now() - startTime
      
      console.log(`📊 Page Size ${pageSize}: ${responseTime}ms - ${result.success ? result.data.files.length : 0} files`)
      
      this.testData.performanceMetrics[`pageSize_${pageSize}`] = {
        responseTime,
        itemCount: result.success ? result.data.files.length : 0,
        success: result.success
      }
    }

    // Test concurrent requests
    await this.testConcurrentRequests()
  }

  /**
   * Test concurrent requests
   */
  async testConcurrentRequests() {
    console.log('\n🔄 Testing Concurrent Requests...')
    
    const concurrentTests = [5, 10, 15, 20]
    
    for (const concurrency of concurrentTests) {
      console.log(`\n🔄 Testing ${concurrency} concurrent requests...`)
      
      const startTime = Date.now()
      const promises = Array(concurrency).fill().map((_, i) => 
        this.makeRequest(`/api/drive/files?pageSize=10&_test=${i}`, 'GET')
      )
      
      try {
        const results = await Promise.all(promises)
        const endTime = Date.now()
        const successCount = results.filter(r => r.success).length
        
        console.log(`✅ Concurrent ${concurrency}: ${endTime - startTime}ms, ${successCount}/${concurrency} success`)
        
        this.testData.performanceMetrics[`concurrent_${concurrency}`] = {
          totalTime: endTime - startTime,
          successCount,
          totalRequests: concurrency,
          successRate: (successCount / concurrency * 100).toFixed(2)
        }
      } catch (error) {
        console.log(`❌ Concurrent ${concurrency}: Failed - ${error.message}`)
      }
    }
  }

  /**
   * Phase 8: Error Handling & Edge Cases
   */
  async testErrorHandling() {
    console.log('\n🚨 Phase 8: Error Handling & Edge Cases Testing')
    console.log('-'.repeat(50))
    
    const errorScenarios = [
      {
        name: 'Invalid File ID',
        path: '/api/drive/files/details',
        method: 'POST',
        body: { fileId: 'invalid_file_id_12345' },
        expectError: true
      },
      {
        name: 'Missing Required Parameters',
        path: '/api/drive/files/rename',
        method: 'POST',
        body: {},
        expectError: true
      },
      {
        name: 'Invalid Sort Parameter',
        path: '/api/drive/files?sortBy=invalid_field',
        method: 'GET',
        expectError: false // Should handle gracefully
      },
      {
        name: 'Extremely Large Page Size',
        path: '/api/drive/files?pageSize=99999',
        method: 'GET',
        expectError: false // Should be limited
      },
      {
        name: 'SQL Injection Attempt',
        path: '/api/drive/files?query=\'; DROP TABLE files; --',
        method: 'GET',
        expectError: false // Should be sanitized
      },
      {
        name: 'XSS Attempt in Query',
        path: '/api/drive/files?query=<script>alert("xss")</script>',
        method: 'GET',
        expectError: false // Should be sanitized
      }
    ]

    for (const scenario of errorScenarios) {
      console.log(`\n🔍 Testing: ${scenario.name}`)
      
      const result = await this.testEndpointWithRetry({
        ...scenario,
        skipRetry: true
      })

      if (scenario.expectError) {
        if (!result.success) {
          console.log(`✅ Expected error handled correctly`)
        } else {
          console.log(`⚠️ Expected error but got success`)
        }
      } else {
        if (result.success) {
          console.log(`✅ Edge case handled gracefully`)
        } else {
          console.log(`⚠️ Edge case caused unexpected error`)
        }
      }
    }
  }

  /**
   * Phase 9: Cache & Optimization Testing
   */
  async testCacheOperations() {
    console.log('\n💾 Phase 9: Cache & Optimization Testing')
    console.log('-'.repeat(50))
    
    const cacheScenarios = [
      {
        name: 'Cache Performance Check',
        path: '/api/drive/performance',
        method: 'GET'
      },
      {
        name: 'Clear Drive Cache',
        path: '/api/drive/cache/clear',
        method: 'POST'
      },
      {
        name: 'Clear All Cache',
        path: '/api/cache/clear',
        method: 'POST'
      }
    ]

    for (const scenario of cacheScenarios) {
      await this.testEndpointWithRetry(scenario)
    }

    // Test cache effectiveness
    await this.testCacheEffectiveness()
  }

  /**
   * Test cache effectiveness
   */
  async testCacheEffectiveness() {
    console.log('\n📊 Testing Cache Effectiveness...')
    
    // First request (cache miss)
    const startTime1 = Date.now()
    await this.makeRequest('/api/drive/files?pageSize=50', 'GET')
    const firstRequestTime = Date.now() - startTime1
    
    // Second request (cache hit)
    const startTime2 = Date.now()
    await this.makeRequest('/api/drive/files?pageSize=50', 'GET')
    const secondRequestTime = Date.now() - startTime2
    
    const improvement = ((firstRequestTime - secondRequestTime) / firstRequestTime * 100).toFixed(2)
    
    console.log(`📊 Cache Performance:`)
    console.log(`  First request: ${firstRequestTime}ms`)
    console.log(`  Second request: ${secondRequestTime}ms`)
    console.log(`  Improvement: ${improvement}%`)
    
    this.testData.performanceMetrics.cacheEffectiveness = {
      firstRequest: firstRequestTime,
      secondRequest: secondRequestTime,
      improvement: improvement
    }
  }

  /**
   * Helper method to test endpoint with retry logic
   */
  async testEndpointWithRetry(endpoint) {
    const maxRetries = endpoint.skipRetry ? 1 : this.config.retryAttempts
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now()
        const result = await this.makeRequest(endpoint.path, endpoint.method, endpoint.body)
        const responseTime = Date.now() - startTime

        const testResult = {
          endpoint: endpoint.path,
          name: endpoint.name,
          method: endpoint.method,
          attempt,
          responseTime,
          success: result.success,
          status: result.status || (result.success ? 200 : 500),
          timestamp: new Date().toISOString()
        }

        if (result.success) {
          // Validate response if validator provided
          if (endpoint.validateResponse && !endpoint.validateResponse(result.data)) {
            testResult.success = false
            testResult.error = 'Response validation failed'
            console.log(`  ❌ ${endpoint.name}: Validation failed (${responseTime}ms)`)
          } else {
            console.log(`  ✅ ${endpoint.name}: ${testResult.status} (${responseTime}ms)`)
            if (attempt > 1) {
              console.log(`    🔄 Succeeded on attempt ${attempt}`)
            }
          }
          
          testResult.data = result.data
          this.results.push(testResult)
          return testResult
        } else {
          testResult.error = result.error
          lastError = result.error
          
          if (attempt < maxRetries) {
            console.log(`  ⚠️ ${endpoint.name}: Attempt ${attempt} failed, retrying...`)
            await this.sleep(1000 * attempt) // Exponential backoff
          } else {
            console.log(`  ❌ ${endpoint.name}: ${result.status || 'Error'} (${responseTime}ms) - ${result.error}`)
          }
        }

        this.results.push(testResult)

      } catch (error) {
        lastError = error.message
        if (attempt < maxRetries) {
          console.log(`  ⚠️ ${endpoint.name}: Attempt ${attempt} failed with exception, retrying...`)
          await this.sleep(1000 * attempt)
        } else {
          console.log(`  ❌ ${endpoint.name}: Exception after ${maxRetries} attempts - ${error.message}`)
          this.results.push({
            endpoint: endpoint.path,
            name: endpoint.name,
            method: endpoint.method,
            attempt,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    return { success: false, error: lastError }
  }

  /**
   * Make HTTP request with proper headers
   */
  async makeRequest(path, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Cookie': this.config.sessionCookie,
          'Content-Type': 'application/json',
          'User-Agent': 'Comprehensive-API-Tester/1.0'
        },
        timeout: this.config.testTimeout
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${this.config.baseUrl}${path}`, options)
      
      let data = null
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = { message: await response.text() }
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        error: response.ok ? null : `HTTP ${response.status}: ${data.message || data.error || 'Unknown error'}`
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  }

  /**
   * Restore file name helper
   */
  async restoreFileName(fileId, currentName, originalName) {
    try {
      const result = await this.makeRequest('/api/drive/files/rename', 'POST', {
        items: [{ id: fileId, name: currentName }],
        newName: originalName
      })
      
      if (result.success) {
        console.log(`🔄 Restored to original name: ${originalName}`)
      }
    } catch (error) {
      console.log(`⚠️ Failed to restore original name: ${error.message}`)
    }
  }

  /**
   * Log error helper
   */
  logError(level, message, stack = null) {
    const error = {
      level,
      message,
      stack,
      timestamp: new Date().toISOString()
    }
    this.testData.errorLog.push(error)
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport() {
    const totalTime = Date.now() - this.startTime
    const successfulTests = this.results.filter(r => r.success).length
    const failedTests = this.results.length - successfulTests
    const averageResponseTime = this.results.length > 0 
      ? this.results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / this.results.length 
      : 0

    console.log('\n' + '='.repeat(80))
    console.log('📊 COMPREHENSIVE API TESTING REPORT')
    console.log('='.repeat(80))
    
    // Summary Statistics
    console.log('📈 SUMMARY STATISTICS')
    console.log('-'.repeat(40))
    console.log(`🎯 Success Rate: ${successfulTests}/${this.results.length} (${Math.round(successfulTests/this.results.length*100)}%)`)
    console.log(`⏱️ Total Test Time: ${totalTime}ms (${(totalTime/1000/60).toFixed(2)} minutes)`)
    console.log(`⚡ Average Response Time: ${Math.round(averageResponseTime)}ms`)
    console.log(`✅ Successful Tests: ${successfulTests}`)
    console.log(`❌ Failed Tests: ${failedTests}`)
    console.log(`🔄 Total Requests: ${this.results.length}`)

    // Performance Metrics
    if (Object.keys(this.testData.performanceMetrics).length > 0) {
      console.log('\n⚡ PERFORMANCE METRICS')
      console.log('-'.repeat(40))
      
      Object.entries(this.testData.performanceMetrics).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`📊 ${key}:`)
          Object.entries(value).forEach(([subKey, subValue]) => {
            console.log(`  ${subKey}: ${subValue}`)
          })
        } else {
          console.log(`📊 ${key}: ${value}`)
        }
      })
    }

    // Test Data Summary
    console.log('\n📄 TEST DATA SUMMARY')
    console.log('-'.repeat(40))
    console.log(`📁 Files Tested: ${this.testData.files.length}`)
    console.log(`📂 Folders Found: ${this.testData.folders.length}`)
    if (this.testData.user) {
      console.log(`👤 Test User: ${this.testData.user.email}`)
    }

    // Failed Tests Details
    if (failedTests > 0) {
      console.log('\n🚨 FAILED TESTS BREAKDOWN')
      console.log('-'.repeat(40))
      
      const failuresByType = {}
      this.results.filter(r => !r.success).forEach(result => {
        const errorType = result.error ? result.error.split(':')[0] : 'Unknown'
        failuresByType[errorType] = (failuresByType[errorType] || 0) + 1
      })

      Object.entries(failuresByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} failures`)
      })

      console.log('\n📋 Failed Test Details:')
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.error || 'Unknown error'}`)
        if (result.attempt > 1) {
          console.log(`    🔄 Failed after ${result.attempt} attempts`)
        }
      })
    }

    // Error Log
    if (this.testData.errorLog.length > 0) {
      console.log('\n🚨 ERROR LOG')
      console.log('-'.repeat(40))
      this.testData.errorLog.forEach(error => {
        console.log(`[${error.level}] ${error.timestamp}: ${error.message}`)
      })
    }

    // Response Time Analysis
    console.log('\n⚡ RESPONSE TIME ANALYSIS')
    console.log('-'.repeat(40))
    
    const responseTimes = this.results.filter(r => r.responseTime).map(r => r.responseTime)
    if (responseTimes.length > 0) {
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const median = sortedTimes[Math.floor(sortedTimes.length / 2)]
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      const min = Math.min(...responseTimes)
      const max = Math.max(...responseTimes)

      console.log(`📊 Min Response Time: ${min}ms`)
      console.log(`📊 Max Response Time: ${max}ms`)
      console.log(`📊 Median Response Time: ${median}ms`)
      console.log(`📊 95th Percentile: ${p95}ms`)
    }

    // Test Categories Breakdown
    console.log('\n📋 TEST CATEGORIES BREAKDOWN')
    console.log('-'.repeat(40))
    
    const categories = {}
    this.results.forEach(result => {
      const category = this.categorizeTest(result.name)
      if (!categories[category]) {
        categories[category] = { total: 0, success: 0, failed: 0 }
      }
      categories[category].total++
      if (result.success) {
        categories[category].success++
      } else {
        categories[category].failed++
      }
    })

    Object.entries(categories).forEach(([category, stats]) => {
      const successRate = Math.round(stats.success / stats.total * 100)
      console.log(`📂 ${category}: ${stats.success}/${stats.total} (${successRate}%)`)
    })

    // Health Assessment
    const overallHealth = this.assessAPIHealth(successfulTests, this.results.length, averageResponseTime)
    console.log('\n🎯 API HEALTH ASSESSMENT')
    console.log('-'.repeat(40))
    console.log(`🏥 Overall Health: ${overallHealth.status}`)
    console.log(`📊 Score: ${overallHealth.score}/100`)
    console.log(`💡 Recommendations:`)
    overallHealth.recommendations.forEach(rec => {
      console.log(`  • ${rec}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log(`🎉 Testing completed at ${new Date().toISOString()}`)
    console.log('='.repeat(80))
  }

  /**
   * Categorize test for reporting
   */
  categorizeTest(testName) {
    if (testName.includes('Authentication') || testName.includes('Session')) return 'Authentication'
    if (testName.includes('File') || testName.includes('Download') || testName.includes('Upload')) return 'File Operations'
    if (testName.includes('Folder')) return 'Folder Operations'
    if (testName.includes('Rename')) return 'Rename Operations'
    if (testName.includes('Copy') || testName.includes('Move')) return 'File Management'
    if (testName.includes('Share')) return 'Sharing'
    if (testName.includes('Trash') || testName.includes('Delete')) return 'Trash Operations'
    if (testName.includes('Performance') || testName.includes('Concurrent')) return 'Performance'
    if (testName.includes('Cache')) return 'Caching'
    if (testName.includes('Error') || testName.includes('Invalid')) return 'Error Handling'
    return 'Other'
  }

  /**
   * Assess API health
   */
  assessAPIHealth(successCount, totalCount, avgResponseTime) {
    const successRate = successCount / totalCount
    let score = 0
    let status = 'CRITICAL'
    let recommendations = []

    // Success rate scoring (60% of total score)
    if (successRate >= 0.95) score += 60
    else if (successRate >= 0.90) score += 50
    else if (successRate >= 0.80) score += 40
    else if (successRate >= 0.70) score += 30
    else if (successRate >= 0.50) score += 20
    else score += 10

    // Response time scoring (40% of total score)
    if (avgResponseTime <= 500) score += 40
    else if (avgResponseTime <= 1000) score += 35
    else if (avgResponseTime <= 2000) score += 30
    else if (avgResponseTime <= 5000) score += 20
    else if (avgResponseTime <= 10000) score += 10
    else score += 5

    // Determine status
    if (score >= 90) status = 'EXCELLENT'
    else if (score >= 80) status = 'GOOD'
    else if (score >= 70) status = 'FAIR'
    else if (score >= 50) status = 'POOR'
    else status = 'CRITICAL'

    // Generate recommendations
    if (successRate < 0.9) {
      recommendations.push('Improve error handling and API reliability')
    }
    if (avgResponseTime > 2000) {
      recommendations.push('Optimize response times and consider caching')
    }
    if (successRate >= 0.95 && avgResponseTime <= 1000) {
      recommendations.push('API is performing well, monitor for consistency')
    }
    if (score < 70) {
      recommendations.push('Critical issues detected, immediate attention required')
    }

    return { status, score, recommendations }
  }

  /**
   * Create test data if none exists
   */
  async createTestData() {
    console.log('\n🏗️ Creating test data...')
    
    try {
      const result = await this.makeRequest('/api/drive/folders', 'POST', {
        name: `API_TEST_FOLDER_${Date.now()}`,
        parentId: 'root'
      })
      
      if (result.success) {
        this.testData.testFolder = result.data.folder
        console.log(`✅ Created test folder: ${result.data.folder.name}`)
      }
    } catch (error) {
      console.log(`⚠️ Failed to create test data: ${error.message}`)
    }
  }
}

// Main execution
async function main() {
  const tester = new ComprehensiveAPITester(testConfig)
  await tester.runComprehensiveTests()
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Comprehensive testing failed:', error)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  })
}

module.exports = { ComprehensiveAPITester, testConfig }
