import { Router } from 'express'
import { prisma } from '../server'
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth'

const router = Router()

// Simple team stats that work with current schema
router.get('/stats', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any

    // Get basic counts
    const totalMembers = await prisma.organizationMember.count({
      where: { organizationId }
    })

    const totalProjects = await prisma.project.count({
      where: { organizationId }
    })

    const totalTasks = await prisma.task.count({
      where: { 
        project: { organizationId }
      }
    })

    const completedTasks = await prisma.task.count({
      where: { 
        project: { organizationId },
        status: 'COMPLETED'
      }
    })

    const totalDocuments = await prisma.document.count({
      where: { organizationId }
    })

    // Calculate simple metrics
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const productivityScore = Math.min(100, Math.round((completedTasks * 10) + (totalDocuments * 2)))

    res.json({
      success: true,
      data: {
        teamMembers: {
          total: totalMembers,
          active: totalMembers, // Simplified - assume all are active
          activityRate: 100
        },
        projects: {
          total: totalProjects,
          active: totalProjects, // Simplified
          activityRate: 100
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
          productivityScore,
          weeklyGrowth: 12,
          monthlyGrowth: 8
        }
      }
    })
  } catch (error) {
    console.error('Error fetching team stats:', error)
    res.status(500).json({ error: 'Failed to fetch team statistics' })
  }
})

// Get recent activity
router.get('/activity', authenticateMultiTenant, async (req, res) => {
  try {
    const { organizationId } = req as any
    const limit = parseInt(req.query.limit as string) || 20

    // Get recent projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
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
    })

    // Transform to activity format
    const activities = projects.map(project => ({
      id: `project-${project.id}`,
      userId: project.createdBy,
      userName: project.user?.name || `${project.user?.firstName} ${project.user?.lastName}` || 'Unknown',
      userAvatar: project.user?.avatar,
      action: 'updated_project',
      target: project.name,
      timestamp: project.updatedAt,
      type: 'project',
      metadata: { projectId: project.id }
    }))

    res.json({
      success: true,
      data: activities
    })
  } catch (error) {
    console.error('Error fetching team activity:', error)
    res.status(500).json({ error: 'Failed to fetch team activity' })
  }
})

// Get team members
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
            lastLogin: true
          }
        }
      }
    })

    const membersWithMetrics = members.map(member => ({
      id: member.user.id,
      name: member.user.name || `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email,
      role: member.role,
      department: member.user.department || member.department,
      avatar: member.user.avatar,
      status: 'online', // Simplified
      lastSeen: member.user.lastLogin,
      metrics: {
        tasksCompleted: 0,
        tasksAssigned: 0,
        taskCompletionRate: 0,
        documentsUploaded: 0,
        productivityScore: 50 // Default score
      }
    }))

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