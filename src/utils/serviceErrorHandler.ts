import { toast } from '@/utils/toast';

interface ServiceErrorOptions {
  operation: string;
  showToast?: boolean;
  retryable?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Handles service errors consistently across the application
 */
export function handleServiceError(error: unknown, options: ServiceErrorOptions): Error {
  const { operation, showToast = true, onError } = options;

  let errorMessage = `Failed to ${operation}`;
  let errorObject: Error;

  if (error instanceof Error) {
    errorObject = error;
    errorMessage = error.message || errorMessage;
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorObject = new Error(error);
  } else {
    errorObject = new Error(errorMessage);
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`Service Error [${operation}]:`, errorObject);
  }

  // Show toast notification
  if (showToast) {
    toast.error(`Failed to ${operation}`, {
      description: errorMessage,
    });
  }

  // Call custom error handler
  if (onError) {
    onError(errorObject);
  }

  return errorObject;
}

/**
 * Wraps an async service function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ServiceErrorOptions
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleServiceError(error, options);
    return null;
  }
}

/**
 * Wraps an async service function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: ServiceErrorOptions & { maxRetries?: number; retryDelay?: number }
): Promise<T | null> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }

  // All retries failed
  if (lastError) {
    handleServiceError(lastError, options);
  }
  
  return null;
}
