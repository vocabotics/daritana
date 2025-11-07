import { config } from 'dotenv';

// Load environment variables
config();

export const productionConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    environment: 'production',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://daritana.com', 'https://www.daritana.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    }
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),
      createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200')
    },
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'daritana.com',
      audience: process.env.JWT_AUDIENCE || 'daritana-users'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '12')
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://api.sendgrid.com"],
          frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Email Configuration (SendGrid)
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'noreply@daritana.com',
      fromName: process.env.FROM_NAME || 'Daritana',
      templates: {
        welcome: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
        passwordReset: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
        invitation: process.env.SENDGRID_INVITATION_TEMPLATE_ID,
        paymentConfirmation: process.env.SENDGRID_PAYMENT_CONFIRMATION_TEMPLATE_ID,
        subscriptionUpdate: process.env.SENDGRID_SUBSCRIPTION_UPDATE_TEMPLATE_ID
      }
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },

  // Payment Configuration (Stripe)
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      apiVersion: '2025-07-30.basil',
      currency: process.env.STRIPE_CURRENCY || 'usd',
      supportedCurrencies: ['usd', 'eur', 'gbp', 'myr'],
      webhookEvents: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    }
  },

  // File Storage Configuration (AWS S3)
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'rtf', 'zip', 'rar', '7z', 'mp4', 'avi', 'mov', 'wmv', 'flv'
      ]
    }
  },

  // Monitoring & Logging
  monitoring: {
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      transports: ['file', 'console'],
      file: {
        filename: process.env.LOG_FILE || 'logs/app.log',
        maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'), // 10MB
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        tailable: true
      }
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: parseInt(process.env.METRICS_PORT || '9090'),
      endpoint: process.env.METRICS_ENDPOINT || '/metrics'
    },
    healthCheck: {
      enabled: true,
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000') // 5 seconds
    }
  },

  // Performance & Caching
  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    caching: {
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        url: process.env.REDIS_URL,
        ttl: parseInt(process.env.REDIS_TTL || '3600') // 1 hour
      },
      memory: {
        enabled: true,
        max: parseInt(process.env.MEMORY_CACHE_MAX || '100'),
        ttl: parseInt(process.env.MEMORY_CACHE_TTL || '300') // 5 minutes
      }
    },
    optimization: {
      responseTime: true,
      compression: true,
      etag: true,
      lastModified: true
    }
  },

  // Backup & Recovery
  backup: {
    database: {
      enabled: process.env.DB_BACKUP_ENABLED === 'true',
      schedule: process.env.DB_BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      retention: parseInt(process.env.DB_BACKUP_RETENTION || '30'), // 30 days
      compression: true,
      encryption: process.env.DB_BACKUP_ENCRYPTION === 'true'
    },
    files: {
      enabled: process.env.FILE_BACKUP_ENABLED === 'true',
      schedule: process.env.FILE_BACKUP_SCHEDULE || '0 3 * * *', // Daily at 3 AM
      retention: parseInt(process.env.FILE_BACKUP_RETENTION || '90'), // 90 days
      compression: true
    }
  },

  // AI & Machine Learning
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
    },
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      index: process.env.PINECONE_INDEX
    },
    langchain: {
      enabled: process.env.LANGCHAIN_ENABLED === 'true',
      tracing: process.env.LANGCHAIN_TRACING === 'true'
    }
  },

  // External Services
  external: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI
    }
  },

  // Feature Flags
  features: {
    aiAssistant: process.env.FEATURE_AI_ASSISTANT === 'true',
    advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
    realTimeCollaboration: process.env.FEATURE_REAL_TIME_COLLABORATION === 'true',
    mobileApp: process.env.FEATURE_MOBILE_APP === 'true',
    apiRateLimiting: process.env.FEATURE_API_RATE_LIMITING === 'true',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING === 'true'
  },

  // Maintenance & Updates
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || 'System is under maintenance. Please try again later.',
    allowedIPs: process.env.MAINTENANCE_ALLOWED_IPS?.split(',') || [],
    scheduled: {
      enabled: process.env.SCHEDULED_MAINTENANCE_ENABLED === 'true',
      schedule: process.env.SCHEDULED_MAINTENANCE_SCHEDULE || '0 1 * * 0', // Weekly on Sunday at 1 AM
      duration: parseInt(process.env.SCHEDULED_MAINTENANCE_DURATION || '3600000') // 1 hour
    }
  }
};

export default productionConfig;
