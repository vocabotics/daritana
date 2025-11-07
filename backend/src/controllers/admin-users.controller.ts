import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'
import { hashPassword } from '../utils/password.utils'

/**
 * Get all users across all organizations (System Admin only)
 */
export const getAllUsers = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search, status, role } = req.query

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.isActive = status === 'active'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          organizations: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true
                }
              }
            }
          },
          systemAdmin: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [projectCount, taskCount, loginCount] = await Promise.all([
          prisma.projectMember.count({
            where: { userId: user.id }
          }),
          prisma.task.count({
            where: { assignedToId: user.id }
          }),
          // Mock login count - in real implementation, track this
          Promise.resolve(Math.floor(Math.random() * 100) + 10)
        ])

        return {
          ...user,
          statistics: {
            projects: projectCount,
            tasks: taskCount,
            logins: loginCount,
            lastLogin: user.lastLogin
          }
        }
      })
    )

    res.json({
      users: usersWithStats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

/**
 * Get user details by ID
 */
export const getUserById = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        systemAdmin: true,
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user activity statistics
    const [projectCount, taskCount, documentCount, auditLogCount] = await Promise.all([
      prisma.projectMember.count({
        where: { userId }
      }),
      prisma.task.count({
        where: { assignedToId: userId }
      }),
      prisma.document.count({
        where: { uploadedById: userId, deletedAt: null }
      }),
      prisma.auditLog.count({
        where: { userId }
      })
    ])

    // Get recent activities
    const recentActivities = await prisma.auditLog.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json({
      user,
      statistics: {
        projects: projectCount,
        tasks: taskCount,
        documents: documentCount,
        activities: auditLogCount
      },
      recentActivities
    })
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch user details' })
  }
}

/**
 * Create new user (System Admin only)
 */
export const createUser = async (req: MultiTenantRequest, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      organizationId,
      role = 'MEMBER',
      isSystemAdmin = false
    } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Validate organization if provided
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      })

      if (!organization) {
        return res.status(400).json({ error: 'Organization not found' })
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        isActive: true,
        emailVerified: true, // Admin-created users are pre-verified
        organizations: organizationId ? {
          create: {
            organizationId,
            role,
            joinedAt: new Date(),
            isActive: true
          }
        } : undefined,
        systemAdmin: isSystemAdmin ? {
          create: {
            role: 'SUPPORT',
            permissions: ['READ_USERS', 'READ_ORGANIZATIONS']
          }
        } : undefined
      },
      include: {
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        systemAdmin: true
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        organizationId: organizationId || null,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: user.id,
        details: {
          targetUser: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          assignedRole: role,
          isSystemAdmin
        }
      }
    })

    res.status(201).json({ user })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

/**
 * Update user (System Admin only)
 */
export const updateUser = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId } = req.params
    const {
      name,
      email,
      phone,
      isActive,
      password,
      systemAdminRole,
      systemAdminPermissions
    } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { systemAdmin: true }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return res.status(400).json({ error: 'Email already taken by another user' })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      updateData.password = await hashPassword(password)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        systemAdmin: true
      }
    })

    // Update system admin if needed
    if (systemAdminRole !== undefined || systemAdminPermissions !== undefined) {
      if (existingUser.systemAdmin) {
        await prisma.systemAdmin.update({
          where: { userId },
          data: {
            role: systemAdminRole,
            permissions: systemAdminPermissions
          }
        })
      } else if (systemAdminRole) {
        await prisma.systemAdmin.create({
          data: {
            userId,
            role: systemAdminRole,
            permissions: systemAdminPermissions || []
          }
        })
      }
    }

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER',
        resourceType: 'USER',
        resourceId: userId,
        details: {
          targetUser: {
            id: userId,
            email: updatedUser.email,
            name: updatedUser.name
          },
          changes: updateData
        }
      }
    })

    res.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

/**
 * Delete user (System Admin only)
 */
