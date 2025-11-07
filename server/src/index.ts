import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database connection
import { testConnection, closePool } from './database/connection';

// Import routes
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';

// Import services
import { initializeSocketServer } from './services/notificationService';
import { sanitizeInput } from './middleware/validation';

// Create Express app
const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Initialize notification service with Socket.IO
initializeSocketServer(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 New WebSocket connection:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  // Join project room for real-time collaboration
  socket.on('join-project', (projectId: string) => {
    socket.join(`project-${projectId}`);
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project-${projectId}`);
    console.log(`Socket ${socket.id} left project ${projectId}`);
  });

  // Handle real-time collaboration events
  socket.on('task-update', (data) => {
    socket.to(`project-${data.projectId}`).emit('task-updated', data);
  });

  socket.on('comment-added', (data) => {
    socket.to(`project-${data.projectId}`).emit('new-comment', data);
  });

  socket.on('disconnect', () => {
    console.log('👤 WebSocket disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
const apiPrefix = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/projects`, projectRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Daritana Architect Management API',
    version: process.env.API_VERSION || 'v1',
    status: 'running',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    status_code: 404
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'File size too large',
      status_code: 400
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Too many files',
      status_code: 400
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
    status_code: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000');

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Connecting to database...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Start listening
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Daritana Backend Server Started Successfully!        ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   🌐 Server:     http://localhost:${PORT}                     ║
║   📡 WebSocket:  ws://localhost:${PORT}                       ║
║   📚 API Base:   http://localhost:${PORT}/api/v1              ║
║   🏥 Health:     http://localhost:${PORT}/health              ║
║                                                            ║
║   🔧 Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   💾 Database:    ${process.env.DB_NAME || 'daritana_db'}                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close database connections
  await closePool();
  
  // Close Socket.IO
  io.close(() => {
    console.log('✅ WebSocket server closed');
  });

  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
startServer();