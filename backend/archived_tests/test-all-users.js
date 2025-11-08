#!/usr/bin/env node

const http = require('http');

// Test configuration
const API_URL = 'http://localhost:7001';
const users = [
  { role: 'admin', email: 'admin@daritana.com', password: 'admin123' },
  { role: 'project_lead', email: 'john@daritana.com', password: 'password123' },
  { role: 'designer', email: 'jane@daritana.com', password: 'password123' },
  { role: 'client', email: 'client@daritana.com', password: 'password123' }
];

let results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper to make HTTP requests
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test helper
function test(name, fn) {
  return async () => {
    results.total++;
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS', message: '' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', message: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  };
}

// Assertion helpers
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertStatus(response, expected, message) {
  if (response.status !== expected) {
    throw new Error(message || `Expected status ${expected}, got ${response.status}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test suite
async function runTests() {
  console.log('🚀 Starting End-to-End User Testing\n');
  console.log('━'.repeat(60));
  
  // Test 1: Health Check
  await test('Health endpoint responds', async () => {
    const res = await request('GET', '/health');
    assertStatus(res, 200, 'Health check failed');
    assertEquals(res.data.status, 'healthy', 'Health status not healthy');
  })();

  console.log('\n📋 Testing User Authentication\n' + '━'.repeat(60));

  const tokens = {};

  // Test 2-5: Login for each user type
  for (const user of users) {
    await test(`${user.role} - Login successful`, async () => {
      const res = await request('POST', '/api/auth/login', {
        email: user.email,
        password: user.password
      });
      assertStatus(res, 200, `Login failed for ${user.role}`);
      assertTrue(res.data.success, 'Login success flag not true');
      assertTrue(res.data.token, 'No token returned');
      assertTrue(res.data.user, 'No user data returned');
      assertEquals(res.data.user.email, user.email, 'Email mismatch');
      assertEquals(res.data.user.role, user.role, 'Role mismatch');
      tokens[user.role] = res.data.token;
    })();
  }

  console.log('\n🔐 Testing Protected Endpoints\n' + '━'.repeat(60));

  // Test 6-9: Settings access for each user
  for (const user of users) {
    await test(`${user.role} - Get settings`, async () => {
      const res = await request('GET', '/api/settings', null, tokens[user.role]);
      assertStatus(res, 200, `Settings access failed for ${user.role}`);
      assertTrue(res.data.theme, 'No theme in settings');
      assertTrue(res.data.language, 'No language in settings');
    })();
  }

  // Test 10-13: Dashboard access for each user
  for (const user of users) {
    await test(`${user.role} - Get dashboard`, async () => {
      const res = await request('GET', '/api/dashboard', null, tokens[user.role]);
      assertStatus(res, 200, `Dashboard access failed for ${user.role}`);
      assertTrue(res.data.stats, 'No stats in dashboard');
      assertTrue(typeof res.data.stats.totalProjects === 'number', 'totalProjects not a number');
    })();
  }

  console.log('\n📁 Testing Project Management\n' + '━'.repeat(60));

  // Test 14-17: Get projects for each user
  for (const user of users) {
    await test(`${user.role} - List projects`, async () => {
      const res = await request('GET', '/api/projects', null, tokens[user.role]);
      assertStatus(res, 200, `Get projects failed for ${user.role}`);
      assertTrue(Array.isArray(res.data.projects), 'Projects not an array');
    })();
  }

  // Test 18: Admin can create project
  let newProjectId;
  await test('admin - Create new project', async () => {
    const res = await request('POST', '/api/projects', {
      name: 'Test Project from E2E',
      description: 'Testing project creation',
      status: 'planning',
      priority: 'medium',
      budget: 100000,
      location: 'Kuala Lumpur',
      type: 'Residential'
    }, tokens.admin);
    assertStatus(res, 201, 'Project creation failed');
    assertTrue(res.data.id, 'No project ID returned');
    newProjectId = res.data.id;
  })();

  // Test 19: Project Lead can create project
  await test('project_lead - Create new project', async () => {
    const res = await request('POST', '/api/projects', {
      name: 'Project Lead Test Project',
      description: 'Testing from project lead role',
      status: 'planning',
      priority: 'high',
      budget: 75000,
      location: 'Penang',
      type: 'Commercial'
    }, tokens.project_lead);
    assertStatus(res, 201, 'Project creation by project lead failed');
  })();

  console.log('\n📝 Testing Task Management\n' + '━'.repeat(60));

  // Test 20-23: Get tasks for each user
  for (const user of users) {
    await test(`${user.role} - List tasks`, async () => {
      const res = await request('GET', '/api/tasks', null, tokens[user.role]);
      assertStatus(res, 200, `Get tasks failed for ${user.role}`);
      assertTrue(Array.isArray(res.data.tasks), 'Tasks not an array');
    })();
  }

  // Test 24: Create task as admin
  let newTaskId;
  await test('admin - Create new task', async () => {
    const res = await request('POST', '/api/tasks', {
      title: 'E2E Test Task',
      description: 'Testing task creation',
      status: 'todo',
      priority: 'high',
      projectId: newProjectId
    }, tokens.admin);
    assertStatus(res, 201, 'Task creation failed');
    assertTrue(res.data.id, 'No task ID returned');
    newTaskId = res.data.id;
  })();

  // Test 25: Update task as designer
  await test('designer - Update task status', async () => {
    const res = await request('PATCH', `/api/tasks/${newTaskId}`, {
      status: 'in_progress'
    }, tokens.designer);
    assertStatus(res, 200, 'Task update failed');
  })();

  console.log('\n👥 Testing User Management\n' + '━'.repeat(60));

  // Test 26-29: Get users for each role
  for (const user of users) {
    await test(`${user.role} - List users`, async () => {
      const res = await request('GET', '/api/users', null, tokens[user.role]);
      assertStatus(res, 200, `Get users failed for ${user.role}`);
      assertTrue(Array.isArray(res.data.users), 'Users not an array');
      assertTrue(res.data.users.length >= 4, 'Should have at least 4 users');
    })();
  }

  console.log('\n🔔 Testing Notifications\n' + '━'.repeat(60));

  // Test 30-33: Get notifications for each user
  for (const user of users) {
    await test(`${user.role} - Get notifications`, async () => {
      const res = await request('GET', '/api/notifications', null, tokens[user.role]);
      assertStatus(res, 200, `Get notifications failed for ${user.role}`);
      assertTrue(Array.isArray(res.data.notifications), 'Notifications not an array');
    })();
  }

  // Test 34-37: Get unread count for each user
  for (const user of users) {
    await test(`${user.role} - Get unread count`, async () => {
      const res = await request('GET', '/api/notifications/unread-count', null, tokens[user.role]);
      assertStatus(res, 200, `Get unread count failed for ${user.role}`);
      assertTrue(typeof res.data.unreadCount === 'number', 'Unread count not a number');
    })();
  }

  console.log('\n⚙️  Testing Settings Persistence\n' + '━'.repeat(60));

  // Test 38: Update settings as admin
  await test('admin - Update settings', async () => {
    const res = await request('PUT', '/api/settings', {
      theme: 'dark',
      language: 'en',
      notifications: { email: true, push: false }
    }, tokens.admin);
    assertStatus(res, 200, 'Settings update failed');
  })();

  // Test 39: Verify settings updated
  await test('admin - Verify settings updated', async () => {
    const res = await request('GET', '/api/settings', null, tokens.admin);
    assertStatus(res, 200, 'Get updated settings failed');
    assertEquals(res.data.theme, 'dark', 'Theme not updated');
  })();

  console.log('\n🔒 Testing Authentication Edge Cases\n' + '━'.repeat(60));

  // Test 40: Invalid credentials
  await test('Login with invalid credentials fails', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
    assertTrue(res.status === 401 || res.status === 400, 'Should return 401 or 400');
    assertTrue(!res.data.success, 'Should not succeed with wrong credentials');
  })();

  // Test 41: Access protected route without token
  await test('Protected route without token fails', async () => {
    const res = await request('GET', '/api/dashboard');
    assertEquals(res.status, 401, 'Should return 401 without token');
  })();

  // Test 42: Access protected route with invalid token
  await test('Protected route with invalid token fails', async () => {
    const res = await request('GET', '/api/dashboard', null, 'invalid-token');
    assertEquals(res.status, 401, 'Should return 401 with invalid token');
  })();

  // Final summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY\n');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('━'.repeat(60));

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  • ${t.name}: ${t.message}`);
    });
  } else {
    console.log('\n🎉 ALL TESTS PASSED! System is 100% functional!');
  }

  return results.failed === 0;
}

// Run the tests
runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
  });
