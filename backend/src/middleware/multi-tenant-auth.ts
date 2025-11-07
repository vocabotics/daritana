import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

export interface MultiTenantRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
    role: string // System role
    organizationId: string
    organizationRole: string // Role within organization
    organizationName?: string
    permissions?: string[]
  }
  organization?: {
    id: string
    name: string
    slug: string
    planId: string
    features?: string[]
    limits?: {
      maxUsers: number
      maxProjects: number
      maxStorage: number
      usedStorage: number
    }
  }
}

/**
 * Enhanced multi-tenant authentication middleware
 * Handles organization context and permissions
 */
export const authenticateMultiTenant = async (
  req: MultiTenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const organizationId = req.headers['x-organization-id'] as string || req.query.organizationId as string

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      username?: string
      role?: string
    }

    // Get user with all organization memberships
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              include: {
                plan: true
              }
            }
          }
        },
        sessions: {
          where: { 
            token,
            expiresAt: { gt: new Date() }
          }
        }
      }
    })

    if (!user || user.sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is not active' })
    }

    // Determine organization context
    let selectedOrg = null
    let orgMembership = null

    if (organizationId) {
      // Use specified organization
      orgMembership = user.organizationMemberships.find(om => om.organizationId === organizationId)
      if (!orgMembership) {
        return res.status(403).json({ error: 'Not a member of this organization' })
      }
      selectedOrg = orgMembership.organization
    } else if (user.organizationMemberships.length === 1) {
      // Auto-select if user has only one organization
      orgMembership = user.organizationMemberships[0]
      selectedOrg = orgMembership.organization
    } else if (user.organizationMemberships.length > 1) {
      // Multiple organizations - require selection
      return res.status(400).json({ 
        error: 'Organization selection required',
        organizations: user.organizationMemberships.map(om => ({
          id: om.organizationId,
          name: om.organization.name,
          role: om.role
        }))
      })
    } else {
      // No organizations
      return res.status(403).json({ error: 'Not a member of any organization' })
    }

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: orgMembership.role,
        organizationId: selectedOrg.id
      }
    })

    // Set request context
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username || user.email,
      role: user.role || 'USER', // System role
      organizationId: selectedOrg.id,
      organizationRole: orgMembership.role, // Organization role
      organizationName: selectedOrg.name,
      permissions: rolePermissions.map(rp => rp.permission)
    }

    req.organization = {
      id: selectedOrg.id,
      name: selectedOrg.name,
      slug: selectedOrg.slug,
      planId: selectedOrg.planId,
      features: selectedOrg.plan.features,
      limits: {
        maxUsers: selectedOrg.maxUsers,
        maxProjects: selectedOrg.maxProjects,
        maxStorage: selectedOrg.maxStorage,
        usedStorage: selectedOrg.usedStorage
      }
    }

    // Update session activity
    await prisma.session.update({
      where: { token },
      data: {
        lastActivityAt: new Date(),
        organizationId: selectedOrg.id
      }
    })

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: MultiTenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      })
    }

    next()
  }
}

/**
 * Check if user has one of the specified organization roles
 */
export const requireOrgRole = (roles: string[]) => {
  return (req: MultiTenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.organizationRole)) {
      return res.status(403).json({ 
        error: 'Insufficient role permissions',
        required: roles,
        current: req.user.organizationRole
      })
    }

    next()
  }
}

/**
 * Check if organization has specific feature in their plan
 */
export const requireFeature = (feature: string) => {
  return (req: MultiTenantRequest, res: Response, next: NextFunction) => {
    if (!req.organization) {
      return res.status(401).json({ error: 'Organization context required' })
    }

    if (!req.organization.features?.includes(feature)) {
      return res.status(403).json({ 
        error: 'Feature not available in current plan',
        required: feature,
        upgrade: true
      })
    }

    next()
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalMultiTenantAuth = async (
  req: MultiTenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      await authenticateMultiTenant(req, res, () => {})
    }
  } catch {
    // Ignore errors for optional auth
  }

  next()
}

/**
 * Switch organization context for authenticated user
 */
export const switchOrganization = async (
  req: MultiTenantRequest,
  res: Response
) => {
  try {
    const { organizationId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token || !req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Check if user is member of target organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId
        }
      },
      include: {
        organization: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    // Update session with new organization context
    await prisma.session.update({
      where: { token },
      data: { organizationId }
    })

    // Generate new token with organization context
    const newToken = jwt.sign(
      {
        userId: req.user.id,
        email: req.user.email,
        username: req.user.username,
        organizationId,
        organizationRole: membership.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token: newToken,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        role: membership.role
      }
    })
  } catch (error) {
    console.error('Switch organization error:', error)
    res.status(500).json({ error: 'Failed to switch organization' })
  }
}