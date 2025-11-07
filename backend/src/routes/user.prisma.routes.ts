import { Router } from 'express';
import { UserController } from '../controllers/user.prisma.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery, validateParams, validateBody, validatePagination } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const getUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.enum(['CLIENT', 'CONTRACTOR', 'STAFF', 'DESIGNER', 'PROJECT_LEAD', 'ADMIN', 'all']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email', 'lastLogin']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['CLIENT', 'CONTRACTOR', 'STAFF', 'DESIGNER', 'PROJECT_LEAD']).optional(),
  phone: z.string().optional(),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

const banUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required').max(500)
});

const credentialParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  credentialId: z.string().uuid('Invalid credential ID format')
});

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/',
  authorize('ADMIN'),
  validateQuery(getUsersQuerySchema),
  UserController.getUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  authorize('ADMIN'),
  UserController.getUserStats
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get('/:id',
  validateParams(userIdParamSchema),
  // Allow users to view their own profile or require admin role
  async (req, res, next) => {
    if (req.params.id === req.userId || req.user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'You can only view your own profile or need admin privileges'
      });
    }
  },
  UserController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  UserController.deleteUser
);

/**
 * @route   POST /api/users/:id/ban
 * @desc    Ban user
 * @access  Private (Admin only)
 */
router.post('/:id/ban',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  validateBody(banUserSchema),
  UserController.banUser
);

/**
 * @route   POST /api/users/:id/unban
 * @desc    Unban user
 * @access  Private (Admin only)
 */
router.post('/:id/unban',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  UserController.unbanUser
);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity log
 * @access  Private (Admin only)
 */
router.get('/:id/activity',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  validatePagination,
  UserController.getUserActivity
);

/**
 * @route   POST /api/users/:userId/credentials/:credentialId/verify
 * @desc    Verify user credential
 * @access  Private (Admin only)
 */
router.post('/:userId/credentials/:credentialId/verify',
  authorize('ADMIN'),
  validateParams(credentialParamsSchema),
  UserController.verifyCredential
);

export default router;