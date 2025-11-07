const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const adminPool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to default postgres db first
});

async function setupDatabase() {
  console.log('🔧 Setting up Daritana database...');
  
  try {
    // Drop existing database if it exists
    console.log('Dropping existing database if exists...');
    await adminPool.query(`DROP DATABASE IF EXISTS daritana_dev;`);
    
    // Create new database
    console.log('Creating daritana_dev database...');
    await adminPool.query(`CREATE DATABASE daritana_dev;`);
    
    console.log('✅ Database created successfully!');
    
    // Close admin connection
    await adminPool.end();
    
    // Connect to new database
    const dbPool = new Pool({
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'daritana_dev',
    });
    
    // Read and execute schema
    console.log('Running schema migrations...');
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await dbPool.query(schema);
    
    console.log('✅ Schema created successfully!');
    
    // Add sample data
    console.log('Adding sample data...');
    
    // Create sample organization
    const orgResult = await dbPool.query(`
      INSERT INTO organizations (name, slug, subscription_tier, max_users, max_projects, max_storage_gb)
      VALUES ('Daritana Architecture', 'daritana', 'enterprise', 100, 1000, 1000)
      RETURNING id;
    `);
    const orgId = orgResult.rows[0].id;
    
    // Get role IDs
    const roles = await dbPool.query('SELECT id, name FROM roles');
    const roleMap = {};
    roles.rows.forEach(r => roleMap[r.name] = r.id);
    
    // Create sample users with password 'password123'
    // bcrypt hash of 'password123' = $2a$10$zJpXCwvgL3.Ku9FhcdYoXuKgO3rUhBjR9m6MhZKm6h7xrNqV0l0Ey
    const hashedPassword = '$2a$10$zJpXCwvgL3.Ku9FhcdYoXuKgO3rUhBjR9m6MhZKm6h7xrNqV0l0Ey';
    
    const users = [
      { email: 'admin@daritana.com', first: 'Admin', last: 'User', role: 'admin' },
      { email: 'lead@daritana.com', first: 'Project', last: 'Lead', role: 'project_lead' },
      { email: 'designer@daritana.com', first: 'Creative', last: 'Designer', role: 'designer' },
      { email: 'client@example.com', first: 'John', last: 'Client', role: 'client' },
      { email: 'contractor@build.com', first: 'Mike', last: 'Contractor', role: 'contractor' },
      { email: 'staff@daritana.com', first: 'Emma', last: 'Staff', role: 'staff' },
    ];
    
    for (const user of users) {
      await dbPool.query(`
        INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role_id, is_active, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, true, true)
      `, [orgId, user.email, hashedPassword, user.first, user.last, roleMap[user.role]]);
    }
    
    console.log('✅ Sample users created!');
    console.log('📧 All users use password: password123');
    
    // Create sample projects
    const projectIds = [];
    const projects = [
      { name: 'KLCC Tower Renovation', status: 'active', budget: 5000000 },
      { name: 'Penang Heritage Hotel', status: 'active', budget: 3000000 },
      { name: 'Cyberjaya Tech Campus', status: 'planning', budget: 8000000 },
    ];
    
    for (const project of projects) {
      const result = await dbPool.query(`
        INSERT INTO projects (organization_id, name, description, status, start_date, end_date, budget)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', $5)
        RETURNING id
      `, [orgId, project.name, `${project.name} - A premier architectural project in Malaysia`, project.status, project.budget]);
      projectIds.push(result.rows[0].id);
    }
    
    console.log('✅ Sample projects created!');
    
    // Create sample tasks
    const taskStatuses = ['todo', 'in_progress', 'review', 'done'];
    const taskNames = ['Site Survey', 'Design Concepts', 'Client Review', 'Material Selection', 'Permits', 'Construction Planning'];
    
    for (const projectId of projectIds) {
      for (let i = 0; i < taskNames.length; i++) {
        await dbPool.query(`
          INSERT INTO tasks (project_id, title, description, status, priority)
          VALUES ($1, $2, $3, $4, $5)
        `, [projectId, taskNames[i], `${taskNames[i]} for the project`, taskStatuses[i % 4], i < 2 ? 'high' : i < 4 ? 'medium' : 'low']);
      }
    }
    
    console.log('✅ Sample tasks created!');
    
    await dbPool.end();
    
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('You can now start the backend server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();