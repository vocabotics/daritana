import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { 
  generateTokenPair,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
} from '../utils/jwt.utils';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { 
  AppError, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError, 
  ValidationError 
} from '../utils/errors';
import { createLogger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import crypto from 'crypto';

const logger = createLogger('AuthController');

export class AuthController {
  /**
   * Register new user
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role = 'CLIENT', 
      phone, 
      company,
      position 
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone,
        company,
        position,
        emailVerificationToken,
        isActive: true, // Set active for development, should be false in production
        emailVerified: false
      }
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // TODO: Send verification email
    logger.info('User registered successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        },
        tokens
      }
    });
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe = false } = req.body;

    // Find user with password field
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    if (user.isBanned) {
      throw new AuthenticationError('Account is banned');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError('Account is locked due to too many failed login attempts');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // Increment login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          ...(user.loginAttempts + 1 >= 5 && {
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
          })
        }
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Check if email is verified (optional for development)
    if (!user.emailVerified && process.env.NODE_ENV === 'production') {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent: req.get('user-agent') || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000) // 30 days if remember me, 7 days otherwise
      }
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          avatar: user.avatar
        },
        tokens
      }
    });
  });

  /**
   * Refresh token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    let decoded: any;
    try {
      // Verify refresh token with error handling
      decoded = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      logger.error('Refresh token verification failed:', error);
      throw new AuthenticationError(error.message === 'jwt malformed' ? 'Invalid token format' : 'Invalid refresh token');
    }

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.id,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session || !session.user.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = generateTokenPair(session.user);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: { token: tokens.refreshToken }
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  });

  /**
   * Logout user
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete session
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Get current user
   */
  static getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      throw new AuthenticationError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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
        dateFormat: true,
        theme: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
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
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      throw new AuthenticationError('Not authenticated');
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: req.body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
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
        dateFormat: true,
        theme: true,
        updatedAt: true
      }
    });

    logger.info('User profile updated', { userId: req.userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      throw new AuthenticationError('Not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    logger.info('Password changed successfully', { userId: req.userId });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  });

  /**
   * Request password reset
   */
  static requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // TODO: Send password reset email
    logger.info('Password reset requested', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  });

  /**
   * Reset password
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    logger.info('Password reset successfully', { userId: user.id });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  });

  /**
   * Verify email
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        isActive: true
      }
    });

    logger.info('Email verified successfully', { userId: user.id });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  });
}