import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: MultiTenantRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resourceType,
      userId,
      organizationId,
      startDate,
      endDate,
      search
    } = req.query

    const where: any = {}

    // Filter by action
    if (action) {
      where.action = action
    }

    // Filter by resource type
    if (resourceType) {
      where.resourceType = resourceType
    }

    // Filter by user
    if (userId) {
      where.userId = userId
    }

    // Filter by organization (system admin can see all, org admin sees their org)
    if (organizationId) {
      where.organizationId = organizationId
    } else if (!req.user?.systemAdmin) {
      // Non-system admins can only see their organization's logs
      where.organizationId = req.organization?.id
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { resourceType: { contains: search as string, mode: 'insensitive' } },
        { ipAddress: { contains: search as string, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ])

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
}

/**
 * Get audit log details by ID
 */
export const getAuditLogById = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { logId } = req.params

    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' })
    }

    // Check access permissions
    if (!req.user?.systemAdmin && log.organizationId !== req.organization?.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ log })
  } catch (error) {
    console.error('Get audit log by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch audit log details' })
  }
}

/**
 * Get audit log statistics
 */
export const getAuditLogStats = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d', organizationId } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      createdAt: { gte: startDate }
    }

    // Filter by organization for non-system admins
    if (organizationId) {
      where.organizationId = organizationId
    } else if (!req.user?.systemAdmin) {
      where.organizationId = req.organization?.id
    }

    const [
      totalLogs,
      actionBreakdown,
      resourceBreakdown,
      userActivity,
      dailyActivity,
      topUsers,
      recentCriticalActions
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      getActionBreakdown(where),
      getResourceBreakdown(where),
      getUserActivity(where),
      getDailyActivity(startDate, days, where),
      getTopUsers(where),
      getCriticalActions(where)
    ])

    res.json({
      overview: {
        totalLogs,
        timeframe,
        periodStart: startDate.toISOString(),
        periodEnd: new Date().toISOString()
      },
      breakdowns: {
        actions: actionBreakdown,
        resources: resourceBreakdown,
        users: userActivity
      },
      trends: {
        daily: dailyActivity
      },
      insights: {
        topUsers,
        criticalActions: recentCriticalActions
      }
    })
  } catch (error) {
    console.error('Get audit log stats error:', error)
    res.status(500).json({ error: 'Failed to fetch audit log statistics' })
  }
}

/**
 * Export audit logs
 */
export const exportAuditLogs = async (req: MultiTenantRequest, res: Response) => {
  try {
    const {
      format = 'csv',
      action,
      resourceType,
      userId,
      organizationId,
      startDate,
      endDate,
      includeDetails = false
    } = req.query

    const where: any = {}

    // Apply filters (same as getAuditLogs)
    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType
    if (userId) where.userId = userId
    
    if (organizationId) {
      where.organizationId = organizationId
    } else if (!req.user?.systemAdmin) {
      where.organizationId = req.organization?.id
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit to prevent excessive exports
    })

    if (format === 'csv') {
      const csv = convertLogsToCSV(logs, includeDetails === 'true')
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(csv)
    }

    if (format === 'json') {
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
      
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.json({
        exportedAt: new Date().toISOString(),
        exportedBy: req.user!.name,
        totalRecords: logs.length,
        logs: logs.map(log => ({
          id: log.id,
          timestamp: log.createdAt,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          user: log.user ? {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email
          } : null,
          organization: log.organization ? {
            id: log.organization.id,
            name: log.organization.name
          } : null,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          details: includeDetails === 'true' ? log.details : undefined
        }))
      })
    }

    res.status(400).json({ error: 'Unsupported export format' })
  } catch (error) {
    console.error('Export audit logs error:', error)
    res.status(500).json({ error: 'Failed to export audit logs' })
  }
}

/**
 * Delete old audit logs (cleanup)
 */
export const cleanupAuditLogs = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { retentionDays = 365, dryRun = false } = req.body

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - Number(retentionDays))

    if (dryRun === true) {
      // Count logs that would be deleted
      const count = await prisma.auditLog.count({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      return res.json({
        dryRun: true,
        logsToDelete: count,
        cutoffDate: cutoffDate.toISOString()
      })
    }

    // Actually delete logs
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })

    // Log the cleanup action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CLEANUP_AUDIT_LOGS',
        resourceType: 'AUDIT_LOG',
        details: {
          deletedCount: result.count,
          retentionDays: Number(retentionDays),
          cutoffDate: cutoffDate.toISOString(),
          executedBy: req.user!.name
        }
      }
    })

    res.json({
      success: true,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString()
    })
  } catch (error) {
    console.error('Cleanup audit logs error:', error)
    res.status(500).json({ error: 'Failed to cleanup audit logs' })
  }
}

/**
 * Get security incidents from audit logs
 */
