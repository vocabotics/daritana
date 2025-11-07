import { apiClient } from './api';

// Types for admin functionality
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isSystemAdmin: boolean;
  systemAdminRole?: 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN';
  systemAdminPermissions?: string[];
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    status: string;
  };
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  metadata?: {
    loginHistory: Array<{
      timestamp: Date;
      ip: string;
      userAgent: string;
      location?: string;
    }>;
    deviceInfo: Array<{
      device: string;
      lastUsed: Date;
      isActive: boolean;
    }>;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  suspensionReason?: string;
  isSuspended: boolean;
  planId: string;
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
  subscription: {
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndsAt?: Date;
    cancelledAt?: Date;
  };
  usage: {
    users: number;
    projects: number;
    storage: number; // in bytes
    apiCalls: number;
  };
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number; // in bytes
    maxApiCalls: number;
  };
  memberCount: number;
  projectCount: number;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
}

export interface SystemSettings {
  id: string;
  category: 'general' | 'subscription' | 'email' | 'storage' | 'security' | 'integrations' | 'compliance';
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isEditable: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: Array<{
    feature: string;
    included: boolean;
    limit?: number;
    description?: string;
  }>;
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number; // in GB
    maxApiCalls: number;
  };
  isActive: boolean;
  isPopular?: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  uptime: number; // in seconds
  services: Array<{
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED';
    responseTime: number; // in ms
    lastCheck: Date;
    errorRate: number;
  }>;
  database: {
    status: 'CONNECTED' | 'DISCONNECTED' | 'SLOW';
    connectionCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  errors: Array<{
    service: string;
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface SystemMetrics {
  timeframe: '24h' | '7d' | '30d';
  apiUsage: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByEndpoint: Array<{
      endpoint: string;
      count: number;
      averageTime: number;
    }>;
    requestsTrend: Array<{
      timestamp: Date;
      count: number;
      responseTime: number;
    }>;
  };
  userActivity: {
    activeUsers: number;
    newRegistrations: number;
    loginActivity: Array<{
      timestamp: Date;
      logins: number;
      uniqueUsers: number;
    }>;
    usersByOrganization: Array<{
      organizationName: string;
      userCount: number;
      activeUsers: number;
    }>;
  };
  systemResources: {
    storageUsed: number;
    bandwidthUsed: number;
    resourceTrend: Array<{
      timestamp: Date;
      cpu: number;
      memory: number;
      disk: number;
    }>;
  };
  businessMetrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    conversionRate: number;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface BackupRecord {
  id: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  size: number; // in bytes
  compressionRatio: number;
  includeFiles: boolean;
  storage: {
    provider: string;
    location: string;
    url: string;
  };
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in seconds
  errorMessage?: string;
  metadata: {
    tables: number;
    records: number;
    files: number;
    checksum: string;
  };
}

// ==================== USER MANAGEMENT API ====================

export const adminUsersAPI = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
    role?: string;
    organizationId?: string;
  }) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async getById(userId: string) {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  async create(user: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    organizationId?: string;
    role?: string;
    isSystemAdmin?: boolean;
    systemAdminRole?: string;
    systemAdminPermissions?: string[];
  }) {
    const response = await apiClient.post('/admin/users', user);
    return response.data;
  },

  async update(userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    password?: string;
    systemAdminRole?: string;
    systemAdminPermissions?: string[];
  }) {
    const response = await apiClient.put(`/admin/users/${userId}`, updates);
    return response.data;
  },

  async delete(userId: string, transferDataTo?: string) {
    const response = await apiClient.delete(`/admin/users/${userId}`, {
      data: { transferDataTo }
    });
    return response.data;
  },

  async getAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    const response = await apiClient.get('/admin/users/analytics', {
      params: { timeframe }
    });
    return response.data;
  },

  async bulkOperations(operation: 'activate' | 'deactivate' | 'delete' | 'export', userIds: string[], data?: any) {
    const response = await apiClient.post('/admin/users/bulk', {
      operation,
      userIds,
      data
    });
    return response.data;
  }
};

// ==================== ORGANIZATION MANAGEMENT API ====================

