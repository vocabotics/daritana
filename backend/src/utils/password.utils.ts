import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { createLogger } from './logger';

const logger = createLogger('Password');

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Failed to hash password', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Failed to compare password', error);
    return false;
  }
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Maximum length
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Contains number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Contains special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate a random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Check if password has been compromised (simplified check)
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '12345678', 'password123', 'admin123', 'qwerty123',
    'letmein', 'welcome', 'monkey', 'dragon', 'master'
  ];
  
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => lowerPassword.includes(common));
};