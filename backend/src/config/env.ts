import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment schema validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('localhost'),
  
  // Database Configuration (Prisma)
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Redis Configuration (optional for now)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  
  // Email Configuration
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@daritana.com'),
  FROM_NAME: z.string().default('Daritana Platform'),
  
  // File Upload Configuration
  UPLOAD_DIRECTORY: z.string().default('uploads'),
  MAX_FILE_SIZE: z.string().default('104857600'), // 100MB
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,dwg,dxf'),
  
  // AWS S3 Configuration (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-southeast-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Monitoring Configuration
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  
  // Malaysian-specific Configuration
  DEFAULT_TIMEZONE: z.string().default('Asia/Kuala_Lumpur'),
  DEFAULT_CURRENCY: z.string().default('MYR'),
  DEFAULT_LANGUAGE: z.string().default('en'),
  
  // Security Configuration
  BCRYPT_ROUNDS: z.string().default('12'),
  SESSION_SECRET: z.string().min(32).optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  
  // Feature Flags
  ENABLE_FILE_PROCESSING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_SMS_NOTIFICATIONS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('false'),
  ENABLE_COMPLIANCE_CHECKER: z.string().transform(val => val === 'true').default('true'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    return {
      ...env,
      // Convert string numbers to actual numbers
      PORT: parseInt(env.PORT, 10),
      REDIS_PORT: parseInt(env.REDIS_PORT, 10),
      MAX_FILE_SIZE: parseInt(env.MAX_FILE_SIZE, 10),
      RATE_LIMIT_WINDOW_MS: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
      BCRYPT_ROUNDS: parseInt(env.BCRYPT_ROUNDS, 10),
      // Parse CORS origins as array
      CORS_ORIGINS: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
      // Parse allowed file types as array
      ALLOWED_FILE_TYPES_ARRAY: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseEnv();

// Type-safe config object
export type Config = typeof config;

// Helper functions
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isTest = () => config.NODE_ENV === 'test';

// Fix import issue for database service
export { config as default };