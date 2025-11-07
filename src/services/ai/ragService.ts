/**
 * RAG (Retrieval-Augmented Generation) Service
 * Combines vector search with LLM generation for intelligent responses
 */

import { openRouterClient, OpenRouterMessage } from './openRouterClient'
import { vectorStore, VectorDocument } from './vectorStore'
import { AI_CONFIG } from './config'
import { cacheService } from './cacheService'

export interface RAGQuery {
  query: string
  context?: string
  filter?: Record<string, any>
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface RAGResponse {
  answer: string
  sources: Array<{
    id: string
    content: string
    score: number
    metadata: Record<string, any>
  }>
  tokens: number
  cached: boolean
}

class RAGService {
  /**
   * Process a RAG query with context retrieval
   */
  async query(params: RAGQuery): Promise<RAGResponse> {
    const {
      query,
      context = '',
      filter,
      maxTokens = 2000,
      temperature = 0.7,
      systemPrompt,
    } = params

    // Check cache first
    const cacheKey = `rag:${JSON.stringify(params)}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    try {
      // 1. Retrieve relevant context from vector store
      const searchResults = await vectorStore.search(query, {
        topK: 5,
        filter,
        includeContent: true,
      })

      // 2. Build context from search results
      const retrievedContext = searchResults
        .map(r => `[${r.metadata.type || 'document'}] ${r.content}`)
        .join('\n\n')

      // 3. Combine contexts
      const fullContext = context
        ? `${context}\n\n---\n\nRetrieved Information:\n${retrievedContext}`
        : retrievedContext

      // 4. Build messages for LLM
      const messages: OpenRouterMessage[] = []

      // System prompt
      const defaultSystemPrompt = `You are ARIA, an intelligent assistant for the Daritana Architecture Platform. 
You help with architecture and interior design projects in Malaysia.
Use the provided context to answer questions accurately and helpfully.
If the context doesn't contain enough information, say so clearly.
Always cite your sources when using retrieved information.`

      messages.push({
        role: 'system',
        content: systemPrompt || defaultSystemPrompt,
      })

      // Add context and query
      messages.push({
        role: 'user',
        content: `Context:\n${fullContext}\n\nQuestion: ${query}`,
      })

      // 5. Generate response
      const response = await openRouterClient.chat(messages, {
        model: AI_CONFIG.models.chat,
        maxTokens,
        temperature,
      })

      const result: RAGResponse = {
        answer: response.choices[0]?.message?.content || '',
        sources: searchResults.map(r => ({
          id: r.id,
          content: r.content,
          score: r.score,
          metadata: r.metadata,
        })),
        tokens: response.usage?.total_tokens || 0,
        cached: false,
      }

      // Cache the result
      await cacheService.set(cacheKey, result, 1800) // 30 minutes

      return result
    } catch (error) {
      console.error('RAG query failed:', error)
      throw error
    }
  }

  /**
   * Process architectural compliance questions
   */
  async queryCompliance(params: {
    query: string
    projectType?: string
    location?: string
  }): Promise<RAGResponse> {
    const { query, projectType, location } = params

    const filter: Record<string, any> = {
      type: 'compliance',
    }

    if (projectType) {
      filter.projectType = projectType
    }

    const systemPrompt = `You are a Malaysian building compliance expert.
Answer questions about UBBL (Uniform Building By-Laws) and other Malaysian building regulations.
Be specific about clause numbers and requirements.
Consider the project type: ${projectType || 'general'} and location: ${location || 'Malaysia'}.`

    return this.query({
      query,
      filter,
      systemPrompt,
      temperature: 0.3, // Lower temperature for factual compliance answers
    })
  }

  /**
   * Generate design suggestions
   */
  async queryDesign(params: {
    query: string
    style?: string
    budget?: { min: number; max: number; currency: string }
    culturalConsiderations?: string[]
  }): Promise<RAGResponse> {
    const { query, style, budget, culturalConsiderations } = params

    const context = `
Design Style: ${style || 'Not specified'}
Budget: ${budget ? `${budget.currency} ${budget.min} - ${budget.max}` : 'Not specified'}
Cultural Considerations: ${culturalConsiderations?.join(', ') || 'None specified'}
`

    const systemPrompt = `You are an expert interior designer and architect specializing in Malaysian projects.
Provide creative and practical design suggestions that respect local culture and climate.
Consider the client's budget and style preferences.
Include specific material and color recommendations where appropriate.`

    return this.query({
      query,
      context,
      filter: { type: 'knowledge' },
      systemPrompt,
      temperature: 0.8, // Higher temperature for creative suggestions
    })
  }

  /**
   * Answer project management questions
   */
  async queryProjectManagement(params: {
    query: string
    projectId?: string
    includeHistory?: boolean
  }): Promise<RAGResponse> {
    const { query, projectId, includeHistory } = params

    const filter: Record<string, any> = {}
    if (projectId) {
      filter.projectId = projectId
    }

    let context = ''
    if (includeHistory && projectId) {
      // Retrieve project conversation history
      const history = await vectorStore.search(`project ${projectId} history`, {
        filter: { type: 'conversation', projectId },
        topK: 10,
      })
      
      context = history
        .map(h => `[${new Date(h.metadata.timestamp).toLocaleDateString()}] ${h.content}`)
        .join('\n')
    }

    const systemPrompt = `You are a project management expert for architecture and construction projects.
Provide practical advice on scheduling, resource allocation, risk management, and team coordination.
Consider Malaysian construction practices and regulations.`

    return this.query({
      query,
      context,
      filter,
      systemPrompt,
      temperature: 0.6,
    })
  }

  /**
   * Index a document for RAG
   */
  async indexDocument(document: VectorDocument): Promise<void> {
    await vectorStore.storeDocument(document)
  }

  /**
   * Index multiple documents
   */
  async indexBatch(documents: VectorDocument[]): Promise<void> {
    await vectorStore.storeBatch(documents)
  }

  /**
   * Update knowledge base with new information
   */
  async updateKnowledgeBase(params: {
    content: string
    type: 'project' | 'document' | 'compliance' | 'knowledge' | 'conversation'
    metadata?: Record<string, any>
  }): Promise<void> {
    const { content, type, metadata = {} } = params

    const document: VectorDocument = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      content,
      metadata: {
        type,
        timestamp: Date.now(),
        ...metadata,
      },
    }

    await this.indexDocument(document)
  }

  /**
   * Search knowledge base without generation
   */
  async search(query: string, options?: any): Promise<any[]> {
    return vectorStore.search(query, options)
  }
}

// Export singleton instance
export const ragService = new RAGService()

// Helper function for quick RAG queries
export async function askRAG(question: string): Promise<string> {
  const response = await ragService.query({ query: question })
  return response.answer
}