import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get team members for organization
 */
export const getTeamMembers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      role,
      department,
      search,
      isActive = 'true',
      page = 1,
      limit = 50,
      sortBy = 'joinedAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Apply filters
    if (role) where.role = role
    if (department) where.department = department
    if (isActive !== 'all') where.isActive = isActive === 'true'

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { position: { contains: String(search), mode: 'insensitive' } }
        ]
      }
    }

    const [members, total] = await Promise.all([
      prisma.organizationMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              avatar: true,
              position: true,
              department: true,
              phone: true,
              bio: true,
              lastActiveAt: true,
              isActive: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.organizationMember.count({ where })
    ])

    // Get online status for each member
    const membersWithStatus = await Promise.all(
      members.map(async (member) => {
        const onlineStatus = await getOnlineStatus(member.userId)
        const projectCount = await prisma.projectMember.count({
          where: { userId: member.userId }
        })
        const taskCount = await prisma.task.count({
          where: { 
            assignedToId: member.userId,
            status: { in: ['TODO', 'IN_PROGRESS'] }
          }
        })

        return {
          ...member,
          user: {
            ...member.user,
            onlineStatus,
            projectCount,
            activeTasks: taskCount
          }
        }
      })
    )

    res.json({
      members: membersWithStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get team members error:', error)
    res.status(500).json({ error: 'Failed to get team members' })
  }
}

/**
 * Get team member details
 */
export const getTeamMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: id,
        organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true,
            department: true,
            phone: true,
            bio: true,
            website: true,
            linkedin: true,
            lastActiveAt: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    // Get additional member data
    const [
      projects,
      activeTasks,
      completedTasks,
      recentActivity,
      onlineStatus
    ] = await Promise.all([
      prisma.projectMember.findMany({
        where: { userId: id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              progress: true
            }
          }
        },
        take: 10,
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.task.findMany({
        where: {
          assignedToId: id,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        },
        include: {
          project: {
            select: { name: true, code: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.count({
        where: {
          assignedToId: id,
          status: 'COMPLETED'
        }
      }),
      getRecentActivity(id, organizationId),
      getOnlineStatus(id)
    ])

    const enrichedMember = {
      ...member,
      user: {
        ...member.user,
        onlineStatus,
        projects,
        activeTasks,
        completedTasksCount: completedTasks,
        recentActivity
      }
    }

    res.json(enrichedMember)
  } catch (error) {
    console.error('Get team member error:', error)
    res.status(500).json({ error: 'Failed to get team member' })
  }
}

/**
 * Update team member role and permissions
 */
export const updateTeamMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('team.manage')) {
      return res.status(403).json({ error: 'No permission to manage team members' })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: id,
        organizationId
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    const {
      role,
      permissions,
      department,
      title,
      isActive
    } = req.body

    const updateData: any = {}
    
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions
    if (department !== undefined) updateData.department = department
    if (title !== undefined) updateData.title = title
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedMember = await prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: id,
          organizationId
        }
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'team_member',
        resourceId: id,
        oldValues: { role: member.role, isActive: member.isActive },
        newValues: updateData
      }
    })

    res.json(updatedMember)
  } catch (error) {
    console.error('Update team member error:', error)
    res.status(500).json({ error: 'Failed to update team member' })
  }
}

/**
 * Remove team member from organization
 */
export const removeTeamMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('team.manage')) {
      return res.status(403).json({ error: 'No permission to remove team members' })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: id,
        organizationId
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    // Don't allow removing the last admin
    if (member.role === 'ORG_ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ORG_ADMIN',
          isActive: true
        }
      })

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove the last organization admin' 
        })
      }
    }

    // Remove from organization
    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: id,
          organizationId
        }
      }
    })

    // Remove from all projects in this organization
    await prisma.projectMember.deleteMany({
      where: {
        userId: id,
        project: {
          organizationId
        }
      }
    })

    // Unassign from all tasks in this organization
    await prisma.task.updateMany({
      where: {
        assignedToId: id,
        organizationId
      },
      data: {
        assignedToId: null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'remove',
        resource: 'team_member',
        resourceId: id,
        oldValues: { 
          name: `${member.user.firstName} ${member.user.lastName}`,
          email: member.user.email,
          role: member.role 
        }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({ error: 'Failed to remove team member' })
  }
}

/**
 * Get team analytics and statistics
 */
export const getTeamAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const [
      totalMembers,
      activeMembers,
      membersByRole,
      membersByDepartment,
      recentJoiners,
      topPerformers,
      teamUtilization
    ] = await Promise.all([
      prisma.organizationMember.count({
        where: { organizationId }
      }),
      prisma.organizationMember.count({
        where: { organizationId, isActive: true }
      }),
      prisma.organizationMember.groupBy({
        by: ['role'],
        where: { organizationId, isActive: true },
        _count: true
      }),
      prisma.organizationMember.groupBy({
        by: ['department'],
        where: { 
          organizationId, 
          isActive: true,
          department: { not: null }
        },
        _count: true
      }),
      prisma.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              position: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: 5
      }),
      getTopPerformers(organizationId),
      getTeamUtilization(organizationId)
    ])

    const analytics = {
      summary: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        utilizationRate: teamUtilization.averageUtilization
      },
      distribution: {
        byRole: membersByRole.map(item => ({
          role: item.role,
          count: item._count
        })),
        byDepartment: membersByDepartment.map(item => ({
          department: item.department,
          count: item._count
        }))
      },
      recentJoiners,
      topPerformers,
      utilization: teamUtilization.memberUtilization
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get team analytics error:', error)
    res.status(500).json({ error: 'Failed to get team analytics' })
  }
}

