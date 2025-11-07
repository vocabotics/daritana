// Update project name with current timestamp to prove it's from database
import axios from 'axios';

const API_BASE = 'http://localhost:7001/api';

async function updateWithTimestamp() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;

    // Get projects
    const projectsResponse = await axios.get(`${API_BASE}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (projectsResponse.data.projects.length === 0) {
      console.log('No projects found!');
      return;
    }

    const project = projectsResponse.data.projects[0];
    const currentTime = new Date().toLocaleTimeString();
    const currentProgress = Math.floor(Math.random() * 100); // Random progress
    
    // Update with timestamp
    const newName = `REAL DATABASE PROJECT - Last Updated: ${currentTime}`;
    
    await axios.put(
      `${API_BASE}/projects/${project.id}`,
      {
        name: newName,
        progress: currentProgress / 100,
        description: `This data is from PostgreSQL database. Progress: ${currentProgress}%. Time: ${currentTime}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Project updated in database!');
    console.log(`📌 Name: ${newName}`);
    console.log(`📊 Progress: ${currentProgress}%`);
    console.log(`⏰ Time: ${currentTime}`);
    console.log('\n🔄 Now refresh the Construction Monitor page to see this exact data!');
    console.log('📍 URL: http://localhost:5174/construction (or similar)');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateWithTimestamp();