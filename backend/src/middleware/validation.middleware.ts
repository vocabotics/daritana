import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validate request data against a Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Invalid query parameters',
          details: errors,
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Invalid route parameters',
          details: errors,
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and encode HTML entities
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = req.query.sortOrder as string || 'desc';
  
  // Validate values
  if (page < 1) {
    res.status(400).json({ error: 'Page must be greater than 0' });
    return;
  }
  
  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Limit must be between 1 and 100' });
    return;
  }
  
  if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    res.status(400).json({ error: 'Sort order must be "asc" or "desc"' });
    return;
  }
  
  // Attach to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder: sortOrder.toLowerCase() as 'asc' | 'desc'
  };
  
  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
      };
    }
  }
}