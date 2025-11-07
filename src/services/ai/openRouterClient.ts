/**
 * OpenRouter Client
 * Unified client for all LLM interactions via OpenRouter
 */

import { AI_CONFIG, MODEL_PRICING } from './config'

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  stop?: string[]
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: OpenRouterMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

class OpenRouterClient {
  private apiKey: string
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private usageTracking: Map<string, { tokens: number; cost: number }>

  constructor() {
    this.apiKey = AI_CONFIG.openRouter.apiKey
    this.baseUrl = AI_CONFIG.openRouter.baseUrl
    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...AI_CONFIG.openRouter.defaultHeaders,
    }
    this.usageTracking = new Map()
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: OpenRouterMessage[],
    options: OpenRouterOptions = {}
  ): Promise<OpenRouterResponse> {
    const model = options.model || AI_CONFIG.models.chat
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          top_p: options.topP ?? 1,
          frequency_penalty: options.frequencyPenalty ?? 0,
          presence_penalty: options.presencePenalty ?? 0,
          stream: options.stream ?? false,
          stop: options.stop,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
      }

      const data: OpenRouterResponse = await response.json()
      
      // Track usage and costs
      if (data.usage) {
        this.trackUsage(model, data.usage)
      }

      return data
    } catch (error) {
      console.error('OpenRouter chat error:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for text
   */
  async createEmbeddings(
    input: string | string[],
    model: string = AI_CONFIG.models.embeddings
  ): Promise<EmbeddingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          model,
          input,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
      }

      const data: EmbeddingResponse = await response.json()
      
      // Track usage
      if (data.usage) {
        this.trackUsage(model, {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: 0,
          total_tokens: data.usage.total_tokens,
        })
      }

      return data
    } catch (error) {
      console.error('OpenRouter embeddings error:', error)
      throw error
    }
  }

  /**
   * Stream chat completion response
   */
  async *streamChat(
    messages: OpenRouterMessage[],
    options: OpenRouterOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || AI_CONFIG.models.chat
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          stream: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              // Skip unparseable chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenRouter stream error:', error)
      throw error
    }
  }

  /**
   * Track token usage and costs
   */
  private trackUsage(
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  ) {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || { input: 0, output: 0 }
    const cost = 
      (usage.prompt_tokens / 1000) * pricing.input +
      (usage.completion_tokens / 1000) * pricing.output

    const current = this.usageTracking.get(model) || { tokens: 0, cost: 0 }
    this.usageTracking.set(model, {
      tokens: current.tokens + usage.total_tokens,
      cost: current.cost + cost,
    })
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats: Record<string, any> = {}
    let totalCost = 0
    let totalTokens = 0

    this.usageTracking.forEach((value, model) => {
      stats[model] = value
      totalCost += value.cost
      totalTokens += value.tokens
    })

    return {
      models: stats,
      totalCost,
      totalTokens,
      budgetRemaining: AI_CONFIG.costTracking.monthlyBudgetUSD - totalCost,
      budgetUsedPercent: (totalCost / AI_CONFIG.costTracking.monthlyBudgetUSD) * 100,
    }
  }

  /**
   * Reset usage tracking (e.g., monthly reset)
   */
  resetUsageTracking() {
    this.usageTracking.clear()
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient()

// Helper function for quick chat
export async function quickChat(
  prompt: string,
  systemPrompt?: string,
  options?: OpenRouterOptions
): Promise<string> {
  const messages: OpenRouterMessage[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  messages.push({ role: 'user', content: prompt })
  
  const response = await openRouterClient.chat(messages, {
    model: AI_CONFIG.models.fast,
    ...options,
  })
  
  return response.choices[0]?.message?.content || ''
}