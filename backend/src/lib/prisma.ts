/**
 * Prisma Client Singleton
 *
 * This file ensures only ONE instance of PrismaClient exists throughout the application.
 * This prevents connection pool exhaustion and memory leaks.
 *
 * IMPORTANT: Always import prisma from this file, never create new PrismaClient() instances.
 *
 * Usage:
 *   import { prisma } from '@/lib/prisma';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

// Extend global namespace to hold the Prisma instance
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Create singleton instance
// In development, use global variable to prevent hot-reload issues
// In production, create a single instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });

// Store in global variable for hot-reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
