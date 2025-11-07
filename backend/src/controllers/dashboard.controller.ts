import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

// Dashboard widget configuration model
interface WidgetConfig {
  id: string
  type: string
  title: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  settings: Record<string, any>
  isVisible: boolean
}

/**
 * Get user's dashboard configuration
 */
export const getDashboardConfig = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const userId = req.user?.id

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organization context and user required' })
    }

    // Check if dashboard config exists
    let config = await prisma.userDashboard.findFirst({
      where: {
        userId,
        organizationId
      }
    })

    // Create default config if none exists
    if (!config) {
      const defaultWidgets = getDefaultWidgets(req.user?.organizationRole || 'MEMBER')
      
      config = await prisma.userDashboard.create({
        data: {
          userId,
          organizationId,
          layout: 'grid',
          widgets: defaultWidgets
        }
      })
    }

    res.json(config)
  } catch (error) {
    console.error('Get dashboard config error:', error)
    res.status(500).json({ error: 'Failed to get dashboard configuration' })
  }
}

/**
 * Update dashboard configuration
 */
export const updateDashboardConfig = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const userId = req.user?.id
    const { layout, widgets } = req.body

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organization context and user required' })
    }

    // Validate widgets structure
    if (widgets && !Array.isArray(widgets)) {
      return res.status(400).json({ error: 'Widgets must be an array' })
    }

    const updateData: any = {}
    if (layout) updateData.layout = layout
    if (widgets) updateData.widgets = widgets

    const config = await prisma.userDashboard.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      update: updateData,
      create: {
        userId,
        organizationId,
        layout: layout || 'grid',
        widgets: widgets || getDefaultWidgets(req.user?.organizationRole || 'MEMBER')
      }
    })

    res.json(config)
  } catch (error) {
    console.error('Update dashboard config error:', error)
    res.status(500).json({ error: 'Failed to update dashboard configuration' })
  }
}

/**
 * Get dashboard data for widgets
 */
export const getDashboardData = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const userId = req.user?.id

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organization context and user required' })
    }

    // Get user's dashboard config to know which widgets to load
    const dashboardConfig = await prisma.userDashboard.findFirst({
      where: {
        userId,
        organizationId
      }
    })

    if (!dashboardConfig) {
      return res.status(404).json({ error: 'Dashboard configuration not found' })
    }

    const widgets = dashboardConfig.widgets as WidgetConfig[]
    const widgetData: Record<string, any> = {}

    // Load data for each widget
    for (const widget of widgets) {
      if (!widget.isVisible) continue

      try {
        widgetData[widget.id] = await getWidgetData(widget.type, {
          organizationId,
          userId,
          userRole: req.user?.organizationRole || 'MEMBER',
          settings: widget.settings
        })
      } catch (error) {
        console.error(`Error loading widget ${widget.id}:`, error)
        widgetData[widget.id] = { error: 'Failed to load widget data' }
      }
    }

    res.json({
      config: dashboardConfig,
      data: widgetData
    })
  } catch (error) {
    console.error('Get dashboard data error:', error)
    res.status(500).json({ error: 'Failed to get dashboard data' })
  }
}

/**
 * Get data for specific widget
 */
export const getWidgetData = async (
  widgetType: string,
  context: {
    organizationId: string
    userId: string
    userRole: string
    settings?: Record<string, any>
  }
): Promise<any> => {
  const { organizationId, userId, userRole, settings = {} } = context

  switch (widgetType) {
    case 'project_overview':
      return await getProjectOverviewData(organizationId, userId, userRole)
    
    case 'task_summary':
      return await getTaskSummaryData(organizationId, userId, userRole)
    
    case 'recent_activity':
      return await getRecentActivityData(organizationId, userId, settings.limit || 10)
    
    case 'team_members':
      return await getTeamMembersData(organizationId, userId, userRole)
    
    case 'storage_usage':
      return await getStorageUsageData(organizationId)
    
    case 'notifications':
      return await getNotificationsData(organizationId, userId, settings.limit || 5)
    
    case 'calendar':
      return await getCalendarData(organizationId, userId, settings.days || 7)
    
    case 'quick_stats':
      return await getQuickStatsData(organizationId, userId, userRole)
    
    case 'budget_overview':
      return await getBudgetOverviewData(organizationId, userId, userRole)
    
    case 'project_progress':
      return await getProjectProgressData(organizationId, userId, userRole)
    
    default:
      throw new Error(`Unknown widget type: ${widgetType}`)
  }
}

