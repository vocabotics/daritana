import { Router, Request, Response } from 'express'
import { sequelize } from '../database/connection'
import { Monitoring } from '../utils/monitoring'
import { logger } from '../utils/logger'

const router = Router()

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }

    res.json(healthStatus)
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
})

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now()
  const checks: any = {}

  try {
    // Database health
    try {
      await sequelize.authenticate()
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      }
    }

    // Memory usage
    const memoryUsage = process.memoryUsage()
    checks.memory = {
      status: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
      usage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      }
    }

    // System info
    checks.system = {
      status: 'healthy',
      uptime: `${Math.round(process.uptime())}s`,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    }

    // Monitoring status
    checks.monitoring = Monitoring.getHealthStatus()

    // Overall status
    const allHealthy = Object.values(checks).every((check: any) => 
      check.status === 'healthy' || check.status === 'warning'
    )

    const response = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      responseTime: `${Date.now() - startTime}ms`
    }

    const statusCode = allHealthy ? 200 : 503
    res.status(statusCode).json(response)

  } catch (error) {
    logger.error('Detailed health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      checks,
      responseTime: `${Date.now() - startTime}ms`
    })
  }
})

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await sequelize.authenticate()
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Database not ready'
    })
  }
})

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Metrics endpoint (basic metrics in Prometheus format)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Basic metrics in Prometheus format
    const metrics = [
      '# HELP daritana_uptime_seconds Total uptime in seconds',
      '# TYPE daritana_uptime_seconds counter',
      `daritana_uptime_seconds ${uptime}`,
      '',
      '# HELP daritana_memory_usage_bytes Memory usage in bytes',
      '# TYPE daritana_memory_usage_bytes gauge',
      `daritana_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `daritana_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `daritana_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `daritana_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      ''
    ].join('\n')

    res.set('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (error) {
    logger.error('Metrics endpoint failed:', error)
    res.status(500).send('# Error generating metrics')
  }
})

export default router