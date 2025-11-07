import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
    role: string
    organizationId?: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      username?: string
      role?: string
      organizationId?: string
      organizationRole?: string
    }

    // Verify session in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    if (!session.user.isActive) {
      return res.status(403).json({ error: 'Account is not active' })
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username || '',
      role: decoded.organizationRole || decoded.role || 'USER',
      organizationId: decoded.organizationId || session.organizationId
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string
        email: string
        username?: string
        role?: string
        organizationId?: string
        organizationRole?: string
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      })

      if (session && session.expiresAt > new Date() && session.user.isActive) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          username: decoded.username || '',
          role: decoded.organizationRole || decoded.role || 'USER',
          organizationId: decoded.organizationId || session.organizationId
        }
      }
    }
  } catch {
    // Ignore errors for optional auth
  }

  next()
}