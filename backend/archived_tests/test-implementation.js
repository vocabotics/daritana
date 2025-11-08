/**
 * Test script for enhanced backend implementation
 * Tests the multi-tenant authentication, project management, and file upload systems
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:8080/api'
let authToken = ''
let organizationId = ''
let projectId = ''
let userId = ''

// Test configuration
const testConfig = {
  email: 'admin@test.com',
  password: 'password123',
  organizationName: 'Test Architecture Firm'
}

/**
 * Helper function to make authenticated requests
 */
async function request(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(organizationId && { 'X-Organization-ID': organizationId }),
        ...headers
      }
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data
    }

    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message)
    throw error
  }
}

/**
 * Test authentication system
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...')
  
  try {
    // Test login
    const loginResponse = await request('POST', '/auth/login', {
      email: testConfig.email,
      password: testConfig.password
    })
    
    authToken = loginResponse.token
    userId = loginResponse.user.id
    
    console.log('✅ Login successful')
    console.log(`   Token: ${authToken.substring(0, 20)}...`)
    console.log(`   User ID: ${userId}`)
    
    // Get user organizations
    const orgsResponse = await request('GET', '/auth/me')
    if (orgsResponse.organizations && orgsResponse.organizations.length > 0) {
      organizationId = orgsResponse.organizations[0].id
      console.log(`✅ Organization ID: ${organizationId}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Authentication test failed')
    return false
  }
}

/**
 * Test organization member management
 */
async function testOrganizationManagement() {
  console.log('\n🏢 Testing Organization Management...')
  
  try {
    // List organization members
    const members = await request('GET', `/organizations/${organizationId}/members`)
    console.log(`✅ Found ${members.members?.length || 0} organization members`)
    
    // Get member statistics
    const stats = await request('GET', `/organizations/${organizationId}/members/stats`)
    console.log(`✅ Organization stats:`)
    console.log(`   Total members: ${stats.totalMembers}`)
    console.log(`   Active members: ${stats.activeMembers}`)
    
    return true
  } catch (error) {
    console.error('❌ Organization management test failed')
    return false
  }
}

/**
 * Test invitation system
 */
async function testInvitationSystem() {
  console.log('\n📧 Testing Invitation System...')
  
  try {
    // Send invitation
    const invitation = await request('POST', '/invitations/invite', {
      email: 'newuser@test.com',
      role: 'DESIGNER',
      message: 'Welcome to our team!'
    })
    
    console.log('✅ Invitation sent successfully')
    console.log(`   Invitation ID: ${invitation.invitation?.id}`)
    
    // List invitations
    const invitations = await request('GET', '/invitations')
    console.log(`✅ Found ${invitations.length} pending invitations`)
    
    return true
  } catch (error) {
    console.error('❌ Invitation system test failed')
    return false
  }
}

/**
 * Test enhanced project management
 */
async function testProjectManagement() {
  console.log('\n📋 Testing Enhanced Project Management...')
  
  try {
    // Create project
    const project = await request('POST', '/projects', {
      name: 'Test Modern House Project',
      description: 'A test project for modern house design',
      clientId: userId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      estimatedBudget: 500000,
      type: 'Residential',
      category: 'Architecture',
      siteAddress: 'Kuala Lumpur, Malaysia'
    })
    
    projectId = project.id
    console.log('✅ Project created successfully')
    console.log(`   Project ID: ${projectId}`)
    console.log(`   Project Code: ${project.code}`)
    
    // List projects
    const projects = await request('GET', '/projects')
    console.log(`✅ Found ${projects.projects?.length || 0} projects`)
    
    // Get project details
    const projectDetails = await request('GET', `/projects/${projectId}`)
    console.log(`✅ Project details retrieved`)
    console.log(`   Members: ${projectDetails.members?.length || 0}`)
    console.log(`   Tasks: ${projectDetails._count?.tasks || 0}`)
    
    return true
  } catch (error) {
    console.error('❌ Project management test failed')
    return false
  }
}

/**
 * Test project team management
 */
async function testTeamManagement() {
  console.log('\n👥 Testing Project Team Management...')
  
  try {
    // List project members
    const members = await request('GET', `/projects/${projectId}/members`)
    console.log(`✅ Found ${members.length} project members`)
    
    // Get team statistics
    const stats = await request('GET', `/projects/${projectId}/members/stats`)
    console.log(`✅ Team statistics:`)
    console.log(`   Total members: ${stats.totalMembers}`)
    
    return true
  } catch (error) {
    console.error('❌ Team management test failed')
    return false
  }
}

