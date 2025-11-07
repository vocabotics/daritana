// Quick test script to verify backend is running and accessible
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api/v1';

async function testBackend() {
  console.log('Testing backend connection...\n');
  
  // Test health endpoint
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', health.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test login
  try {
    console.log('\nTesting login with admin@daritana.com...');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@daritana.com',
      password: 'Admin123!'
    });
    console.log('✅ Login successful!');
    console.log('User:', login.data.data.user);
    console.log('Token received:', login.data.data.token ? 'Yes' : 'No');
    
    const token = login.data.data.token;
    
    // Test authenticated endpoint
    console.log('\nTesting authenticated endpoint...');
    const me = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Auth/me endpoint works:', me.data.data.user);
    
    // Test projects endpoint
    console.log('\nTesting projects endpoint...');
    const projects = await axios.get(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Projects endpoint works. Count:', projects.data.data?.length || 0);
    
    // Test tasks endpoint
    console.log('\nTesting tasks endpoint...');
    const tasks = await axios.get(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Tasks endpoint works. Count:', tasks.data.data?.length || 0);
    
  } catch (error) {
    console.log('❌ API test failed:', error.response?.data || error.message);
  }
}

testBackend();