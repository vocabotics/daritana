import { Router } from 'express';
import { AuthController } from '../controllers/auth.prisma.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  updateNotificationPreferencesSchema
} from '../validators/auth.validators';
import { requestLogger, securityLogger } from '../middleware/logging.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit password reset requests
  message: {
    error: 'Too many password reset requests, please try again later',
    retryAfter: 60 * 60 // seconds
  },
});

// Apply security logging to all auth routes
router.use(securityLogger);

// Public routes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validateBody(registerSchema.shape.body),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validateBody(loginSchema.shape.body),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  validateBody(refreshTokenSchema.shape.body),
  AuthController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema.shape.body),
  AuthController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token',
  validateParams(resetPasswordSchema.shape.params),
  validateBody(resetPasswordSchema.shape.body),
  AuthController.resetPassword
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 */
router.get('/verify-email/:token',
  validateParams(verifyEmailSchema.shape.params),
  AuthController.verifyEmail
);

// Protected routes (require authentication)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  optionalAuth,
  AuthController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me',
  authenticate,
  AuthController.getCurrentUser
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validateBody(updateProfileSchema.shape.body),
  AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  validateBody(changePasswordSchema.shape.body),
  AuthController.changePassword
);

/**
 * @route   PUT /api/auth/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/notifications',
  authenticate,
  validateBody(updateNotificationPreferencesSchema.shape.body),
  async (req, res, next) => {
    try {
      const { prisma } = await import('../services/database.service');
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          emailNotifications: req.body.emailNotifications,
          smsNotifications: req.body.smsNotifications,
          pushNotifications: req.body.pushNotifications,
        },
        select: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        }
      });

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: { preferences: updatedUser }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      const { prisma } = await import('../services/database.service');
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const sessions = await prisma.session.findMany({
        where: {
          userId: req.userId,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  authenticate,
  async (req, res, next) => {
    try {
      const { prisma } = await import('../services/database.service');
      const { sessionId } = req.params;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await prisma.session.deleteMany({
        where: {
          id: sessionId,
          userId: req.userId
        }
      });

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all user sessions (logout from all devices)
 * @access  Private
 */
router.delete('/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      const { prisma } = await import('../services/database.service');
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await prisma.session.deleteMany({
        where: { userId: req.userId }
      });

      res.json({
        success: true,
        message: 'All sessions revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;