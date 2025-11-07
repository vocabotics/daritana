import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt.utils';
import { prisma } from '../services/database.service';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import { UserRole } from '@prisma/client';

const logger = createLogger('AuthMiddleware');

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      userId?: string;
    }
  }
}

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }
    
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true
      }
    });
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }
    
    if (user.isBanned) {
      throw new AuthenticationError('Account is banned');
    }
    
    // Attach user to request
    req.user = decoded;
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ error: error.message });
    } else {
      logger.error('Authentication error', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    if (user && user.isActive) {
      req.user = decoded;
      req.userId = decoded.id;
    }
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.debug('Optional auth failed', error);
    next();
  }
};

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const userRole = req.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${userRole}`);
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
      return;
    }
    
    next();
  };
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      
      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }
      
      // Check ownership based on the route
      const path = req.baseUrl + req.path;
      
      // Project ownership
      if (path.includes('/projects')) {
        const project = await prisma.project.findUnique({
          where: { id: resourceId },
          select: { clientId: true }
        });
        
        if (!project || project.clientId !== userId) {
          throw new AuthorizationError('You do not have access to this resource');
        }
      }
      
      // Task ownership
      else if (path.includes('/tasks')) {
        const task = await prisma.task.findFirst({
          where: {
            id: resourceId,
            OR: [
              { createdBy: userId },
              { assignments: { some: { userId } } }
            ]
          }
        });
        
        if (!task) {
          throw new AuthorizationError('You do not have access to this resource');
        }
      }
      
      // Document ownership
      else if (path.includes('/documents')) {
        const document = await prisma.document.findUnique({
          where: { id: resourceId },
          select: { uploadedBy: true }
        });
        
        if (!document || document.uploadedBy !== userId) {
          throw new AuthorizationError('You do not have access to this resource');
        }
      }
      
      // Default: check if resource belongs to user
      else {
        if (resourceId !== userId) {
          throw new AuthorizationError('You do not have access to this resource');
        }
      }
      
      next();
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        logger.error('Ownership check error', error);
        res.status(500).json({ error: 'Failed to verify resource ownership' });
      }
    }
  };
};

/**
 * Rate limit by user (requires authentication)
 */
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    
    const userLimit = requests.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
      return;
    }
    
    userLimit.count++;
    next();
  };
};