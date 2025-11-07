import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'
import { ApiError } from '../middleware/errorHandler'

const router = Router()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation error', 'VALIDATION_ERROR', errors.array()))
  }
  next()
}

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').optional().isIn(['client', 'staff', 'contractor', 'project_lead', 'designer']),
  validate
], asyncHandler(AuthController.register))

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], asyncHandler(AuthController.login))

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty(),
  validate
], asyncHandler(AuthController.refreshToken))

// Verify email
router.get('/verify-email/:token', asyncHandler(AuthController.verifyEmail))

// Request password reset
router.post('/request-password-reset', [
  body('email').isEmail().normalizeEmail(),
  validate
], asyncHandler(AuthController.requestPasswordReset))

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
], asyncHandler(AuthController.resetPassword))

// Protected routes
router.use(authenticate)

// Get current user
router.get('/me', asyncHandler(AuthController.getCurrentUser))

// Update password
router.put('/update-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
], asyncHandler(AuthController.updatePassword))

// Logout
router.post('/logout', asyncHandler(AuthController.logout))

export default router