/**
 * Widget data functions
 */
async function getProjectOverviewData(organizationId: string, userId: string, userRole: string) {
  const where: any = { organizationId, deletedAt: null }
  
  // Regular users only see projects they're members of
  if (userRole !== 'ORG_ADMIN' && userRole !== 'PROJECT_LEAD') {
    where.members = {
      some: { userId }
    }
  }

  const [projects, statusStats] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.project.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ])

  return {
    projects,
    statistics: statusStats.map(stat => ({
      status: stat.status,
      count: stat._count
    }))
  }
}

async function getTaskSummaryData(organizationId: string, userId: string, userRole: string) {
  const where: any = { organizationId }
  
  // Regular users only see their assigned tasks or tasks in their projects
  if (userRole !== 'ORG_ADMIN' && userRole !== 'PROJECT_LEAD') {
    where.OR = [
      { assignedToId: userId },
      {
        project: {
          members: {
            some: { userId }
          }
        }
      }
    ]
  }

  const [myTasks, overdueTasks, statusStats] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...where,
        assignedToId: userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5,
      orderBy: { dueDate: 'asc' }
    }),
    prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    }),
    prisma.task.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ])

  return {
    myTasks,
    overdueTasks,
    statistics: statusStats.map(stat => ({
      status: stat.status,
      count: stat._count
    }))
  }
}