/**
 * Test timeline and milestone system
 */
async function testTimelineManagement() {
  console.log('\n📅 Testing Timeline & Milestone Management...')
  
  try {
    // Create timeline entry
    const timeline = await request('POST', `/projects/${projectId}/timeline`, {
      title: 'Design Phase',
      description: 'Initial design and planning phase',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      color: '#3B82F6'
    })
    
    console.log('✅ Timeline entry created')
    console.log(`   Timeline ID: ${timeline.id}`)
    
    // Create milestone
    const milestone = await request('POST', `/projects/${projectId}/milestones`, {
      name: 'Design Approval',
      description: 'Client approval of initial design',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
    })
    
    console.log('✅ Milestone created')
    console.log(`   Milestone ID: ${milestone.id}`)
    
    // Get project progress
    const progress = await request('GET', `/projects/${projectId}/progress`)
    console.log('✅ Project progress retrieved')
    console.log(`   Overall progress: ${progress.progress.overall}%`)
    
    return true
  } catch (error) {
    console.error('❌ Timeline management test failed')
    return false
  }
}

/**
 * Test dashboard system
 */
async function testDashboardSystem() {
  console.log('\n📊 Testing Dashboard System...')
  
  try {
    // Get dashboard configuration
    const config = await request('GET', '/dashboard/config')
    console.log('✅ Dashboard config retrieved')
    console.log(`   Layout: ${config.layout}`)
    console.log(`   Widgets: ${config.widgets?.length || 0}`)
    
    // Get dashboard data
    const data = await request('GET', '/dashboard/data')
    console.log('✅ Dashboard data retrieved')
    console.log(`   Data keys: ${Object.keys(data.data || {}).join(', ')}`)
    
    return true
  } catch (error) {
    console.error('❌ Dashboard system test failed')
    return false
  }
}

/**
 * Test file upload system
 */
async function testFileUpload() {
  console.log('\n📁 Testing File Upload System...')
  
  try {
    // Get storage stats first
    const stats = await request('GET', '/files/stats')
    console.log('✅ Storage statistics retrieved')
    console.log(`   Total files: ${stats.totalFiles}`)
    console.log(`   Used storage: ${stats.usedStorageMB} MB`)
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt')
    fs.writeFileSync(testFilePath, 'This is a test file for upload testing.')
    
    // Get presigned upload URL
    const uploadUrl = await request('POST', '/files/upload-url', {
      filename: 'test-document.txt',
      contentType: 'text/plain',
      folder: 'documents'
    })
    
    console.log('✅ Upload URL generated')
    console.log(`   Upload URL: ${uploadUrl.uploadUrl ? 'Generated' : 'Not available'}`)
    
    // List documents
    const documents = await request('GET', '/files')
    console.log(`✅ Found ${documents.documents?.length || 0} documents`)
    
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
    
    return true
  } catch (error) {
    console.error('❌ File upload test failed')
    return false
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Enhanced Backend Implementation Tests...')
  console.log(`📡 Base URL: ${BASE_URL}`)
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Organization Management', fn: testOrganizationManagement },
    { name: 'Invitation System', fn: testInvitationSystem },
    { name: 'Project Management', fn: testProjectManagement },
    { name: 'Team Management', fn: testTeamManagement },
    { name: 'Timeline Management', fn: testTimelineManagement },
    { name: 'Dashboard System', fn: testDashboardSystem },
    { name: 'File Upload', fn: testFileUpload }
  ]
  
  const results = {
    passed: 0,
    failed: 0,
    total: tests.length
  }
  
  for (const test of tests) {
    try {
      const success = await test.fn()
      if (success) {
        results.passed++
        console.log(`✅ ${test.name} test passed`)
      } else {
        results.failed++
        console.log(`❌ ${test.name} test failed`)
      }
    } catch (error) {
      results.failed++
      console.log(`❌ ${test.name} test failed with error`)
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log(`   ✅ Passed: ${results.passed}/${results.total}`)
  console.log(`   ❌ Failed: ${results.failed}/${results.total}`)
  console.log(`   📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`)
  
  if (results.passed === results.total) {
    console.log('\n🎉 All tests passed! Enhanced backend implementation is working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Check the error messages above for details.')
  }
  
  return results
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  })
}

module.exports = { runTests }