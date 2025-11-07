import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Update user presence status
 */
export const updatePresence = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      status = 'ONLINE',
      message,
      location
    } = req.body

    // Convert status to uppercase to match Prisma enum
    const normalizedStatus = status ? String(status).toUpperCase() : 'ONLINE'

    // Validate status enum
    const validStatuses = ['ONLINE', 'AWAY', 'BUSY', 'DO_NOT_DISTURB', 'OFFLINE']
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    // Update user's last active time
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        lastActiveAt: new Date()
      }
    })

    // Update or create presence record
    const presence = await prisma.userPresence.upsert({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId
        }
      },
      update: {
        status: normalizedStatus,
        statusMessage: message,
        location,
        lastSeenAt: new Date()
      },
      create: {
        userId: req.user!.id,
        organizationId,
        status: normalizedStatus,
        statusMessage: message,
        location,
        lastSeenAt: new Date()
      }
    })

    // TODO: Emit WebSocket event for real-time presence update
    // io.to(`org:${organizationId}`).emit('presence_update', {
    //   userId: req.user!.id,
    //   status,
    //   message,
    //   lastSeenAt: presence.lastSeenAt
    // })

    res.json(presence)
  } catch (error) {
    console.error('Update presence error:', error)
    res.status(500).json({ error: 'Failed to update presence' })
  }
}

/**
 * Get presence status for organization members
 */
export const getPresenceStatus = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { userIds } = req.query

    let where: any = { organizationId }

    // Filter by specific user IDs if provided
    if (userIds) {
      const ids = String(userIds).split(',')
      where.userId = { in: ids }
    }

    const presenceRecords = await prisma.userPresence.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    // Determine actual status based on last seen time
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    const enrichedPresence = presenceRecords.map(record => {
      let actualStatus = 'offline'
      
      if (record.lastSeenAt > fiveMinutesAgo) {
        actualStatus = record.status || 'online'
      } else if (record.lastSeenAt > thirtyMinutesAgo) {
        actualStatus = 'away'
      }

      return {
        ...record,
        actualStatus,
        isOnline: actualStatus !== 'offline'
      }
    })

    res.json(enrichedPresence)
  } catch (error) {
    console.error('Get presence status error:', error)
    res.status(500).json({ error: 'Failed to get presence status' })
  }
}

/**
 * Get online users count and list
 */
export const getOnlineUsers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const onlineUsers = await prisma.userPresence.findMany({
      where: {
        organizationId,
        lastSeenAt: {
          gte: fiveMinutesAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      },
      orderBy: { lastSeenAt: 'desc' }
    })

    const totalMembers = await prisma.organizationMember.count({
      where: {
        organizationId,
        isActive: true
      }
    })

    res.json({
      onlineUsers,
      onlineCount: onlineUsers.length,
      totalMembers,
      onlinePercentage: totalMembers > 0 ? (onlineUsers.length / totalMembers) * 100 : 0
    })
  } catch (error) {
    console.error('Get online users error:', error)
    res.status(500).json({ error: 'Failed to get online users' })
  }
}

/**
 * Set user status message
 */
export const setStatusMessage = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { message, expiresAt } = req.body

    const presence = await prisma.userPresence.upsert({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId
        }
      },
      update: {
        statusMessage: message,
        statusExpiresAt: expiresAt ? new Date(expiresAt) : null,
        lastSeenAt: new Date()
      },
      create: {
        userId: req.user!.id,
        organizationId,
        status: 'online',
        statusMessage: message,
        statusExpiresAt: expiresAt ? new Date(expiresAt) : null,
        lastSeenAt: new Date()
      }
    })

    // TODO: Emit WebSocket event for real-time status update
    // io.to(`org:${organizationId}`).emit('status_update', {
    //   userId: req.user!.id,
    //   message,
    //   expiresAt
    // })

    res.json(presence)
  } catch (error) {
    console.error('Set status message error:', error)
    res.status(500).json({ error: 'Failed to set status message' })
  }
}

/**
 * Get user activity timeline
 */
