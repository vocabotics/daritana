import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * List organization members
 */
export const listOrganizationMembers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const { page = 1, limit = 20, role, department, search } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    if (role) {
      where.role = role
    }

    if (department) {
      where.department = department
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: String(search), mode: 'insensitive' } },
          { name: { contains: String(search), mode: 'insensitive' } },
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName: { contains: String(search), mode: 'insensitive' } }
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
              name: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
              department: true,
              lastLogin: true,
              isActive: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.organizationMember.count({ where })
    ])

    res.json({
      members,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List members error:', error)
    res.status(500).json({ error: 'Failed to list organization members' })
  }
}

/**
 * Get single organization member
 */
export const getOrganizationMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId
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
            bio: true,
            position: true,
            department: true,
            phone: true,
            website: true,
            linkedin: true,
            lastLogin: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }

    res.json(member)
  } catch (error) {
    console.error('Get member error:', error)
    res.status(500).json({ error: 'Failed to get member details' })
  }
}

/**
 * Update organization member role
 */
export const updateMemberRole = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const { role } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if user has permission
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    // Validate role
    const validRoles = [
      'ORG_ADMIN', 'PROJECT_LEAD', 'SENIOR_DESIGNER', 'SENIOR_ARCHITECT',
      'DESIGNER', 'ARCHITECT', 'CONTRACTOR', 'ENGINEER', 'STAFF',
      'CLIENT', 'CONSULTANT', 'MEMBER', 'VIEWER'
    ]

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Prevent removing last admin
    if (req.user.organizationRole === 'ORG_ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ORG_ADMIN'
        }
      })

      if (adminCount === 1 && role !== 'ORG_ADMIN') {
        const member = await prisma.organizationMember.findFirst({
          where: { id: memberId, organizationId }
        })
        
        if (member?.role === 'ORG_ADMIN') {
          return res.status(400).json({ error: 'Cannot remove last organization admin' })
        }
      }
    }

    const updatedMember = await prisma.organizationMember.update({
      where: {
        id: memberId
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'update',
        resource: 'organization_member',
        resourceId: memberId,
        newValues: { role }
      }
    })

    res.json(updatedMember)
  } catch (error) {
    console.error('Update member role error:', error)
    res.status(500).json({ error: 'Failed to update member role' })
  }
}

/**
 * Update member details
 */
export const updateMemberDetails = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const { department, title, permissions, isActive } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if user has permission
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    const updateData: any = {}
    
    if (department !== undefined) updateData.department = department
    if (title !== undefined) updateData.title = title
    if (permissions !== undefined) updateData.permissions = permissions
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    res.json(updatedMember)
  } catch (error) {
    console.error('Update member details error:', error)
    res.status(500).json({ error: 'Failed to update member details' })
  }
}

/**
 * Remove member from organization
 */
export const removeMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if user has permission
    if (!req.user?.permissions?.includes('members.remove')) {
      return res.status(403).json({ error: 'No permission to remove members' })
    }

    // Get member details
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }

    // Prevent removing last admin
    if (member.role === 'ORG_ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ORG_ADMIN'
        }
      })

      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot remove last organization admin' })
      }
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: { id: memberId }
    })

    // Remove from all projects
    await prisma.projectMember.deleteMany({
      where: {
        userId: member.userId,
        project: {
          organizationId
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'delete',
        resource: 'organization_member',
        resourceId: memberId,
        oldValues: { userId: member.userId, role: member.role }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ error: 'Failed to remove member' })
  }
}

/**
 * Get member statistics
 */
export const getMemberStats = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const [totalMembers, activeMembers, roleDistribution, departmentDistribution] = await Promise.all([
      prisma.organizationMember.count({
        where: { organizationId }
      }),
      prisma.organizationMember.count({
        where: { organizationId, isActive: true }
      }),
      prisma.organizationMember.groupBy({
        by: ['role'],
        where: { organizationId },
        _count: true
      }),
      prisma.organizationMember.groupBy({
        by: ['department'],
        where: { 
          organizationId,
          department: { not: null }
        },
        _count: true
      })
    ])

    const recentlyJoined = await prisma.organizationMember.findMany({
      where: { organizationId },
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

    res.json({
      totalMembers,
      activeMembers,
      inactiveMembers: totalMembers - activeMembers,
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: r._count
      })),
      departmentDistribution: departmentDistribution.map(d => ({
        department: d.department,
        count: d._count
      })),
      recentlyJoined,
      limits: {
        maxMembers: req.organization?.limits?.maxUsers || 0,
        usedMembers: totalMembers,
        availableSlots: (req.organization?.limits?.maxUsers || 0) - totalMembers
      }
    })
  } catch (error) {
    console.error('Get member stats error:', error)
    res.status(500).json({ error: 'Failed to get member statistics' })
  }
}