/**
 * Vector Store Service
 * Manages vector embeddings and similarity search using Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone'
import { AI_CONFIG } from './config'
import { openRouterClient } from './openRouterClient'

export interface VectorDocument {
  id: string
  content: string
  metadata: {
    type: 'project' | 'document' | 'compliance' | 'knowledge' | 'conversation'
    projectId?: string
    userId?: string
    timestamp: number
    source?: string
    tags?: string[]
    [key: string]: any
  }
}

export interface SearchResult {
  id: string
  score: number
  content: string
  metadata: Record<string, any>
}

class VectorStoreService {
  private pinecone: Pinecone | null = null
  private index: any = null
  private initialized = false

  /**
   * Initialize Pinecone connection
   */
  async initialize() {
    if (this.initialized) return

    // Skip initialization in browser environment
    if (typeof window !== 'undefined') {
      console.log('Vector store disabled in browser environment')
      this.initialized = false
      return
    }

    try {
      this.pinecone = new Pinecone({
        apiKey: AI_CONFIG.pinecone.apiKey,
      })

      this.index = this.pinecone.index(AI_CONFIG.pinecone.indexName)
      this.initialized = true
      
      console.log('Vector store initialized successfully')
    } catch (error) {
      console.error('Failed to initialize vector store:', error)
      this.initialized = false
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openRouterClient.createEmbeddings(text)
    return response.data[0].embedding
  }

  /**
   * Store document with embeddings
   */
  async storeDocument(document: VectorDocument): Promise<void> {
    // Skip in browser environment
    if (typeof window !== 'undefined') {
      return
    }

    await this.initialize()

    try {
      // Generate embedding for the document content
      const embedding = await this.generateEmbedding(document.content)

      // Upsert to Pinecone
      await this.index.upsert([
        {
          id: document.id,
          values: embedding,
          metadata: {
            ...document.metadata,
            content: document.content.substring(0, 1000), // Store first 1000 chars in metadata
          },
        },
      ])

      console.log(`Document ${document.id} stored successfully`)
    } catch (error) {
      console.error('Failed to store document:', error)
      throw error
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeBatch(documents: VectorDocument[]): Promise<void> {
    // Skip in browser environment
    if (typeof window !== 'undefined') {
      return
    }

    await this.initialize()

    try {
      // Generate embeddings for all documents
      const embeddings = await Promise.all(
        documents.map(doc => this.generateEmbedding(doc.content))
      )

      // Prepare vectors for upsert
      const vectors = documents.map((doc, index) => ({
        id: doc.id,
        values: embeddings[index],
        metadata: {
          ...doc.metadata,
          content: doc.content.substring(0, 1000),
        },
      }))

      // Batch upsert to Pinecone (max 100 at a time)
      const batchSize = 100
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize)
        await this.index.upsert(batch)
      }

      console.log(`Stored ${documents.length} documents successfully`)
    } catch (error) {
      console.error('Failed to store batch:', error)
      throw error
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    options: {
      topK?: number
      filter?: Record<string, any>
      includeContent?: boolean
    } = {}
  ): Promise<SearchResult[]> {
    // Return empty results in browser environment
    if (typeof window !== 'undefined') {
      return []
    }

    await this.initialize()

    const { topK = 5, filter, includeContent = true } = options

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)

      // Search in Pinecone
      const searchResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        filter,
        includeMetadata: true,
      })

      // Format results
      const results: SearchResult[] = searchResponse.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        content: includeContent ? match.metadata.content : '',
        metadata: match.metadata,
      }))

      return results
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  /**
   * Search with context for RAG
   */
  async searchForRAG(
    query: string,
    options: {
      topK?: number
      filter?: Record<string, any>
      minScore?: number
    } = {}
  ): Promise<string> {
    const { topK = 5, filter, minScore = 0.7 } = options

    const results = await this.search(query, { topK, filter })
    
    // Filter by minimum score
    const relevantResults = results.filter(r => r.score >= minScore)
    
    if (relevantResults.length === 0) {
      return ''
    }

    // Combine relevant content for context
    const context = relevantResults
      .map(r => `[Source: ${r.metadata.source || 'Unknown'}]\n${r.content}`)
      .join('\n\n---\n\n')

    return context
  }

  /**
   * Update document metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    await this.initialize()

    try {
      // Fetch existing vector
      const fetchResponse = await this.index.fetch([id])
      const existingVector = fetchResponse.records[id]

      if (!existingVector) {
        throw new Error(`Document ${id} not found`)
      }

      // Update with new metadata
      await this.index.upsert([
        {
          id,
          values: existingVector.values,
          metadata: {
            ...existingVector.metadata,
            ...metadata,
            updatedAt: Date.now(),
          },
        },
      ])

      console.log(`Metadata updated for document ${id}`)
    } catch (error) {
      console.error('Failed to update metadata:', error)
      throw error
    }
  }

  /**
   * Delete document from vector store
   */
  async deleteDocument(id: string): Promise<void> {
    await this.initialize()

    try {
      await this.index.deleteOne(id)
      console.log(`Document ${id} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  }

  /**
   * Delete multiple documents
   */
  async deleteBatch(ids: string[]): Promise<void> {
    await this.initialize()

    try {
      await this.index.deleteMany(ids)
      console.log(`Deleted ${ids.length} documents successfully`)
    } catch (error) {
      console.error('Failed to delete batch:', error)
      throw error
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<any> {
    await this.initialize()

    try {
      const stats = await this.index.describeIndexStats()
      return stats
    } catch (error) {
      console.error('Failed to get stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreService()

// Helper function to prepare text for embedding
export function prepareTextForEmbedding(text: string, maxLength = 8000): string {
  // Clean and truncate text
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  // Truncate intelligently at sentence boundary
  const truncated = cleaned.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (lastSentenceEnd > maxLength * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1)
  }

  return truncated + '...'
}