import { Router } from 'express'
import { prisma } from '../server'
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth'

const router = Router()

// Get team activity feed
router.get('/activity', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any
    const limit = parseInt(req.query.limit as string) || 20

    // Get recent activities from multiple sources
    const [projects, tasks, documents, sessions] = await Promise.all([
      // Recent project updates
      prisma.project.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          createdBy: true,
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      // Recent tasks
      prisma.task.findMany({
        where: { 
          project: { organizationId }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      // Recent documents
      prisma.document.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      // Recent login sessions
      prisma.session.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true,
              lastLogin: true
            }
          }
        }
      })
    ])

    // Transform into activity format
    const activities: any[] = []

    // Add project activities
    projects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        userId: project.createdBy,
        userName: project.user?.name || `${project.user?.firstName} ${project.user?.lastName}`,
        userAvatar: project.user?.avatar,
        action: 'updated_project',
        target: project.name,
        timestamp: project.updatedAt,
        type: 'project',
        metadata: { projectId: project.id }
      })
    })

    // Add task activities
    tasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        userId: task.assignedToId,
        userName: task.assignedTo?.name || `${task.assignedTo?.firstName} ${task.assignedTo?.lastName}`,
        userAvatar: task.assignedTo?.avatar,
        action: task.status === 'COMPLETED' ? 'completed_task' : 'updated_task',
        target: task.title,
        timestamp: task.updatedAt,
        type: 'task',
        metadata: { 
          taskId: task.id,
          status: task.status,
          priority: task.priority
        }
      })
    })

    // Add document activities
    documents.forEach(doc => {
      activities.push({
        id: `doc-${doc.id}`,
        userId: doc.userId,
        userName: doc.user?.name || `${doc.user?.firstName} ${doc.user?.lastName}`,
        userAvatar: doc.user?.avatar,
        action: 'uploaded_document',
        target: doc.name,
        timestamp: doc.createdAt,
        type: 'document',
        metadata: { 
          documentId: doc.id,
          fileType: doc.fileType
        }
      })
    })

    // Add session activities
    sessions.forEach(session => {
      if (session.user) {
        activities.push({
          id: `session-${session.id}`,
          userId: session.userId,
          userName: session.user.name || `${session.user.firstName} ${session.user.lastName}`,
          userAvatar: session.user.avatar,
          action: 'logged_in',
          target: 'System',
          timestamp: session.createdAt,
          type: 'login',
          metadata: { 
            ipAddress: session.ipAddress,
            lastLogin: session.user.lastLogin
          }
        })
      }
    })

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivities = activities.slice(0, limit)

    res.json({
      success: true,
      data: limitedActivities
    })
  } catch (error) {
    console.error('Error fetching team activity:', error)
    res.status(500).json({ error: 'Failed to fetch team activity' })
  }
})

// Get team statistics
router.get('/stats', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any

    const [
      totalMembers,
      activeMembers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalDocuments
    ] = await Promise.all([
      // Total team members
      prisma.organizationMember.count({
        where: { organizationId }
      }),
      // Active members (logged in last 7 days)
      prisma.user.count({
        where: {
          organizationMemberships: {
            some: { organizationId }
          },
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Total projects
      prisma.project.count({
        where: { organizationId }
      }),
      // Active projects
      prisma.project.count({
        where: { 
          organizationId,
          status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] }
        }
      }),
      // Total tasks
      prisma.task.count({
        where: { 
          project: { organizationId }
        }
      }),
      // Completed tasks
      prisma.task.count({
        where: { 
          project: { organizationId },
          status: 'COMPLETED'
        }
      }),
      // Total documents
      prisma.document.count({
        where: { organizationId }
      })
    ])

    // Calculate percentages
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const memberActivityRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0
    const projectActivityRate = totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0

    res.json({
      success: true,
      data: {
        teamMembers: {
          total: totalMembers,
          active: activeMembers,
          activityRate: memberActivityRate
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          activityRate: projectActivityRate
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: taskCompletionRate,
          pending: totalTasks - completedTasks
        },
        documents: {
          total: totalDocuments
        },
        meetings: {
          total: 0,
          upcoming: 0
        },
        overview: {
          productivityScore: Math.round((taskCompletionRate + memberActivityRate + projectActivityRate) / 3),
          weeklyGrowth: 12, // This would need historical data to calculate properly
          monthlyGrowth: 8  // This would need historical data to calculate properly
        }
      }
    })
  } catch (error) {
    console.error('Error fetching team stats:', error)
    res.status(500).json({ error: 'Failed to fetch team statistics' })
  }
})

// Get team members with performance metrics
router.get('/members', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any

    const members = await prisma.organizationMember.findMany({
      where: { 
        organizationId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            department: true,
            lastLogin: true,
            profileImage: true
          }
        }
      }
    })

    // Get performance metrics for each member
    const membersWithMetrics = await Promise.all(
      members.map(async (member) => {
        const [tasksCompleted, tasksAssigned, documentsUploaded] = await Promise.all([
          prisma.task.count({
            where: {
              assignedToId: member.userId,
              status: 'COMPLETED',
              project: { organizationId }
            }
          }),
          prisma.task.count({
            where: {
              assignedToId: member.userId,
              project: { organizationId }
            }
          }),
          prisma.document.count({
            where: {
              userId: member.userId,
              organizationId
            }
          })
        ])

        const taskCompletionRate = tasksAssigned > 0 
          ? Math.round((tasksCompleted / tasksAssigned) * 100)
          : 0

        // Calculate status based on last login
        const lastLoginDate = member.user.lastLogin ? new Date(member.user.lastLogin) : null
        const hoursSinceLogin = lastLoginDate 
          ? (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60)
          : 999

        let status = 'offline'
        if (hoursSinceLogin < 0.5) status = 'online'
        else if (hoursSinceLogin < 2) status = 'away'
        else if (hoursSinceLogin < 8) status = 'busy'

        return {
          id: member.user.id,
          name: member.user.name || `${member.user.firstName} ${member.user.lastName}`,
          email: member.user.email,
          role: member.role,
          department: member.user.department || member.department,
          avatar: member.user.avatar || member.user.profileImage,
          status,
          lastSeen: member.user.lastLogin,
          metrics: {
            tasksCompleted,
            tasksAssigned,
            taskCompletionRate,
            documentsUploaded,
            productivityScore: Math.min(100, taskCompletionRate + (documentsUploaded * 2))
          }
        }
      })
    )

    res.json({
      success: true,
      data: membersWithMetrics
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

export default router