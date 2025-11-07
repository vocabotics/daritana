import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get system settings
 */
export const getSystemSettings = async (req: MultiTenantRequest, res: Response) => {
  try {
    // Get system-wide settings from database or environment
    const settings = {
      general: {
        siteName: process.env.SITE_NAME || 'Daritana',
        siteUrl: process.env.SITE_URL || 'https://daritana.com',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@daritana.com',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
        emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED !== 'false',
        maxFileUploadSize: parseInt(process.env.MAX_FILE_UPLOAD_SIZE || '100') // MB
      },
      subscription: {
        basicPlanPrice: parseFloat(process.env.BASIC_PLAN_PRICE || '49.99'),
        professionalPlanPrice: parseFloat(process.env.PROFESSIONAL_PLAN_PRICE || '99.99'),
        enterprisePlanPrice: parseFloat(process.env.ENTERPRISE_PLAN_PRICE || '299.99'),
        trialPeriodDays: parseInt(process.env.TRIAL_PERIOD_DAYS || '14'),
        currency: process.env.CURRENCY || 'MYR'
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUsername: process.env.SMTP_USERNAME || '',
        smtpPassword: process.env.SMTP_PASSWORD ? '***hidden***' : '',
        fromName: process.env.EMAIL_FROM_NAME || 'Daritana',
        fromEmail: process.env.EMAIL_FROM || 'noreply@daritana.com'
      },
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        awsRegion: process.env.AWS_REGION || '',
        awsBucket: process.env.AWS_BUCKET || '',
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID ? '***hidden***' : '',
        googleDriveEnabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
        oneDriveEnabled: process.env.ONEDRIVE_ENABLED === 'true'
      },
      security: {
        jwtExpirationTime: process.env.JWT_EXPIRATION || '24h',
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
        passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
        passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1440'), // minutes
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15') // minutes
      },
      integrations: {
        slackEnabled: process.env.SLACK_ENABLED === 'true',
        teamsEnabled: process.env.TEAMS_ENABLED === 'true',
        googleWorkspaceEnabled: process.env.GOOGLE_WORKSPACE_ENABLED === 'true',
        office365Enabled: process.env.OFFICE365_ENABLED === 'true',
        whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true'
      },
      compliance: {
        gdprEnabled: process.env.GDPR_ENABLED !== 'false',
        dataRetentionPeriod: parseInt(process.env.DATA_RETENTION_PERIOD || '2555'), // days (7 years)
        auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION || '365'), // days
        backupFrequency: process.env.BACKUP_FREQUENCY || 'daily',
        encryptionEnabled: process.env.ENCRYPTION_ENABLED !== 'false'
      }
    }

    // Get database-stored settings
    const dbSettings = await getSystemSettingsFromDB()
    
    res.json({
      settings: {
        ...settings,
        ...dbSettings
      }
    })
  } catch (error) {
    console.error('Get system settings error:', error)
    res.status(500).json({ error: 'Failed to fetch system settings' })
  }
}

/**
 * Update system settings
 */
export const updateSystemSettings = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { category, settings } = req.body

    if (!category || !settings) {
      return res.status(400).json({ error: 'Category and settings are required' })
    }

    // Store settings in database
    await saveSystemSettingsToDB(category, settings)

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        resourceType: 'SYSTEM_SETTINGS',
        resourceId: category,
        details: {
          category,
          changes: settings,
          updatedBy: req.user!.name
        }
      }
    })

    res.json({
      success: true,
      message: 'System settings updated successfully'
    })
  } catch (error) {
    console.error('Update system settings error:', error)
    res.status(500).json({ error: 'Failed to update system settings' })
  }
}

/**
 * Get subscription plans
 */
export const getSubscriptionPlans = async (req: MultiTenantRequest, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    })

    res.json({ plans })
  } catch (error) {
    console.error('Get subscription plans error:', error)
    res.status(500).json({ error: 'Failed to fetch subscription plans' })
  }
}

