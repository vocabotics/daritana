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

    // Get user's organization membership
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      include: { organization: true }
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Set HTTP-Only cookies for tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict' as const,
      path: '/'
    };

    // Access token cookie (15 minutes)
    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Refresh token cookie (7 or 30 days)
    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000 // 7 or 30 days
    });

    // Return user and organization data (NO tokens in response body)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        memberOnboardingCompleted: user.memberOnboardingCompleted,
        vendorOnboardingCompleted: user.vendorOnboardingCompleted
      },
      organization: orgMember ? {
        id: orgMember.organization.id,
        name: orgMember.organization.name,
        slug: orgMember.organization.slug,
        plan: orgMember.organization.planId,
        onboardingCompleted: orgMember.organization.onboardingCompleted
      } : null
    });
  });

  /**
   * Refresh token (from HTTP-Only cookie)
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token not found');
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

    // Update session with new refresh token (token rotation)
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        lastUsedAt: new Date()
      }
    });

    // Set new HTTP-Only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/'
    };

    // New access token cookie (15 minutes)
    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000
    });

    // New refresh token cookie (rotate)
    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      expiresIn: 900 // 15 minutes in seconds
    });
  });

  /**
   * Logout user (clear HTTP-Only cookies)
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Clear HTTP-Only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Get current user (from HTTP-Only cookie)
   * This is the /api/auth/me endpoint
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
        personalAddress: true,
        personalCity: true,
        personalState: true,
        personalPostcode: true,
        personalCountry: true,
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
        memberOnboardingCompleted: true,
        vendorOnboardingCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Get user's organization membership
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      include: { organization: true }
    });

    res.json({
      success: true,
      user,
      organization: orgMember ? {
        id: orgMember.organization.id,
        name: orgMember.organization.name,
        slug: orgMember.organization.slug,
        plan: orgMember.organization.planId,
        onboardingCompleted: orgMember.organization.onboardingCompleted,
        status: orgMember.organization.status,
        maxUsers: orgMember.organization.maxUsers,
        maxProjects: orgMember.organization.maxProjects,
        maxStorage: orgMember.organization.maxStorage
      } : null,
      permissions: orgMember?.permissions || []
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

  /**
   * Verify token validity (from HTTP-Only cookie)
   */
  static verifyToken = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      throw new AuthenticationError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, isActive: true, isBanned: true }
    });

    if (!user || !user.isActive || user.isBanned) {
      throw new AuthenticationError('Invalid token');
    }

    res.json({
      success: true,
      valid: true,
      userId: user.id,
      expiresIn: 900 // Approximate - access tokens last 15 minutes
    });
  });

  /**
   * Mark onboarding as complete
   */
  static completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      throw new AuthenticationError('Not authenticated');
    }

    const { type } = req.body; // 'organization' | 'member' | 'vendor'

    if (type === 'organization') {
      // Mark organization onboarding as complete
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: req.userId, isActive: true },
        include: { organization: true }
      });

      if (!orgMember) {
        throw new NotFoundError('Organization membership');
      }

      await prisma.organization.update({
        where: { id: orgMember.organizationId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        }
      });

      logger.info('Organization onboarding completed', {
        userId: req.userId,
        organizationId: orgMember.organizationId
      });

      res.json({
        success: true,
        message: 'Organization onboarding completed',
        organization: {
          ...orgMember.organization,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        }
      });
    } else if (type === 'member') {
      // Mark member onboarding as complete
      await prisma.user.update({
        where: { id: req.userId },
        data: { memberOnboardingCompleted: true }
      });

      logger.info('Member onboarding completed', { userId: req.userId });

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          memberOnboardingCompleted: true,
          vendorOnboardingCompleted: true
        }
      });

      res.json({
        success: true,
        message: 'Member onboarding completed',
        user
      });
    } else if (type === 'vendor') {
      // Mark vendor onboarding as complete
      await prisma.user.update({
        where: { id: req.userId },
        data: { vendorOnboardingCompleted: true }
      });

      logger.info('Vendor onboarding completed', { userId: req.userId });

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          memberOnboardingCompleted: true,
          vendorOnboardingCompleted: true
        }
      });

      res.json({
        success: true,
        message: 'Vendor onboarding completed',
        user
      });
    } else {
      throw new ValidationError('Invalid onboarding type. Must be "organization", "member", or "vendor"');
    }
  });
}