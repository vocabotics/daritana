/**
 * ARIA Virtual Project Manager
 * AI-powered assistant for project management and guidance
 */

import { openRouterClient, OpenRouterMessage } from './openRouterClient'
import { ragService } from './ragService'
import { AI_CONFIG } from './config'
import { cacheService, cacheKeys } from './cacheService'

export interface ARIAContext {
  projectId?: string
  userId?: string
  role?: string
  conversationHistory?: OpenRouterMessage[]
  projectData?: any
  preferences?: {
    language?: string
    tone?: 'formal' | 'casual' | 'professional'
    responseLength?: 'brief' | 'detailed' | 'comprehensive'
  }
}

export interface ARIAResponse {
  message: string
  suggestions?: string[]
  actions?: Array<{
    type: string
    data: any
  }>
  metadata?: {
    confidence: number
    sources?: string[]
    tokensUsed: number
  }
}

class ARIAAssistant {
  private conversations: Map<string, OpenRouterMessage[]> = new Map()

  /**
   * Main conversation interface
   */
  async chat(
    message: string,
    context: ARIAContext = {}
  ): Promise<ARIAResponse> {
    const conversationId = context.projectId || context.userId || 'default'
    
    try {
      // Get or initialize conversation history
      const history = this.getConversationHistory(conversationId)
      
      // Build system prompt based on context
      const systemPrompt = this.buildSystemPrompt(context)
      
      // Check for relevant knowledge from RAG
      const ragContext = await this.getRelevantContext(message, context)
      
      // Prepare messages
      const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10), // Include last 10 messages for context
      ]
      
      // Add RAG context if available
      if (ragContext) {
        messages.push({
          role: 'system',
          content: `Relevant information from knowledge base:\n${ragContext}`,
        })
      }
      
      // Add user message
      messages.push({ role: 'user', content: message })
      
      // Generate response
      const response = await openRouterClient.chat(messages, {
        model: AI_CONFIG.models.chat,
        temperature: 0.7,
        maxTokens: 2000,
      })
      
      const assistantMessage = response.choices[0]?.message?.content || ''
      
