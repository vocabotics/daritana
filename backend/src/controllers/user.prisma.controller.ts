import { Request, Response } from 'express';
import { prisma } from '../services/database.service';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import { Prisma, UserRole } from '@prisma/client';

const logger = createLogger('UserController');

export class UserController {
  /**
   * Get all users (admin only)
   */
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role as UserRole;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy as string]: sortOrder === 'desc' ? 'desc' : 'asc'
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          company: true,
          position: true,
          avatar: true,
          isActive: true,
          isBanned: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              tasks: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalUsers: total,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1
        }
      }
    });
  });

  /**
   * Get user by ID
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        company: true,
        position: true,
        website: true,
        linkedin: true,
        address: true,
        city: true,
        state: true,
        postcode: true,
        country: true,
        language: true,
        timezone: true,
        currency: true,
        isActive: true,
        isBanned: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            tasks: true,
            documents: true
          }
        },
        credentials: {
          select: {
            id: true,
            name: true,
            organization: true,
            status: true,
            verifiedAt: true,
            expiresAt: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: { user }
    });
  });

  /**
   * Update user (admin only)
   */
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Don't allow updating password through this endpoint
    delete updateData.password;
    delete updateData.emailVerificationToken;
    delete updateData.passwordResetToken;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        company: true,
        position: true,
        avatar: true,
        bio: true,
        isActive: true,
        isBanned: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    logger.info('User updated by admin', { 
      adminId: req.userId, 
      targetUserId: id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  });

  /**
   * Delete user (admin only)
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent deleting admin users
    if (user.role === 'ADMIN' && req.userId !== id) {
      throw new AuthorizationError('Cannot delete admin users');
    }

    // Soft delete - deactivate instead of actually deleting
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isBanned: true,
        banReason: 'Account deleted by admin'
      }
    });

    logger.info('User soft deleted by admin', { 
      adminId: req.userId, 
      deletedUserId: id 
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  /**
   * Ban user (admin only)
   */
  static banUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role === 'ADMIN') {
      throw new AuthorizationError('Cannot ban admin users');
    }

    await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: reason || 'Banned by administrator',
        isActive: false
      }
    });

    // Revoke all user sessions
    await prisma.session.deleteMany({
      where: { userId: id }
    });

    logger.info('User banned', { 
      adminId: req.userId, 
      bannedUserId: id,
      reason 
    });

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  });

  /**
   * Unban user (admin only)
   */
  static unbanUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
        isActive: true,
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    logger.info('User unbanned', { 
      adminId: req.userId, 
      unbannedUserId: id 
    });

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  });

  /**
   * Get user statistics (admin only)
   */
  static getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      unverifiedUsers,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          unverified: unverifiedUsers,
          inactive: totalUsers - activeUsers
        },
        roleDistribution: roleStats,
        recentUsers
      }
    });
  });

  /**
   * Get user's activity log (admin only)
   */
  static getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const activities = await prisma.auditLog.findMany({
      where: { userId: id },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    });

    const total = await prisma.auditLog.count({
      where: { userId: id }
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  });

  /**
   * Verify user credential (admin only)
   */
  static verifyCredential = asyncHandler(async (req: Request, res: Response) => {
    const { userId, credentialId } = req.params;

    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        userId
      }
    });

    if (!credential) {
      throw new NotFoundError('Credential');
    }

    await prisma.credential.update({
      where: { id: credentialId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date()
      }
    });

    logger.info('Credential verified', {
      adminId: req.userId,
      userId,
      credentialId
    });

    res.json({
      success: true,
      message: 'Credential verified successfully'
    });
  });
}