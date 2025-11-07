import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'

export class Monitoring {
  private static isInitialized = false

  static initialize(): void {
    if (this.isInitialized) {
      return
    }

    const environment = process.env.NODE_ENV || 'development'
    const sentryDsn = process.env.SENTRY_DSN

    if (!sentryDsn) {
      logger.warn('Sentry DSN not provided, error monitoring will be limited to console logs')
      return
    }

    try {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        integrations: [
          nodeProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: require('../app').app }),
          new Sentry.Integrations.Postgres(),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
          // Filter out certain errors that we don't want to track
          if (event.exception) {
            const error = hint.originalException
            
            // Don't send validation errors to Sentry
            if (error && typeof error === 'object' && 'code' in error) {
              if ((error as any).code === 'VALIDATION_ERROR') {
                return null
              }
            }
          }
          
          return event
        },
        beforeSendTransaction(event) {
          // Filter out health check transactions
          if (event.transaction === 'GET /health') {
            return null
          }
          
          return event
        }
      })

      this.isInitialized = true
      logger.info('Sentry monitoring initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error)
    }
  }

  // Request handler middleware (should be used first)
  static requestHandler() {
    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'role'],
      ip: true
    })
  }

  // Tracing middleware
  static tracingHandler() {
    return Sentry.Handlers.tracingHandler()
  }

  // Error handler middleware (should be used last)
  static errorHandler() {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only send errors that are 500+ status codes to Sentry
        return error.status >= 500
      }
    })
  }

  // Custom error capture with context
  static captureException(error: Error, context?: Record<string, any>, user?: { id?: string; email?: string; role?: string }): string {
    return Sentry.captureException(error, {
      tags: {
        component: context?.component || 'backend',
        feature: context?.feature || 'unknown'
      },
      extra: {
        ...context,
        timestamp: new Date().toISOString()
      },
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : undefined
    })
  }

  // Capture custom message
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): string {
    return Sentry.captureMessage(message, {
      level,
      tags: {
        component: context?.component || 'backend'
      },
      extra: context
    })
  }

  // Add breadcrumb
  static addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    })
  }

  // Set user context
  static setUser(user: { id?: string; email?: string; role?: string; [key: string]: any }): void {
    Sentry.setUser(user)
  }

  // Set context
  static setContext(name: string, context: Record<string, any>): void {
    Sentry.setContext(name, context)
  }

  // Set tag
  static setTag(key: string, value: string): void {
    Sentry.setTag(key, value)
  }

  // Start transaction for performance monitoring
  static startTransaction(name: string, op: string, description?: string): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op,
      description
    })
  }

  // Performance monitoring middleware
  static performanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const transaction = Sentry.startTransaction({
        op: 'http.server',
        name: `${req.method} ${req.path}`,
        data: {
          method: req.method,
          url: req.url,
          path: req.path,
          query: req.query,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      })

      // Add transaction to response locals so it can be finished later
      res.locals.sentryTransaction = transaction

      // Set user context if available
      if (req.user) {
        this.setUser({
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        })
      }

      // Finish transaction when response is sent
      res.on('finish', () => {
        transaction.setHttpStatus(res.statusCode)
        transaction.finish()
      })

      next()
    }
  }

  // Database query performance monitoring
  static trackDatabaseQuery(query: string, duration: number, table?: string): void {
    const span = Sentry.getCurrentHub().getScope()?.getTransaction()?.startChild({
      op: 'db.query',
      description: query,
      data: {
        duration,
        table,
        query: query.substring(0, 200) // Truncate long queries
      }
    })

    setTimeout(() => span?.finish(), duration)
  }

  // System metrics collection
  static collectSystemMetrics(): void {
    if (!this.isInitialized) return

    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    this.setContext('system', {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version
    })
  }

  // Custom middleware for API monitoring
  static apiMonitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()

      // Track API endpoint usage
      this.addBreadcrumb(
        `API Request: ${req.method} ${req.path}`,
        'http',
        'info',
        {
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      )

      res.on('finish', () => {
        const duration = Date.now() - startTime
        
        // Track slow requests
        if (duration > 5000) {
          this.captureMessage(
            `Slow API request: ${req.method} ${req.path} took ${duration}ms`,
            'warning',
            {
              method: req.method,
              path: req.path,
              duration,
              statusCode: res.statusCode,
              component: 'api-performance'
            }
          )
        }

        // Track error responses
        if (res.statusCode >= 400) {
          this.addBreadcrumb(
            `API Error: ${res.statusCode} ${req.method} ${req.path}`,
            'http',
            res.statusCode >= 500 ? 'error' : 'warning',
            {
              statusCode: res.statusCode,
              duration
            }
          )
        }
      })

      next()
    }
  }

  // Health check for monitoring systems
  static getHealthStatus() {
    return {
      sentry: this.isInitialized,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
  }
}

// Express middleware for user context
export const setUserContext = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    Monitoring.setUser({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    })
  }
  next()
}