import { Request, Response, NextFunction } from 'express'
import { User, UserRole, UserStatus } from '../models/User'
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt'
import { ApiError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role = UserRole.CLIENT, phoneNumber, companyName } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists', 'USER_EXISTS')
      }

      // Create verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
        phoneNumber,
        companyName,
        status: UserStatus.PENDING,
        emailVerificationToken
      })

      // Generate tokens
      const tokens = generateTokenPair(user)

      // TODO: Send verification email
      logger.info(`User registered: ${user.email}`)

      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        },
        tokens
      })
    } catch (error) {
      next(error)
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      // Find user - explicitly include password field
      const user = await User.findOne({ 
        where: { email },
        attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'status', 'emailVerified', 'loginAttempts', 'lockUntil']
      })
      
      console.log('User found:', user?.email)
      console.log('User password field:', user?.password)
      console.log('User dataValues:', user?.dataValues)
      
      if (!user) {
        throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new ApiError(423, 'Account is locked due to too many failed login attempts', 'ACCOUNT_LOCKED')
      }

      // Verify password
      const isValidPassword = await user.validatePassword(password)
      if (!isValidPassword) {
        await user.incrementLoginAttempts()
        throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
      }

      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new ApiError(403, 'Account is suspended', 'ACCOUNT_SUSPENDED')
      }

      // Temporarily disabled for testing
      // if (user.status === UserStatus.PENDING) {
      //   throw new ApiError(403, 'Please verify your email before logging in', 'EMAIL_NOT_VERIFIED')
      // }

      // Reset login attempts and update last login
      await user.resetLoginAttempts()

      // Generate tokens
      const tokens = generateTokenPair(user)

      logger.info(`User logged in: ${user.email}`)

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage
        },
        tokens
      })
    } catch (error) {
      next(error)
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required', 'NO_REFRESH_TOKEN')
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken)

      // Find user
      const user = await User.findByPk(decoded.id)
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN')
      }

      // Generate new token pair
      const tokens = generateTokenPair(user)

      res.json({
        message: 'Token refreshed successfully',
        tokens
      })
    } catch (error) {
      next(error)
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params

      const user = await User.findOne({
        where: { emailVerificationToken: token }
      })

      if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token', 'INVALID_TOKEN')
      }

      await user.update({
        emailVerified: true,
        emailVerificationToken: null,
        status: UserStatus.ACTIVE
      })

      logger.info(`Email verified for user: ${user.email}`)

      res.json({
        message: 'Email verified successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Request password reset
  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      const user = await User.findOne({ where: { email } })
      if (!user) {
        // Don't reveal if user exists
        res.json({
          message: 'If the email exists, a password reset link has been sent'
        })
        return
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date()
      resetExpires.setHours(resetExpires.getHours() + 1) // Token expires in 1 hour

      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      })

      // TODO: Send password reset email
      logger.info(`Password reset requested for: ${user.email}`)

      res.json({
        message: 'If the email exists, a password reset link has been sent'
      })
    } catch (error) {
      next(error)
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params
      const { password } = req.body

      const user = await User.findOne({
        where: { passwordResetToken: token }
      })

      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token', 'INVALID_TOKEN')
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        throw new ApiError(400, 'Reset token has expired', 'TOKEN_EXPIRED')
      }

      await user.update({
        password,
        passwordResetToken: null,
        passwordResetExpires: null
      })

      logger.info(`Password reset for user: ${user.email}`)

      res.json({
        message: 'Password reset successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Logout (client-side token removal, but we can track it)
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a more complex setup, you might want to:
      // 1. Add the token to a blacklist
      // 2. Track logout events
      // 3. Clear refresh tokens from database

      res.json({
        message: 'Logged out successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Get current user
  static async getCurrentUser(req: Request & { user?: any }, res: Response, next: NextFunction) {
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

      res.json({
        user
      })
    } catch (error) {
      next(error)
    }
  }

  // Update password
  static async updatePassword(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      const { currentPassword, newPassword } = req.body

      const user = await User.findByPk(req.user.id)
      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(currentPassword)
      if (!isValidPassword) {
        throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD')
      }

      await user.update({ password: newPassword })

      logger.info(`Password updated for user: ${user.email}`)

      res.json({
        message: 'Password updated successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}