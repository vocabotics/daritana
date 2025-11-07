import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get all members in the organization
 */
export const getOrganizationMembers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(members)
  } catch (error) {
    console.error('Error fetching organization members:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
}

/**
 * Add a new member to the organization
 */
export const addOrganizationMember = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId, role, permissions } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if user has permission to add members
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    // Check if member already exists
    const existing = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' })
    }

    // Add member
    const member = await prisma.organizationMember.create({
      data: {
        userId,
        organizationId,
        role,
        permissions: permissions || ['view']
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    res.status(201).json(member)
  } catch (error) {
    console.error('Error adding organization member:', error)
    res.status(500).json({ error: 'Failed to add member' })
  }
}

/**
 * Update member role
 */
export const updateMemberRole = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const { role } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    const member = await prisma.organizationMember.update({
      where: {
        id: memberId,
        organizationId
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

    res.json(member)
  } catch (error) {
    console.error('Error updating member role:', error)
    res.status(500).json({ error: 'Failed to update role' })
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

    // Check permissions
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    // Can't remove yourself
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId }
    })

    if (member?.userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from organization' })
    }

    await prisma.organizationMember.delete({
      where: {
        id: memberId,
        organizationId
      }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error removing member:', error)
    res.status(500).json({ error: 'Failed to remove member' })
  }
}

/**
 * Bulk invite members
 */
export const bulkInviteMembers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { emails, role, message } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('members.invite')) {
      return res.status(403).json({ error: 'No permission to invite members' })
    }

    const results = []
    
    for (const email of emails) {
      try {
        // Check if already invited
        const existing = await prisma.invitation.findFirst({
          where: {
            email,
            organizationId,
            status: 'PENDING'
          }
        })

        if (existing) {
          results.push({ email, status: 'already_invited' })
          continue
        }

        // Create invitation
        const invitation = await prisma.invitation.create({
          data: {
            email,
            organizationId,
            role,
            invitedBy: req.user?.id!,
            message,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })

        results.push({ email, status: 'invited', id: invitation.id })
      } catch (error) {
        results.push({ email, status: 'failed' })
      }
    }

    res.json({ results })
  } catch (error) {
    console.error('Error bulk inviting members:', error)
    res.status(500).json({ error: 'Failed to invite members' })
  }
}

/**
 * Get member permissions
 */
export const getMemberPermissions = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        id: memberId,
        organizationId
      },
      select: {
        role: true,
        permissions: true
      }
    })

    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        organizationId,
        role: member.role
      },
      select: {
        page: true,
        feature: true,
        canView: true,
        canEdit: true,
        canDelete: true
      }
    })

    res.json({
      role: member.role,
      customPermissions: member.permissions,
      rolePermissions
    })
  } catch (error) {
    console.error('Error fetching member permissions:', error)
    res.status(500).json({ error: 'Failed to fetch permissions' })
  }
}

/**
 * Update member permissions
 */
export const updateMemberPermissions = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { memberId } = req.params
    const { permissions } = req.body
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check permissions
    if (!req.user?.permissions?.includes('members.manage')) {
      return res.status(403).json({ error: 'No permission to manage members' })
    }

    const member = await prisma.organizationMember.update({
      where: {
        id: memberId,
        organizationId
      },
      data: { permissions },
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

    res.json(member)
  } catch (error) {
    console.error('Error updating member permissions:', error)
    res.status(500).json({ error: 'Failed to update permissions' })
  }
}