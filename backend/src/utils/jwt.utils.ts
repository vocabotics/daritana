import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { config } from '../config/env';
import { createLogger } from './logger';

const logger = createLogger('JWT');

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export const generateAccessToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'daritana',
    audience: 'daritana-api'
  });
};

export const generateRefreshToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  };

  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    issuer: 'daritana',
    audience: 'daritana-api'
  });
};

export const generateTokenPair = (user: Pick<User, 'id' | 'email' | 'role'>) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: config.JWT_EXPIRES_IN
  };
};

export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'daritana',
      audience: 'daritana-api'
    }) as DecodedToken;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logger.error('Access token verification failed', error);
    throw error;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'daritana',
      audience: 'daritana-api'
    }) as DecodedToken;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    throw error;
  }
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
};

// Generate a token for email verification
export const generateEmailVerificationToken = (userId: string, email: string): string => {
  return jwt.sign(
    { id: userId, email, type: 'email-verification' },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate a token for password reset
export const generatePasswordResetToken = (userId: string, email: string): string => {
  return jwt.sign(
    { id: userId, email, type: 'password-reset' },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Verify email verification token
export const verifyEmailToken = (token: string): { id: string; email: string } => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }
    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    logger.error('Email verification token failed', error);
    throw error;
  }
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): { id: string; email: string } => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }
    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    logger.error('Password reset token verification failed', error);
    throw error;
  }
};