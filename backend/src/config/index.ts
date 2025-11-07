/**
 * Central Configuration Management
 * Handles all environment variables and configuration settings
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration schema validation
const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('Daritana Architecture Platform'),
  APP_VERSION: z.string().default('1.0.0'),
  PORT: z.string().transform(Number).default('3000'),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Database
  DATABASE_URL: z.string(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('daritana'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  DB_SSL: z.string().transform(val => val === 'true').default('false'),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).default('60000'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  REDIS_KEY_PREFIX: z.string().default('daritana:'),
  
  // Authentication
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-southeast-1'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().transform(val => val === 'true').default('false'),
  
  // Google Cloud Storage
  GCS_PROJECT_ID: z.string().optional(),
  GCS_KEY_FILE: z.string().optional(),
  GCS_BUCKET: z.string().optional(),
  
  // Email
  EMAIL_PROVIDER: z.enum(['ses', 'sendgrid', 'smtp', 'mailgun']).default('smtp'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@daritana.com'),
  EMAIL_FROM_NAME: z.string().default('Daritana Platform'),
  
  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  
  // Twilio (SMS)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // WhatsApp Business
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  
  // Payment Gateways
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  FPX_MERCHANT_ID: z.string().optional(),
  FPX_SECRET_KEY: z.string().optional(),
  IPAY88_MERCHANT_KEY: z.string().optional(),
  IPAY88_MERCHANT_CODE: z.string().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORGANIZATION: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  
  // Google APIs
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_DRIVE_REDIRECT_URI: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  LOG_TO_FILE: z.string().transform(val => val === 'true').default('false'),
  LOG_FILE_PATH: z.string().default('./logs'),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  ENCRYPTION_KEY: z.string(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'), // 50MB
  ALLOWED_FILE_TYPES: z.string().default('image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Malaysian Specific
  DEFAULT_TIMEZONE: z.string().default('Asia/Kuala_Lumpur'),
  DEFAULT_CURRENCY: z.string().default('MYR'),
  DEFAULT_LANGUAGE: z.string().default('en'),
  SST_RATE: z.string().transform(Number).default('0.06'), // 6% SST
  
  // Background Jobs
  BULL_REDIS_HOST: z.string().optional(),
  BULL_REDIS_PORT: z.string().transform(Number).optional(),
  BULL_REDIS_PASSWORD: z.string().optional(),
  JOB_CONCURRENCY: z.string().transform(Number).default('5'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_GRAPHQL: z.string().transform(val => val === 'true').default('true'),
  ENABLE_WEBSOCKET: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PAYMENT_GATEWAY: z.string().transform(val => val === 'true').default('true'),
  ENABLE_DAILY_AUTOMATION: z.string().transform(val => val === 'true').default('true'),
  
  // Cache
  CACHE_TTL: z.string().transform(Number).default('3600'), // 1 hour
  CACHE_CHECK_PERIOD: z.string().transform(Number).default('600'), // 10 minutes
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      PORT: process.env.PORT,
      API_PREFIX: process.env.API_PREFIX,
      
      // Database
      DATABASE_URL: process.env.DATABASE_URL,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_SSL: process.env.DB_SSL,
      DB_POOL_MIN: process.env.DB_POOL_MIN,
      DB_POOL_MAX: process.env.DB_POOL_MAX,
      DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT,
      
      // Redis
      REDIS_URL: process.env.REDIS_URL,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DB: process.env.REDIS_DB,
      REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
      
      // Authentication
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
      BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
      
      // OAuth
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      
      // AWS S3
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION,
      S3_BUCKET: process.env.S3_BUCKET,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
      
      // Google Cloud Storage
      GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
      GCS_KEY_FILE: process.env.GCS_KEY_FILE,
      GCS_BUCKET: process.env.GCS_BUCKET,
      
      // Email
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      
      // SMS
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      
      // WhatsApp
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      
      // Telegram
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,
      
      // Payment
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      FPX_MERCHANT_ID: process.env.FPX_MERCHANT_ID,
      FPX_SECRET_KEY: process.env.FPX_SECRET_KEY,
      IPAY88_MERCHANT_KEY: process.env.IPAY88_MERCHANT_KEY,
      IPAY88_MERCHANT_CODE: process.env.IPAY88_MERCHANT_CODE,
      
      // AI
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_ORGANIZATION: process.env.OPENAI_ORGANIZATION,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      
      // Google Drive
      GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
      
      // Logging
      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_FORMAT: process.env.LOG_FORMAT,
      LOG_TO_FILE: process.env.LOG_TO_FILE,
      LOG_FILE_PATH: process.env.LOG_FILE_PATH,
      
      // Security
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      CORS_CREDENTIALS: process.env.CORS_CREDENTIALS,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      
      // File Upload
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
      UPLOAD_PATH: process.env.UPLOAD_PATH,
      
      // Malaysian Specific
      DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE,
      DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
      DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE,
      SST_RATE: process.env.SST_RATE,
      
      // Background Jobs
      BULL_REDIS_HOST: process.env.BULL_REDIS_HOST,
      BULL_REDIS_PORT: process.env.BULL_REDIS_PORT,
      BULL_REDIS_PASSWORD: process.env.BULL_REDIS_PASSWORD,
      JOB_CONCURRENCY: process.env.JOB_CONCURRENCY,
      
      // Monitoring
      SENTRY_DSN: process.env.SENTRY_DSN,
      NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
      DATADOG_API_KEY: process.env.DATADOG_API_KEY,
      
      // Feature Flags
      ENABLE_GRAPHQL: process.env.ENABLE_GRAPHQL,
      ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET,
      ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES,
      ENABLE_PAYMENT_GATEWAY: process.env.ENABLE_PAYMENT_GATEWAY,
      ENABLE_DAILY_AUTOMATION: process.env.ENABLE_DAILY_AUTOMATION,
      
      // Cache
      CACHE_TTL: process.env.CACHE_TTL,
      CACHE_CHECK_PERIOD: process.env.CACHE_CHECK_PERIOD,
    };

    return configSchema.parse(env);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration');
  }
};

// Export validated configuration
export const config = parseConfig();

// Database configuration object
export const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
  pool: {
    min: config.DB_POOL_MIN,
    max: config.DB_POOL_MAX,
    idle: 10000,
    acquire: config.DB_CONNECTION_TIMEOUT,
    evict: 1000
  }
};

// Redis configuration object
export const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  keyPrefix: config.REDIS_KEY_PREFIX,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// JWT configuration object
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshSecret: config.JWT_REFRESH_SECRET,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  algorithms: ['HS256'] as const
};

// S3 configuration object
export const s3Config = {
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION,
  bucket: config.S3_BUCKET,
  endpoint: config.S3_ENDPOINT,
  forcePathStyle: config.S3_FORCE_PATH_STYLE
};

// Email configuration object
export const emailConfig = {
  provider: config.EMAIL_PROVIDER,
  from: {
    email: config.EMAIL_FROM,
    name: config.EMAIL_FROM_NAME
  },
  smtp: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD
    }
  },
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY
  }
};

// Feature flags
export const features = {
  graphql: config.ENABLE_GRAPHQL,
  websocket: config.ENABLE_WEBSOCKET,
  ai: config.ENABLE_AI_FEATURES,
  payment: config.ENABLE_PAYMENT_GATEWAY,
  automation: config.ENABLE_DAILY_AUTOMATION
};

// Export helper to check if in production
export const isProduction = () => config.NODE_ENV === 'production';
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isStaging = () => config.NODE_ENV === 'staging';

// Export helper to get base URL
export const getBaseUrl = () => {
  if (isProduction()) {
    return 'https://api.daritana.com';
  } else if (isStaging()) {
    return 'https://staging-api.daritana.com';
  }
  return `http://localhost:${config.PORT}`;
};

// Export helper for API URL
export const getApiUrl = (path: string = '') => {
  return `${getBaseUrl()}${config.API_PREFIX}${path}`;
};