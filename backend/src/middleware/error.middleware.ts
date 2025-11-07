import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, DatabaseError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import { config, isDevelopment } from '../config/env';

const logger = createLogger('ErrorHandler');

/**
 * Handle Prisma errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.[0] || 'field';
      return new AppError(`${field} already exists`, 409, 'DUPLICATE_ERROR');
    
    case 'P2025':
      // Record not found
      return new AppError('Record not found', 404, 'NOT_FOUND');
    
    case 'P2003':
      // Foreign key constraint violation
      return new AppError('Related record not found', 400, 'FOREIGN_KEY_ERROR');
    
    case 'P2014':
      // Relation violation
      return new AppError('Invalid relation', 400, 'RELATION_ERROR');
    
    default:
      return new DatabaseError('Database operation failed', error);
  }
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }
  return new AppError('Authentication failed', 401, 'AUTH_ERROR');
};

/**
 * Handle validation errors
 */
const handleValidationError = (error: any): AppError => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }
  return error;
};

/**
 * Send error response
 */
const sendErrorResponse = (error: AppError, req: Request, res: Response) => {
  const { statusCode, message, code, details } = error;
  
  const response: any = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  if (isDevelopment() && error.stack) {
    response.error.stack = error.stack.split('\n');
  }
  
  res.status(statusCode).json(response);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId
  });
  
  let appError: AppError;
  
  // Handle different error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new AppError('Invalid data provided', 400, 'VALIDATION_ERROR');
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError(error);
  } else {
    // Default to 500 server error
    appError = new AppError(
      isDevelopment() ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }
  
  sendErrorResponse(appError, req, res);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  sendErrorResponse(error, req, res);
};

/**
 * Handle async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      reason,
      promise
    });
    process.exit(1);
  });
};