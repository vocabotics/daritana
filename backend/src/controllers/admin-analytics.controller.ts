import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get comprehensive system analytics dashboard
 */
export const getSystemAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      overviewMetrics,
      growthMetrics,
      usageMetrics,
      revenueMetrics,
      performanceMetrics
    ] = await Promise.all([
      getOverviewMetrics(),
      getGrowthMetrics(startDate, days),
      getUsageMetrics(startDate),
      getRevenueMetrics(startDate, days),
      getPerformanceMetrics(startDate)
    ])

    res.json({
      overview: overviewMetrics,
      growth: growthMetrics,
      usage: usageMetrics,
      revenue: revenueMetrics,
      performance: performanceMetrics,
      timeframe,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get system analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch system analytics' })
  }
}

/**
 * Get user engagement analytics
 */
export const getUserEngagementAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      dailyActiveUsers,
      sessionMetrics,
      featureUsage,
      userRetention,
      topUsers
    ] = await Promise.all([
      getDailyActiveUsers(startDate, days),
      getSessionMetrics(startDate),
      getFeatureUsage(startDate),
      getUserRetention(days),
      getTopUsers(startDate)
    ])

    res.json({
      dailyActiveUsers,
      sessionMetrics,
      featureUsage,
      userRetention,
      topUsers,
      timeframe
    })
  } catch (error) {
    console.error('Get user engagement analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch user engagement analytics' })
  }
}

/**
 * Get organization analytics
 */
export const getOrganizationAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      organizationGrowth,
      subscriptionBreakdown,
      organizationSizes,
      churnAnalysis,
      topOrganizations
    ] = await Promise.all([
      getOrganizationGrowth(startDate, days),
      getSubscriptionBreakdown(),
      getOrganizationSizes(),
      getChurnAnalysis(startDate, days),
      getTopOrganizations(startDate)
    ])

    res.json({
      growth: organizationGrowth,
      subscriptions: subscriptionBreakdown,
      sizes: organizationSizes,
      churn: churnAnalysis,
      topOrganizations,
      timeframe
    })
  } catch (error) {
    console.error('Get organization analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch organization analytics' })
  }
}

/**
 * Get project analytics
 */
export const getProjectAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      projectMetrics,
      projectTypes,
      completionRates,
      budgetAnalysis,
      timelineAnalysis
    ] = await Promise.all([
      getProjectMetrics(startDate),
      getProjectTypes(),
      getCompletionRates(startDate, days),
      getBudgetAnalysis(),
      getTimelineAnalysis()
    ])

    res.json({
      metrics: projectMetrics,
      types: projectTypes,
      completion: completionRates,
      budget: budgetAnalysis,
      timeline: timelineAnalysis,
      timeframe
    })
  } catch (error) {
    console.error('Get project analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch project analytics' })
  }
}

/**
 * Get financial analytics
 */
export const getFinancialAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '12m' } = req.query
    const months = timeframe === '12m' ? 12 : timeframe === '6m' ? 6 : 3
    
    const [
      revenueMetrics,
      subscriptionRevenue,
      revenueBreakdown,
      growthMetrics,
      forecasting
    ] = await Promise.all([
      getRevenueMetrics(new Date(), months * 30),
      getSubscriptionRevenue(months),
      getRevenueBreakdown(months),
      getGrowthMetrics(new Date(), months * 30),
      getRevenueForecast(months)
    ])

    res.json({
      revenue: revenueMetrics,
      subscriptions: subscriptionRevenue,
      breakdown: revenueBreakdown,
      growth: growthMetrics,
      forecast: forecasting,
      timeframe
    })
  } catch (error) {
    console.error('Get financial analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch financial analytics' })
  }
}

/**
 * Get system performance analytics
 */
export const getPerformanceAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '24h' } = req.query
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
    
    const [
      responseTimeMetrics,
      errorRateMetrics,
      uptimeMetrics,
      throughputMetrics,
      resourceUsage
    ] = await Promise.all([
      getResponseTimeMetrics(hours),
      getErrorRateMetrics(hours),
      getUptimeMetrics(hours),
      getThroughputMetrics(hours),
      getResourceUsage()
    ])

    res.json({
      responseTime: responseTimeMetrics,
      errorRate: errorRateMetrics,
      uptime: uptimeMetrics,
      throughput: throughputMetrics,
      resources: resourceUsage,
      timeframe
    })
  } catch (error) {
    console.error('Get performance analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch performance analytics' })
  }
}

