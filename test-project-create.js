// Test script to create a project with real database
import axios from 'axios';

const API_BASE = 'http://localhost:7001/api';

async function testProjectCreation() {
  try {
    // First, login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // Create a test project
    console.log('\n2. Creating project...');
    const projectData = {
      name: 'Test Real Database Project',
      description: 'This is a real project stored in PostgreSQL database',
      type: 'commercial',
      status: 'PLANNING',
      priority: 'HIGH',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedBudget: 100000,
      siteAddress: '123 Test Street',
      siteCity: 'Kuala Lumpur',
      siteState: 'Wilayah Persekutuan',
      siteCountry: 'Malaysia',
      category: 'Architecture'
    };

    const createResponse = await axios.post(
      `${API_BASE}/projects`,
      projectData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Project created successfully!');
    console.log('Project details:', JSON.stringify(createResponse.data, null, 2));

    // Fetch all projects to verify
    console.log('\n3. Fetching all projects to verify...');
    const listResponse = await axios.get(`${API_BASE}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Found ${listResponse.data.projects?.length || listResponse.data.length} projects in database`);
    
    if (listResponse.data.projects) {
      console.log('Projects:', listResponse.data.projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

testProjectCreation();