import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Import configuration and services
import { config, isDevelopment, isProduction } from './config/env';
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './services/database.service';
import { logger, createLogger } from './utils/logger';

// Import middleware
import { requestLogger, securityLogger, slowQueryLogger, apiUsageLogger, errorLogger } from './middleware/logging.middleware';
import { errorHandler, notFoundHandler, handleUncaughtException, handleUnhandledRejection } from './middleware/error.middleware';
import { sanitizeInput } from './middleware/validation.middleware';

// Import routes
import authRoutes from './routes/auth.prisma.routes';
import userRoutes from './routes/user.prisma.routes';
import searchRoutes from './routes/search.routes';
import projectRoutes from './routes/project.routes';
// import taskRoutes from './routes/task.prisma.routes';
// import documentRoutes from './routes/document.prisma.routes';

const serverLogger = createLogger('Server');

class Server {
  private app: Express;
  private httpServer: any;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.setupSocketIO();
    this.setupGlobalErrorHandlers();
  }

  private setupSocketIO(): void {
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.CORS_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    // Socket.IO middleware and event handlers would be set up here
    this.io.on('connection', (socket) => {
      serverLogger.info('New socket connection', { socketId: socket.id });
      
      socket.on('disconnect', () => {
        serverLogger.info('Socket disconnected', { socketId: socket.id });
      });
    });
  }

  private setupGlobalErrorHandlers(): void {
    handleUncaughtException();
    handleUnhandledRejection();
  }

  private setupSecurityMiddleware(): void {
    // Helmet for security headers
    this.app.use(helmet({
      contentSecurityPolicy: !isDevelopment(),
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction(),
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (config.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        
        // In development, allow localhost with any port
        if (isDevelopment() && origin.match(/^http:\/\/localhost:\d+$/)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Total-Pages']
    }));

    // Rate limiting
    const generalLimiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      }
    });

    this.app.use(generalLimiter);

    // Compression middleware
    this.app.use(compression());
  }

  private setupParsingMiddleware(): void {
    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Input sanitization
    this.app.use(sanitizeInput);
  }

  private setupLoggingMiddleware(): void {
    // Request logging
    this.app.use(requestLogger);
    
    // Security logging for sensitive routes
    this.app.use('/api/auth', securityLogger);
    
    // Slow query logging
    this.app.use(slowQueryLogger(2000)); // Log requests slower than 2 seconds
    
    // API usage tracking
    if (isProduction()) {
      this.app.use('/api', apiUsageLogger);
    }
  }

  private setupStaticFiles(): void {
    // Serve uploaded files
    this.app.use('/uploads', express.static(
      path.join(process.cwd(), config.UPLOAD_DIRECTORY),
      {
        maxAge: isProduction() ? '1d' : 0,
        etag: true,
        lastModified: true
      }
    ));

    // Serve API documentation in development
    if (isDevelopment()) {
      this.app.get('/api-docs', (req, res) => {
        res.json({
          message: 'Daritana API Documentation',
          version: '1.0.0',
          endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            tasks: '/api/tasks',
            documents: '/api/documents'
          }
        });
      });
    }
  }

  private setupHealthChecks(): void {
    // Basic health check
    this.app.get('/health', async (req: Request, res: Response) => {
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: await checkDatabaseHealth()
      };

      const statusCode = healthData.database ? 200 : 503;
      res.status(statusCode).json(healthData);
    });

    // Detailed health check for monitoring
    this.app.get('/api/health', async (req: Request, res: Response) => {
      try {
        const [dbHealth] = await Promise.all([
          checkDatabaseHealth()
        ]);

        const healthData = {
          status: dbHealth ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealth ? 'up' : 'down',
            // Add other service health checks here
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: process.version,
            platform: process.platform
          }
        };

        const statusCode = dbHealth ? 200 : 503;
        res.status(statusCode).json(healthData);
      } catch (error) {
        res.status(503).json({
          status: 'error',
          message: 'Health check failed',
          error: isDevelopment() ? error : 'Internal server error'
        });
      }
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api', searchRoutes);
    this.app.use('/api/projects', projectRoutes);
    // this.app.use('/api/tasks', taskRoutes);
    // this.app.use('/api/documents', documentRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Daritana Backend API',
        version: '1.0.0',
        status: 'running',
        documentation: isDevelopment() ? `${req.protocol}://${req.get('host')}/api-docs` : undefined
      });
    });
  }

  private setupErrorHandling(): void {
    // Error logging middleware (must be before error handler)
    this.app.use(errorLogger);

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      serverLogger.info(`${signal} received: closing HTTP server`);
      
      this.httpServer.close(async () => {
        serverLogger.info('HTTP server closed');
        
        try {
          await disconnectDatabase();
          serverLogger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          serverLogger.error('Error during graceful shutdown', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        serverLogger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      
      // Setup middleware and routes
      this.setupSecurityMiddleware();
      this.setupParsingMiddleware();
      this.setupLoggingMiddleware();
      this.setupStaticFiles();
      this.setupHealthChecks();
      this.setupRoutes();
      this.setupErrorHandling();
      this.setupGracefulShutdown();

      // Start server
      this.httpServer.listen(config.PORT, config.HOST, () => {
        serverLogger.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`);
        serverLogger.info(`🔌 WebSocket server running on ws://${config.HOST}:${config.PORT}`);
        serverLogger.info(`📚 Environment: ${config.NODE_ENV}`);
        
        if (isDevelopment()) {
          serverLogger.info(`📖 API docs: http://${config.HOST}:${config.PORT}/api-docs`);
          serverLogger.info(`🏥 Health check: http://${config.HOST}:${config.PORT}/health`);
        }
      });

    } catch (error) {
      serverLogger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  public getApp(): Express {
    return this.app;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

export default Server;