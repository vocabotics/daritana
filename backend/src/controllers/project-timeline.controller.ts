import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Create project timeline entry
 */
export const createTimeline = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const { title, description, startDate, endDate, color } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to manage project timeline' })
    }

    const timeline = await prisma.projectTimeline.create({
      data: {
        projectId,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'project_timeline',
        resourceId: timeline.id,
        newValues: { title, projectId }
      }
    })

    res.status(201).json(timeline)
  } catch (error) {
    console.error('Create timeline error:', error)
    res.status(500).json({ error: 'Failed to create timeline entry' })
  }
}

/**
 * List project timelines
 */
export const listTimelines = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check access
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => m.userId === req.user?.id)

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this project' })
    }

    const timelines = await prisma.projectTimeline.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' }
    })

    res.json(timelines)
  } catch (error) {
    console.error('List timelines error:', error)
    res.status(500).json({ error: 'Failed to list project timelines' })
  }
}

/**
 * Update timeline entry
 */
export const updateTimeline = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, timelineId } = req.params
    const { title, description, startDate, endDate, color } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if timeline exists
    const timeline = await prisma.projectTimeline.findFirst({
      where: {
        id: timelineId,
        projectId
      },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!timeline || timeline.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Timeline entry not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     timeline.project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to edit timeline' })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (color !== undefined) updateData.color = color

    const updatedTimeline = await prisma.projectTimeline.update({
      where: { id: timelineId },
      data: updateData
    })

    res.json(updatedTimeline)
  } catch (error) {
    console.error('Update timeline error:', error)
    res.status(500).json({ error: 'Failed to update timeline entry' })
  }
}

/**
 * Delete timeline entry
 */
export const deleteTimeline = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, timelineId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if timeline exists
    const timeline = await prisma.projectTimeline.findFirst({
      where: {
        id: timelineId,
        projectId
      },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!timeline || timeline.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Timeline entry not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     timeline.project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to delete timeline' })
    }

    await prisma.projectTimeline.delete({
      where: { id: timelineId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete timeline error:', error)
    res.status(500).json({ error: 'Failed to delete timeline entry' })
  }
}

/**
 * Create milestone
 */
export const createMilestone = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const { name, description, dueDate } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to manage milestones' })
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name,
        description,
        dueDate: new Date(dueDate)
      }
    })

    res.status(201).json(milestone)
  } catch (error) {
    console.error('Create milestone error:', error)
    res.status(500).json({ error: 'Failed to create milestone' })
  }
}

/**
 * List project milestones
 */
export const listMilestones = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check access
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => m.userId === req.user?.id)

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this project' })
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    })

    res.json(milestones)
  } catch (error) {
    console.error('List milestones error:', error)
    res.status(500).json({ error: 'Failed to list milestones' })
  }
}

/**
 * Update milestone
 */
export const updateMilestone = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params
    const { name, description, dueDate, completedDate, status, progress } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if milestone exists
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId
      },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!milestone || milestone.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     milestone.project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to edit milestone' })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null
    if (status !== undefined) updateData.status = status
    if (progress !== undefined) updateData.progress = parseFloat(progress)

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData
    })

    res.json(updatedMilestone)
  } catch (error) {
    console.error('Update milestone error:', error)
    res.status(500).json({ error: 'Failed to update milestone' })
  }
}

/**
 * Delete milestone
 */
export const deleteMilestone = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if milestone exists
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId
      },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!milestone || milestone.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    // Check permissions
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     milestone.project.members.some(m => 
                       m.userId === req.user?.id && 
                       m.permissions.includes('edit')
                     )

    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to delete milestone' })
    }

    await prisma.milestone.delete({
      where: { id: milestoneId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete milestone error:', error)
    res.status(500).json({ error: 'Failed to delete milestone' })
  }
}

/**
 * Get project progress overview
 */
export const getProjectProgress = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check access
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => m.userId === req.user?.id)

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this project' })
    }

    const [
      taskStats,
      milestoneStats,
      timelineData,
      recentActivity
    ] = await Promise.all([
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true
      }),
      // Milestone statistics
      prisma.milestone.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true
      }),
      // Timeline data
      prisma.projectTimeline.findMany({
        where: { projectId },
        orderBy: { startDate: 'asc' }
      }),
      // Recent activity (last 10 audit logs)
      prisma.auditLog.findMany({
        where: {
          organizationId,
          OR: [
            { resource: 'project', resourceId: projectId },
            { resource: 'task', newValues: { path: ['projectId'], equals: projectId } },
            { resource: 'milestone', newValues: { path: ['projectId'], equals: projectId } }
          ]
        },
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
        take: 10
      })
    ])

    // Calculate overall progress
    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0)
    const completedTasks = taskStats.find(stat => stat.status === 'COMPLETED')?._count || 0
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const totalMilestones = milestoneStats.reduce((sum, stat) => sum + stat._count, 0)
    const completedMilestones = milestoneStats.find(stat => stat.status === 'COMPLETED')?._count || 0
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

    // Calculate time progress
    const now = new Date()
    const projectStart = project.startDate
    const projectEnd = project.endDate
    const totalDuration = projectEnd.getTime() - projectStart.getTime()
    const elapsed = now.getTime() - projectStart.getTime()
    const timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate
      },
      progress: {
        overall: ((taskProgress + milestoneProgress) / 2),
        tasks: taskProgress,
        milestones: milestoneProgress,
        timeline: timeProgress
      },
      statistics: {
        tasks: {
          total: totalTasks,
          byStatus: taskStats.map(stat => ({
            status: stat.status,
            count: stat._count
          }))
        },
        milestones: {
          total: totalMilestones,
          byStatus: milestoneStats.map(stat => ({
            status: stat.status,
            count: stat._count
          }))
        }
      },
      timeline: timelineData,
      recentActivity
    })
  } catch (error) {
    console.error('Get project progress error:', error)
    res.status(500).json({ error: 'Failed to get project progress' })
  }
}