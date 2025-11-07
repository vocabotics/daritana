// Script to rename the project in the database
import axios from 'axios';

const API_BASE = 'http://localhost:7001/api';

async function renameProject() {
  try {
    // First, login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get all projects
    console.log('\n2. Getting projects...');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const projects = projectsResponse.data.projects || [];
    if (projects.length === 0) {
      console.log('No projects found!');
      return;
    }

    const projectId = projects[0].id;
    console.log(`Found project: ${projects[0].name} (${projectId})`);

    // Rename the project with a timestamp to prove it's from the database
    const newName = `Petronas Twin Towers Construction - Updated ${new Date().toLocaleTimeString()}`;
    
    console.log('\n3. Renaming project to:', newName);
    const updateResponse = await axios.put(
      `${API_BASE}/projects/${projectId}`,
      {
        name: newName,
        description: 'This is REAL data from PostgreSQL database - not mock data!',
        siteAddress: 'Jalan Ampang, KLCC',
        siteCity: 'Kuala Lumpur',
        progress: 0.42  // Update progress to 42%
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Project renamed successfully!');
    console.log('\n📊 Updated project details:');
    console.log(`   Name: ${newName}`);
    console.log(`   Progress: 42%`);
    console.log(`   Description: This is REAL data from PostgreSQL database`);
    console.log('\n🔄 Refresh your browser to see the changes in Construction Monitor!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

renameProject();