/**
 * Update subscription plan
 */
export const updateSubscriptionPlan = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { planId } = req.params
    const updateData = req.body

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_SUBSCRIPTION_PLAN',
        resourceType: 'SUBSCRIPTION_PLAN',
        resourceId: planId,
        details: {
          planName: plan.name,
          changes: updateData
        }
      }
    })

    res.json({ plan })
  } catch (error) {
    console.error('Update subscription plan error:', error)
    res.status(500).json({ error: 'Failed to update subscription plan' })
  }
}

/**
 * Get system health
 */
export const getSystemHealth = async (req: MultiTenantRequest, res: Response) => {
  try {
    const [
      databaseHealth,
      storageHealth,
      emailHealth,
      integrationHealth
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkStorageHealth(),
      checkEmailHealth(),
      checkIntegrationHealth()
    ])

    const overall = [databaseHealth, storageHealth, emailHealth, integrationHealth]
      .every(health => health.status === 'healthy') ? 'healthy' : 'degraded'

    res.json({
      overall,
      services: {
        database: databaseHealth,
        storage: storageHealth,
        email: emailHealth,
        integrations: integrationHealth
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get system health error:', error)
    res.status(500).json({
      overall: 'unhealthy',
      error: 'Failed to check system health'
    })
  }
}

/**
 * Get system metrics
 */
export const getSystemMetrics = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { timeframe = '24h' } = req.query
    const hours = timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 24

    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    const [
      userMetrics,
      organizationMetrics,
      projectMetrics,
      storageMetrics,
      performanceMetrics
    ] = await Promise.all([
      getUserMetrics(startTime),
      getOrganizationMetrics(startTime),
      getProjectMetrics(startTime),
      getStorageMetrics(),
      getPerformanceMetrics(hours)
    ])

    res.json({
      users: userMetrics,
      organizations: organizationMetrics,
      projects: projectMetrics,
      storage: storageMetrics,
      performance: performanceMetrics,
      timeframe
    })
  } catch (error) {
    console.error('Get system metrics error:', error)
    res.status(500).json({ error: 'Failed to fetch system metrics' })
  }
}

/**
 * Backup system data
 */
export const createBackup = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { includeFiles = false, compression = true } = req.body

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `backup_${timestamp}`

    // Start backup process (would be async in real implementation)
    const backup = {
      id: backupId,
      createdAt: new Date(),
      createdBy: req.user!.id,
      status: 'in_progress',
      includeFiles,
      compression,
      estimatedSize: '0 MB',
      progress: 0
    }

    // Log backup creation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_BACKUP',
        resourceType: 'SYSTEM_BACKUP',
        resourceId: backupId,
        details: {
          includeFiles,
          compression,
          initiatedBy: req.user!.name
        }
      }
    })

    // In real implementation, start background backup process
    // For now, simulate immediate completion
    setTimeout(async () => {
      await simulateBackupCompletion(backupId)
    }, 5000)

    res.json({
      success: true,
      backup,
      message: 'Backup process started'
    })
  } catch (error) {
    console.error('Create backup error:', error)
    res.status(500).json({ error: 'Failed to create backup' })
  }
}

/**
 * Get backup history
 */
export const getBackupHistory = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query

    // In real implementation, get from backup storage/database
    const mockBackups = [
      {
        id: 'backup_2024-01-15T10-30-00',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        createdBy: req.user!.id,
        status: 'completed',
        size: '124.5 MB',
        includeFiles: true,
        compression: true,
        downloadUrl: '/api/admin/backups/backup_2024-01-15T10-30-00/download'
      },
      {
        id: 'backup_2024-01-14T10-30-00',
        createdAt: new Date('2024-01-14T10:30:00Z'),
        createdBy: req.user!.id,
        status: 'completed',
        size: '98.2 MB',
        includeFiles: false,
        compression: true,
        downloadUrl: '/api/admin/backups/backup_2024-01-14T10-30-00/download'
      }
    ]

    res.json({
      backups: mockBackups,
      pagination: {
        total: mockBackups.length,
        page: Number(page),
        limit: Number(limit),
        pages: 1
      }
    })
  } catch (error) {
    console.error('Get backup history error:', error)
    res.status(500).json({ error: 'Failed to fetch backup history' })
  }
}

