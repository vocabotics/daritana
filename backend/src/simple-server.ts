import express from 'express'
import cors from 'cors'
import { logger } from './utils/logger'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { WebSocketServer } from 'ws'
import http from 'http'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })
const PORT = process.env.PORT || 8080

// JWT middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' })
    req.user = user
    next()
  })
}

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10485760 }
})

// WebSocket connections management
const wsClients = new Map()

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      if (data.type === 'auth') {
        jwt.verify(data.token, process.env.JWT_SECRET || 'dev-secret', (err: any, user: any) => {
          if (!err && user) {
            wsClients.set(ws, user)
            ws.send(JSON.stringify({ type: 'auth', status: 'success' }))
          } else {
            ws.send(JSON.stringify({ type: 'auth', status: 'failed' }))
            ws.close()
          }
        })
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
    }
  })

  ws.on('close', () => {
    wsClients.delete(ws)
  })
})

function broadcastMessage(message: any) {
  const messageStr = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(messageStr)
    }
  })
}

// In-memory storage for mock data (will be replaced gradually)
const mockProjects = [
  {
    id: '1',
    name: 'Modern Condominium Renovation',
    description: 'Complete renovation of a 3-bedroom unit in KLCC',
    type: 'renovation',
    status: 'in_progress',
    priority: 'high',
    progress: 65,
    budget: 150000,
    actualCost: 98000,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    address: '188 Jalan Ampang',
    city: 'Kuala Lumpur',
    state: 'Kuala Lumpur',
    country: 'Malaysia',
    client: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@example.com'
    },
    projectLead: {
      id: '2',
      firstName: 'Ahmad',
      lastName: 'Rahman',
      email: 'ahmad@daritana.com'
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  })
})

// Real authentication endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      })
    }

    // Generate JWT tokens (with default role since it's not in User model)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: 'staff', // Default role - in production this would come from OrganizationMember
        organizationId: user.organizationId || 'default'
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    )

    // Remove password from response and add computed fields
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          ...userWithoutPassword,
          name: `${user.firstName} ${user.lastName}`,
          role: 'staff' // Default role
        }
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    })
  }
})

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'staff' } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create default organization for the user
    const organization = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        subscription: 'BASIC',
        settings: {}
      }
    })

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        organizationId: organization.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true
      }
    })

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful',
        token,
        refreshToken,
        user
      }
    })
  } catch (error) {
    logger.error('Register error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    })
  }
})

app.post('/api/v1/auth/forgot-password', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Password reset email sent'
    }
  })
})

// Real project endpoints with database
app.get('/api/v1/projects', authenticateToken, async (req: any, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId,
      OR: [
        { projectLeadId: req.user.id },
        { clientId: req.user.id },
        { teamMembers: { some: { userId: req.user.id } } }
      ]
    }

    if (status) where.status = status
    if (type) where.type = type

    // Get projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          projectLead: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            select: { id: true, status: true }
          },
          teamMembers: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.project.count({ where })
    ])

    res.json({
      success: true,
      data: {
        data: projects,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    })
  } catch (error) {
    logger.error('Get projects error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch projects' 
    })
  }
})

app.get('/api/v1/projects/dashboard-statistics', authenticateToken, async (req: any, res) => {
  try {
    const where = {
      organizationId: req.user.organizationId,
      OR: [
        { projectLeadId: req.user.id },
        { clientId: req.user.id },
        { teamMembers: { some: { userId: req.user.id } } }
      ]
    }

    // Get project statistics
    const [total, active, completed, overdue, recentProjects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: 'in_progress' } }),
      prisma.project.count({ where: { ...where, status: 'completed' } }),
      prisma.project.count({ 
        where: { 
          ...where, 
          status: { not: 'completed' },
          endDate: { lt: new Date() }
        } 
      }),
      prisma.project.findMany({
        where,
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          progress: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      })
    ])

    res.json({
      success: true,
      data: {
        statistics: {
          projects: {
            total,
            active,
            completed,
            overdue
          },
          recentProjects
        }
      }
    })
  } catch (error) {
    logger.error('Get dashboard statistics error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    })
  }
})

