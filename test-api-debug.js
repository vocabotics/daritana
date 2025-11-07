// Debug script to test API responses
import axios from 'axios';

const API_BASE = 'http://localhost:7001/api';

async function debugAPI() {
  try {
    // 1. Login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // 2. Test projects endpoint with limit=1
    console.log('\n2. Testing /projects?limit=1 endpoint...');
    const projectsResponse = await axios.get(`${API_BASE}/projects?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Projects API Response:');
    console.log(JSON.stringify(projectsResponse.data, null, 2));
    
    // Check the structure
    if (projectsResponse.data?.data?.projects) {
      console.log('\n✅ Structure: response.data.data.projects');
      console.log('First project ID:', projectsResponse.data.data.projects[0]?.id);
    } else if (projectsResponse.data?.projects) {
      console.log('\n✅ Structure: response.data.projects');
      console.log('First project ID:', projectsResponse.data.projects[0]?.id);
    } else {
      console.log('\n❌ Unexpected structure!');
    }

    // 3. Test if construction endpoint works with real ID
    if (projectsResponse.data?.projects?.[0]?.id || projectsResponse.data?.data?.projects?.[0]?.id) {
      const projectId = projectsResponse.data?.projects?.[0]?.id || projectsResponse.data?.data?.projects?.[0]?.id;
      console.log(`\n3. Testing /construction/sites/${projectId} endpoint...`);
      
      const constructionResponse = await axios.get(`${API_BASE}/construction/sites/${projectId}`);
      console.log('✅ Construction endpoint works!');
      console.log('Site name:', constructionResponse.data.data?.name);
      console.log('Progress:', constructionResponse.data.data?.overallProgress + '%');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('URL:', error.config?.url);
    }
  }
}

debugAPI();