      // Update conversation history
      this.updateConversationHistory(conversationId, [
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage },
      ])
      
      // Parse response for structured data
      const parsed = this.parseAssistantResponse(assistantMessage)
      
      return {
        message: parsed.message,
        suggestions: parsed.suggestions,
        actions: parsed.actions,
        metadata: {
          confidence: parsed.confidence || 0.8,
          sources: ragContext ? ['knowledge base'] : undefined,
          tokensUsed: response.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('ARIA chat error:', error)
      throw error
    }
  }

  /**
   * Handle project-specific queries
   */
  async assistProject(
    projectId: string,
    query: string,
    projectData?: any
  ): Promise<ARIAResponse> {
    const context: ARIAContext = {
      projectId,
      projectData,
    }
    
    // Check cache for similar queries
    const cacheKey = cacheKeys.aiResponse(`project:${projectId}:${query}`)
    const cached = await cacheService.get<ARIAResponse>(cacheKey)
    if (cached) {
      return cached
    }
    
    const response = await this.chat(query, context)
    
    // Cache the response
    await cacheService.set(cacheKey, response, 1800) // 30 minutes
    
    return response
  }

  /**
   * Generate project timeline suggestions
   */
  async suggestTimeline(params: {
    projectType: string
    scope: string
    budget: number
    startDate: Date
  }): Promise<ARIAResponse> {
    const prompt = `Generate a detailed project timeline for:
- Project Type: ${params.projectType}
- Scope: ${params.scope}
- Budget: MYR ${params.budget}
- Start Date: ${params.startDate.toISOString()}

Consider Malaysian construction practices, weather patterns, and regulatory requirements.
Provide specific milestones, durations, and dependencies.`

    return this.chat(prompt, {
      preferences: { responseLength: 'comprehensive' },
    })
  }

  /**
   * Analyze project risks
   */
  async analyzeRisks(projectData: any): Promise<ARIAResponse> {
    const prompt = `Analyze potential risks for this project:
${JSON.stringify(projectData, null, 2)}

Identify:
1. High-priority risks
2. Mitigation strategies
3. Contingency plans
4. Early warning indicators

Focus on Malaysian-specific risks including weather, regulations, and market conditions.`

    return this.chat(prompt, {
      projectData,
      preferences: { responseLength: 'detailed' },
    })
  }

  /**
   * Generate task recommendations
   */
  async recommendTasks(params: {
    projectPhase: string
    completedTasks: string[]
    teamSize: number
    deadline: Date
  }): Promise<ARIAResponse> {
    const prompt = `Based on the current project phase "${params.projectPhase}" and ${params.completedTasks.length} completed tasks, 
recommend the next priority tasks for a team of ${params.teamSize} people to meet the deadline of ${params.deadline.toLocaleDateString()}.

Consider task dependencies, resource allocation, and critical path.`

    return this.chat(prompt)
  }

  /**
   * Answer compliance questions
   */
  async checkCompliance(query: string, projectType?: string): Promise<ARIAResponse> {
    const ragResponse = await ragService.queryCompliance({
      query,
      projectType,
      location: 'Malaysia',
    })
    
    return {
      message: ragResponse.answer,
      suggestions: ragResponse.sources.map(s => 
        `Reference: ${s.metadata.clause || s.metadata.source}`
      ),
      metadata: {
        confidence: 0.9,
        sources: ragResponse.sources.map(s => s.id),
        tokensUsed: ragResponse.tokens,
      },
    }
  }

  /**
   * Provide design suggestions
   */
  async suggestDesign(params: {
    style: string
    space: string
    budget: { min: number; max: number; currency: string }
    preferences: string[]
  }): Promise<ARIAResponse> {
    const ragResponse = await ragService.queryDesign({
      query: `Suggest design ideas for a ${params.style} style ${params.space}`,
      style: params.style,
      budget: params.budget,
      culturalConsiderations: params.preferences,
    })
    
    return {
      message: ragResponse.answer,
      suggestions: this.extractDesignSuggestions(ragResponse.answer),
      metadata: {
        confidence: 0.85,
        sources: ragResponse.sources.map(s => s.id),
        tokensUsed: ragResponse.tokens,
      },
    }
  }

  /**
   * Build system prompt based on context
   */
  private buildSystemPrompt(context: ARIAContext): string {
    const { role, preferences, projectData } = context
    
    let prompt = `You are ARIA, an intelligent Virtual Project Manager for Daritana Architecture Platform.
You specialize in Malaysian architecture and construction projects.

Core Responsibilities:
- Project planning and timeline management
- Risk assessment and mitigation
- Resource allocation and optimization
- Compliance guidance (UBBL and Malaysian regulations)
- Design recommendations
- Team coordination suggestions`

    if (role) {
      prompt += `\n\nUser Role: ${role}`
    }
    
    if (projectData) {
      prompt += `\n\nCurrent Project Context: ${projectData.name || 'Active Project'}`
    }
    
    if (preferences?.tone) {
      prompt += `\n\nCommunication Style: ${preferences.tone}`
    }
    
    if (preferences?.responseLength) {
      prompt += `\n\nResponse Length Preference: ${preferences.responseLength}`
    }
    
    prompt += `\n\nAlways:
- Be helpful and proactive
- Cite Malaysian regulations when relevant
- Consider local climate and cultural factors
- Provide actionable recommendations
- Flag potential risks or issues`
    
    return prompt
  }

  /**
   * Get relevant context from RAG
   */
  private async getRelevantContext(
    message: string,
    context: ARIAContext
  ): Promise<string | null> {
    try {
      const filter: Record<string, any> = {}
      
      if (context.projectId) {
        filter.projectId = context.projectId
      }
      
      const searchResults = await ragService.search(message, {
        topK: 3,
        filter,
      })
      
      if (searchResults.length === 0) {
        return null
      }
      
      return searchResults
        .map(r => r.content)
        .join('\n\n')
    } catch (error) {
      console.error('Failed to get RAG context:', error)
      return null
    }
  }

  /**
   * Parse assistant response for structured data
   */
  private parseAssistantResponse(response: string): {
    message: string
    suggestions?: string[]
    actions?: Array<{ type: string; data: any }>
    confidence?: number
  } {
    // Look for structured markers in response
    const suggestionMatch = response.match(/\[SUGGESTIONS\](.*?)\[\/SUGGESTIONS\]/s)
    const actionMatch = response.match(/\[ACTIONS\](.*?)\[\/ACTIONS\]/s)
    const confidenceMatch = response.match(/\[CONFIDENCE\](.*?)\[\/CONFIDENCE\]/s)
    
    let message = response
    const result: any = { message }
    
    if (suggestionMatch) {
      result.suggestions = suggestionMatch[1]
        .split('\n')
        .filter(s => s.trim())
        .map(s => s.replace(/^[-*]\s*/, ''))
      message = message.replace(suggestionMatch[0], '')
    }
    
    if (actionMatch) {
      try {
        result.actions = JSON.parse(actionMatch[1])
        message = message.replace(actionMatch[0], '')
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    if (confidenceMatch) {
      result.confidence = parseFloat(confidenceMatch[1])
      message = message.replace(confidenceMatch[0], '')
    }
    
    result.message = message.trim()
    return result
  }

  /**
   * Extract design suggestions from text
   */
  private extractDesignSuggestions(text: string): string[] {
    const suggestions: string[] = []
    
    // Look for bullet points or numbered lists
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
        suggestions.push(line.replace(/^[-*•\d.]\s+/, '').trim())
      }
    }
    
    return suggestions.slice(0, 5) // Return top 5 suggestions
  }

  /**
   * Get conversation history
   */
  private getConversationHistory(conversationId: string): OpenRouterMessage[] {
    return this.conversations.get(conversationId) || []
  }

  /**
   * Update conversation history
   */
  private updateConversationHistory(
    conversationId: string,
    messages: OpenRouterMessage[]
  ) {
    const history = this.getConversationHistory(conversationId)
    history.push(...messages)
    
    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
    
    this.conversations.set(conversationId, history)
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string) {
    this.conversations.delete(conversationId)
  }
  
  /**
   * Get all active conversations
   */
  getActiveConversations(): string[] {
    return Array.from(this.conversations.keys())
  }
}

// Export singleton instance
export const aria = new ARIAAssistant()

// Helper function for quick ARIA queries
export async function askARIA(question: string): Promise<string> {
  const response = await aria.chat(question)
  return response.message
}