async function getRecentActivityData(organizationId: string, userId: string, limit: number) {
  return await prisma.auditLog.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

async function getTeamMembersData(organizationId: string, userId: string, userRole: string) {
  const [members, recentJoins] = await Promise.all([
    prisma.organizationMember.count({
      where: { organizationId, isActive: true }
    }),
    prisma.organizationMember.findMany({
      where: { organizationId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            lastLogin: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
      take: 5
    })
  ])

  return {
    totalMembers: members,
    recentJoins
  }
}

async function getStorageUsageData(organizationId: string) {
  const [totalSize, fileCount, org] = await Promise.all([
    prisma.document.aggregate({
      where: { organizationId, deletedAt: null },
      _sum: { size: true }
    }),
    prisma.document.count({
      where: { organizationId, deletedAt: null }
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxStorage: true, usedStorage: true }
    })
  ])

  const usedBytes = totalSize._sum.size || 0
  const usedMB = Math.ceil(usedBytes / (1024 * 1024))
  const maxMB = org?.maxStorage || 0

  return {
    used: usedMB,
    total: maxMB,
    percentage: maxMB > 0 ? (usedMB / maxMB) * 100 : 0,
    fileCount
  }
}

async function getNotificationsData(organizationId: string, userId: string, limit: number) {
  return await prisma.notification.findMany({
    where: {
      recipientId: userId,
      organizationId
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

async function getCalendarData(organizationId: string, userId: string, days: number) {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  return await prisma.meeting.findMany({
    where: {
      organizationId,
      startTime: {
        gte: new Date(),
        lte: endDate
      },
      participants: {
        some: { userId }
      }
    },
    include: {
      organizer: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { startTime: 'asc' }
  })
}

async function getQuickStatsData(organizationId: string, userId: string, userRole: string) {
  const [projectCount, taskCount, memberCount, documentCount] = await Promise.all([
    prisma.project.count({
      where: { organizationId, deletedAt: null }
    }),
    prisma.task.count({
      where: { organizationId }
    }),
    prisma.organizationMember.count({
      where: { organizationId, isActive: true }
    }),
    prisma.document.count({
      where: { organizationId, deletedAt: null }
    })
  ])

  return {
    projects: projectCount,
    tasks: taskCount,
    members: memberCount,
    documents: documentCount
  }
}

async function getBudgetOverviewData(organizationId: string, userId: string, userRole: string) {
  if (userRole !== 'ORG_ADMIN' && userRole !== 'PROJECT_LEAD') {
    return { error: 'Insufficient permissions to view budget data' }
  }

  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      estimatedBudget: true,
      approvedBudget: true,
      actualCost: true
    }
  })

  const totals = projects.reduce((acc, project) => ({
    estimated: acc.estimated + (project.estimatedBudget || 0),
    approved: acc.approved + (project.approvedBudget || 0),
    actual: acc.actual + (project.actualCost || 0)
  }), { estimated: 0, approved: 0, actual: 0 })

  return {
    totals,
    projects: projects.slice(0, 5)
  }
}

async function getProjectProgressData(organizationId: string, userId: string, userRole: string) {
  const where: any = { organizationId, deletedAt: null }
  
  if (userRole !== 'ORG_ADMIN' && userRole !== 'PROJECT_LEAD') {
    where.members = {
      some: { userId }
    }
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      progress: true,
      status: true,
      startDate: true,
      endDate: true
    },
    take: 10,
    orderBy: { updatedAt: 'desc' }
  })

  return { projects }
}

/**
 * Get default widgets based on user role
 */
function getDefaultWidgets(role: string): WidgetConfig[] {
  const baseWidgets: WidgetConfig[] = [
    {
      id: 'quick_stats',
      type: 'quick_stats',
      title: 'Quick Statistics',
      position: { x: 0, y: 0, w: 6, h: 2 },
      settings: {},
      isVisible: true
    },
    {
      id: 'task_summary',
      type: 'task_summary',
      title: 'My Tasks',
      position: { x: 6, y: 0, w: 6, h: 4 },
      settings: {},
      isVisible: true
    },
    {
      id: 'recent_activity',
      type: 'recent_activity',
      title: 'Recent Activity',
      position: { x: 0, y: 2, w: 6, h: 4 },
      settings: { limit: 10 },
      isVisible: true
    },
    {
      id: 'project_overview',
      type: 'project_overview',
      title: 'Project Overview',
      position: { x: 0, y: 6, w: 12, h: 3 },
      settings: {},
      isVisible: true
    }
  ]

  if (role === 'ORG_ADMIN' || role === 'PROJECT_LEAD') {
    baseWidgets.push(
      {
        id: 'budget_overview',
        type: 'budget_overview',
        title: 'Budget Overview',
        position: { x: 0, y: 9, w: 6, h: 3 },
        settings: {},
        isVisible: true
      },
      {
        id: 'team_members',
        type: 'team_members',
        title: 'Team Members',
        position: { x: 6, y: 9, w: 6, h: 3 },
        settings: {},
        isVisible: true
      }
    )
  }

  return baseWidgets
}

/**
 * Get dashboard templates
 */
export const getDashboardTemplates = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId, userRole } = req

    // Mock templates for now - this would come from database
    const templates = [
      {
        id: 'default',
        name: 'Default Dashboard',
        description: 'Standard dashboard layout',
        type: 'predefined',
        isPublic: true,
        widgets: getDefaultWidgets(userRole)
      },
      {
        id: 'minimal',
        name: 'Minimal Dashboard',
        description: 'Clean, minimal layout',
        type: 'predefined',
        isPublic: true,
        widgets: [
          {
            id: 'quick_stats',
            type: 'quick_stats',
            title: 'Quick Stats',
            position: { x: 0, y: 0, w: 12, h: 2 },
            settings: {},
            isVisible: true
          },
          {
            id: 'recent_activity',
            type: 'recent_activity',
            title: 'Recent Activity',
            position: { x: 0, y: 2, w: 12, h: 4 },
            settings: { limit: 5 },
            isVisible: true
          }
        ]
      }
    ]

    res.json({ templates })
  } catch (error: any) {
    console.error('Get dashboard templates error:', error)
    res.status(500).json({ error: 'Failed to get dashboard templates' })
  }
}

/**
 * Save custom dashboard template
 */