export const adminOrganizationsAPI = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
    plan?: string;
  }) {
    const response = await apiClient.get('/admin/organizations', { params });
    return response.data;
  },

  async getById(orgId: string) {
    const response = await apiClient.get(`/admin/organizations/${orgId}`);
    return response.data;
  },

  async suspend(orgId: string, reason: string, notifyUsers: boolean = true) {
    const response = await apiClient.post(`/admin/organizations/${orgId}/suspend`, {
      reason,
      notifyUsers
    });
    return response.data;
  },

  async reactivate(orgId: string) {
    const response = await apiClient.post(`/admin/organizations/${orgId}/reactivate`);
    return response.data;
  },

  async updateSubscription(orgId: string, updates: {
    planId?: string;
    customLimits?: {
      maxUsers?: number;
      maxProjects?: number;
      maxStorage?: number;
    };
  }) {
    const response = await apiClient.put(`/admin/organizations/${orgId}/subscription`, updates);
    return response.data;
  },

  async getUsageReport(orgId: string, timeframe: '30d' | '90d' | '1y' = '30d') {
    const response = await apiClient.get(`/admin/organizations/${orgId}/usage`, {
      params: { timeframe }
    });
    return response.data;
  }
};

// ==================== SYSTEM SETTINGS API ====================

export const adminSettingsAPI = {
  async getSettings(category?: string) {
    const response = await apiClient.get('/admin/settings', {
      params: { category }
    });
    return response.data;
  },

  async updateSettings(category: string, settings: Record<string, any>) {
    const response = await apiClient.put('/admin/settings', {
      category,
      settings
    });
    return response.data;
  },

  async getSubscriptionPlans() {
    const response = await apiClient.get('/admin/subscription-plans');
    return response.data;
  },

  async updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>) {
    const response = await apiClient.put(`/admin/subscription-plans/${planId}`, updates);
    return response.data;
  },

  async getSystemHealth() {
    const response = await apiClient.get('/admin/health');
    return response.data as SystemHealth;
  },

  async getSystemMetrics(timeframe: '24h' | '7d' | '30d' = '24h') {
    const response = await apiClient.get('/admin/metrics', {
      params: { timeframe }
    });
    return response.data as SystemMetrics;
  },

  async createBackup(includeFiles: boolean = true, compression: boolean = true) {
    const response = await apiClient.post('/admin/backup', {
      includeFiles,
      compression
    });
    return response.data;
  },

  async getBackupHistory(params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/admin/backups', { params });
    return response.data;
  }
};

// ==================== ANALYTICS AND REPORTS API ====================

export const adminAnalyticsAPI = {
  async getSystemAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    const response = await apiClient.get('/admin/analytics', {
      params: { timeframe }
    });
    return response.data;
  },

  async getUserEngagementAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    const response = await apiClient.get('/admin/analytics/engagement', {
      params: { timeframe }
    });
    return response.data;
  },

  async getOrganizationAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    const response = await apiClient.get('/admin/analytics/organizations', {
      params: { timeframe }
    });
    return response.data;
  },

  async getProjectAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
    const response = await apiClient.get('/admin/analytics/projects', {
      params: { timeframe }
    });
    return response.data;
  },

  async getFinancialAnalytics(timeframe: '3m' | '6m' | '12m' = '3m') {
    const response = await apiClient.get('/admin/analytics/financial', {
      params: { timeframe }
    });
    return response.data;
  },

  async getPerformanceAnalytics(timeframe: '24h' | '7d' | '30d' = '24h') {
    const response = await apiClient.get('/admin/analytics/performance', {
      params: { timeframe }
    });
    return response.data;
  },

  async generateCustomReport(reportConfig: {
    reportType: string;
    metrics: string[];
    timeframe?: string;
    filters?: Record<string, any>;
    groupBy?: string;
    format?: 'json' | 'csv';
  }) {
    const response = await apiClient.post('/admin/analytics/reports', reportConfig);
    return response.data;
  }
};

// ==================== AUDIT LOGS API ====================