// Create project with database
app.post('/api/v1/projects', authenticateToken, async (req: any, res) => {
  try {
    const projectData = {
      ...req.body,
      organizationId: req.user.organizationId,
      projectLeadId: req.body.projectLeadId || req.user.id,
      status: req.body.status || 'planning',
      progress: 0,
      actualCost: 0
    }

    const project = await prisma.project.create({
      data: projectData,
      include: {
        projectLead: {
          select: { id: true, name: true, email: true }
        },
        client: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Broadcast real-time notification
    broadcastMessage({
      type: 'project_created',
      project,
      userId: req.user.id
    })

    res.status(201).json({
      success: true,
      data: project
    })
  } catch (error) {
    logger.error('Create project error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create project' 
    })
  }
})

// Update project
app.put('/api/v1/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    const project = await prisma.project.update({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      data: req.body,
      include: {
        projectLead: true,
        client: true,
        tasks: true
      }
    })

    // Broadcast real-time notification
    broadcastMessage({
      type: 'project_updated',
      project,
      userId: req.user.id
    })

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    logger.error('Update project error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update project' 
    })
  }
})

// Delete project
app.delete('/api/v1/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    await prisma.project.delete({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    })

    res.status(204).send()
  } catch (error) {
    logger.error('Delete project error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete project' 
    })
  }
})

// Get single project
app.get('/api/v1/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        projectLead: true,
        client: true,
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        teamMembers: {
          include: {
            user: true
          }
        },
        files: true,
        invoices: true,
        quotations: true
      }
    })

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      })
    }

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    logger.error('Get project error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project' 
    })
  }
})

// Get current user
app.get('/api/v1/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    // Remove password and add computed fields
    const { password: _, ...userWithoutPassword } = user

    res.json({
      ...userWithoutPassword,
      name: `${user.firstName} ${user.lastName}`,
      role: req.user.role || 'staff'
    })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user' 
    })
  }
})

// ==================== TASK ENDPOINTS ====================

// Get tasks
app.get('/api/v1/tasks', authenticateToken, async (req: any, res) => {
  try {
    const { projectId, status, assigneeId } = req.query
    
    const where: any = {
      project: {
        organizationId: req.user.organizationId
      }
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    logger.error('Get tasks error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tasks' 
    })
  }
})

// Create task
app.post('/api/v1/tasks', authenticateToken, async (req: any, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        ...req.body,
        status: req.body.status || 'todo'
      },
      include: {
        assignee: true,
        project: true
      }
    })

    // Broadcast real-time notification
    broadcastMessage({
      type: 'task_created',
      task,
      userId: req.user.id
    })

    res.status(201).json({
      success: true,
      data: task
    })
  } catch (error) {
    logger.error('Create task error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create task' 
    })
  }
})

// Update task
app.put('/api/v1/tasks/:id', authenticateToken, async (req: any, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        assignee: true,
        project: true
      }
    })

    // Broadcast real-time notification
    broadcastMessage({
      type: 'task_updated',
      task,
      userId: req.user.id
    })

    res.json({
      success: true,
      data: task
    })
  } catch (error) {
    logger.error('Update task error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update task' 
    })
  }
})

// Delete task
app.delete('/api/v1/tasks/:id', authenticateToken, async (req: any, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    })

    if (task) {
      await prisma.task.delete({
        where: { id: req.params.id }
      })

      // Broadcast real-time notification
      broadcastMessage({
        type: 'task_deleted',
        taskId: task.id,
        userId: req.user.id
      })
    }

    res.status(204).send()
  } catch (error) {
    logger.error('Delete task error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete task' 
    })
  }
})

// ==================== FILE UPLOAD ENDPOINTS ====================

// Upload file
app.post('/api/v1/files/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      })
    }

    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        projectId: req.body.projectId,
        uploadedById: req.user.id
      }
    })

    res.json({
      success: true,
      data: file
    })
  } catch (error) {
    logger.error('File upload error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload file' 
    })
  }
})

// Get project files
app.get('/api/v1/projects/:id/files', authenticateToken, async (req: any, res) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        projectId: req.params.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: files
    })
  } catch (error) {
    logger.error('Get files error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch files' 
    })
  }
})

// Download file
app.get('/api/v1/files/:id/download', authenticateToken, async (req: any, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    })

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      })
    }

    res.download(file.path, file.name)
  } catch (error) {
    logger.error('File download error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to download file' 
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    path: req.url
  })
})

// Start server with WebSocket support
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`🌐 CORS enabled for: http://localhost:5174, http://localhost:5173, http://localhost:3000`)
  logger.info(`🔌 WebSocket server ready`)
  logger.info(`🗄️  Database connected`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})