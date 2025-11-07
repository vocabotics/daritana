// Update the test project with construction details
import axios from 'axios';

const API_BASE = 'http://localhost:7001/api';

async function updateProjectForConstruction() {
  try {
    // First, login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get all projects first
    console.log('\n2. Getting existing projects...');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const projects = projectsResponse.data.projects || [];
    if (projects.length === 0) {
      console.log('No projects found. Creating new one...');
      return;
    }

    const projectId = projects[0].id;
    console.log(`Found project: ${projects[0].name} (${projectId})`);

    // Update project with construction details
    console.log('\n3. Updating project with construction details...');
    const updateData = {
      name: 'KLCC Tower Phase 2 Construction',
      type: 'commercial',
      category: 'Architecture',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 0.35, // 35% complete
      siteAddress: 'Jalan Ampang',
      siteCity: 'Kuala Lumpur',
      siteState: 'Wilayah Persekutuan',
      sitePostcode: '50088',
      siteCountry: 'Malaysia',
      estimatedBudget: 50000000
    };

    const updateResponse = await axios.put(
      `${API_BASE}/projects/${projectId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Project updated successfully!');

    // Create some tasks for the project
    console.log('\n4. Creating construction tasks...');
    const tasks = [
      {
        title: 'Foundation Excavation',
        description: 'Complete excavation for foundation work',
        status: 'COMPLETED',
        progress: 1.0,
        priority: 'HIGH'
      },
      {
        title: 'Pile Foundation',
        description: 'Install pile foundations for the building',
        status: 'COMPLETED',
        progress: 1.0,
        priority: 'HIGH'
      },
      {
        title: 'Basement Construction',
        description: 'Construct B1 and B2 basement levels',
        status: 'IN_PROGRESS',
        progress: 0.6,
        priority: 'HIGH'
      },
      {
        title: 'Ground Floor Slab',
        description: 'Pour concrete for ground floor slab',
        status: 'IN_PROGRESS',
        progress: 0.3,
        priority: 'MEDIUM'
      },
      {
        title: 'Structural Frame',
        description: 'Erect structural steel frame',
        status: 'TODO',
        progress: 0,
        priority: 'MEDIUM'
      }
    ];

    for (const task of tasks) {
      try {
        await axios.post(
          `${API_BASE}/tasks`,
          { ...task, projectId },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`✅ Created task: ${task.title}`);
      } catch (err) {
        console.log(`⚠️ Task creation failed: ${err.response?.data?.error || err.message}`);
      }
    }

    // Test construction endpoint
    console.log('\n5. Testing construction monitor endpoint...');
    const constructionResponse = await axios.get(`${API_BASE}/construction/sites/${projectId}`);
    console.log('✅ Construction site data retrieved:');
    console.log(`   Name: ${constructionResponse.data.data.name}`);
    console.log(`   Location: ${constructionResponse.data.data.location}`);
    console.log(`   Progress: ${constructionResponse.data.data.overallProgress}%`);
    console.log(`   Phase: ${constructionResponse.data.data.currentPhase}`);
    console.log(`   Tasks: ${constructionResponse.data.data.tasksCompleted}/${constructionResponse.data.data.tasksTotal} completed`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateProjectForConstruction();