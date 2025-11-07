import { PrismaClient } from '@prisma/client';
import { config, isDevelopment } from '../config/env';
import { logger } from '../utils/logger';

// Extend PrismaClient for middleware and logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isDevelopment() 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: isDevelopment() ? 'pretty' : 'minimal',
  });
};

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma || prismaClientSingleton();

if (!isProduction()) {
  globalThis.prisma = prisma;
}

// Add middleware for soft deletes, audit logging, etc.
prisma.$use(async (params, next) => {
  const before = Date.now();
  
  // Log slow queries in development
  if (isDevelopment()) {
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;
    
    if (duration > 100) {
      logger.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
    }
    
    return result;
  }
  
  return next(params);
});

// Connection management
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection verified');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

// Transaction helper
export const withTransaction = async <T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(async (tx) => {
    return fn(tx as PrismaClient);
  });
};

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export default prisma;