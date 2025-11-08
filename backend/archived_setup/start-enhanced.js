/**
 * Enhanced server startup script
 * Configures and starts the multi-tenant backend with all new features
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Check if enhanced server exists
const enhancedServerPath = path.join(__dirname, 'src', 'enhanced-server.ts')
const regularServerPath = path.join(__dirname, 'src', 'server.ts')

function startServer() {
  console.log('🚀 Starting Enhanced Daritana Backend Server...')
  
  // Use enhanced server if it exists, otherwise fall back to regular
  const serverFile = fs.existsSync(enhancedServerPath) ? 'src/enhanced-server.ts' : 'src/server.ts'
  
  console.log(`📂 Using server file: ${serverFile}`)
  
  // Start the server with tsx
  const serverProcess = spawn('npx', ['tsx', serverFile], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  })
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  })
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Server process exited with code ${code}`)
      process.exit(code)
    }
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down server...')
    serverProcess.kill('SIGINT')
  })
  
  process.on('SIGTERM', () => {
    console.log('\n⏹️ Shutting down server...')
    serverProcess.kill('SIGTERM')
  })
}

// Check environment variables
function checkEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('\n💡 Please check your .env file')
    process.exit(1)
  }
  
  console.log('✅ Environment variables validated')
}

// Main startup function
async function main() {
  console.log('🔧 Enhanced Backend Startup Process')
  console.log('=====================================')
  
  try {
    // Check environment
    checkEnvironment()
    
    // Start server
    startServer()
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }