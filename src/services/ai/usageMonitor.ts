/**
 * AI Usage Monitoring and Cost Tracking System
 * Tracks API usage, costs, and provides analytics
 */

import { MODEL_PRICING, AI_CONFIG } from './config'
import { cacheService } from './cacheService'

export interface UsageRecord {
  id: string
  timestamp: Date
  model: string
  operation: 'chat' | 'embedding' | 'image' | 'analysis'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  userId?: string
  projectId?: string
  success: boolean
  cached: boolean
  latency: number // milliseconds
}

export interface UsageStats {
  period: 'hour' | 'day' | 'week' | 'month'
  startDate: Date
  endDate: Date
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  cacheHitRate: number
  modelBreakdown: Record<string, {
    requests: number
    tokens: number
    cost: number
  }>
  topUsers: Array<{
    userId: string
    requests: number
    cost: number
  }>
  topProjects: Array<{
    projectId: string
    requests: number
    cost: number
  }>
}

export interface CostAlert {
  id: string
  type: 'budget_exceeded' | 'unusual_spike' | 'rate_limit_approaching'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
  metadata: Record<string, any>
}

class UsageMonitor {
  private usageRecords: UsageRecord[] = []
  private alerts: CostAlert[] = []
  private currentMonthCost: number = 0
  private lastResetDate: Date = new Date()

  constructor() {
    this.initializeMonthlyReset()
  }

  /**
   * Initialize monthly cost reset
   */
  private initializeMonthlyReset() {
    const now = new Date()
    const dayOfMonth = now.getDate()
    
    // Reset on the 1st of each month
    if (dayOfMonth === 1 && this.lastResetDate.getMonth() !== now.getMonth()) {
      this.resetMonthlyUsage()
    }
  }

  /**
   * Record API usage
   */
  async recordUsage(params: {
    model: string
    operation: UsageRecord['operation']
    inputTokens: number
    outputTokens: number
    userId?: string
    projectId?: string
    success: boolean
    cached: boolean
    latency: number
  }): Promise<void> {
    const { model, operation, inputTokens, outputTokens, userId, projectId, success, cached, latency } = params

    // Calculate cost
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || { input: 0, output: 0 }
    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output

    // Create usage record
    const record: UsageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      model,
      operation,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      userId,
      projectId,
      success,
      cached,
      latency,
    }

    // Store record
    this.usageRecords.push(record)
    this.currentMonthCost += cost

    // Store in cache for persistence
    await this.persistRecord(record)

    // Check for alerts
    await this.checkAlerts(record)

