import CryptoJS from 'crypto-js';

// Security constants
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'daritana-default-key-2024';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Rate limiting
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  locked?: boolean;
  lockExpiry?: number;
}

class SecurityManager {
  private static instance: SecurityManager;
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private sessionData: Map<string, { data: any; expiry: number }> = new Map();

  private constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Encryption/Decryption
  encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption failed - invalid data or key');
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Secure storage with encryption
  setSecureItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encrypt(serialized);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  getSecureItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Secure retrieval error:', error);
      // Clean up corrupted data
      localStorage.removeItem(`secure_${key}`);
      return null;
    }
  }

  removeSecureItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  // Session management
  createSession(sessionId: string, data: any): void {
    const expiry = Date.now() + SESSION_TIMEOUT;
    this.sessionData.set(sessionId, { data, expiry });
  }

  getSession<T>(sessionId: string): T | null {
    const session = this.sessionData.get(sessionId);
    if (!session) return null;

    if (Date.now() > session.expiry) {
      this.sessionData.delete(sessionId);
      return null;
    }

    return session.data as T;
  }

  extendSession(sessionId: string): boolean {
    const session = this.sessionData.get(sessionId);
    if (!session) return false;

    session.expiry = Date.now() + SESSION_TIMEOUT;
    return true;
  }

  destroySession(sessionId: string): void {
    this.sessionData.delete(sessionId);
  }

  // Rate limiting
  checkRateLimit(identifier: string, maxAttempts: number = MAX_LOGIN_ATTEMPTS, windowMs: number = 60000): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  } {
    const now = Date.now();
    const entry = this.rateLimits.get(identifier);

    if (!entry) {
      // First attempt
      this.rateLimits.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Check if user is locked out
    if (entry.locked && entry.lockExpiry && now < entry.lockExpiry) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.lockExpiry,
      };
    }

    // Reset if window has passed
    if (now - entry.firstAttempt > windowMs) {
      this.rateLimits.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Increment attempt count
    entry.count++;
    entry.lastAttempt = now;

    if (entry.count > maxAttempts) {
      // Lock the user
      entry.locked = true;
      entry.lockExpiry = now + LOCKOUT_DURATION;
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.lockExpiry,
      };
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - entry.count,
    };
  }

  clearRateLimit(identifier: string): void {
    this.rateLimits.delete(identifier);
  }

  // Input sanitization
  sanitizeHtml(input: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = input;
    return tempDiv.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  sanitizeUrl(url: string): string {
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '';
      }
    }
    
    return url;
  }

  // Password security
  generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    
    // Ensure at least one character from each required category
    const categories = [
      'abcdefghijklmnopqrstuvwxyz',      // lowercase
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',      // uppercase
      '0123456789',                       // numbers
      '!@#$%^&*()'                       // symbols
    ];
    
    // Add one character from each category
    for (const category of categories) {
      const randomIndex = Math.floor(Math.random() * category.length);
      password += category[randomIndex];
    }
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  hashPassword(password: string, salt?: string): string {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(128/8).toString();
    const hashed = CryptoJS.PBKDF2(password, saltToUse, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
    
    return `${saltToUse}:${hashed}`;
  }

  verifyPassword(password: string, hash: string): boolean {
    try {
      const [salt, storedHash] = hash.split(':');
      const computedHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      }).toString();
      
      return computedHash === storedHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // Content Security Policy helpers
  generateNonce(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64);
  }

  // CSRF protection
  generateCSRFToken(): string {
    const token = CryptoJS.lib.WordArray.random(256/8).toString();
    this.setSecureItem('csrf_token', token);
    return token;
  }

  validateCSRFToken(token: string): boolean {
    const storedToken = this.getSecureItem<string>('csrf_token');
    return storedToken === token;
  }

  // File security
  isSecureFileType(fileName: string, allowedExtensions: string[]): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    return allowedExtensions.includes(`.${extension}`);
  }

  scanFileContent(file: File): Promise<{ safe: boolean; threats: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const threats: string[] = [];
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Basic threat detection
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /on\w+\s*=/i,
          /<iframe/i,
          /<object/i,
          /<embed/i,
          /eval\s*\(/i,
          /document\.write/i,
          /window\.location/i,
        ];
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(content)) {
            threats.push(`Potential threat detected: ${pattern.source}`);
          }
        }
        
        resolve({
          safe: threats.length === 0,
          threats,
        });
      };
      
      reader.onerror = () => {
        resolve({ safe: false, threats: ['Failed to scan file'] });
      };
      
      reader.readAsText(file.slice(0, 10000)); // Only read first 10KB for performance
    });
  }

  // Device fingerprinting for security
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown',
    ].join('|');
    
    return CryptoJS.MD5(fingerprint).toString();
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    
    // Clean up expired sessions
    for (const [sessionId, session] of this.sessionData.entries()) {
      if (now > session.expiry) {
        this.sessionData.delete(sessionId);
      }
    }
    
    // Clean up expired rate limits
    for (const [identifier, entry] of this.rateLimits.entries()) {
      if (entry.locked && entry.lockExpiry && now > entry.lockExpiry) {
        this.rateLimits.delete(identifier);
      }
    }
  }

  // Security headers validation
  validateSecurityHeaders(response: Response): {
    secure: boolean;
    missing: string[];
    recommendations: string[];
  } {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
    ];
    
    const recommendedHeaders = [
      'content-security-policy',
      'referrer-policy',
      'permissions-policy',
    ];
    
    const missing: string[] = [];
    const recommendations: string[] = [];
    
    for (const header of requiredHeaders) {
      if (!response.headers.get(header)) {
        missing.push(header);
      }
    }
    
    for (const header of recommendedHeaders) {
      if (!response.headers.get(header)) {
        recommendations.push(header);
      }
    }
    
    return {
      secure: missing.length === 0,
      missing,
      recommendations,
    };
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Utility functions
export const generateSecureId = (): string => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

export const isSecureContext = (): boolean => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
};

export const validateOrigin = (origin: string, allowedOrigins: string[]): boolean => {
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
};

// Security constants for export
export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION,
  SESSION_TIMEOUT,
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;