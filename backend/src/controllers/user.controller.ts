import { Request, Response, NextFunction } from 'express'
import { User, UserRole, UserStatus } from '../models/User'
import { ApiError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { logger } from '../utils/logger'
import { Op } from 'sequelize'

export class UserController {
  // Get all users with filtering and pagination
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const offset = (pageNum - 1) * limitNum

      // Build where clause
      const where: any = {}
      
      if (role) {
        where.role = role
      }
      
      if (status) {
        where.status = status
      }
      
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { companyName: { [Op.iLike]: `%${search}%` } }
        ]
      }

      const users = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires'] },
        order: [[sortBy as string, sortOrder as string]],
        limit: limitNum,
        offset
      })

      res.json({
        users: users.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: users.count,
          pages: Math.ceil(users.count / limitNum)
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Get user by ID
  static async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires'] }
      })

      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      res.json({ user })
    } catch (error) {
      next(error)
    }
  }

  // Get current user profile
  static async getCurrentUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires'] }
      })

      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      res.json({ user })
    } catch (error) {
      next(error)
    }
  }

  // Update user profile
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updateData = req.body

      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, emailVerificationToken, passwordResetToken, passwordResetExpires, ...allowedUpdates } = updateData

      const user = await User.findByPk(id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      // Check if user can update this profile
      if (req.user?.id !== id && req.user?.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'You can only update your own profile', 'ACCESS_DENIED')
      }

      // Only admins can change role and status
      if ((allowedUpdates.role || allowedUpdates.status) && req.user?.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'Only administrators can change user role or status', 'ADMIN_REQUIRED')
      }

      await user.update(allowedUpdates)

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires'] }
      })

      logger.info(`User profile updated: ${user.email} by ${req.user?.email}`)

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      })
    } catch (error) {
      next(error)
    }
  }

  // Update current user profile
  static async updateCurrentUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const updateData = req.body

      // Remove sensitive and admin-only fields
      const { password, role, status, emailVerificationToken, passwordResetToken, passwordResetExpires, ...allowedUpdates } = updateData

      const user = await User.findByPk(req.user.id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      await user.update(allowedUpdates)

      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires'] }
      })

      logger.info(`User updated own profile: ${user.email}`)

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      })
    } catch (error) {
      next(error)
    }
  }

  // Delete user (soft delete)
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Only admins can delete users
      if (req.user.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'Only administrators can delete users', 'ADMIN_REQUIRED')
      }

      const user = await User.findByPk(id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      // Can't delete yourself
      if (id === req.user.id) {
        throw new ApiError(400, 'You cannot delete your own account', 'CANNOT_DELETE_SELF')
      }

      // Soft delete by updating status
      await user.update({ status: UserStatus.DELETED })

      logger.info(`User deleted: ${user.email} by ${req.user.email}`)

      res.json({
        message: 'User deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Suspend user
  static async suspendUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { reason } = req.body

      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Only admins can suspend users
      if (req.user.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'Only administrators can suspend users', 'ADMIN_REQUIRED')
      }

      const user = await User.findByPk(id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      // Can't suspend yourself
      if (id === req.user.id) {
        throw new ApiError(400, 'You cannot suspend your own account', 'CANNOT_SUSPEND_SELF')
      }

      await user.update({
        status: UserStatus.SUSPENDED,
        metadata: {
          ...user.metadata,
          suspensionReason: reason,
          suspendedBy: req.user.id,
          suspendedAt: new Date()
        }
      })

      logger.info(`User suspended: ${user.email} by ${req.user.email}. Reason: ${reason}`)

      res.json({
        message: 'User suspended successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Reactivate user
  static async reactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Only admins can reactivate users
      if (req.user.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'Only administrators can reactivate users', 'ADMIN_REQUIRED')
      }

      const user = await User.findByPk(id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      await user.update({
        status: UserStatus.ACTIVE,
        metadata: {
          ...user.metadata,
          reactivatedBy: req.user.id,
          reactivatedAt: new Date()
        }
      })

      logger.info(`User reactivated: ${user.email} by ${req.user.email}`)

      res.json({
        message: 'User reactivated successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Get user statistics (admin only)
  static async getUserStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Only admins can view user statistics
      if (req.user.role !== UserRole.ADMIN) {
        throw new ApiError(403, 'Only administrators can view user statistics', 'ADMIN_REQUIRED')
      }

      const stats = await Promise.all([
        User.count(),
        User.count({ where: { status: UserStatus.ACTIVE } }),
        User.count({ where: { status: UserStatus.PENDING } }),
        User.count({ where: { status: UserStatus.SUSPENDED } }),
        User.count({ where: { role: UserRole.CLIENT } }),
        User.count({ where: { role: UserRole.DESIGNER } }),
        User.count({ where: { role: UserRole.PROJECT_LEAD } }),
        User.count({ where: { role: UserRole.CONTRACTOR } }),
        User.count({ where: { role: UserRole.STAFF } }),
        User.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        User.count({
          where: {
            lastLogin: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ])

      const statistics = {
        total: stats[0],
        active: stats[1],
        pending: stats[2],
        suspended: stats[3],
        byRole: {
          client: stats[4],
          designer: stats[5],
          projectLead: stats[6],
          contractor: stats[7],
          staff: stats[8]
        },
        newUsersLast30Days: stats[9],
        activeUsersLast30Days: stats[10]
      }

      res.json({ statistics })
    } catch (error) {
      next(error)
    }
  }

  // Search users
  static async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q, role, limit = 10 } = req.query

      if (!q || typeof q !== 'string' || q.length < 2) {
        throw new ApiError(400, 'Search query must be at least 2 characters long', 'INVALID_SEARCH_QUERY')
      }

      const where: any = {
        [Op.and]: [
          {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${q}%` } },
              { lastName: { [Op.iLike]: `%${q}%` } },
              { email: { [Op.iLike]: `%${q}%` } },
              { companyName: { [Op.iLike]: `%${q}%` } }
            ]
          },
          { status: { [Op.ne]: UserStatus.DELETED } }
        ]
      }

      if (role) {
        where[Op.and].push({ role })
      }

      const users = await User.findAll({
        where,
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyName', 'profileImage'],
        limit: parseInt(limit as string),
        order: [['firstName', 'ASC']]
      })

      res.json({ users })
    } catch (error) {
      next(error)
    }
  }
}