    // Clean old records (keep last 10000)
    if (this.usageRecords.length > 10000) {
      this.usageRecords = this.usageRecords.slice(-10000)
    }
  }

  /**
   * Get usage statistics
   */
  async getStats(period: UsageStats['period'] = 'day'): Promise<UsageStats> {
    const now = new Date()
    const startDate = this.getStartDate(now, period)
    
    // Filter records for the period
    const periodRecords = this.usageRecords.filter(r => 
      r.timestamp >= startDate && r.timestamp <= now
    )

    // Calculate statistics
    const totalRequests = periodRecords.length
    const totalTokens = periodRecords.reduce((sum, r) => sum + r.totalTokens, 0)
    const totalCost = periodRecords.reduce((sum, r) => sum + r.cost, 0)
    const averageLatency = periodRecords.length > 0
      ? periodRecords.reduce((sum, r) => sum + r.latency, 0) / periodRecords.length
      : 0
    const cachedRequests = periodRecords.filter(r => r.cached).length
    const cacheHitRate = totalRequests > 0 ? cachedRequests / totalRequests : 0

    // Model breakdown
    const modelBreakdown: Record<string, any> = {}
    for (const record of periodRecords) {
      if (!modelBreakdown[record.model]) {
        modelBreakdown[record.model] = { requests: 0, tokens: 0, cost: 0 }
      }
      modelBreakdown[record.model].requests++
      modelBreakdown[record.model].tokens += record.totalTokens
      modelBreakdown[record.model].cost += record.cost
    }

    // Top users
    const userCosts: Record<string, { requests: number; cost: number }> = {}
    for (const record of periodRecords) {
      if (record.userId) {
        if (!userCosts[record.userId]) {
          userCosts[record.userId] = { requests: 0, cost: 0 }
        }
        userCosts[record.userId].requests++
        userCosts[record.userId].cost += record.cost
      }
    }
    const topUsers = Object.entries(userCosts)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    // Top projects
    const projectCosts: Record<string, { requests: number; cost: number }> = {}
    for (const record of periodRecords) {
      if (record.projectId) {
        if (!projectCosts[record.projectId]) {
          projectCosts[record.projectId] = { requests: 0, cost: 0 }
        }
        projectCosts[record.projectId].requests++
        projectCosts[record.projectId].cost += record.cost
      }
    }
    const topProjects = Object.entries(projectCosts)
      .map(([projectId, data]) => ({ projectId, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    return {
      period,
      startDate,
      endDate: now,
      totalRequests,
      totalTokens,
      totalCost,
      averageLatency,
      cacheHitRate,
      modelBreakdown,
      topUsers,
      topProjects,
    }
  }

  /**
   * Get current month's cost
   */
  getCurrentMonthCost(): number {
    return this.currentMonthCost
  }

  /**
   * Get budget status
   */
  getBudgetStatus(): {
    used: number
    limit: number
    percentage: number
    remaining: number
    daysInMonth: number
    projectedMonthly: number
    status: 'ok' | 'warning' | 'critical'
  } {
    const limit = AI_CONFIG.costTracking.monthlyBudgetUSD
    const used = this.currentMonthCost
    const percentage = (used / limit) * 100
    const remaining = limit - used

    // Calculate projected monthly cost
    const now = new Date()
    const dayOfMonth = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const projectedMonthly = (used / dayOfMonth) * daysInMonth

    // Determine status
    let status: 'ok' | 'warning' | 'critical' = 'ok'
    if (percentage >= 100) {
      status = 'critical'
    } else if (percentage >= AI_CONFIG.costTracking.alertThresholdPercent) {
      status = 'warning'
    }

    return {
      used,
      limit,
      percentage,
      remaining,
      daysInMonth,
      projectedMonthly,
      status,
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10): CostAlert[] {
    return this.alerts.slice(-limit)
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(daysToKeep = 7): void {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysToKeep)
    
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff)
  }

  /**
   * Check for alerts based on usage
   */
  private async checkAlerts(record: UsageRecord): Promise<void> {
    const budgetStatus = this.getBudgetStatus()

    // Check budget threshold
    if (budgetStatus.percentage >= AI_CONFIG.costTracking.alertThresholdPercent) {
      const severity = budgetStatus.percentage >= 100 ? 'critical' : 'warning'
      
      // Only create alert if we don't have a recent one
      const recentAlert = this.alerts.find(a => 
        a.type === 'budget_exceeded' &&
        a.timestamp > new Date(Date.now() - 3600000) // 1 hour
      )

      if (!recentAlert) {
        this.alerts.push({
          id: `alert_${Date.now()}`,
          type: 'budget_exceeded',
          severity,
          message: `Monthly AI budget ${severity === 'critical' ? 'exceeded' : 'approaching limit'}: $${budgetStatus.used.toFixed(2)} of $${budgetStatus.limit} (${budgetStatus.percentage.toFixed(1)}%)`,
          timestamp: new Date(),
          metadata: {
            used: budgetStatus.used,
            limit: budgetStatus.limit,
            percentage: budgetStatus.percentage,
          },
        })
      }
    }

    // Check for unusual spikes
    await this.checkForSpikes()
  }

  /**
   * Check for unusual usage spikes
   */
  private async checkForSpikes(): Promise<void> {
    // Get last hour's usage
    const oneHourAgo = new Date(Date.now() - 3600000)
    const recentRecords = this.usageRecords.filter(r => r.timestamp > oneHourAgo)
    
    if (recentRecords.length < 10) return // Not enough data

    const recentCost = recentRecords.reduce((sum, r) => sum + r.cost, 0)
    const recentTokens = recentRecords.reduce((sum, r) => sum + r.totalTokens, 0)

    // Get average from previous period
    const twoHoursAgo = new Date(Date.now() - 7200000)
    const previousRecords = this.usageRecords.filter(r => 
      r.timestamp > twoHoursAgo && r.timestamp <= oneHourAgo
    )

    if (previousRecords.length === 0) return

    const previousCost = previousRecords.reduce((sum, r) => sum + r.cost, 0)
    
    // Check if current cost is 3x previous
    if (recentCost > previousCost * 3) {
      this.alerts.push({
        id: `alert_${Date.now()}`,
        type: 'unusual_spike',
        severity: 'warning',
        message: `Unusual spike in AI usage detected: $${recentCost.toFixed(2)} in last hour (${recentTokens} tokens)`,
        timestamp: new Date(),
        metadata: {
          recentCost,
          previousCost,
          recentTokens,
          spikeRatio: recentCost / previousCost,
        },
      })
    }
  }

  /**
   * Get start date for period
   */
  private getStartDate(now: Date, period: UsageStats['period']): Date {
    const startDate = new Date(now)
    
    switch (period) {
      case 'hour':
        startDate.setHours(startDate.getHours() - 1)
        break
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }
    
    return startDate
  }

  /**
   * Persist usage record to cache
   */
  private async persistRecord(record: UsageRecord): Promise<void> {
    const key = `usage:${record.timestamp.toISOString().split('T')[0]}`
    const existing = await cacheService.get<UsageRecord[]>(key) || []
    existing.push(record)
    await cacheService.set(key, existing, 86400 * 30) // Keep for 30 days
  }

  /**
   * Load historical usage data
   */
  async loadHistoricalData(days = 30): Promise<void> {
    const records: UsageRecord[] = []
    const now = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = `usage:${date.toISOString().split('T')[0]}`
      
      const dayRecords = await cacheService.get<UsageRecord[]>(key)
      if (dayRecords) {
        records.push(...dayRecords)
      }
    }
    
    // Merge with current records
    this.usageRecords = [...records, ...this.usageRecords]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10000) // Keep last 10000
    
    // Recalculate current month cost
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    this.currentMonthCost = this.usageRecords
      .filter(r => {
        const recordDate = new Date(r.timestamp)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      })
      .reduce((sum, r) => sum + r.cost, 0)
  }

  /**
   * Reset monthly usage
   */
  private resetMonthlyUsage(): void {
    this.currentMonthCost = 0
    this.lastResetDate = new Date()
    
    // Archive old records
    const archiveKey = `usage:archive:${this.lastResetDate.toISOString().substring(0, 7)}`
    cacheService.set(archiveKey, this.usageRecords, 86400 * 365) // Keep for 1 year
    
    // Clear current records older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    this.usageRecords = this.usageRecords.filter(r => r.timestamp > thirtyDaysAgo)
  }

  /**
   * Export usage data as CSV
   */
  exportToCSV(startDate?: Date, endDate?: Date): string {
    const records = this.usageRecords.filter(r => {
      if (startDate && r.timestamp < startDate) return false
      if (endDate && r.timestamp > endDate) return false
      return true
    })

    const headers = ['Timestamp', 'Model', 'Operation', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)', 'User ID', 'Project ID', 'Success', 'Cached', 'Latency (ms)']
    const rows = records.map(r => [
      r.timestamp.toISOString(),
      r.model,
      r.operation,
      r.inputTokens,
      r.outputTokens,
      r.totalTokens,
      r.cost.toFixed(4),
      r.userId || '',
      r.projectId || '',
      r.success,
      r.cached,
      r.latency,
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// Export singleton instance
export const usageMonitor = new UsageMonitor()

// Helper function to track usage
export async function trackAIUsage(
  model: string,
  operation: UsageRecord['operation'],
  tokens: { input: number; output: number },
  options: {
    userId?: string
    projectId?: string
    success?: boolean
    cached?: boolean
    startTime?: number
  } = {}
): Promise<void> {
  const latency = options.startTime ? Date.now() - options.startTime : 0
  
  await usageMonitor.recordUsage({
    model,
    operation,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    userId: options.userId,
    projectId: options.projectId,
    success: options.success ?? true,
    cached: options.cached ?? false,
    latency,
  })
}