const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 7001,
      path,
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
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', resolve);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  // Login
  const login = await request('POST', '/api/auth/login', {
    email: 'admin@daritana.com',
    password: 'admin123'
  });
  const token = login.data.token;
  
  // Create project first
  const project = await request('POST', '/api/projects', {
    name: 'Task Test Project',
    description: 'For task testing',
    status: 'planning',
    priority: 'medium',
    budget: 50000,
    location: 'KL',
    type: 'Residential'
  }, token);
  
  console.log('Project created:', project.status, project.data.id ? '✅' : '❌');
  const projectId = project.data.id;
  
  // Try to create task
  const task = await request('POST', '/api/tasks', {
    title: 'Test Task',
    description: 'Testing task creation',
    status: 'todo',
    priority: 'high',
    projectId: projectId
  }, token);
  
  console.log('Create Task:', task.status);
  console.log('Response:', JSON.stringify(task.data, null, 2));
}

test();