/**
 * Get team workload distribution
 */
export const getTeamWorkload = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    const workload = await Promise.all(
      members.map(async (member) => {
        const [
          activeTasks,
          projectsCount,
          overdueTasksCount,
          completedThisMonth,
          estimatedHours
        ] = await Promise.all([
          prisma.task.count({
            where: {
              assignedToId: member.userId,
              status: { in: ['TODO', 'IN_PROGRESS'] }
            }
          }),
          prisma.projectMember.count({
            where: { userId: member.userId }
          }),
          prisma.task.count({
            where: {
              assignedToId: member.userId,
              status: { in: ['TODO', 'IN_PROGRESS'] },
              dueDate: { lt: new Date() }
            }
          }),
          prisma.task.count({
            where: {
              assignedToId: member.userId,
              status: 'COMPLETED',
              completedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          prisma.task.aggregate({
            where: {
              assignedToId: member.userId,
              status: { in: ['TODO', 'IN_PROGRESS'] }
            },
            _sum: { estimatedHours: true }
          })
        ])

        // Calculate workload level
        let workloadLevel = 'LOW'
        if (activeTasks > 10 || (estimatedHours._sum.estimatedHours || 0) > 40) {
          workloadLevel = 'HIGH'
        } else if (activeTasks > 5 || (estimatedHours._sum.estimatedHours || 0) > 20) {
          workloadLevel = 'MEDIUM'
        }

        return {
          member: member.user,
          role: member.role,
          department: member.department,
          workload: {
            activeTasks,
            projectsCount,
            overdueTasksCount,
            completedThisMonth,
            estimatedHours: estimatedHours._sum.estimatedHours || 0,
            level: workloadLevel
          }
        }
      })
    )

    // Sort by workload level
    const sortedWorkload = workload.sort((a, b) => {
      const levelOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      return levelOrder[b.workload.level as keyof typeof levelOrder] - 
             levelOrder[a.workload.level as keyof typeof levelOrder]
    })

    res.json({
      workload: sortedWorkload,
      summary: {
        averageActiveTasks: workload.reduce((sum, w) => sum + w.workload.activeTasks, 0) / workload.length,
        totalActiveTasks: workload.reduce((sum, w) => sum + w.workload.activeTasks, 0),
        overloadedMembers: workload.filter(w => w.workload.level === 'HIGH').length,
        availableMembers: workload.filter(w => w.workload.level === 'LOW').length
      }
    })
  } catch (error) {
    console.error('Get team workload error:', error)
    res.status(500).json({ error: 'Failed to get team workload' })
  }
}

/**
 * Get online status for a user (simplified implementation)
 */
async function getOnlineStatus(userId: string) {
  // Check if user has been active in the last 15 minutes
  const recentSession = await prisma.session.findFirst({
    where: {
      userId,
      lastUsedAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      }
    }
  })

  return recentSession ? 'online' : 'offline'
}

/**
 * Get recent activity for a user
 */
async function getRecentActivity(userId: string, organizationId: string) {
  const activities = await prisma.auditLog.findMany({
    where: {
      userId,
      organizationId
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return activities.map(activity => ({
    action: activity.action,
    resource: activity.resource,
    resourceId: activity.resourceId,
    createdAt: activity.createdAt
  }))
}

/**
 * Get top performers based on completed tasks
 */
async function getTopPerformers(organizationId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const performers = await prisma.task.groupBy({
    by: ['assignedToId'],
    where: {
      organizationId,
      status: 'COMPLETED',
      completedAt: { gte: thirtyDaysAgo },
      assignedToId: { not: null }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  })

  const enrichedPerformers = await Promise.all(
    performers.map(async (performer) => {
      const user = await prisma.user.findUnique({
        where: { id: performer.assignedToId! },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          position: true
        }
      })

      return {
        user,
        completedTasks: performer._count.id
      }
    })
  )

  return enrichedPerformers.filter(p => p.user)
}

/**
 * Get team utilization statistics
 */
async function getTeamUtilization(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      isActive: true
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  const memberUtilization = await Promise.all(
    members.map(async (member) => {
      const [activeTasks, totalCapacity] = await Promise.all([
        prisma.task.aggregate({
          where: {
            assignedToId: member.userId,
            status: { in: ['TODO', 'IN_PROGRESS'] }
          },
          _sum: { estimatedHours: true }
        }),
        40 // Assume 40 hours per week capacity
      ])

      const utilization = totalCapacity > 0 ? 
        Math.min(((activeTasks._sum.estimatedHours || 0) / totalCapacity) * 100, 100) : 0

      return {
        user: member.user,
        utilization,
        estimatedHours: activeTasks._sum.estimatedHours || 0
      }
    })
  )

  const averageUtilization = memberUtilization.length > 0 ?
    memberUtilization.reduce((sum, m) => sum + m.utilization, 0) / memberUtilization.length : 0

  return {
    memberUtilization,
    averageUtilization
  }
}