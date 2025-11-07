import jwt from 'jsonwebtoken'
import { User, UserAttributes } from '../models/User'

interface TokenPayload {
  id: string
  email: string
  role: string
}

interface DecodedToken extends TokenPayload {
  iat: number
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export const generateToken = (user: Partial<UserAttributes>): string => {
  const payload: TokenPayload = {
    id: user.id!,
    email: user.email!,
    role: user.role!
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export const generateRefreshToken = (user: Partial<UserAttributes>): string => {
  const payload: TokenPayload = {
    id: user.id!,
    email: user.email!,
    role: user.role!
  }

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  })
}

export const verifyToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

export const generateTokenPair = (user: Partial<UserAttributes>) => {
  return {
    accessToken: generateToken(user),
    refreshToken: generateRefreshToken(user)
  }
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken
  } catch {
    return null
  }
}