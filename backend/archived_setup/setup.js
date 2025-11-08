// Setup script for Daritana Backend
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message) => console.log(`🔧 ${message}`);
const error = (message) => console.error(`❌ ${message}`);
const success = (message) => console.log(`✅ ${message}`);

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('error', (err) => {
      error(`Command failed: ${err.message}`);
      reject(err);
    });

    process.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
}

async function checkDatabase() {
  log('Checking database connection...');
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    error('.env file not found!');
    log('Please copy .env.example to .env and configure your database URL');
    return false;
  }
  
  return true;
}

async function setup() {
  try {
    log('Setting up Daritana Backend...');
    
    // Check database
    const dbOk = await checkDatabase();
    if (!dbOk) {
      process.exit(1);
    }
    
    // Install dependencies
    log('Installing dependencies...');
    await runCommand('npm', ['install']);
    success('Dependencies installed');
    
    // Generate Prisma client
    log('Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate']);
    success('Prisma client generated');
    
    // Run database migrations
    log('Running database migrations...');
    try {
      await runCommand('npx', ['prisma', 'db', 'push']);
      success('Database migrations completed');
    } catch (err) {
      error('Database migration failed. Please check your DATABASE_URL in .env file');
      log('Make sure PostgreSQL is running and the database exists');
      throw err;
    }
    
    // Seed database
    log('Seeding database with sample data...');
    try {
      await runCommand('tsx', ['src/scripts/seed.ts']);
      success('Database seeded successfully');
    } catch (err) {
      error('Database seeding failed');
      log('You can run seeding manually later: npm run seed');
    }
    
    success('🎉 Setup completed successfully!');
    log('');
    log('You can now start the server with:');
    log('  npm run dev    (development mode)');
    log('  npm start      (production mode)');
    log('');
    log('Test accounts created:');
    log('  Admin: admin@daritana.com / admin123!');
    log('  Client: client@daritana.com / client123!');
    log('  Designer: designer@daritana.com / designer123!');
    log('');
    log('API will be available at: http://localhost:3001');
    log('Health check: http://localhost:3001/health');
    
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

// Run setup
setup();