// Helper functions

async function getSystemSettingsFromDB() {
  // In real implementation, fetch from a system_settings table
  return {
    customSettings: {
      logoUrl: '/api/uploads/logo.png',
      primaryColor: '#0066CC',
      secondaryColor: '#0052A3'
    }
  }
}

async function saveSystemSettingsToDB(category: string, settings: any) {
  // In real implementation, save to system_settings table
  console.log(`Saving ${category} settings:`, settings)
}

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'healthy',
      responseTime: Math.floor(Math.random() * 10) + 5, // ms
      connections: Math.floor(Math.random() * 50) + 10
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Database connection failed'
    }
  }
}

async function checkStorageHealth() {
  // Mock storage health check
  return {
    status: 'healthy',
    totalSpace: '1 TB',
    usedSpace: '245 GB',
    availableSpace: '755 GB',
    usagePercentage: 25
  }
}

async function checkEmailHealth() {
  // Mock email service health check
  return {
    status: 'healthy',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    dailyQuota: 10000,
    dailySent: 234,
    quotaUsage: 2.34
  }
}

async function checkIntegrationHealth() {
  // Mock integration health check
  return {
    status: 'healthy',
    services: {
      slack: { status: 'connected', lastChecked: new Date() },
      googleDrive: { status: 'connected', lastChecked: new Date() },
      office365: { status: 'disconnected', lastChecked: new Date() }
    }
  }
}

async function getUserMetrics(startTime: Date) {
  const [totalUsers, newUsers, activeUsers] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        createdAt: { gte: startTime }
      }
    }),
    prisma.user.count({
      where: {
        isActive: true,
        lastLogin: { gte: startTime }
      }
    })
  ])

  return {
    total: totalUsers,
    new: newUsers,
    active: activeUsers,
    activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
  }
}

async function getOrganizationMetrics(startTime: Date) {
  const [totalOrgs, newOrgs, activeOrgs] = await Promise.all([
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({
      where: {
        createdAt: { gte: startTime }
      }
    }),
    prisma.organization.count({
      where: {
        status: 'ACTIVE',
        updatedAt: { gte: startTime }
      }
    })
  ])

  return {
    total: totalOrgs,
    new: newOrgs,
    active: activeOrgs
  }
}

async function getProjectMetrics(startTime: Date) {
  const [totalProjects, newProjects, activeProjects] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({
      where: {
        createdAt: { gte: startTime },
        deletedAt: null
      }
    }),
    prisma.project.count({
      where: {
        status: 'IN_PROGRESS',
        deletedAt: null
      }
    })
  ])

  return {
    total: totalProjects,
    new: newProjects,
    active: activeProjects
  }
}

async function getStorageMetrics() {
  const [totalFiles, totalSize] = await Promise.all([
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.document.aggregate({
      where: { deletedAt: null },
      _sum: { size: true }
    })
  ])

  const totalSizeGB = (totalSize._sum.size || 0) / (1024 * 1024 * 1024)

  return {
    totalFiles,
    totalSizeGB: Math.round(totalSizeGB * 100) / 100,
    averageFileSize: totalFiles > 0 ? (totalSize._sum.size || 0) / totalFiles : 0
  }
}

async function getPerformanceMetrics(hours: number) {
  // Mock performance metrics
  return {
    averageResponseTime: Math.floor(Math.random() * 100) + 50, // ms
    uptime: 99.9,
    errorRate: 0.1,
    throughput: Math.floor(Math.random() * 1000) + 500 // requests/hour
  }
}

async function simulateBackupCompletion(backupId: string) {
  // In real implementation, update backup status in database
  console.log(`Backup ${backupId} completed`)
}