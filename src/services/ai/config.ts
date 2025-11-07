/**
 * AI Service Configuration
 * Central configuration for all AI services using OpenRouter
 */

export const AI_CONFIG = {
  openRouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    baseUrl: import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://daritana.com',
      'X-Title': 'Daritana Architecture Platform',
    },
  },
  
  models: {
    // Primary chat model for complex tasks
    chat: import.meta.env.VITE_AI_MODEL_CHAT || 'openai/gpt-4-turbo-preview',
    
    // Fast model for simple tasks
    fast: import.meta.env.VITE_AI_MODEL_FAST || 'openai/gpt-3.5-turbo',
    
    // Embeddings model for vector search
    embeddings: import.meta.env.VITE_AI_MODEL_EMBEDDINGS || 'openai/text-embedding-3-small',
    
    // Vision model for image analysis
    vision: import.meta.env.VITE_AI_MODEL_VISION || 'openai/gpt-4-vision-preview',
    
    // Code generation model
    code: import.meta.env.VITE_AI_MODEL_CODE || 'anthropic/claude-3-opus',
  },
  
  pinecone: {
    apiKey: import.meta.env.VITE_PINECONE_API_KEY || '',
    environment: import.meta.env.VITE_PINECONE_ENVIRONMENT || '',
    indexName: import.meta.env.VITE_PINECONE_INDEX_NAME || 'daritana-knowledge-base',
    dimension: 1536, // Dimension for text-embedding-3-small
  },
  
  redis: {
    url: import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379',
    ttl: {
      default: 3600, // 1 hour
      embeddings: 86400, // 24 hours
      completions: 1800, // 30 minutes
    },
  },
  
  rateLimits: {
    requestsPerMinute: 50,
    tokensPerMinute: 90000,
    concurrentRequests: 5,
  },
  
  costTracking: {
    monthlyBudgetUSD: Number(import.meta.env.VITE_AI_MONTHLY_BUDGET_USD) || 1000,
    alertThresholdPercent: Number(import.meta.env.VITE_AI_ALERT_THRESHOLD_PERCENT) || 80,
  },
  
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
  },
}

// Model pricing per 1K tokens (approximate, check OpenRouter for latest)
export const MODEL_PRICING = {
  'openai/gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'openai/gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'openai/text-embedding-3-small': { input: 0.00002, output: 0 },
  'openai/gpt-4-vision-preview': { input: 0.01, output: 0.03 },
  'anthropic/claude-3-opus': { input: 0.015, output: 0.075 },
}

// Context window sizes
export const MODEL_CONTEXT_WINDOWS = {
  'openai/gpt-4-turbo-preview': 128000,
  'openai/gpt-3.5-turbo': 16385,
  'openai/text-embedding-3-small': 8191,
  'openai/gpt-4-vision-preview': 128000,
  'anthropic/claude-3-opus': 200000,
}