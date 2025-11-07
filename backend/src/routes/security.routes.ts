import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, authorize } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { UAParser } from 'ua-parser-js'

const router = Router()
const prisma = new PrismaClient()

// Rate limiting configurations
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again later'
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down'
})

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// All routes require authentication except where noted
router.use(authenticate)

// Enable two-factor authentication
router.post('/2fa/enable', async (req: any, res: any) => {
  try {
    const userId = req.user.id

    // Check if 2FA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (user?.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication is already enabled'
      })
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Daritana (${user?.email})`,
      issuer: 'Daritana Architect Management'
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Save secret temporarily (not enabled yet)
    await prisma.twoFactorSecret.upsert({
      where: { userId },
      create: {
        userId,
        secret: secret.base32,
        tempSecret: secret.base32,
        isVerified: false
      },
      update: {
        tempSecret: secret.base32,
        isVerified: false
      }
    })

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32,
      backupCodes,
      message: 'Please scan the QR code with your authenticator app and verify'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to enable two-factor authentication',
      message: error.message
    })
  }
})

// Verify and confirm 2FA setup
router.post('/2fa/verify', [
  body('token').notEmpty().isLength({ min: 6, max: 6 }),
  validate
], async (req: any, res: any) => {
  try {
    const { token } = req.body
    const userId = req.user.id

    // Get temp secret
    const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
      where: { userId }
    })

    if (!twoFactorSecret || !twoFactorSecret.tempSecret) {
      return res.status(400).json({
        success: false,
        error: 'No pending 2FA setup found'
      })
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret.tempSecret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      })
    }

    // Enable 2FA
    await prisma.$transaction([
      prisma.twoFactorSecret.update({
        where: { userId },
        data: {
          secret: twoFactorSecret.tempSecret,
          tempSecret: null,
          isVerified: true
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      })
    ])

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'TWO_FACTOR_ENABLED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true
      }
    })

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify two-factor authentication',
      message: error.message
    })
  }
})

// Disable 2FA
router.post('/2fa/disable', [
  body('password').notEmpty(),
  body('token').optional().isLength({ min: 6, max: 6 }),
  validate
], async (req: any, res: any) => {
  try {
    const { password, token } = req.body
    const userId = req.user.id

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      })
    }

    // If 2FA is enabled, verify token
    if (user.twoFactorEnabled && token) {
      const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
        where: { userId }
      })

      if (twoFactorSecret) {
        const verified = speakeasy.totp.verify({
          secret: twoFactorSecret.secret,
          encoding: 'base32',
          token,
          window: 2
        })

        if (!verified) {
          return res.status(401).json({
            success: false,
            error: 'Invalid 2FA token'
          })
        }
      }
    }

    // Disable 2FA
    await prisma.$transaction([
      prisma.twoFactorSecret.delete({
        where: { userId }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false }
      })
    ])

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'TWO_FACTOR_DISABLED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true
      }
    })

    res.json({
      success: true,
      message: 'Two-factor authentication disabled'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to disable two-factor authentication',
      message: error.message
    })
  }
})

// Get active sessions
router.get('/sessions', async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActivity: 'desc' }
    })

    // Parse user agents for better display
    const parser = new UAParser()
    const enrichedSessions = sessions.map(session => {
      parser.setUA(session.userAgent || '')
      const result = parser.getResult()
      
      return {
        ...session,
        device: {
          browser: result.browser.name,
          browserVersion: result.browser.version,
          os: result.os.name,
          osVersion: result.os.version,
          device: result.device.type || 'desktop'
        },
        isCurrent: session.token === req.headers.authorization?.replace('Bearer ', '')
      }
    })

    res.json({
      success: true,
      sessions: enrichedSessions
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
      message: error.message
    })
  }
})

// Revoke session
router.delete('/sessions/:sessionId', [
  param('sessionId').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { sessionId } = req.params
    const userId = req.user.id

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      })
    }

    await prisma.session.delete({
      where: { id: sessionId }
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'SESSION_REVOKED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { sessionId },
        success: true
      }
    })

    res.json({
      success: true,
      message: 'Session revoked successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session',
      message: error.message
    })
  }
})

// Revoke all sessions except current
router.post('/sessions/revoke-all', async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const currentToken = req.headers.authorization?.replace('Bearer ', '')

    await prisma.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken }
      }
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'ALL_SESSIONS_REVOKED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true
      }
    })

    res.json({
      success: true,
      message: 'All other sessions revoked'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions',
      message: error.message
    })
  }
})

// Get security logs
router.get('/logs', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('action').optional(),
  validate
], async (req: any, res: any) => {
  try {
    const { limit = 50, offset = 0, action } = req.query
    const userId = req.user.id

    const where: any = { userId }
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityLog.count({ where })
    ])

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security logs',
      message: error.message
    })
  }
})

// Update password
router.post('/password/change', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  validate
], async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    // Check password history
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    for (const history of passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, history.passwordHash)
      if (isReused) {
        return res.status(400).json({
          success: false,
          error: 'Cannot reuse recent passwords'
        })
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date()
        }
      }),
      prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash: hashedPassword
        }
      })
    ])

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true
      }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    })
  }
})

// Request password reset (no auth required)
router.post('/password/reset-request', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail(),
  validate
], async (req: any, res: any) => {
  try {
    const { email } = req.body

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      })

      // TODO: Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      console.log('Password reset URL:', resetUrl)
    }

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
      message: error.message
    })
  }
})

// Get API keys
router.get('/api-keys', async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const organizationId = req.user.organizationId

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
        organizationId,
        revokedAt: null
      },
      select: {
        id: true,
        name: true,
        key: false, // Never return the actual key
        maskedKey: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      apiKeys
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys',
      message: error.message
    })
  }
})

// Create API key
router.post('/api-keys', [
  body('name').notEmpty(),
  body('permissions').isArray(),
  body('expiresIn').optional().isIn(['30d', '90d', '1y', 'never']),
  validate
], async (req: any, res: any) => {
  try {
    const { name, permissions, expiresIn = '90d' } = req.body
    const userId = req.user.id
    const organizationId = req.user.organizationId

    // Generate API key
    const apiKey = `dak_${crypto.randomBytes(32).toString('hex')}`
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')
    const maskedKey = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`

    // Calculate expiration
    let expiresAt = null
    if (expiresIn !== 'never') {
      const duration = {
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
      }[expiresIn]
      expiresAt = new Date(Date.now() + duration!)
    }

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId,
        organizationId,
        name,
        key: hashedKey,
        maskedKey,
        permissions,
        expiresAt
      }
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'API_KEY_CREATED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { keyId: apiKeyRecord.id, name },
        success: true
      }
    })

    res.status(201).json({
      success: true,
      apiKey: apiKey, // Only return full key on creation
      apiKeyRecord: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        maskedKey: apiKeyRecord.maskedKey,
        expiresAt: apiKeyRecord.expiresAt
      },
      message: 'Save this API key securely. It will not be shown again.'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
      message: error.message
    })
  }
})

// Revoke API key
router.delete('/api-keys/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        revokedAt: null
      }
    })

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      })
    }

    await prisma.apiKey.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedBy: userId
      }
    })

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'API_KEY_REVOKED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { keyId: id },
        success: true
      }
    })

    res.json({
      success: true,
      message: 'API key revoked successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
      message: error.message
    })
  }
})

// Get IP whitelist
router.get('/ip-whitelist', authorize(['ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId

    const whitelist = await prisma.ipWhitelist.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      whitelist
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch IP whitelist',
      message: error.message
    })
  }
})

// Add IP to whitelist
router.post('/ip-whitelist', authorize(['ORG_ADMIN']), [
  body('ipAddress').isIP(),
  body('description').optional(),
  validate
], async (req: any, res: any) => {
  try {
    const { ipAddress, description } = req.body
    const organizationId = req.user.organizationId

    const whitelistEntry = await prisma.ipWhitelist.create({
      data: {
        organizationId,
        ipAddress,
        description,
        addedBy: req.user.id
      }
    })

    res.status(201).json({
      success: true,
      whitelistEntry
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to add IP to whitelist',
      message: error.message
    })
  }
})

export default router