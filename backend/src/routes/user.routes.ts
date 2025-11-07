import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler'
import { UserController } from '../controllers/user.controller'
import { authenticate, authorize, checkOwnership } from '../middleware/auth'
import { ApiError } from '../middleware/errorHandler'
import { UserRole } from '../models/User'
import { validationResult } from 'express-validator'

const router = Router()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation error', 'VALIDATION_ERROR', errors.array()))
  }
  next()
}

// All routes require authentication
router.use(authenticate)

// Search users (accessible to all authenticated users)
router.get('/search', [
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], asyncHandler(UserController.searchUsers))

// Get current user profile
router.get('/me', asyncHandler(UserController.getCurrentUserProfile))

// Update current user profile
router.put('/me', [
  body('firstName').optional().isLength({ min: 1 }).trim(),
  body('lastName').optional().isLength({ min: 1 }).trim(),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('companyName').optional().trim(),
  body('designation').optional().trim(),
  validate
], asyncHandler(UserController.updateCurrentUserProfile))

// Get user statistics (admin only)
router.get('/statistics', 
  authorize(UserRole.ADMIN),
  asyncHandler(UserController.getUserStatistics)
)

// Get all users (admin and staff only)
router.get('/', [
  authorize(UserRole.ADMIN, UserRole.STAFF),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['client', 'staff', 'contractor', 'project_lead', 'designer', 'admin']),
  query('status').optional().isIn(['pending', 'active', 'suspended', 'deleted']),
  query('search').optional().isLength({ min: 1 }),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email', 'role', 'status']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate
], asyncHandler(UserController.getAllUsers))

// Get user by ID
router.get('/:id', [
  param('id').isUUID(),
  validate,
  checkOwnership('id')
], asyncHandler(UserController.getUserById))

// Update user
router.put('/:id', [
  param('id').isUUID(),
  body('firstName').optional().isLength({ min: 1 }).trim(),
  body('lastName').optional().isLength({ min: 1 }).trim(),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('companyName').optional().trim(),
  body('designation').optional().trim(),
  body('role').optional().isIn(['client', 'staff', 'contractor', 'project_lead', 'designer']),
  body('status').optional().isIn(['pending', 'active', 'suspended']),
  validate,
  checkOwnership('id')
], asyncHandler(UserController.updateUser))

// Suspend user (admin only)
router.post('/:id/suspend', [
  authorize(UserRole.ADMIN),
  param('id').isUUID(),
  body('reason').notEmpty().withMessage('Suspension reason is required'),
  validate
], asyncHandler(UserController.suspendUser))

// Reactivate user (admin only)
router.post('/:id/reactivate', [
  authorize(UserRole.ADMIN),
  param('id').isUUID(),
  validate
], asyncHandler(UserController.reactivateUser))

// Delete user (admin only)
router.delete('/:id', [
  authorize(UserRole.ADMIN),
  param('id').isUUID(),
  validate
], asyncHandler(UserController.deleteUser))

export default router