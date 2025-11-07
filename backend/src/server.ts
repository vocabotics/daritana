import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import rateLimit from 'express-rate-limit'

// Import routers
import multiTenantAuthRouter from './routes/multi-tenant-auth'
import documentsRouter from './routes/documents'
import reviewsRouter from './routes/reviews'
import hrRouter from './routes/hr.routes'
import learningRouter from './routes/learning.routes'
import organizationRouter from './routes/organization.routes'
import systemAdminRouter from './routes/system-admin.routes'
import communityRouter from './routes/community.routes'
import enterpriseRouter from './routes/enterprise.routes'
import projectRouter from './routes/project.routes'
import tasksRouter from './routes/tasks'
import studioRouter from './routes/studio'
import permissionsRouter from './routes/permissions'

// Import enhanced routers
import invitationRouter from './routes/invitation.routes'
import organizationMemberRouter from './routes/organization-member.routes'
import enhancedProjectRouter from './routes/enhanced-project.routes'
import projectTeamRouter from './routes/project-team.routes'
import timelineRouter from './routes/timeline.routes'
import dashboardRouter from './routes/dashboard.routes'
import fileRouter from './routes/file.routes'
import financialRouter from './routes/financial.routes'
import teamRouter from './routes/team.routes'
import teamStatsRouter from './routes/team-stats-simple.routes'
import meetingsRouter from './routes/meetings.routes'

// Import new system routers
import marketplaceRouter from './routes/marketplace.routes'
import complianceRouter from './routes/compliance.routes'
import analyticsRouter from './routes/analytics.routes'
import notificationsRouter from './routes/notifications.routes'
import settingsRouter from './routes/settings-simple.routes'
import adminRouter from './routes/admin.routes'
import apiFixesRouter from './routes/api-fixes'
import apiCompleteFixesRouter from './routes/api-complete-fixes'
import apiFinalFixesRouter from './routes/api-final-fixes'
import constructionRouter from './routes/construction-real.routes'
import chatRouter from './routes/chat.routes'
import videoRouter from './routes/video.routes'

// Import middleware
import { authenticate } from './middleware/auth'
import { authenticateMultiTenant } from './middleware/multi-tenant-auth'

// Import Socket handlers
import { setupSocketHandlers } from './sockets'
import { setupVirtualOfficeSimple } from './sockets/virtualOfficeSimple'
import { setupWebRTCSignaling } from './sockets/webrtc'
import { NotificationService } from './sockets/notification'

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
    origin: ['http://localhost:7000', 'http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Initialize Notification Service
const notificationService = new NotificationService(io)

// Port configuration
const PORT = process.env.PORT || 7001
const NODE_ENV = process.env.NODE_ENV || 'development'

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:7000', 'http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Debug logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`🔍 [${timestamp}] ${req.method} ${req.path}`)
  console.log(`   📍 Origin: ${req.get('Origin') || 'No origin'}`)
  console.log(`   🔑 Auth: ${req.get('Authorization') ? 'Present' : 'None'}`)
  
  // Safely log body
  const bodyStr = req.body ? JSON.stringify(req.body) : 'No body'
  console.log(`   📦 Body: ${bodyStr.substring(0, 200)}${bodyStr.length > 200 ? '...' : ''}`)
  
  // Log response
  const originalSend = res.send
  res.send = function(data) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data || '')
    console.log(`   ✅ Response: ${res.statusCode} - ${dataStr.substring(0, 100)}${dataStr.length > 100 ? '...' : ''}`)
    return originalSend.call(this, data)
  }
  
  next()
})

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Multer configuration for file uploads
import multer from 'multer'
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
})

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 10000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/health' || req.path === '/' || req.path.startsWith('/uploads');
  }
})

// Apply rate limiting to API routes
app.use('/api', limiter)

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Daritana Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: process.env.NODE_ENV === 'development' ? `http://localhost:${PORT}/api-docs` : undefined
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', multiTenantAuthRouter)
app.use('/api/organizations', organizationRouter)
app.use('/api/system', systemAdminRouter)

// Apply FINAL fixes for ALL broken endpoints - HIGHEST PRIORITY
app.use('/api', apiFinalFixesRouter)

// Apply complete fixes for broken endpoints
app.use('/api', apiCompleteFixesRouter)

// Apply additional fixes for missing/broken endpoints
app.use('/api', apiFixesRouter)