/**
 * Generate custom analytics report
 */
export const generateCustomReport = async (req: MultiTenantRequest, res: Response) => {
  try {
    const {
      reportType,
      metrics,
      timeframe,
      filters,
      groupBy,
      format = 'json'
    } = req.body

    if (!reportType || !metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ error: 'Report type and metrics are required' })
    }

    const days = getTimeframeDays(timeframe || '30d')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const reportData = await generateReportData(reportType, metrics, startDate, filters, groupBy)

    if (format === 'csv') {
      const csv = convertToCSV(reportData)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`)
      return res.send(csv)
    }

    // Log report generation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'GENERATE_CUSTOM_REPORT',
        resourceType: 'ANALYTICS_REPORT',
        details: {
          reportType,
          metrics,
          timeframe,
          filters,
          format
        }
      }
    })

    res.json({
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user!.name,
      data: reportData,
      metadata: {
        metrics,
        timeframe,
        filters,
        recordCount: Array.isArray(reportData) ? reportData.length : Object.keys(reportData).length
      }
    })
  } catch (error) {
    console.error('Generate custom report error:', error)
    res.status(500).json({ error: 'Failed to generate custom report' })
  }
}

// Helper functions

function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '1y': return 365
    default: return 30
  }
}

async function getOverviewMetrics() {
  const [
    totalUsers,
    totalOrganizations,
    totalProjects,
    totalRevenue,
    activeUsers,
    newUsersToday
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { deletedAt: null } }),
    // Mock revenue calculation
    Promise.resolve(125000),
    prisma.user.count({
      where: {
        isActive: true,
        lastLogin: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return {
    totalUsers,
    totalOrganizations,
    totalProjects,
    totalRevenue,
    activeUsers,
    newUsersToday,
    userGrowthRate: totalUsers > 0 ? (newUsersToday / totalUsers) * 100 : 0
  }
}

async function getGrowthMetrics(startDate: Date, days: number) {
  const growthData = await Promise.all(
    Array.from({ length: days }, async (_, i) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const [newUsers, newOrgs, newProjects] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.organization.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.project.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            },
            deletedAt: null
          }
        })
      ])

      return {
        date: date.toISOString().split('T')[0],
        users: newUsers,
        organizations: newOrgs,
        projects: newProjects
      }
    })
  )

  return growthData
}

async function getUsageMetrics(startDate: Date) {
  const [
    totalLogins,
    totalDocuments,
    totalTasks,
    storageUsed
  ] = await Promise.all([
    // Mock login count
    Promise.resolve(Math.floor(Math.random() * 10000) + 5000),
    prisma.document.count({
      where: {
        createdAt: { gte: startDate },
        deletedAt: null
      }
    }),
    prisma.task.count({
      where: {
        createdAt: { gte: startDate }
      }
    }),
    prisma.document.aggregate({
      where: { deletedAt: null },
      _sum: { size: true }
    })
  ])

  return {
    totalLogins,
    totalDocuments,
    totalTasks,
    storageUsedGB: Math.round(((storageUsed._sum.size || 0) / (1024 * 1024 * 1024)) * 100) / 100
  }
}

async function getRevenueMetrics(startDate: Date, days: number) {
  // Mock revenue data - in real implementation, calculate from subscriptions
  const monthlyRevenue = []
  const currentDate = new Date()
  
  for (let i = Math.floor(days / 30); i >= 0; i--) {
    const month = new Date(currentDate)
    month.setMonth(currentDate.getMonth() - i)
    
    monthlyRevenue.push({
      month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: Math.floor(Math.random() * 50000) + 75000,
      subscriptions: Math.floor(Math.random() * 100) + 150
    })
  }

  const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0)
  const averageMonthlyRevenue = totalRevenue / monthlyRevenue.length

  return {
    total: totalRevenue,
    average: averageMonthlyRevenue,
    monthly: monthlyRevenue
  }
}

async function getPerformanceMetrics(startDate: Date) {
  // Mock performance data
  return {
    averageResponseTime: Math.floor(Math.random() * 100) + 50,
    errorRate: Math.random() * 2,
    uptime: 99.5 + Math.random() * 0.5,
    throughput: Math.floor(Math.random() * 1000) + 2000
  }
}

async function getDailyActiveUsers(startDate: Date, days: number) {
  // Mock DAU data
  const dauData = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    dauData.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 500) + 200,
      newUsers: Math.floor(Math.random() * 50) + 10,
      returningUsers: Math.floor(Math.random() * 450) + 150
    })
  }
  return dauData
}

async function getSessionMetrics(startDate: Date) {
  return {
    averageSessionDuration: Math.floor(Math.random() * 1800) + 600, // seconds
    averagePageViews: Math.floor(Math.random() * 10) + 5,
    bounceRate: Math.random() * 30 + 10, // percentage
    totalSessions: Math.floor(Math.random() * 10000) + 5000
  }
}

async function getFeatureUsage(startDate: Date) {
  return [
    { feature: 'Dashboard', usage: Math.floor(Math.random() * 1000) + 500 },
    { feature: 'Projects', usage: Math.floor(Math.random() * 800) + 400 },
    { feature: 'Tasks', usage: Math.floor(Math.random() * 600) + 300 },
    { feature: 'Documents', usage: Math.floor(Math.random() * 400) + 200 },
    { feature: 'Analytics', usage: Math.floor(Math.random() * 200) + 100 }
  ]
}

async function getUserRetention(days: number) {
  return {
    day1: 85 + Math.random() * 10,
    day7: 65 + Math.random() * 15,
    day30: 45 + Math.random() * 20,
    day90: 30 + Math.random() * 15
  }
}

async function getTopUsers(startDate: Date) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      organizations: {
        include: {
          organization: {
            select: { name: true }
          }
        }
      }
    },
    take: 10,
    orderBy: { lastLogin: 'desc' }
  })

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    lastLogin: user.lastLogin,
    organizations: user.organizations.map(org => org.organization.name),
    sessionCount: Math.floor(Math.random() * 100) + 10
  }))
}

async function getOrganizationGrowth(startDate: Date, days: number) {
  const growthData = []
  for (let i = 0; i < days; i += 7) { // Weekly data
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + i)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const newOrgs = await prisma.organization.count({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    })

    growthData.push({
      week: weekStart.toISOString().split('T')[0],
      newOrganizations: newOrgs
    })
  }
  return growthData
}

async function getSubscriptionBreakdown() {
  const subscriptions = await prisma.subscriptionPlan.findMany({
    include: {
      organizations: {
        where: { status: 'ACTIVE' }
      }
    }
  })

  return subscriptions.map(plan => ({
    planName: plan.name,
    count: plan.organizations.length,
    revenue: plan.organizations.length * plan.price
  }))
}

async function getOrganizationSizes() {
  const orgs = await prisma.organization.findMany({
    include: {
      members: {
        where: { isActive: true }
      }
    }
  })

  const sizes = { small: 0, medium: 0, large: 0, enterprise: 0 }
  
  orgs.forEach(org => {
    const memberCount = org.members.length
    if (memberCount <= 5) sizes.small++
    else if (memberCount <= 20) sizes.medium++
    else if (memberCount <= 100) sizes.large++
    else sizes.enterprise++
  })

  return sizes
}

async function getChurnAnalysis(startDate: Date, days: number) {
  // Mock churn data
  return {
    churned: Math.floor(Math.random() * 10) + 2,
    retained: Math.floor(Math.random() * 200) + 150,
    churnRate: Math.random() * 5 + 1 // percentage
  }
}

async function getTopOrganizations(startDate: Date) {
  const organizations = await prisma.organization.findMany({
    where: { status: 'ACTIVE' },
    include: {
      members: {
        where: { isActive: true }
      },
      projects: {
        where: { deletedAt: null }
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  return organizations.map(org => ({
    id: org.id,
    name: org.name,
    memberCount: org.members.length,
    projectCount: org.projects.length,
    plan: org.planId,
    createdAt: org.createdAt
  }))
}

async function getProjectMetrics(startDate: Date) {
  const [total, active, completed, overdue] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({
      where: { status: 'IN_PROGRESS', deletedAt: null }
    }),
    prisma.project.count({
      where: { status: 'COMPLETED', deletedAt: null }
    }),
    prisma.project.count({
      where: {
        endDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
        deletedAt: null
      }
    })
  ])

  return { total, active, completed, overdue }
}

async function getProjectTypes() {
  // Mock project type data
  return [
    { type: 'Residential', count: 45, percentage: 35 },
    { type: 'Commercial', count: 32, percentage: 25 },
    { type: 'Interior Design', count: 28, percentage: 22 },
    { type: 'Renovation', count: 23, percentage: 18 }
  ]
}

async function getCompletionRates(startDate: Date, days: number) {
  const completed = await prisma.project.count({
    where: {
      status: 'COMPLETED',
      updatedAt: { gte: startDate },
      deletedAt: null
    }
  })

  const total = await prisma.project.count({
    where: {
      createdAt: { gte: startDate },
      deletedAt: null
    }
  })

  return {
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    onTimeRate: 85 + Math.random() * 10, // Mock on-time completion rate
    averageDuration: Math.floor(Math.random() * 100) + 60 // days
  }
}

async function getBudgetAnalysis() {
  // Mock budget analysis
  return {
    averageBudget: 150000,
    budgetVariance: 8.5, // percentage
    overBudgetProjects: 12,
    underBudgetProjects: 28
  }
}

async function getTimelineAnalysis() {
  // Mock timeline analysis
  return {
    averageDelay: 5.2, // days
    onTimeProjects: 78, // percentage
    delayedProjects: 15,
    aheadOfSchedule: 7
  }
}

async function getSubscriptionRevenue(months: number) {
  const revenueData = []
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    revenueData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: Math.floor(Math.random() * 50000) + 75000,
      newSubscriptions: Math.floor(Math.random() * 20) + 10,
      cancelledSubscriptions: Math.floor(Math.random() * 5) + 1
    })
  }
  
  return revenueData
}

async function getRevenueBreakdown(months: number) {
  return {
    basic: Math.floor(Math.random() * 30000) + 20000,
    professional: Math.floor(Math.random() * 50000) + 40000,
    enterprise: Math.floor(Math.random() * 80000) + 60000
  }
}

async function getRevenueForecast(months: number) {
  const forecast = []
  
  for (let i = 1; i <= 6; i++) { // 6 months forecast
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    
    forecast.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      predictedRevenue: Math.floor(Math.random() * 60000) + 80000,
      confidence: 75 + Math.random() * 20 // percentage
    })
  }
  
  return forecast
}

// Performance metrics helpers
async function getResponseTimeMetrics(hours: number) {
  const data = []
  for (let i = 0; i < hours; i++) {
    data.push({
      hour: i,
      averageResponseTime: Math.floor(Math.random() * 100) + 50,
      p95ResponseTime: Math.floor(Math.random() * 200) + 100
    })
  }
  return data
}

async function getErrorRateMetrics(hours: number) {
  const data = []
  for (let i = 0; i < hours; i++) {
    data.push({
      hour: i,
      errorRate: Math.random() * 2,
      errorCount: Math.floor(Math.random() * 10)
    })
  }
  return data
}

async function getUptimeMetrics(hours: number) {
  return {
    uptime: 99.5 + Math.random() * 0.5,
    downtimeMinutes: Math.floor(Math.random() * 30),
    incidents: Math.floor(Math.random() * 3)
  }
}

async function getThroughputMetrics(hours: number) {
  const data = []
  for (let i = 0; i < hours; i++) {
    data.push({
      hour: i,
      requestsPerSecond: Math.floor(Math.random() * 100) + 50,
      totalRequests: Math.floor(Math.random() * 10000) + 5000
    })
  }
  return data
}

async function getResourceUsage() {
  return {
    cpu: Math.floor(Math.random() * 40) + 30, // percentage
    memory: Math.floor(Math.random() * 50) + 40,
    disk: Math.floor(Math.random() * 30) + 20,
    network: Math.floor(Math.random() * 60) + 30
  }
}

async function generateReportData(reportType: string, metrics: string[], startDate: Date, filters: any, groupBy: string) {
  // Mock report generation
  const data: any = {}
  
  for (const metric of metrics) {
    switch (metric) {
      case 'users':
        data.users = await prisma.user.count({ where: { isActive: true } })
        break
      case 'organizations':
        data.organizations = await prisma.organization.count()
        break
      case 'projects':
        data.projects = await prisma.project.count({ where: { deletedAt: null } })
        break
      case 'revenue':
        data.revenue = Math.floor(Math.random() * 100000) + 50000
        break
      default:
        data[metric] = Math.floor(Math.random() * 1000)
    }
  }
  
  return data
}

function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n')
    
    return csvContent
  }
  
  // For object data
  const entries = Object.entries(data)
  return entries.map(([key, value]) => `${key},${value}`).join('\n')
}