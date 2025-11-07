import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload, UserRole } from '../types';

interface AuthRequest extends Request {
  user?: TokenPayload;
}

// JWT verification middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Organization-based authorization
export const authorizeOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  const organizationId = req.params.organizationId || req.body.organization_id;
  
  if (!organizationId) {
    res.status(400).json({
      success: false,
      error: 'Organization ID required'
    });
    return;
  }

  if (req.user.organization_id !== organizationId && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied to this organization'
    });
    return;
  }

  next();
};

// Extract token from various sources
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query parameters (for WebSocket connections)
  if (req.query && req.query.token) {
    return req.query.token as string;
  }

  return null;
};

// Generate tokens
export const generateTokens = (payload: TokenPayload) => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!secret || !refreshSecret) {
    throw new Error('JWT secrets are not configured');
  }

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRE || '24h') as string
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as string
  } as jwt.SignOptions);

  return {
    accessToken,
    refreshToken
  };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  return jwt.verify(token, refreshSecret) as TokenPayload;
};