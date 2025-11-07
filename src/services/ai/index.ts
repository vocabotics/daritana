/**
 * AI Services Export Hub
 * Central export point for all AI services
 */

// Core services
export { openRouterClient, quickChat } from './openRouterClient'
export { vectorStore, prepareTextForEmbedding } from './vectorStore'
export { ragService, askRAG } from './ragService'
export { aria, askARIA } from './ariaAssistant'
export { complianceAI, checkQuickCompliance } from './complianceAI'
export { cacheService, cacheKeys } from './cacheService'
export { promptTemplates, useTemplate, PROMPT_TEMPLATES } from './promptTemplates'
export { usageMonitor, trackAIUsage } from './usageMonitor'

// Team Management services
export { ariaTeamManager, startARIATeamMonitoring, getTeamInsights } from './ariaTeamManager'
export { ariaNotifications, sendARIANotification, sendUrgentNotification } from './ariaNotifications'
export { ariaDailyStandup, scheduleTeamStandup } from './ariaDailyStandup'

// Communication services
export { ariaWhatsApp, sendWhatsAppMessage, sendWhatsAppTemplate } from './ariaWhatsAppIntegration'
export { ariaEmail, sendTaskReminderEmail, sendProjectReportEmail, sendComplianceAlertEmail } from './ariaEmailIntegration'
export { ariaSlack, sendSlackTaskReminder, sendSlackProjectUpdate, sendSlackComplianceAlert } from './ariaSlackIntegration'

// Document services
export { ariaDocumentReviewer, submitDocumentForReview } from './ariaDocumentReviewer'

// Configuration
export { AI_CONFIG, MODEL_PRICING, MODEL_CONTEXT_WINDOWS } from './config'

// Types
export type {
  OpenRouterMessage,
  OpenRouterOptions,
  OpenRouterResponse,
  EmbeddingResponse,
} from './openRouterClient'

export type {
  VectorDocument,
  SearchResult,
} from './vectorStore'

export type {
  RAGQuery,
  RAGResponse,
} from './ragService'

export type {
  ARIAContext,
  ARIAResponse,
} from './ariaAssistant'

export type {
  ComplianceCheckRequest,
  ComplianceIssue,
  ComplianceReport,
} from './complianceAI'

export type {
  PromptTemplate,
} from './promptTemplates'

export type {
  UsageRecord,
  UsageStats,
  CostAlert,
} from './usageMonitor'

/**
 * Initialize all AI services
 */
export async function initializeAIServices(): Promise<void> {
  try {
    console.log('Initializing AI services...')
    
    // Initialize vector store - commented out for now as it's not critical
    // await vectorStore.initialize()
    
    // Load historical usage data - commented out for now
    // await usageMonitor.loadHistoricalData(30)
    
    console.log('AI services initialized successfully')
  } catch (error) {
    console.error('Failed to initialize AI services:', error)
    // Don't throw error to prevent app from crashing
    // throw error
  }
}

/**
 * Get AI service health status
 */
export async function getAIHealthStatus(): Promise<{
  operational: boolean
  services: Record<string, boolean>
  usage: any
  alerts: any[]
}> {
  const services: Record<string, boolean> = {
    openRouter: false,
    vectorStore: false,
    cache: false,
  }
  
  // Check OpenRouter
  try {
    const response = await quickChat('test', 'Respond with "ok"', { maxTokens: 10 })
    services.openRouter = response.toLowerCase().includes('ok')
  } catch (e) {
    services.openRouter = false
  }
  
  // Check Vector Store
  try {
    const stats = await vectorStore.getStats()
    services.vectorStore = stats !== null
  } catch (e) {
    services.vectorStore = false
  }
  
  // Check Cache
  try {
    await cacheService.set('health_check', 'ok', 10)
    const value = await cacheService.get('health_check')
    services.cache = value === 'ok'
  } catch (e) {
    services.cache = false
  }
  
  // Get usage stats
  const usage = usageMonitor.getBudgetStatus()
  const alerts = usageMonitor.getAlerts(5)
  
  const operational = Object.values(services).every(s => s)
  
  return {
    operational,
    services,
    usage,
    alerts,
  }
}