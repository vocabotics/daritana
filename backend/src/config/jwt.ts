import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateAccessToken = (user: Partial<User>): string => {
  const payload: TokenPayload = {
    userId: user.id!,
    email: user.email!,
    role: user.role!,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (user: Partial<User>): string => {
  const payload: TokenPayload = {
    userId: user.id!,
    email: user.email!,
    role: user.role!,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): DecodedToken => {
  return jwt.verify(token, JWT_SECRET) as DecodedToken;
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
};

export const generateTokens = (user: Partial<User>) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
  };
};