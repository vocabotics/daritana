import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
  code?: string
  details?: any
}

export class ApiError extends Error implements AppError {
  statusCode: number
  status: string
  isOperational: boolean
  code?: string
  details?: any

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any,
    isOperational = true,
    stack = ''
  ) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = isOperational
    this.code = code
    this.details = details

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message, code, details } = err

  // Log error
  logger.error({
    error: {
      message,
      statusCode,
      code,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      details
    }
  })

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    details = err.details || err.message
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400
    message = 'Database validation error'
    details = err.details || err.message
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409
    message = 'Duplicate entry'
    details = err.details || err.message
  }

  // Send error response
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      details,
      stack: err.stack
    }),
    timestamp: new Date().toISOString(),
    path: req.url
  })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}