// Enhanced multi-tenant routes with organization context
app.use('/api/invitations', authenticateMultiTenant, invitationRouter)
app.use('/api/organization-members', authenticateMultiTenant, organizationMemberRouter)
app.use('/api/enhanced-projects', authenticateMultiTenant, enhancedProjectRouter)
app.use('/api/project-teams', authenticateMultiTenant, projectTeamRouter)
app.use('/api/timelines', authenticateMultiTenant, timelineRouter)
app.use('/api/dashboards', authenticateMultiTenant, dashboardRouter)
app.use('/api/files', authenticateMultiTenant, fileRouter)
app.use('/api/financial', authenticateMultiTenant, financialRouter)
app.use('/api/team', authenticateMultiTenant, teamRouter)
app.use('/api/team-activity', authenticateMultiTenant, teamStatsRouter)
app.use('/api/meetings', authenticateMultiTenant, meetingsRouter)

// New system routes
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/compliance', complianceRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/settings', settingsRouter)  // Removed duplicate auth middleware
app.use('/api/admin', adminRouter)  // Admin routes
app.use('/api/construction', constructionRouter)  // Removed duplicate auth middleware

// Public routes for development (no auth required)
app.use('/api/notifications', notificationsRouter)  // Made public for development
app.use('/api/projects', authenticateMultiTenant, enhancedProjectRouter)  // Use real project router with auth
app.use('/api/tasks', authenticate, tasksRouter)
app.use('/api/studio', authenticate, studioRouter)
app.use('/api/documents', authenticate, documentsRouter)
app.use('/api/reviews', authenticate, reviewsRouter)
app.use('/api/hr', hrRouter)
app.use('/api/learning', learningRouter)
app.use('/api/community', communityRouter)
app.use('/api/enterprise', enterpriseRouter)
app.use('/api/permissions', authenticate, permissionsRouter)
app.use('/api/chat', authenticateMultiTenant, chatRouter)
app.use('/api/video', authenticateMultiTenant, videoRouter)

// Support old v1 endpoints for backwards compatibility
app.use('/api/v1/auth', multiTenantAuthRouter)
app.use('/api/v1/projects', projectRouter)
app.use('/api/v1/tasks', authenticate, tasksRouter)
app.use('/api/v1/documents', authenticate, documentsRouter)

// Socket.IO handlers
setupSocketHandlers(io)
const virtualOfficeManager = setupVirtualOfficeSimple(io)
setupWebRTCSignaling(io)

// Virtual Office API endpoints
app.get('/api/virtual-office/state', authenticate, (req, res) => {
  const state = virtualOfficeManager?.getCurrentState() || { rooms: [], onlineUsers: [], totalUsers: 0 }
  res.json({ success: true, data: state })
})

app.get('/api/virtual-office/team-members', authenticate, async (req, res) => {
  try {
    // Get all active team members from the same organization
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              include: {
                members: {
                  where: { isActive: true },
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        profileImage: true,
                        position: true,
                        department: true,
                        role: true,
                        lastSeen: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user || !user.organizationMembers.length) {
      return res.json({ success: true, data: [] })
    }

    const teamMembers = user.organizationMembers[0].organization.members.map(member => ({
      id: member.user.id,
      name: member.user.name || `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email,
      role: member.user.position || member.role,
      avatar: member.user.avatar || member.user.profileImage,
      department: member.user.department,
      status: 'offline', // Will be updated by WebSocket
      lastSeen: member.user.lastSeen
    }))

    res.json({ success: true, data: teamMembers })
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

// WebSocket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }
    // Verify token and attach user/org info to socket
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    socket.data.userId = decoded.userId
    socket.data.organizationId = decoded.organizationId
    next()
  } catch (err) {
    next(new Error('Authentication error'))
  }
})

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  httpServer.close(() => {
    console.log('HTTP server closed')
  })
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  httpServer.close(() => {
    console.log('HTTP server closed')
  })
  await prisma.$disconnect()
  process.exit(0)
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`)
  console.log(`📚 API documentation available at http://localhost:${PORT}/api-docs`)
  console.log(`\n✨ Enhanced Features Active:`)
  console.log(`   - Multi-tenant authentication`)
  console.log(`   - Organization member management`)
  console.log(`   - Enhanced project management`)
  console.log(`   - Team collaboration`)
  console.log(`   - Timeline & milestones`)
  console.log(`   - Cloud file storage`)
  console.log(`   - Dashboard persistence`)
  console.log(`   - Real-time notifications`)
  console.log(`\n📧 Test Credentials:`)
  console.log(`   Email: admin@test.com`)
  console.log(`   Password: password123`)
})

export { app, io, notificationService, upload }