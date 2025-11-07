/**
 * Automated API Test Suite for Daritana Backend
 * Tests all backend endpoints to verify connectivity and functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:7001/api';
const TEST_EMAIL = 'admin@test.com';  // Updated to match backend seed data
const TEST_PASSWORD = 'password123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  endpoints: {}
};

// Global variables to store tokens and IDs
let authToken = '';
let userId = '';
let organizationId = '';
let projectId = '';
let taskId = '';
let documentId = '';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken && !endpoint.includes('/auth/login')) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (organizationId) {
      config.headers['X-Organization-Id'] = organizationId;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0
    };
  }
}

// Test runner function
async function runTest(testName, testFunction) {
  testResults.total++;
  process.stdout.write(`${colors.cyan}Testing: ${testName}...${colors.reset} `);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`${colors.green}✓ PASSED${colors.reset}`);
      return result;
    } else {
      testResults.failed++;
      testResults.errors.push({ test: testName, error: result.error });
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${result.error}`);
      return result;
    }
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Authentication Tests
async function testAuthentication() {
  console.log(`\n${colors.bold}${colors.blue}=== AUTHENTICATION TESTS ===${colors.reset}\n`);

  // Test login
  const loginResult = await runTest('POST /auth/login', async () => {
    const result = await apiRequest('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (result.success) {
      authToken = result.data.access_token || result.data.token;
      userId = result.data.user?.id;
      organizationId = result.data.user?.organizationId || result.data.organization?.id;
    }
    
    return result;
  });

  // Test get current user
  await runTest('GET /auth/me', async () => {
    return await apiRequest('GET', '/auth/me');
  });

  // Test token refresh
  await runTest('POST /auth/refresh', async () => {
    return await apiRequest('POST', '/auth/refresh', {
      refresh_token: loginResult.data?.refresh_token || 'mock-refresh-token'
    });
  });

  return loginResult.success;
}

// Projects Tests
async function testProjects() {
  console.log(`\n${colors.bold}${colors.blue}=== PROJECTS TESTS ===${colors.reset}\n`);

  // Get projects
  const projectsResult = await runTest('GET /projects', async () => {
    return await apiRequest('GET', '/projects');
  });

  if (projectsResult.success && projectsResult.data?.data?.length > 0) {
    projectId = projectsResult.data.data[0].id;
  }

  // Create project
  const createResult = await runTest('POST /projects', async () => {
    const result = await apiRequest('POST', '/projects', {
      name: 'Test Project ' + Date.now(),
      description: 'Automated test project',
      status: 'PLANNING',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    if (result.success && result.data?.id) {
      projectId = result.data.id;
    }
    
    return result;
  });

  // Get single project
  if (projectId) {
    await runTest(`GET /projects/${projectId}`, async () => {
      return await apiRequest('GET', `/projects/${projectId}`);
    });

    // Update project
    await runTest(`PUT /projects/${projectId}`, async () => {
      return await apiRequest('PUT', `/projects/${projectId}`, {
        name: 'Updated Test Project'
      });
    });

    // Get project statistics
    await runTest(`GET /projects/${projectId}/statistics`, async () => {
      return await apiRequest('GET', `/projects/${projectId}/statistics`);
    });
  }
}

// Tasks Tests
async function testTasks() {
  console.log(`\n${colors.bold}${colors.blue}=== TASKS TESTS ===${colors.reset}\n`);

  // Get tasks
  const tasksResult = await runTest('GET /tasks', async () => {
    return await apiRequest('GET', '/tasks');
  });

  // Create task
  const createResult = await runTest('POST /tasks', async () => {
    const result = await apiRequest('POST', '/tasks', {
      title: 'Test Task ' + Date.now(),
      description: 'Automated test task',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: projectId || 1
    });
    
    if (result.success && result.data?.id) {
      taskId = result.data.id;
    }
    
    return result;
  });

  // Update task
  if (taskId) {
    await runTest(`PATCH /tasks/${taskId}`, async () => {
      return await apiRequest('PATCH', `/tasks/${taskId}`, {
        status: 'IN_PROGRESS'
      });
    });

    // Get single task
    await runTest(`GET /tasks/${taskId}`, async () => {
      return await apiRequest('GET', `/tasks/${taskId}`);
    });
  }
}

// Team Tests
async function testTeam() {
  console.log(`\n${colors.bold}${colors.blue}=== TEAM TESTS ===${colors.reset}\n`);

  await runTest('GET /team/members', async () => {
    return await apiRequest('GET', '/team/members');
  });

  await runTest('GET /team/analytics', async () => {
    return await apiRequest('GET', '/team/analytics');
  });

  await runTest('GET /team/workload', async () => {
    return await apiRequest('GET', '/team/workload');
  });

  await runTest('GET /team/presence', async () => {
    return await apiRequest('GET', '/team/presence');
  });

  await runTest('POST /team/presence', async () => {
    return await apiRequest('POST', '/team/presence', {
      status: 'online',
      location: 'Office'
    });
  });
}

// Documents Tests
async function testDocuments() {
  console.log(`\n${colors.bold}${colors.blue}=== DOCUMENTS TESTS ===${colors.reset}\n`);

  await runTest('GET /documents', async () => {
    return await apiRequest('GET', '/documents');
  });

  await runTest('GET /documents/statistics', async () => {
    return await apiRequest('GET', '/documents/statistics');
  });

  await runTest('GET /documents/categories', async () => {
    return await apiRequest('GET', '/documents/categories');
  });

  // Test file upload (create a test file)
  await runTest('POST /documents/upload', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Document');
    formData.append('category', 'General');
    
    // Create a test file
    const testContent = 'This is a test document for API testing';
    formData.append('file', Buffer.from(testContent), {
      filename: 'test-document.txt',
      contentType: 'text/plain'
    });

    const result = await apiRequest('POST', '/documents/upload', formData, {
      ...formData.getHeaders()
    });

    if (result.success && result.data?.id) {
      documentId = result.data.id;
    }

    return result;
  });
}

// Financial Tests
async function testFinancial() {
  console.log(`\n${colors.bold}${colors.blue}=== FINANCIAL TESTS ===${colors.reset}\n`);

  await runTest('GET /financial/dashboard', async () => {
    return await apiRequest('GET', '/financial/dashboard');
  });

  await runTest('GET /financial/invoices', async () => {
    return await apiRequest('GET', '/financial/invoices');
  });

  await runTest('GET /financial/expenses', async () => {
    return await apiRequest('GET', '/financial/expenses');
  });

  await runTest('GET /financial/analytics', async () => {
    return await apiRequest('GET', '/financial/analytics');
  });

  await runTest('POST /financial/invoices', async () => {
    return await apiRequest('POST', '/financial/invoices', {
      invoiceNumber: 'INV-TEST-' + Date.now(),
      amount: 1000,
      status: 'DRAFT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
}

// Settings Tests
async function testSettings() {
  console.log(`\n${colors.bold}${colors.blue}=== SETTINGS TESTS ===${colors.reset}\n`);

  await runTest('GET /settings', async () => {
    return await apiRequest('GET', '/settings');
  });

  await runTest('PUT /settings', async () => {
    return await apiRequest('PUT', '/settings', {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kuala_Lumpur'
    });
  });

  await runTest('GET /settings/preferences', async () => {
    return await apiRequest('GET', '/settings/preferences');
  });

  await runTest('PUT /settings/preferences/general', async () => {
    return await apiRequest('PUT', '/settings/preferences/general', {
      theme: 'light',
      language: 'en'
    });
  });
}

// Compliance Tests
async function testCompliance() {
  console.log(`\n${colors.bold}${colors.blue}=== COMPLIANCE TESTS ===${colors.reset}\n`);

  await runTest('GET /compliance/documents', async () => {
    return await apiRequest('GET', '/compliance/documents');
  });

  await runTest('GET /compliance/audits', async () => {
    return await apiRequest('GET', '/compliance/audits');
  });

  await runTest('GET /compliance/standards', async () => {
    return await apiRequest('GET', '/compliance/standards');
  });

  await runTest('GET /compliance/issues', async () => {
    return await apiRequest('GET', '/compliance/issues');
  });

  await runTest('POST /compliance/issues', async () => {
    return await apiRequest('POST', '/compliance/issues', {
      title: 'Test Compliance Issue',
      severity: 'medium',
      description: 'Test issue for API testing'
    });
  });
}

// Marketplace Tests
async function testMarketplace() {
  console.log(`\n${colors.bold}${colors.blue}=== MARKETPLACE TESTS ===${colors.reset}\n`);

  await runTest('GET /marketplace/products', async () => {
    return await apiRequest('GET', '/marketplace/products');
  });

  await runTest('GET /marketplace/vendors', async () => {
    return await apiRequest('GET', '/marketplace/vendors');
  });

  await runTest('GET /marketplace/quotes', async () => {
    return await apiRequest('GET', '/marketplace/quotes');
  });

  await runTest('GET /marketplace/orders', async () => {
    return await apiRequest('GET', '/marketplace/orders');
  });

  await runTest('POST /marketplace/cart', async () => {
    return await apiRequest('POST', '/marketplace/cart', {
      productId: 1,
      quantity: 2
    });
  });
}

// Community Tests
async function testCommunity() {
  console.log(`\n${colors.bold}${colors.blue}=== COMMUNITY TESTS ===${colors.reset}\n`);

  await runTest('GET /community/posts', async () => {
    return await apiRequest('GET', '/community/posts');
  });

  await runTest('GET /community/events', async () => {
    return await apiRequest('GET', '/community/events');
  });

  await runTest('GET /community/groups', async () => {
    return await apiRequest('GET', '/community/groups');
  });

  await runTest('POST /community/posts', async () => {
    return await apiRequest('POST', '/community/posts', {
      content: 'Test post from automated API testing',
      type: 'post'
    });
  });
}

// HR Tests
async function testHR() {
  console.log(`\n${colors.bold}${colors.blue}=== HR TESTS ===${colors.reset}\n`);

  await runTest('GET /hr/employees', async () => {
    return await apiRequest('GET', '/hr/employees');
  });

  await runTest('GET /hr/leaves', async () => {
    return await apiRequest('GET', '/hr/leaves');
  });

  await runTest('GET /hr/payroll', async () => {
    return await apiRequest('GET', '/hr/payroll');
  });

  await runTest('GET /hr/attendance', async () => {
    return await apiRequest('GET', '/hr/attendance');
  });

  await runTest('POST /hr/leaves', async () => {
    return await apiRequest('POST', '/hr/leaves', {
      type: 'annual',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Test leave request'
    });
  });
}

// Learning Tests
async function testLearning() {
  console.log(`\n${colors.bold}${colors.blue}=== LEARNING TESTS ===${colors.reset}\n`);

  await runTest('GET /learning/courses', async () => {
    return await apiRequest('GET', '/learning/courses');
  });

  await runTest('GET /learning/enrollments', async () => {
    return await apiRequest('GET', '/learning/enrollments');
  });

  await runTest('GET /learning/certifications', async () => {
    return await apiRequest('GET', '/learning/certifications');
  });

  await runTest('GET /learning/analytics', async () => {
    return await apiRequest('GET', '/learning/analytics');
  });

  await runTest('POST /learning/enrollments', async () => {
    return await apiRequest('POST', '/learning/enrollments', {
      courseId: 1,
      userId: userId || 1
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     DARITANA API AUTOMATED TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  console.log(`${colors.yellow}API Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Test Account: ${TEST_EMAIL}${colors.reset}\n`);

  const startTime = Date.now();

  // Check if backend is running
  console.log(`${colors.cyan}Checking backend connectivity...${colors.reset}`);
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log(`${colors.green}✓ Backend is running${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Backend is not running on port 7001${colors.reset}`);
    console.log(`${colors.yellow}Please start the backend with: cd backend && npm run dev${colors.reset}\n`);
    return;
  }

  // Run all test suites
  const authSuccess = await testAuthentication();
  
  if (!authSuccess) {
    console.log(`\n${colors.red}Authentication failed. Skipping remaining tests.${colors.reset}`);
  } else {
    await testProjects();
    await testTasks();
    await testTeam();
    await testDocuments();
    await testFinancial();
    await testSettings();
    await testCompliance();
    await testMarketplace();
    await testCommunity();
    await testHR();
    await testLearning();
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print test results summary
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}TEST RESULTS SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}s\n`);

  // Print failed tests
  if (testResults.errors.length > 0) {
    console.log(`${colors.red}${colors.bold}FAILED TESTS:${colors.reset}`);
    testResults.errors.forEach(error => {
      console.log(`${colors.red}  ✗ ${error.test}: ${error.error}${colors.reset}`);
    });
  }

  // Generate test report file
  const report = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    duration: `${duration}s`,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${((testResults.passed / testResults.total) * 100).toFixed(1)}%`
    },
    errors: testResults.errors
  };

  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n${colors.cyan}Test report saved to: test-results.json${colors.reset}`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});