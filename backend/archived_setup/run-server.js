// Simple script to run the new Prisma-based server
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Daritana Backend with Prisma...');

// Run the new server file
const server = spawn('tsx', ['src/server.prisma.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  } else {
    console.log('✅ Server stopped gracefully');
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});