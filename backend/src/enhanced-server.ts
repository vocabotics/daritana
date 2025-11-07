import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import rateLimit from 'express-rate-limit'

// Import enhanced routers
import multiTenantAuthRouter from './routes/multi-tenant-auth'
import organizationRouter from './routes/organization.routes'
import organizationMembersRouter from './routes/organization-members.routes'
import organizationSwitchRouter from './routes/organization-switch.routes'
import enhancedProjectRouter from './routes/enhanced-project.routes'
import invitationRouter from './routes/invitation.routes'
import systemAdminRouter from './routes/system-admin.routes'

// Import existing routers
import documentsRouter from './routes/documents'
import reviewsRouter from './routes/reviews'
import hrRouter from './routes/hr'
import learningRouter from './routes/learning'
import communityRouter from './routes/community.routes'
import enterpriseRouter from './routes/enterprise.routes'
import tasksRouter from './routes/tasks'
import studioRouter from './routes/studio'
import permissionsRouter from './routes/permissions'

// Import enhanced controllers
import { 
  uploadFiles, 
  getUploadUrl, 
  listDocuments, 
  getDocument, 
  deleteDocument, 
  getStorageStats,
  upload
} from './controllers/enhanced-file.controller'
import {
  createTimeline,
  listTimelines,
  updateTimeline,
  deleteTimeline,
  createMilestone,
  listMilestones,
  updateMilestone,
  deleteMilestone,
  getProjectProgress
} from './controllers/project-timeline.controller'
import {
  getDashboardConfig,
  updateDashboardConfig,
  getDashboardData
} from './controllers/dashboard.controller'

// Import middleware
import { authenticateMultiTenant } from './middleware/multi-tenant-auth'
import { authenticate } from './middleware/auth'

// Import Socket handlers and notification service
import { setupSocketHandlers } from './sockets'
import { setupWebRTCSignaling } from './sockets/webrtc'
import { initializeNotificationService } from './sockets/notification'

// Load environment variables
dotenv.config()

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

const app: Express = express()
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Port configuration
const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5174', 'http://127.0.0.1:5174']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true)
    
    if (corsOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
}))

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again later.',
})

// Apply rate limiting to API routes
app.use('/api', limiter)

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Daritana Backend API - Enhanced Multi-Tenant Version',
    version: '2.0.0',
    status: 'running',
    features: [
      'Multi-tenant authentication',
      'Organization member management',
      'Enhanced project management',
      'Team assignment',
      'Cloud storage integration',
      'Real-time notifications',
      'Dashboard persistence',
      'WebSocket collaboration'
    ],
    documentation: process.env.NODE_ENV === 'development' ? `http://localhost:${PORT}/api-docs` : undefined
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    websockets: 'active'
  })
})

// Enhanced API Routes
app.use('/api/auth', multiTenantAuthRouter)
app.use('/api/organizations', organizationRouter)
app.use('/api/organizations/:organizationId/members', organizationMembersRouter)
app.use('/api/organization', organizationSwitchRouter)
app.use('/api/invitations', invitationRouter)
app.use('/api/projects', enhancedProjectRouter)
app.use('/api/system', systemAdminRouter)

// Enhanced file management
const fileRoutes = express.Router()
fileRoutes.post('/upload', authenticateMultiTenant, upload.array('files'), uploadFiles)
fileRoutes.post('/upload-url', authenticateMultiTenant, getUploadUrl)
fileRoutes.get('/', authenticateMultiTenant, listDocuments)
fileRoutes.get('/stats', authenticateMultiTenant, getStorageStats)
fileRoutes.get('/:id', authenticateMultiTenant, getDocument)
fileRoutes.delete('/:id', authenticateMultiTenant, deleteDocument)
app.use('/api/files', fileRoutes)

