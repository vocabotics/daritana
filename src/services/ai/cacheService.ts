/**
 * Cache Service for AI Responses
 * Implements caching using Redis for production or in-memory for development
 */

import { AI_CONFIG } from './config'

// Only import Redis on server-side
let Redis: any = null
if (typeof window === 'undefined') {
  try {
    Redis = require('ioredis')
  } catch (error) {
    console.warn('Redis not available, using in-memory cache')
  }
}

interface CacheEntry {
  value: any
  expires: number
}

class CacheService {
  private redis: Redis | null = null
  private memoryCache: Map<string, CacheEntry> = new Map()
  private useRedis: boolean = false

  constructor() {
    this.initializeCache()
  }

  private initializeCache() {
    // Only use Redis on server-side and in production
    if (typeof window === 'undefined' && Redis && AI_CONFIG.redis.url && import.meta.env.MODE === 'production') {
      try {
        this.redis = new Redis(AI_CONFIG.redis.url)
        this.useRedis = true
        
        this.redis.on('connect', () => {
          console.log('Connected to Redis cache')
        })
        
        this.redis.on('error', (err) => {
          console.error('Redis connection error:', err)
          this.useRedis = false
        })
      } catch (error) {
        console.warn('Failed to connect to Redis, using in-memory cache:', error)
        this.useRedis = false
      }
    } else {
      console.log('Using in-memory cache')
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redis) {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) : null
      } else {
        // Use memory cache
        const entry = this.memoryCache.get(key)
        if (!entry) return null
        
        // Check if expired
        if (Date.now() > entry.expires) {
          this.memoryCache.delete(key)
          return null
        }
        
        return entry.value
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || AI_CONFIG.redis.ttl.default
    
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value))
      } else {
        // Use memory cache
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000),
        })
        
        // Clean up expired entries periodically
        this.cleanupMemoryCache()
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key)
      } else {
        this.memoryCache.delete(key)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Clear all cache entries with a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        // For memory cache, iterate and delete matching keys
        const regex = new RegExp(pattern.replace('*', '.*'))
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error)
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        const exists = await this.redis.exists(key)
        return exists === 1
      } else {
        const entry = this.memoryCache.get(key)
        if (!entry) return false
        
        // Check if expired
        if (Date.now() > entry.expires) {
          this.memoryCache.delete(key)
          return false
        }
        
        return true
      }
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get or set cache value
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Generate new value
    const value = await factory()
    
    // Store in cache
    await this.set(key, value, ttlSeconds)
    
    return value
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expires) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    type: string
    size: number
    memoryUsage?: number
  }> {
    if (this.useRedis && this.redis) {
      const info = await this.redis.info('memory')
      const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1]
      const dbSize = await this.redis.dbsize()
      
      return {
        type: 'redis',
        size: dbSize,
        memoryUsage: usedMemory ? parseFloat(usedMemory) : undefined,
      }
    } else {
      return {
        type: 'memory',
        size: this.memoryCache.size,
        memoryUsage: typeof process !== 'undefined' && process.memoryUsage ? 
          process.memoryUsage().heapUsed / 1024 / 1024 : undefined // MB
      }
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.flushdb()
      } else {
        this.memoryCache.clear()
      }
      console.log('Cache cleared')
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Cache key generators
export const cacheKeys = {
  aiResponse: (prompt: string, model?: string) => 
    `ai:response:${model || 'default'}:${Buffer.from(prompt).toString('base64').substring(0, 50)}`,
  
  embedding: (text: string) => 
    `embedding:${Buffer.from(text).toString('base64').substring(0, 50)}`,
  
  ragQuery: (query: string, filter?: any) => 
    `rag:${Buffer.from(JSON.stringify({ query, filter })).toString('base64').substring(0, 50)}`,
  
  compliance: (clauseId: string) => 
    `compliance:${clauseId}`,
  
  project: (projectId: string) => 
    `project:${projectId}`,
  
  user: (userId: string) => 
    `user:${userId}`,
}