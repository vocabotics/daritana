import winston from 'winston';
import { query } from '../database/connection';
import { Request } from 'express';

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'audit' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'info'
    })
  ]
});

// Audit event types
export enum AuditEventType {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // User Management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  
  // Project Management
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_MEMBER_ADD = 'PROJECT_MEMBER_ADD',
  PROJECT_MEMBER_REMOVE = 'PROJECT_MEMBER_REMOVE',
  
  // Task Management
  TASK_CREATE = 'TASK_CREATE',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_COMPLETE = 'TASK_COMPLETE',
  
  // Financial
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_UPDATE = 'INVOICE_UPDATE',
  INVOICE_DELETE = 'INVOICE_DELETE',
  INVOICE_SEND = 'INVOICE_SEND',
  PAYMENT_RECEIVE = 'PAYMENT_RECEIVE',
  
  // File Management
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  FILE_SHARE = 'FILE_SHARE',
  
  // System
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  
  // Security
  ACCESS_DENIED = 'ACCESS_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_REVOKE = 'API_KEY_REVOKE'
}

// Audit entry interface
export interface AuditEntry {
  id?: string;
  event_type: AuditEventType;
  user_id?: string;
  user_email?: string;
  organization_id?: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at?: Date;
}

// Log audit event
export const logAuditEvent = async (
  eventType: AuditEventType,
  req: Request | null,
  data: {
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    entityType?: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }
): Promise<void> => {
  try {
    const auditEntry: AuditEntry = {
      event_type: eventType,
      user_id: data.userId,
      user_email: data.userEmail,
      organization_id: data.organizationId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
      new_values: data.newValues ? JSON.stringify(data.newValues) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ip_address: req ? getClientIp(req) || undefined : undefined,
      user_agent: req ? req.headers['user-agent'] || undefined : undefined
    };

    // Save to database
    await saveAuditEntry(auditEntry);

    // Log to file
    logger.info('Audit event', auditEntry);
  } catch (error) {
    logger.error('Failed to log audit event', { error, eventType, data });
  }
};

// Save audit entry to database
const saveAuditEntry = async (entry: AuditEntry): Promise<void> => {
  const sql = `
    INSERT INTO audit_logs (
      event_type, user_id, user_email, organization_id,
      entity_type, entity_id, old_values, new_values,
      ip_address, user_agent, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;
  
  const params = [
    entry.event_type,
    entry.user_id,
    entry.user_email,
    entry.organization_id,
    entry.entity_type,
    entry.entity_id,
    entry.old_values,
    entry.new_values,
    entry.ip_address,
    entry.user_agent,
    entry.metadata
  ];

  await query(sql, params);
};

// Get client IP address
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (forwarded as string).split(',')[0].trim();
  }
  
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }
  
  return req.socket.remoteAddress || 'unknown';
};

// Query audit logs
export const queryAuditLogs = async (
  filters: {
    eventType?: AuditEventType;
    userId?: string;
    organizationId?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  pagination: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{ logs: AuditEntry[]; total: number }> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const offset = (page - 1) * limit;
  
  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (filters.eventType) {
    whereConditions.push(`event_type = $${paramIndex++}`);
    params.push(filters.eventType);
  }

  if (filters.userId) {
    whereConditions.push(`user_id = $${paramIndex++}`);
    params.push(filters.userId);
  }

  if (filters.organizationId) {
    whereConditions.push(`organization_id = $${paramIndex++}`);
    params.push(filters.organizationId);
  }

  if (filters.entityType) {
    whereConditions.push(`entity_type = $${paramIndex++}`);
    params.push(filters.entityType);
  }

  if (filters.entityId) {
    whereConditions.push(`entity_id = $${paramIndex++}`);
    params.push(filters.entityId);
  }

  if (filters.startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`;
  const countResult = await query<{ count: string }>(countSql, params);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const dataSql = `
    SELECT * FROM audit_logs 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const dataResult = await query<AuditEntry>(dataSql, params);

  return {
    logs: dataResult.rows,
    total
  };
};

// Generate audit report
export const generateAuditReport = async (
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  summary: Record<string, number>;
  topUsers: Array<{ userId: string; userEmail: string; eventCount: number }>;
  recentEvents: AuditEntry[];
}> => {
  // Get event type summary
  const summarySql = `
    SELECT event_type, COUNT(*) as count
    FROM audit_logs
    WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
    GROUP BY event_type
    ORDER BY count DESC
  `;
  const summaryResult = await query<{ event_type: string; count: string }>(
    summarySql,
    [organizationId, startDate, endDate]
  );

  const summary: Record<string, number> = {};
  summaryResult.rows.forEach(row => {
    summary[row.event_type] = parseInt(row.count);
  });

  // Get top users by activity
  const topUsersSql = `
    SELECT user_id, user_email, COUNT(*) as event_count
    FROM audit_logs
    WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
    GROUP BY user_id, user_email
    ORDER BY event_count DESC
    LIMIT 10
  `;
  const topUsersResult = await query<{ user_id: string; user_email: string; event_count: string }>(
    topUsersSql,
    [organizationId, startDate, endDate]
  );

  const topUsers = topUsersResult.rows.map(row => ({
    userId: row.user_id,
    userEmail: row.user_email,
    eventCount: parseInt(row.event_count)
  }));

  // Get recent events
  const recentEventsSql = `
    SELECT * FROM audit_logs
    WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC
    LIMIT 100
  `;
  const recentEventsResult = await query<AuditEntry>(
    recentEventsSql,
    [organizationId, startDate, endDate]
  );

  return {
    summary,
    topUsers,
    recentEvents: recentEventsResult.rows
  };
};

// Clean up old audit logs
export const cleanupOldAuditLogs = async (retentionDays: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const sql = `
    DELETE FROM audit_logs
    WHERE created_at < $1
  `;

  const result = await query(sql, [cutoffDate]);
  const deletedCount = result.rowCount || 0;

  logger.info('Cleaned up old audit logs', { deletedCount, cutoffDate });
  return deletedCount;
};

// Check for suspicious activity
export const checkSuspiciousActivity = async (
  userId: string,
  timeWindowMinutes: number = 5,
  maxAttempts: number = 10
): Promise<boolean> => {
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - timeWindowMinutes);

  const sql = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE user_id = $1 
      AND created_at >= $2
      AND event_type IN ($3, $4)
  `;

  const result = await query<{ count: string }>(
    sql,
    [userId, startTime, AuditEventType.ACCESS_DENIED, AuditEventType.SUSPICIOUS_ACTIVITY]
  );

  const attemptCount = parseInt(result.rows[0].count);
  const isSuspicious = attemptCount >= maxAttempts;

  if (isSuspicious) {
    await logAuditEvent(AuditEventType.SUSPICIOUS_ACTIVITY, null, {
      userId,
      metadata: { attemptCount, timeWindowMinutes }
    });
  }

  return isSuspicious;
};