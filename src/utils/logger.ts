/**
 * Production-Safe Logger
 *
 * Replaces console.log with environment-aware logging
 * - Development: Full logging to console
 * - Production: Only errors, sends to error tracking service
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('API failed', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log warnings (all environments)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || '');

    if (this.isProduction) {
      this.sendToErrorTracking('warn', message, context);
    }
  }

  /**
   * Log errors (all environments)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context || '');

    if (this.isProduction) {
      this.sendToErrorTracking('error', message, { error, ...context });
    }
  }

  /**
   * Send to error tracking service (Sentry, LogRocket, etc.)
   */
  private sendToErrorTracking(level: LogLevel, message: string, context?: LogContext): void {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(message, {
    //     level,
    //     extra: context,
    //   });
    // }
  }

  /**
   * Log API errors with structured data
   */
  apiError(endpoint: string, error: any, context?: LogContext): void {
    const message = `API Error: ${endpoint}`;
    const errorContext = {
      endpoint,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      ...context,
    };

    this.error(message, error, errorContext);
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${metric}: ${duration}ms`, context || '');
    }

    // In production, send to analytics service
    if (this.isProduction && duration > 1000) {
      // Only log slow operations
      this.sendToErrorTracking('warn', `Slow operation: ${metric}`, {
        duration,
        ...context,
      });
    }
  }

  /**
   * Create a scoped logger for a specific module
   */
  scope(moduleName: string) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(`[${moduleName}] ${message}`, context),
      info: (message: string, context?: LogContext) =>
        this.info(`[${moduleName}] ${message}`, context),
      warn: (message: string, context?: LogContext) =>
        this.warn(`[${moduleName}] ${message}`, context),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        this.error(`[${moduleName}] ${message}`, error, context),
    };
  }
}

export const logger = new Logger();

// Export scoped loggers for common modules
export const authLogger = logger.scope('Auth');
export const apiLogger = logger.scope('API');
export const storeLogger = logger.scope('Store');
export const routerLogger = logger.scope('Router');

export default logger;