// Project timeline and progress routes
const timelineRoutes = express.Router()
timelineRoutes.post('/:projectId/timeline', authenticateMultiTenant, createTimeline)
timelineRoutes.get('/:projectId/timeline', authenticateMultiTenant, listTimelines)
timelineRoutes.put('/:projectId/timeline/:timelineId', authenticateMultiTenant, updateTimeline)
timelineRoutes.delete('/:projectId/timeline/:timelineId', authenticateMultiTenant, deleteTimeline)
timelineRoutes.post('/:projectId/milestones', authenticateMultiTenant, createMilestone)
timelineRoutes.get('/:projectId/milestones', authenticateMultiTenant, listMilestones)
timelineRoutes.put('/:projectId/milestones/:milestoneId', authenticateMultiTenant, updateMilestone)
timelineRoutes.delete('/:projectId/milestones/:milestoneId', authenticateMultiTenant, deleteMilestone)
timelineRoutes.get('/:projectId/progress', authenticateMultiTenant, getProjectProgress)
app.use('/api/projects', timelineRoutes)

// Dashboard routes
const dashboardRoutes = express.Router()
dashboardRoutes.get('/config', authenticateMultiTenant, getDashboardConfig)
dashboardRoutes.put('/config', authenticateMultiTenant, updateDashboardConfig)
dashboardRoutes.get('/data', authenticateMultiTenant, getDashboardData)
app.use('/api/dashboard', dashboardRoutes)

// Legacy routes (with enhanced features)
app.use('/api/tasks', authenticate, tasksRouter)
app.use('/api/studio', authenticate, studioRouter)
app.use('/api/documents', authenticate, documentsRouter)
app.use('/api/reviews', authenticate, reviewsRouter)
app.use('/api/hr', authenticate, hrRouter)
app.use('/api/learning', learningRouter)
app.use('/api/community', communityRouter)
app.use('/api/enterprise', enterpriseRouter)
app.use('/api/permissions', authenticate, permissionsRouter)

// Support old v1 endpoints for backwards compatibility
app.use('/api/v1/auth', multiTenantAuthRouter)
app.use('/api/v1/projects', enhancedProjectRouter)
app.use('/api/v1/tasks', authenticate, tasksRouter)
app.use('/api/v1/documents', authenticate, documentsRouter)

// Initialize services
const notificationService = initializeNotificationService(io)

// Socket.IO handlers
setupSocketHandlers(io)
setupWebRTCSignaling(io)

// API endpoint to get online users (for admin/debugging)
app.get('/api/system/online-users/:organizationId', authenticateMultiTenant, (req, res) => {
  if (req.user?.organizationRole !== 'ORG_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  const onlineUsers = notificationService?.getOnlineUsers(req.params.organizationId) || []
  res.json({ onlineUsers })
})

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  
  // Handle specific error types
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    })
  }
  
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      field: err.meta?.target
    })
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/auth',
      '/api/organizations',
      '/api/projects',
      '/api/files',
      '/api/dashboard',
      '/api/invitations'
    ]
  })
})

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  
  httpServer.close(async () => {
    console.log('HTTP server closed')
    
    // Close database connection
    await prisma.$disconnect()
    console.log('Database connection closed')
    
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  
  httpServer.close(async () => {
    console.log('HTTP server closed')
    
    // Close database connection
    await prisma.$disconnect()
    console.log('Database connection closed')
    
    process.exit(0)
  })
})

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testDatabaseConnection()
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Enhanced Daritana Backend Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${NODE_ENV}`)
      console.log(`📊 Dashboard: http://localhost:${PORT}`)
      console.log(`🔗 WebSocket: ws://localhost:${PORT}`)
      console.log(`📁 Static files: http://localhost:${PORT}/uploads`)
      
      if (NODE_ENV === 'development') {
        console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`)
      }
      
      console.log(`\n🎯 Key Features Active:`)
      console.log(`   ✅ Multi-tenant authentication`)
      console.log(`   ✅ Organization management`)
      console.log(`   ✅ Enhanced project APIs`)
      console.log(`   ✅ Team assignment`)
      console.log(`   ✅ Cloud storage (S3)`)
      console.log(`   ✅ Real-time notifications`)
      console.log(`   ✅ Dashboard persistence`)
      console.log(`   ✅ WebSocket collaboration`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export for testing
export { app, httpServer, io, prisma }

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
}