export const deleteUser = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { transferDataTo } = req.body

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: true,
        systemAdmin: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent self-deletion
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    // Check if user is the only admin of any organization
    const adminOrgs = await prisma.organizationMember.findMany({
      where: {
        userId,
        role: 'ORG_ADMIN'
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                role: 'ORG_ADMIN',
                isActive: true
              }
            }
          }
        }
      }
    })

    const soloAdminOrgs = adminOrgs.filter(
      member => member.organization.members.length === 1
    )

    if (soloAdminOrgs.length > 0 && !transferDataTo) {
      return res.status(400).json({
        error: 'Cannot delete user who is the sole admin of organizations',
        soloAdminOrganizations: soloAdminOrgs.map(m => ({
          id: m.organization.id,
          name: m.organization.name
        }))
      })
    }

    // Transfer data if specified
    if (transferDataTo) {
      const transferUser = await prisma.user.findUnique({
        where: { id: transferDataTo }
      })

      if (!transferUser) {
        return res.status(400).json({ error: 'Transfer target user not found' })
      }

      // Transfer projects, tasks, documents, etc.
      await prisma.$transaction([
        // Transfer project ownership
        prisma.project.updateMany({
          where: { createdById: userId },
          data: { createdById: transferDataTo }
        }),
        // Transfer task assignments
        prisma.task.updateMany({
          where: { assignedToId: userId },
          data: { assignedToId: transferDataTo }
        }),
        // Transfer document ownership
        prisma.document.updateMany({
          where: { uploadedById: userId },
          data: { uploadedById: transferDataTo }
        })
      ])
    }

    // Soft delete user (deactivate instead of hard delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
        deletedAt: new Date()
      }
    })

    // Deactivate organization memberships
    await prisma.organizationMember.updateMany({
      where: { userId },
      data: { isActive: false }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: userId,
        details: {
          targetUser: {
            id: userId,
            email: user.email,
            name: user.name
          },
          transferDataTo,
          organizationCount: user.organizations.length
        }
      }
    })

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

/**
 * Get user analytics
 */
export const getUserAnalytics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      totalUsers,
      activeUsers,
      newUsers,
      systemAdmins,
      organizationAdmins,
      userGrowth,
      topOrganizations
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { isActive: true }
      }),
      // Active users (logged in recently)
      prisma.user.count({
        where: {
          isActive: true,
          lastLogin: {
            gte: startDate
          }
        }
      }),
      // New users in timeframe
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      // System admins
      prisma.systemAdmin.count(),
      // Organization admins
      prisma.organizationMember.count({
        where: {
          role: 'ORG_ADMIN',
          isActive: true
        }
      }),
      // User growth over time
      Promise.all(
        Array.from({ length: days }, async (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (days - 1 - i))
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)

          const count = await prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          })

          return {
            date: date.toISOString().split('T')[0],
            count
          }
        })
      ),
      // Top organizations by user count
      prisma.organization.findMany({
        include: {
          members: {
            where: { isActive: true }
          }
        },
        take: 10
      })
    ])

    const organizationStats = topOrganizations
      .map(org => ({
        id: org.id,
        name: org.name,
        userCount: org.members.length,
        status: org.status
      }))
      .sort((a, b) => b.userCount - a.userCount)

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        systemAdmins,
        organizationAdmins,
        activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      },
      growth: userGrowth,
      organizations: organizationStats,
      timeframe
    })
  } catch (error) {
    console.error('Get user analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch user analytics' })
  }
}

/**
 * Bulk user operations
 */
export const bulkUserOperations = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { operation, userIds, data } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' })
    }

    let result: any = {}

    switch (operation) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds }
          },
          data: { isActive: true }
        })
        break

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds }
          },
          data: { isActive: false }
        })
        break

      case 'delete':
        // Soft delete
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds }
          },
          data: {
            isActive: false,
            deletedAt: new Date()
          }
        })
        break

      case 'export':
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds }
          },
          include: {
            organizations: {
              include: {
                organization: {
                  select: {
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        })

        return res.json({
          success: true,
          data: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            organizations: user.organizations.map(org => ({
              name: org.organization.name,
              role: org.role
            }))
          }))
        })

      default:
        return res.status(400).json({ error: 'Invalid operation' })
    }

    // Log bulk operation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `BULK_${operation.toUpperCase()}_USERS`,
        resourceType: 'USER',
        details: {
          operation,
          userCount: userIds.length,
          userIds
        }
      }
    })

    res.json({
      success: true,
      message: `Bulk ${operation} completed`,
      affected: result.count || userIds.length
    })
  } catch (error) {
    console.error('Bulk user operations error:', error)
    res.status(500).json({ error: 'Failed to perform bulk operation' })
  }
}