export const getUserActivity = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { days = 7 } = req.query

    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)

    // Get presence history
    const presenceHistory = await prisma.presenceHistory.findMany({
      where: {
        userId,
        organizationId,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    // Get recent activities from audit logs
    const activities = await prisma.auditLog.findMany({
      where: {
        userId,
        organizationId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Group presence by day
    const presenceByDay = groupPresenceByDay(presenceHistory)

    // Calculate activity metrics
    const metrics = calculateActivityMetrics(presenceHistory, activities)

    res.json({
      presenceHistory: presenceByDay,
      activities,
      metrics
    })
  } catch (error) {
    console.error('Get user activity error:', error)
    res.status(500).json({ error: 'Failed to get user activity' })
  }
}

/**
 * Get organization-wide activity analytics
 */
export const getActivityAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { days = 30 } = req.query

    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)

    const [
      dailyActiveUsers,
      peakHours,
      averageSessionDuration,
      mostActiveUsers,
      activityTrends
    ] = await Promise.all([
      getDailyActiveUsers(organizationId, startDate),
      getPeakActivityHours(organizationId, startDate),
      getAverageSessionDuration(organizationId, startDate),
      getMostActiveUsers(organizationId, startDate),
      getActivityTrends(organizationId, startDate)
    ])

    const analytics = {
      summary: {
        dailyActiveUsers: dailyActiveUsers.length,
        peakHour: peakHours[0]?.hour || 9,
        averageSessionDuration,
        totalSessions: activityTrends.reduce((sum, day) => sum + day.sessions, 0)
      },
      dailyActiveUsers,
      peakHours,
      mostActiveUsers,
      trends: activityTrends
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get activity analytics error:', error)
    res.status(500).json({ error: 'Failed to get activity analytics' })
  }
}

/**
 * Track user cursor position for collaboration
 */
export const updateCursorPosition = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      documentId,
      x,
      y,
      page,
      elementId
    } = req.body

    // Store cursor position in memory/cache (Redis would be ideal)
    // For now, we'll emit via WebSocket only
    
    // TODO: Emit WebSocket event for real-time cursor tracking
    // io.to(`document:${documentId}`).emit('cursor_update', {
    //   userId: req.user!.id,
    //   userName: `${req.user!.firstName} ${req.user!.lastName}`,
    //   x,
    //   y,
    //   page,
    //   elementId,
    //   timestamp: new Date()
    // })

    res.json({ success: true })
  } catch (error) {
    console.error('Update cursor position error:', error)
    res.status(500).json({ error: 'Failed to update cursor position' })
  }
}

// Helper functions

function groupPresenceByDay(presenceHistory: any[]) {
  const grouped: { [key: string]: any[] } = {}
  
  presenceHistory.forEach(record => {
    const day = record.timestamp.toISOString().split('T')[0]
    if (!grouped[day]) {
      grouped[day] = []
    }
    grouped[day].push(record)
  })

  return Object.entries(grouped).map(([date, records]) => ({
    date,
    records,
    totalMinutes: calculateDailyMinutes(records)
  }))
}

function calculateDailyMinutes(records: any[]) {
  // Simplified calculation - in reality you'd track session durations
  return records.filter(r => r.status === 'online').length * 5 // Assume 5 min intervals
}

function calculateActivityMetrics(presenceHistory: any[], activities: any[]) {
  const totalSessions = presenceHistory.filter(r => r.status === 'online').length
  const totalActivities = activities.length
  const averageActivitiesPerSession = totalSessions > 0 ? totalActivities / totalSessions : 0

  return {
    totalSessions,
    totalActivities,
    averageActivitiesPerSession,
    mostActiveDay: getMostActiveDay(presenceHistory),
    activityScore: Math.min(100, totalActivities * 2) // Simplified scoring
  }
}

function getMostActiveDay(presenceHistory: any[]) {
  const dayCount: { [key: string]: number } = {}
  
  presenceHistory.forEach(record => {
    const day = record.timestamp.toISOString().split('T')[0]
    dayCount[day] = (dayCount[day] || 0) + 1
  })

  return Object.entries(dayCount).sort(([,a], [,b]) => b - a)[0]?.[0] || null
}

async function getDailyActiveUsers(organizationId: string, startDate: Date) {
  // Get unique users who were active each day
  const activeUsers = await prisma.userPresence.findMany({
    where: {
      organizationId,
      lastSeenAt: { gte: startDate }
    },
    select: {
      userId: true,
      lastSeenAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  })

  return activeUsers
}

async function getPeakActivityHours(organizationId: string, startDate: Date) {
  // This would be more complex with real presence tracking
  // For now, return mock peak hours
  return [
    { hour: 9, count: 15 },
    { hour: 10, count: 20 },
    { hour: 11, count: 18 },
    { hour: 14, count: 22 },
    { hour: 15, count: 19 }
  ]
}

async function getAverageSessionDuration(organizationId: string, startDate: Date) {
  // Simplified calculation
  return 180 // 3 hours average
}

async function getMostActiveUsers(organizationId: string, startDate: Date) {
  const activities = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      organizationId,
      createdAt: { gte: startDate },
      userId: { not: null }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  })

  const enrichedUsers = await Promise.all(
    activities.map(async (activity) => {
      const user = await prisma.user.findUnique({
        where: { id: activity.userId! },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          position: true
        }
      })

      return {
        user,
        activityCount: activity._count.id
      }
    })
  )

  return enrichedUsers.filter(u => u.user)
}

async function getActivityTrends(organizationId: string, startDate: Date) {
  // Group activities by day
  const activities = await prisma.auditLog.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      userId: true
    }
  })

  const trendData: { [key: string]: { activities: number, uniqueUsers: Set<string> } } = {}
  
  activities.forEach(activity => {
    const day = activity.createdAt.toISOString().split('T')[0]
    if (!trendData[day]) {
      trendData[day] = { activities: 0, uniqueUsers: new Set() }
    }
    trendData[day].activities++
    if (activity.userId) {
      trendData[day].uniqueUsers.add(activity.userId)
    }
  })

  return Object.entries(trendData).map(([date, data]) => ({
    date,
    activities: data.activities,
    uniqueUsers: data.uniqueUsers.size,
    sessions: data.uniqueUsers.size // Simplified
  }))
}