export const adminAuditAPI = {
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    userId?: string;
    organizationId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  async getAuditLogById(logId: string) {
    const response = await apiClient.get(`/admin/audit-logs/${logId}`);
    return response.data;
  },

  async getAuditStats(params?: {
    timeframe?: '1d' | '7d' | '30d' | '90d' | '1y';
    organizationId?: string;
  }) {
    const response = await apiClient.get('/admin/audit-logs/stats', { params });
    return response.data;
  },

  async exportAuditLogs(params: {
    format?: 'csv' | 'json';
    action?: string;
    resourceType?: string;
    userId?: string;
    organizationId?: string;
    startDate?: string;
    endDate?: string;
    includeDetails?: boolean;
  }) {
    const response = await apiClient.get('/admin/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  async cleanupAuditLogs(retentionDays: number = 365, dryRun: boolean = true) {
    const response = await apiClient.post('/admin/audit-logs/cleanup', {
      retentionDays,
      dryRun
    });
    return response.data;
  },

  async getSecurityIncidents(params?: {
    timeframe?: '1d' | '7d' | '30d' | '90d';
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'all';
  }) {
    const response = await apiClient.get('/admin/security/incidents', { params });
    return response.data;
  },

  async generateComplianceReport(params: {
    startDate: string;
    endDate: string;
    organizationId?: string;
    includeUserActions?: boolean;
    includeDataAccess?: boolean;
    includeSystemChanges?: boolean;
    format?: 'json' | 'pdf';
  }) {
    const response = await apiClient.post('/admin/compliance/report', params, {
      responseType: params.format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  }
};

// ==================== COMBINED ADMIN API ====================

export const adminAPI = {
  users: adminUsersAPI,
  organizations: adminOrganizationsAPI,
  settings: adminSettingsAPI,
  analytics: adminAnalyticsAPI,
  audit: adminAuditAPI,

  // Convenience methods
  async getDashboardOverview() {
    const [health, metrics, recentActivity] = await Promise.all([
      adminSettingsAPI.getSystemHealth(),
      adminSettingsAPI.getSystemMetrics('24h'),
      adminAnalyticsAPI.getSystemAnalytics('7d')
    ]);

    return {
      health,
      metrics,
      recentActivity
    };
  },

  async getSystemStatus() {
    const health = await adminSettingsAPI.getSystemHealth();
    return {
      status: health.status,
      uptime: health.uptime,
      services: health.services.filter(s => s.status !== 'UP').length,
      errors: health.errors.length
    };
  },

  async getCriticalAlerts() {
    const [healthData, securityIncidents] = await Promise.all([
      adminSettingsAPI.getSystemHealth(),
      adminAuditAPI.getSecurityIncidents({ severity: 'critical', timeframe: '7d' })
    ]);

    const alerts = [];
    
    // Add health alerts
    if (healthData.status === 'CRITICAL') {
      alerts.push({
        type: 'system_health',
        severity: 'critical',
        message: 'System health is critical',
        data: healthData
      });
    }

    // Add security alerts
    if (securityIncidents.incidents && securityIncidents.incidents.length > 0) {
      alerts.push({
        type: 'security',
        severity: 'critical',
        message: `${securityIncidents.incidents.length} critical security incidents`,
        data: securityIncidents.incidents
      });
    }

    return alerts;
  },

  async searchSystem(query: string, type?: 'users' | 'organizations' | 'audit') {
    switch (type) {
      case 'users':
        return adminUsersAPI.getAll({ search: query, limit: 20 });
      case 'organizations':
        return adminOrganizationsAPI.getAll({ search: query, limit: 20 });
      case 'audit':
        return adminAuditAPI.getAuditLogs({ search: query, limit: 50 });
      default:
        // Search all types
        const [users, orgs, audit] = await Promise.all([
          adminUsersAPI.getAll({ search: query, limit: 10 }),
          adminOrganizationsAPI.getAll({ search: query, limit: 10 }),
          adminAuditAPI.getAuditLogs({ search: query, limit: 20 })
        ]);
        return { users, organizations: orgs, auditLogs: audit };
    }
  },

  async getMaintenanceMode() {
    const response = await apiClient.get('/admin/maintenance');
    return response.data;
  },

  async setMaintenanceMode(enabled: boolean, message?: string, estimatedDuration?: number) {
    const response = await apiClient.post('/admin/maintenance', {
      enabled,
      message,
      estimatedDuration
    });
    return response.data;
  }
};

export default adminAPI;