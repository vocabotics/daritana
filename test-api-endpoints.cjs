const axios = require('axios');

const API_BASE = 'http://localhost:7001/api';

async function testEndpoints() {
  console.log('Testing API Endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/notifications', description: 'Notifications list' },
    { method: 'GET', path: '/notifications/unread-count', description: 'Unread count' },
    { method: 'GET', path: '/notifications/types', description: 'Notification types' },
    { method: 'GET', path: '/settings', description: 'User settings' },
    { method: 'GET', path: '/settings/preferences', description: 'User preferences' },
    { method: 'GET', path: '/construction/sites/1', description: 'Construction site' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE}${endpoint.path}`,
        validateStatus: () => true // Accept any status code
      });
      
      const status = response.status;
      const statusText = status === 200 ? '✅ OK' : 
                         status === 401 ? '🔒 Auth Required' :
                         status === 404 ? '❌ Not Found' :
                         `⚠️ ${status}`;
      
      console.log(`${statusText} - ${endpoint.method} ${endpoint.path}`);
      console.log(`    ${endpoint.description}`);
      
      if (status === 200) {
        const data = response.data;
        if (data.success) {
          console.log(`    Response: Success with data`);
        }
      } else if (status === 401) {
        console.log(`    Response: ${response.data.error || 'Unauthorized'}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ERROR - ${endpoint.method} ${endpoint.path}`);
      console.log(`    ${error.message}`);
      console.log('');
    }
  }
}

testEndpoints().then(() => {
  console.log('✨ API Endpoint Test Complete!');
}).catch(console.error);