export const getSecurityIncidents = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '7d', severity = 'all' } = req.query
    const days = getTimeframeDays(timeframe as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Define security-related actions
    const securityActions = [
      'LOGIN_FAILED',
      'ACCOUNT_LOCKED',
      'PASSWORD_CHANGED',
      'EMAIL_CHANGED',
      'PERMISSION_DENIED',
      'UNAUTHORIZED_ACCESS',
      'SUSPICIOUS_ACTIVITY',
      'MULTIPLE_LOGIN_ATTEMPTS',
      'ADMIN_PRIVILEGE_ESCALATION'
    ]

    const where: any = {
      createdAt: { gte: startDate },
      action: { in: securityActions }
    }

    // Filter by organization for non-system admins
    if (!req.user?.systemAdmin) {
      where.organizationId = req.organization?.id
    }

    const [incidents, incidentStats] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      getSecurityIncidentStats(where)
    ])

    // Categorize incidents by severity
    const categorizedIncidents = categorizeIncidentsBySeverity(incidents)

    // Filter by severity if specified
    const filteredIncidents = severity === 'all' 
      ? incidents 
      : categorizedIncidents[severity as string] || []

    res.json({
      incidents: filteredIncidents,
      statistics: incidentStats,
      breakdown: {
        critical: categorizedIncidents.critical?.length || 0,
        high: categorizedIncidents.high?.length || 0,
        medium: categorizedIncidents.medium?.length || 0,
        low: categorizedIncidents.low?.length || 0
      },
      timeframe
    })
  } catch (error) {
    console.error('Get security incidents error:', error)
    res.status(500).json({ error: 'Failed to fetch security incidents' })
  }
}

/**
 * Generate compliance report
 */
export const generateComplianceReport = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { 
      startDate,
      endDate,
      organizationId,
      includeUserActions = true,
      includeDataAccess = true,
      includeSystemChanges = true,
      format = 'json'
    } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' })
    }

    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (organizationId) {
      where.organizationId = organizationId
    } else if (!req.user?.systemAdmin) {
      where.organizationId = req.organization?.id
    }

    const [
      userActions,
      dataAccess,
      systemChanges,
      securityEvents,
      report
    ] = await Promise.all([
      includeUserActions ? getUserActionsForCompliance(where) : Promise.resolve([]),
      includeDataAccess ? getDataAccessForCompliance(where) : Promise.resolve([]),
      includeSystemChanges ? getSystemChangesForCompliance(where) : Promise.resolve([]),
      getSecurityEventsForCompliance(where),
      generateComplianceReportData(where, startDate, endDate)
    ])

    const complianceData = {
      reportGenerated: new Date().toISOString(),
      reportPeriod: {
        startDate,
        endDate
      },
      generatedBy: req.user!.name,
      scope: organizationId ? 'organization' : 'system',
      sections: {
        ...(includeUserActions && { userActions }),
        ...(includeDataAccess && { dataAccess }),
        ...(includeSystemChanges && { systemChanges }),
        securityEvents
      },
      summary: report
    }

    if (format === 'pdf') {
      // In real implementation, generate PDF report
      return res.status(501).json({ error: 'PDF export not yet implemented' })
    }

    // Log report generation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organizationId: req.organization?.id,
        action: 'GENERATE_COMPLIANCE_REPORT',
        resourceType: 'COMPLIANCE_REPORT',
        details: {
          reportPeriod: { startDate, endDate },
          scope: organizationId ? 'organization' : 'system',
          sections: {
            userActions: includeUserActions,
            dataAccess: includeDataAccess,
            systemChanges: includeSystemChanges
          }
        }
      }
    })

    res.json(complianceData)
  } catch (error) {
    console.error('Generate compliance report error:', error)
    res.status(500).json({ error: 'Failed to generate compliance report' })
  }
}

// Helper functions

function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case '1d': return 1
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '1y': return 365
    default: return 30
  }
}

async function getActionBreakdown(where: any) {
  return await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: true,
    orderBy: { _count: { action: 'desc' } },
    take: 10
  })
}

async function getResourceBreakdown(where: any) {
  return await prisma.auditLog.groupBy({
    by: ['resourceType'],
    where,
    _count: true,
    orderBy: { _count: { resourceType: 'desc' } },
    take: 10
  })
}

async function getUserActivity(where: any) {
  return await prisma.auditLog.groupBy({
    by: ['userId'],
    where: { ...where, userId: { not: null } },
    _count: true,
    orderBy: { _count: { userId: 'desc' } },
    take: 10
  })
}

async function getDailyActivity(startDate: Date, days: number, where: any) {
  const dailyData = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const count = await prisma.auditLog.count({
      where: {
        ...where,
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    })

    dailyData.push({
      date: date.toISOString().split('T')[0],
      count
    })
  }

  return dailyData
}

