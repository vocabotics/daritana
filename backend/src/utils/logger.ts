import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config, isProduction } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${stack || message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger configuration
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { 
    service: 'daritana-backend',
    environment: config.NODE_ENV 
  },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Add console transport for non-production environments
if (!isProduction()) {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    )
  }));
}

// Stream for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Create log methods for different contexts
export const createLogger = (context: string) => {
  return {
    error: (message: string, error?: any) => {
      if (error instanceof Error) {
        logger.error(`[${context}] ${message}`, { error: error.message, stack: error.stack });
      } else {
        logger.error(`[${context}] ${message}`, error);
      }
    },
    warn: (message: string, ...meta: any[]) => logger.warn(`[${context}] ${message}`, ...meta),
    info: (message: string, ...meta: any[]) => logger.info(`[${context}] ${message}`, ...meta),
    debug: (message: string, ...meta: any[]) => logger.debug(`[${context}] ${message}`, ...meta),
  };
};

export { logger };