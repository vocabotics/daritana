import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Add team member to project
 */
export const addProjectMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const { userId, role = 'MEMBER', permissions = ['view', 'comment'] } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and belongs to organization
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

    // Check if user has permission to manage team
    const hasManageAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                           req.user?.organizationRole === 'PROJECT_LEAD' ||
                           project.members.some(m => 
                             m.userId === req.user?.id && 
                             m.permissions.includes('manage_team')
                           )

    if (!hasManageAccess) {
      return res.status(403).json({ error: 'No permission to manage project team' })
    }

    // Check if user is member of organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId
      }
    })

    if (!orgMember) {
      return res.status(400).json({ error: 'User is not a member of this organization' })
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    })

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' })
    }

    // Add member
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
        permissions
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
        action: 'create',
        resource: 'project_member',
        resourceId: projectMember.id,
        newValues: { projectId, userId, role, permissions }
      }
    })

    res.status(201).json(projectMember)
  } catch (error) {
    console.error('Add project member error:', error)
    res.status(500).json({ error: 'Failed to add project member' })
  }
}

/**
 * List project team members
 */
export const listProjectMembers = async (req: MultiTenantRequest, res: Response) => {
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

    const members = await prisma.projectMember.findMany({
      where: { projectId },
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
      },
      orderBy: { joinedAt: 'asc' }
    })

    res.json(members)
  } catch (error) {
    console.error('List project members error:', error)
    res.status(500).json({ error: 'Failed to list project members' })
  }
}

/**
 * Update project member role/permissions
 */
export const updateProjectMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, memberId } = req.params
    const { role, permissions } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has manage access
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

    const hasManageAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                           req.user?.organizationRole === 'PROJECT_LEAD' ||
                           project.members.some(m => 
                             m.userId === req.user?.id && 
                             m.permissions.includes('manage_team')
                           )

    if (!hasManageAccess) {
      return res.status(403).json({ error: 'No permission to manage project team' })
    }

    // Check if member exists
    const member = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Project member not found' })
    }

    // Update member
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
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
        resource: 'project_member',
        resourceId: memberId,
        newValues: updateData
      }
    })

    res.json(updatedMember)
  } catch (error) {
    console.error('Update project member error:', error)
    res.status(500).json({ error: 'Failed to update project member' })
  }
}

/**
 * Remove project member
 */
export const removeProjectMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId, memberId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has manage access
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

    const hasManageAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                           req.user?.organizationRole === 'PROJECT_LEAD' ||
                           project.members.some(m => 
                             m.userId === req.user?.id && 
                             m.permissions.includes('manage_team')
                           )

    if (!hasManageAccess) {
      return res.status(403).json({ error: 'No permission to manage project team' })
    }

    // Check if member exists
    const member = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Project member not found' })
    }

    // Prevent removing project manager
    if (member.role === 'LEAD' && member.userId === project.managerId) {
      return res.status(400).json({ error: 'Cannot remove project manager' })
    }

    // Remove member
    await prisma.projectMember.delete({
      where: { id: memberId }
    })

    // Unassign from all tasks in this project
    await prisma.task.updateMany({
      where: {
        projectId,
        assignedToId: member.userId
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
        action: 'delete',
        resource: 'project_member',
        resourceId: memberId,
        oldValues: { projectId, userId: member.userId, role: member.role }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Remove project member error:', error)
    res.status(500).json({ error: 'Failed to remove project member' })
  }
}

/**
 * Bulk assign users to projects
 */
export const bulkAssignMembers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const { userIds, role = 'MEMBER', permissions = ['view', 'comment'] } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' })
    }

    // Check if project exists
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
    const hasManageAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                           req.user?.organizationRole === 'PROJECT_LEAD' ||
                           project.members.some(m => 
                             m.userId === req.user?.id && 
                             m.permissions.includes('manage_team')
                           )

    if (!hasManageAccess) {
      return res.status(403).json({ error: 'No permission to manage project team' })
    }

    // Verify all users are organization members
    const orgMembers = await prisma.organizationMember.findMany({
      where: {
        userId: { in: userIds },
        organizationId
      }
    })

    if (orgMembers.length !== userIds.length) {
      return res.status(400).json({ error: 'Some users are not members of this organization' })
    }

    // Filter out existing members
    const existingMemberIds = project.members.map(m => m.userId)
    const newUserIds = userIds.filter(id => !existingMemberIds.includes(id))

    if (newUserIds.length === 0) {
      return res.status(400).json({ error: 'All users are already project members' })
    }

    // Create project members
    const memberData = newUserIds.map(userId => ({
      projectId,
      userId,
      role,
      permissions
    }))

    await prisma.projectMember.createMany({
      data: memberData
    })

    // Get created members with user details
    const newMembers = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { in: newUserIds }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'project_members_bulk',
        resourceId: projectId,
        newValues: { userIds: newUserIds, role, permissions, count: newUserIds.length }
      }
    })

    res.status(201).json({
      success: true,
      addedMembers: newMembers,
      skippedCount: userIds.length - newUserIds.length
    })
  } catch (error) {
    console.error('Bulk assign members error:', error)
    res.status(500).json({ error: 'Failed to assign members' })
  }
}

/**
 * Get project member statistics
 */
export const getProjectMemberStats = async (req: MultiTenantRequest, res: Response) => {
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

    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => m.userId === req.user?.id)

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this project' })
    }

    const [totalMembers, roleDistribution, recentJoins] = await Promise.all([
      prisma.projectMember.count({
        where: { projectId }
      }),
      prisma.projectMember.groupBy({
        by: ['role'],
        where: { projectId },
        _count: true
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: 5
      })
    ])

    res.json({
      totalMembers,
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: r._count
      })),
      recentJoins
    })
  } catch (error) {
    console.error('Get project member stats error:', error)
    res.status(500).json({ error: 'Failed to get member statistics' })
  }
}