export const saveDashboardTemplate = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const { name, description, widgets, isPublic = false } = req.body

    // In a real implementation, this would save to database
    const template = {
      id: `template_${Date.now()}`,
      name,
      description,
      type: 'custom',
      isPublic,
      widgets,
      createdBy: userId,
      createdAt: new Date(),
      organizationId: isPublic ? null : organizationId
    }

    res.json({ 
      success: true, 
      template,
      message: 'Dashboard template saved successfully' 
    })
  } catch (error: any) {
    console.error('Save dashboard template error:', error)
    res.status(500).json({ error: 'Failed to save dashboard template' })
  }
}

/**
 * Apply dashboard template
 */
export const applyDashboardTemplate = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const { templateId, templateType } = req.body

    // Get template widgets (this would come from database)
    let widgets
    if (templateType === 'predefined') {
      if (templateId === 'default') {
        widgets = getDefaultWidgets(req.userRole)
      } else if (templateId === 'minimal') {
        widgets = [
          {
            id: 'quick_stats',
            type: 'quick_stats',
            title: 'Quick Stats',
            position: { x: 0, y: 0, w: 12, h: 2 },
            settings: {},
            isVisible: true
          },
          {
            id: 'recent_activity',
            type: 'recent_activity',
            title: 'Recent Activity',
            position: { x: 0, y: 2, w: 12, h: 4 },
            settings: { limit: 5 },
            isVisible: true
          }
        ]
      }
    }

    if (!widgets) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Update user's dashboard configuration
    // In a real implementation, this would update the database
    const updatedConfig = {
      organizationId,
      userId,
      widgets,
      updatedAt: new Date()
    }

    res.json({ 
      success: true, 
      config: updatedConfig,
      message: 'Dashboard template applied successfully' 
    })
  } catch (error: any) {
    console.error('Apply dashboard template error:', error)
    res.status(500).json({ error: 'Failed to apply dashboard template' })
  }
}

/**
 * Get widget analytics
 */
export const getWidgetAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const { widgetId } = req.params

    // Mock analytics data - this would come from database
    const analytics = {
      widgetId,
      views: Math.floor(Math.random() * 1000),
      interactions: Math.floor(Math.random() * 100),
      avgTimeSpent: Math.floor(Math.random() * 300), // seconds
      lastAccessed: new Date(),
      popularActions: [
        { action: 'view_details', count: 45 },
        { action: 'refresh_data', count: 23 },
        { action: 'filter_data', count: 12 }
      ]
    }

    res.json({ analytics })
  } catch (error: any) {
    console.error('Get widget analytics error:', error)
    res.status(500).json({ error: 'Failed to get widget analytics' })
  }
}

/**
 * Export dashboard configuration
 */
export const exportDashboardConfig = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId } = req

    // Get current dashboard configuration
    const config = {
      version: '1.0',
      exported: new Date(),
      organizationId,
      userId,
      widgets: getDefaultWidgets(req.userRole), // This would come from database
      settings: {
        theme: 'light',
        refreshInterval: 300000, // 5 minutes
        autoSave: true
      }
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-config-${userId}.json`)
    res.json(config)
  } catch (error: any) {
    console.error('Export dashboard config error:', error)
    res.status(500).json({ error: 'Failed to export dashboard configuration' })
  }
}

/**
 * Import dashboard configuration
 */
export const importDashboardConfig = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const { config } = req.body

    if (!config || !config.widgets) {
      return res.status(400).json({ error: 'Invalid configuration format' })
    }

    // Validate and sanitize imported config
    const sanitizedWidgets = config.widgets.map((widget: any) => ({
      id: widget.id || `widget_${Date.now()}_${Math.random()}`,
      type: widget.type,
      title: widget.title || 'Untitled Widget',
      position: widget.position || { x: 0, y: 0, w: 6, h: 4 },
      settings: widget.settings || {},
      isVisible: widget.isVisible !== false
    }))

    // Save imported configuration (would update database)
    const updatedConfig = {
      organizationId,
      userId,
      widgets: sanitizedWidgets,
      updatedAt: new Date()
    }

    res.json({ 
      success: true, 
      config: updatedConfig,
      message: 'Dashboard configuration imported successfully' 
    })
  } catch (error: any) {
    console.error('Import dashboard config error:', error)
    res.status(500).json({ error: 'Failed to import dashboard configuration' })
  }
}