async function getTopUsers(where: any) {
  const userActivity = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: { ...where, userId: { not: null } },
    _count: true,
    orderBy: { _count: { userId: 'desc' } },
    take: 5
  })

  const userIds = userActivity.map(activity => activity.userId!).filter(Boolean)
  
  if (userIds.length === 0) return []

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  })

  return userActivity.map(activity => {
    const user = users.find(u => u.id === activity.userId)
    return {
      user,
      activityCount: activity._count
    }
  }).filter(item => item.user)
}

async function getCriticalActions(where: any) {
  const criticalActions = [
    'DELETE_USER',
    'DELETE_ORGANIZATION',
    'DELETE_PROJECT',
    'SYSTEM_SETTING_CHANGED',
    'PERMISSION_ESCALATION',
    'BULK_DELETE',
    'DATA_EXPORT'
  ]

  return await prisma.auditLog.findMany({
    where: {
      ...where,
      action: { in: criticalActions }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

function convertLogsToCSV(logs: any[], includeDetails: boolean): string {
  const headers = [
    'ID',
    'Timestamp',
    'Action',
    'Resource Type',
    'Resource ID',
    'User Name',
    'User Email',
    'Organization',
    'IP Address',
    'User Agent'
  ]

  if (includeDetails) {
    headers.push('Details')
  }

  const rows = logs.map(log => {
    const row = [
      log.id,
      log.createdAt.toISOString(),
      log.action,
      log.resourceType || '',
      log.resourceId || '',
      log.user?.name || '',
      log.user?.email || '',
      log.organization?.name || '',
      log.ipAddress || '',
      log.userAgent || ''
    ]

    if (includeDetails) {
      row.push(JSON.stringify(log.details || {}))
    }

    return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

function categorizeIncidentsBySeverity(incidents: any[]) {
  const categories = {
    critical: [] as any[],
    high: [] as any[],
    medium: [] as any[],
    low: [] as any[]
  }

  incidents.forEach(incident => {
    switch (incident.action) {
      case 'ACCOUNT_LOCKED':
      case 'ADMIN_PRIVILEGE_ESCALATION':
      case 'UNAUTHORIZED_ACCESS':
        categories.critical.push(incident)
        break
      case 'LOGIN_FAILED':
      case 'MULTIPLE_LOGIN_ATTEMPTS':
      case 'SUSPICIOUS_ACTIVITY':
        categories.high.push(incident)
        break
      case 'PERMISSION_DENIED':
      case 'PASSWORD_CHANGED':
        categories.medium.push(incident)
        break
      default:
        categories.low.push(incident)
    }
  })

  return categories
}

async function getSecurityIncidentStats(where: any) {
  const stats = await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: true
  })

  return stats.map(stat => ({
    action: stat.action,
    count: stat._count
  }))
}

async function getUserActionsForCompliance(where: any) {
  return await prisma.auditLog.findMany({
    where: {
      ...where,
      action: {
        in: [
          'LOGIN',
          'LOGOUT',
          'CREATE_PROJECT',
          'UPDATE_PROJECT',
          'DELETE_PROJECT',
          'UPLOAD_DOCUMENT',
          'DELETE_DOCUMENT',
          'INVITE_USER',
          'REMOVE_USER'
        ]
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getDataAccessForCompliance(where: any) {
  return await prisma.auditLog.findMany({
    where: {
      ...where,
      action: {
        in: [
          'VIEW_DOCUMENT',
          'DOWNLOAD_DOCUMENT',
          'EXPORT_DATA',
          'VIEW_REPORT',
          'GENERATE_REPORT'
        ]
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getSystemChangesForCompliance(where: any) {
  return await prisma.auditLog.findMany({
    where: {
      ...where,
      action: {
        in: [
          'UPDATE_SYSTEM_SETTINGS',
          'CREATE_USER',
          'UPDATE_USER',
          'DELETE_USER',
          'UPDATE_PERMISSIONS',
          'BACKUP_CREATED',
          'RESTORE_PERFORMED'
        ]
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getSecurityEventsForCompliance(where: any) {
  return await prisma.auditLog.findMany({
    where: {
      ...where,
      action: {
        in: [
          'LOGIN_FAILED',
          'ACCOUNT_LOCKED',
          'UNAUTHORIZED_ACCESS',
          'PERMISSION_DENIED',
          'SUSPICIOUS_ACTIVITY'
        ]
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function generateComplianceReportData(where: any, startDate: string, endDate: string) {
  const [
    totalEvents,
    uniqueUsers,
    securityIncidents,
    dataExports,
    systemChanges
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      select: { userId: true },
      distinct: ['userId']
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: {
          in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'UNAUTHORIZED_ACCESS']
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: 'EXPORT_DATA'
      }
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: {
          in: ['UPDATE_SYSTEM_SETTINGS', 'CREATE_USER', 'DELETE_USER']
        }
      }
    })
  ])

  return {
    reportPeriod: { startDate, endDate },
    totalEvents,
    uniqueUsers: uniqueUsers.length,
    securityIncidents,
    dataExports,
    systemChanges,
    complianceScore: Math.max(0, 100 - (securityIncidents * 2)) // Simple scoring
  }
}