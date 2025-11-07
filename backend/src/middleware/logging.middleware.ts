import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { config, isDevelopment } from '../config/env';

const logger = createLogger('HTTP');

/**
 * HTTP request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request start
  if (isDevelopment()) {
    logger.info(`➡️  ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.userId,
    });
  }
  
  // Log response on finish
  const originalSend = res.send;
  res.send = function(data: any): Response {
    const duration = Date.now() - startTime;
    const size = Buffer.byteLength(data || '', 'utf8');
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      size: `${size}b`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.userId,
    };
    
    if (res.statusCode >= 500) {
      logger.error('HTTP 5xx Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP 4xx Error', logData);
    } else if (isDevelopment()) {
      logger.info(`⬅️  ${res.statusCode} ${req.method} ${req.path} - ${duration}ms`);
    } else {
      logger.info('HTTP Request', logData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log authentication attempts
  if (req.path.includes('/auth/login')) {
    logger.info('Login attempt', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      email: req.body?.email
    });
  }
  
  // Log failed authentication attempts
  const originalStatus = res.status;
  res.status = function(code: number): Response {
    if (code === 401 && req.path.includes('/auth')) {
      logger.warn('Failed authentication', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        email: req.body?.email
      });
    }
    
    return originalStatus.call(this, code);
  };
  
  next();
};

/**
 * Slow query logger middleware
 */
export const slowQueryLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data: any): Response {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          userId: req.userId,
          ip: req.ip
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * API usage tracking middleware
 */
export const apiUsageLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for health checks and static assets
  if (req.path === '/health' || req.path.startsWith('/uploads')) {
    return next();
  }
  
  const originalSend = res.send;
  res.send = function(data: any): Response {
    // Log API usage for analytics
    logger.info('API Usage', {
      method: req.method,
      endpoint: req.route?.path || req.path,
      status: res.statusCode,
      userId: req.userId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  next(error);
};