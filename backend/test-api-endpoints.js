/**
 * API Endpoint Test Suite
 * Tests all failing endpoints and identifies issues
 */

const axios = require('axios')
const BASE_URL = 'http://localhost:7001/api'

// Test helper
async function testEndpoint(method, path, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }
  
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.data = data
  }
  
  try {
    const response = await axios(config)
    return { success: true, status: response.status, data: response.data }
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 'ERROR', 
      error: error.response?.data || error.message 
    }
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints on port 7001...\n')
  
  let authToken = null
  let refreshToken = null
  
  // First, try to login to get a token
  console.log('🔐 Testing Authentication...')
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'admin@daritana.com',
    password: 'admin123'
  })
  
  if (loginResult.success) {
    authToken = loginResult.data.token || loginResult.data.accessToken
    refreshToken = loginResult.data.refreshToken
    console.log('✅ Login successful, got token')
  } else {
    console.log('⚠️ Login failed:', loginResult.status, loginResult.error)
  }
  
  console.log('\n📋 Testing Failed Endpoints...\n')
  
  const tests = [
    {
      name: 'POST /auth/refresh',
      test: () => testEndpoint('POST', '/auth/refresh', { refreshToken: refreshToken || 'test-token' })
    },
    {
      name: 'POST /projects',
      test: () => testEndpoint('POST', '/projects', {
        name: 'Test Project',
        description: 'Test Description',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, authToken)
    },
    {
      name: 'POST /tasks',
      test: () => testEndpoint('POST', '/tasks', {
        title: 'Test Task',
        description: 'Test Description',
        projectId: 'test-project-id',
        status: 'pending'
      }, authToken)
    },
    {
      name: 'POST /team/presence',
      test: () => testEndpoint('POST', '/team/presence', {
        status: 'online',
        location: 'dashboard'
      }, authToken)
    },
    {
      name: 'GET /documents/statistics',
      test: () => testEndpoint('GET', '/documents/statistics', null, authToken)
    },
    {
      name: 'GET /documents/categories',
      test: () => testEndpoint('GET', '/documents/categories', null, authToken)
    },
    {
      name: 'POST /documents/upload',
      test: () => testEndpoint('POST', '/documents/upload', {
        filename: 'test.pdf',
        category: 'design'
      }, authToken)
    },
    {
      name: 'GET /financial/analytics',
      test: () => testEndpoint('GET', '/financial/analytics', null, authToken)
    },
    {
      name: 'POST /financial/invoices',
      test: () => testEndpoint('POST', '/financial/invoices', {
        projectId: 'test-project',
        amount: 1000,
        description: 'Test Invoice'
      }, authToken)
    },
    {
      name: 'PUT /settings/preferences/general',
      test: () => testEndpoint('PUT', '/settings/preferences/general', {
        theme: 'light',
        language: 'en'
      }, authToken)
    },
    {
      name: 'GET /compliance/issues',
      test: () => testEndpoint('GET', '/compliance/issues', null, authToken)
    },
    {
      name: 'POST /compliance/issues',
      test: () => testEndpoint('POST', '/compliance/issues', {
        title: 'Test Issue',
        severity: 'low',
        description: 'Test compliance issue'
      }, authToken)
    },
    {
      name: 'GET /marketplace/quotes',
      test: () => testEndpoint('GET', '/marketplace/quotes', null, authToken)
    },
    {
      name: 'GET /hr/employees',
      test: () => testEndpoint('GET', '/hr/employees', null, authToken)
    },
    {
      name: 'GET /learning/enrollments',
      test: () => testEndpoint('GET', '/learning/enrollments', null, authToken)
    },
    {
      name: 'POST /learning/enrollments',
      test: () => testEndpoint('POST', '/learning/enrollments', {
        courseId: 'test-course',
        userId: 'test-user'
      }, authToken)
    }
  ]
  
  const results = []
  
  for (const { name, test } of tests) {
    const result = await test()
    results.push({ name, ...result })
    
    const emoji = result.success ? '✅' : result.status === 404 ? '🔍' : result.status === 400 ? '📝' : result.status === 403 ? '🔒' : result.status === 500 ? '💥' : '❌'
    console.log(`${emoji} ${name}: ${result.status}`)
    
    if (!result.success && result.error) {
      const errorMsg = typeof result.error === 'object' ? 
        (result.error.message || result.error.error || JSON.stringify(result.error).substring(0, 100)) : 
        result.error
      console.log(`   → ${errorMsg}`)
    }
  }
  
  console.log('\n📊 Summary:')
  const grouped = {
    '404 - Missing Route': results.filter(r => r.status === 404),
    '400 - Validation Error': results.filter(r => r.status === 400),
    '403 - Permission Error': results.filter(r => r.status === 403),
    '500 - Database Error': results.filter(r => r.status === 500),
    'Success': results.filter(r => r.success)
  }
  
  for (const [category, items] of Object.entries(grouped)) {
    if (items.length > 0) {
      console.log(`\n${category}: ${items.length}`)
      items.forEach(item => console.log(`  - ${item.name}`))
    }
  }
}

// Run tests
runTests().catch(console.error)