import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let redisClient: RedisClientType

export const connectRedis = async (): Promise<void> => {
  if (process.env.DISABLE_REDIS === 'true') {
    logger.info('Redis disabled by environment variable')
    return
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  redisClient = createClient({
    url: redisUrl,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.warn('Redis connection failed after 3 retries - disabling Redis')
          return false
        }
        return Math.min(retries * 100, 3000)
      }
    }
  })

  redisClient.on('error', (err) => {
    // Only log once for development
    if (process.env.NODE_ENV !== 'production') {
      return
    }
    logger.error('Redis Client Error:', err)
  })

  redisClient.on('connect', () => {
    logger.info('Redis client connected')
  })

  redisClient.on('ready', () => {
    logger.info('Redis client ready')
  })

  try {
    await redisClient.connect()
  } catch (error) {
    logger.warn('Redis not available - running without cache')
    // Don't throw - Redis is optional for development
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit()
    logger.info('Redis connection closed')
  }
}

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized')
  }
  return redisClient
}

// Cache utility functions
export const cache = {
  async get(key: string): Promise<any> {
    try {
      const data = await redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },

  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value)
      if (expireSeconds) {
        await redisClient.setEx(key, expireSeconds, data)
      } else {
        await redisClient.set(key, data)
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key)
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
    }
  },

  async flush(): Promise<void> {
    try {
      await redisClient.flushAll()
      logger.info('Redis cache flushed')
    } catch (error) {
      logger.error('Cache flush error:', error)
    }
  }
}