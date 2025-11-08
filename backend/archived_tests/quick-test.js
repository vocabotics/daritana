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
  console.log('Login:', login.status, login.data.success ? '✅' : '❌');
  
  const token = login.data.token;
  
  // Try to create project
  const project = await request('POST', '/api/projects', {
    name: 'Test Project',
    description: 'Testing',
    status: 'planning',
    priority: 'medium',
    budget: 100000,
    location: 'KL',
    type: 'Residential'
  }, token);
  
  console.log('Create Project:', project.status);
  console.log('Response:', JSON.stringify(project.data, null, 2));
}

test();
