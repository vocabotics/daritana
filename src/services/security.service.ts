import { api } from '@/lib/api';

export interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
  trusted: boolean;
  userAgent: string;
  createdAt: string;
  expiresAt?: string;
}

export interface SessionSettings {
  timeout: number; // minutes
  maxSessions: number;
  requireReauth: boolean;
  alertNewDevice: boolean;
  enable2FA: boolean;
  requirePasswordChange: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'session_terminated';
  description: string;
  ip: string;
  location: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  backupCodes: string[];
  lastUsed?: string;
}

class SecurityService {
  // Session management
  async getActiveSessions(): Promise<Session[]> {
    try {
      const response = await api.get<Session[]>('/security/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<Session> {
    try {
      const response = await api.get<Session>(`/security/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch session ${sessionId}:`, error);
      throw error;
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/security/sessions/${sessionId}`);
    } catch (error) {
      console.error(`Failed to terminate session ${sessionId}:`, error);
      throw error;
    }
  }

  async terminateAllOtherSessions(): Promise<void> {
    try {
      await api.delete('/security/sessions/others');
    } catch (error) {
      console.error('Failed to terminate all other sessions:', error);
      throw error;
    }
  }

  async refreshSession(sessionId: string): Promise<Session> {
    try {
      const response = await api.post<Session>(`/security/sessions/${sessionId}/refresh`);
      return response.data;
    } catch (error) {
      console.error(`Failed to refresh session ${sessionId}:`, error);
      throw error;
    }
  }

  // Session settings
  async getSessionSettings(): Promise<SessionSettings> {
    try {
      const response = await api.get<SessionSettings>('/security/session-settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch session settings:', error);
      throw error;
    }
  }

  async updateSessionSettings(settings: Partial<SessionSettings>): Promise<SessionSettings> {
    try {
      const response = await api.put<SessionSettings>('/security/session-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update session settings:', error);
      throw error;
    }
  }

  // Two-factor authentication
  async getTwoFactorAuth(): Promise<TwoFactorAuth> {
    try {
      const response = await api.get<TwoFactorAuth>('/security/2fa');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch 2FA settings:', error);
      throw error;
    }
  }

  async enableTwoFactorAuth(method: 'totp' | 'sms' | 'email'): Promise<TwoFactorAuth> {
    try {
      const response = await api.post<TwoFactorAuth>('/security/2fa/enable', { method });
      return response.data;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  async disableTwoFactorAuth(): Promise<TwoFactorAuth> {
    try {
      const response = await api.post<TwoFactorAuth>('/security/2fa/disable');
      return response.data;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }

  async verifyTwoFactorAuth(code: string): Promise<boolean> {
    try {
      const response = await api.post<{ valid: boolean }>('/security/2fa/verify', { code });
      return response.data.valid;
    } catch (error) {
      console.error('Failed to verify 2FA code:', error);
      throw error;
    }
  }

  async generateBackupCodes(): Promise<string[]> {
    try {
      const response = await api.post<{ backupCodes: string[] }>('/security/2fa/backup-codes');
      return response.data.backupCodes;
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      throw error;
    }
  }

  // Security events and audit
  async getSecurityEvents(limit: number = 50, offset: number = 0): Promise<SecurityEvent[]> {
    try {
      const response = await api.get<SecurityEvent[]>(`/security/events?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      throw error;
    }
  }

  async getSecurityEventById(eventId: string): Promise<SecurityEvent> {
    try {
      const response = await api.get<SecurityEvent>(`/security/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch security event ${eventId}:`, error);
      throw error;
    }
  }

  async getSecurityEventsByType(type: string): Promise<SecurityEvent[]> {
    try {
      const response = await api.get<SecurityEvent[]>(`/security/events/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch security events by type ${type}:`, error);
      throw error;
    }
  }

  async getSecurityEventsBySeverity(severity: string): Promise<SecurityEvent[]> {
    try {
      const response = await api.get<SecurityEvent[]>(`/security/events/severity/${severity}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch security events by severity ${severity}:`, error);
      throw error;
    }
  }

  // Password security
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/security/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  async requirePasswordChange(): Promise<void> {
    try {
      await api.post('/security/require-password-change');
    } catch (error) {
      console.error('Failed to require password change:', error);
      throw error;
    }
  }

  async getPasswordPolicy(): Promise<any> {
    try {
      const response = await api.get('/security/password-policy');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch password policy:', error);
      throw error;
    }
  }

  // Device management
  async getTrustedDevices(): Promise<any[]> {
    try {
      const response = await api.get('/security/trusted-devices');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trusted devices:', error);
      throw error;
    }
  }

  async trustDevice(deviceId: string): Promise<void> {
    try {
      await api.post(`/security/trusted-devices/${deviceId}/trust`);
    } catch (error) {
      console.error(`Failed to trust device ${deviceId}:`, error);
      throw error;
    }
  }

  async untrustDevice(deviceId: string): Promise<void> {
    try {
      await api.delete(`/security/trusted-devices/${deviceId}`);
    } catch (error) {
      console.error(`Failed to untrust device ${deviceId}:`, error);
      throw error;
    }
  }

  // Security analytics
  async getSecurityAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await api.get(`/security/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security analytics:', error);
      throw error;
    }
  }

  async getLoginAttempts(period: 'day' | 'week' | 'month' = 'week'): Promise<any[]> {
    try {
      const response = await api.get(`/security/login-attempts?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch login attempts:', error);
      throw error;
    }
  }

  async getFailedLoginAttempts(period: 'day' | 'week' | 'month' = 'week'): Promise<any[]> {
    try {
      const response = await api.get(`/security/failed-login-attempts?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch failed login attempts:', error);
      throw error;
    }
  }

  // Security recommendations
  async getSecurityRecommendations(): Promise<any[]> {
    try {
      const response = await api.get('/security/recommendations');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security recommendations:', error);
      throw error;
    }
  }

  async dismissSecurityRecommendation(recommendationId: string): Promise<void> {
    try {
      await api.post(`/security/recommendations/${recommendationId}/dismiss`);
    } catch (error) {
      console.error(`Failed to dismiss security recommendation ${recommendationId}:`, error);
      throw error;
    }
  }

  // Export security data
  async exportSecurityData(format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: any): Promise<Blob> {
    try {
      const response = await api.post(`/security/export?format=${format}`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export security data:', error);
      throw error;
    }
  }

  // Security health check
  async getSecurityHealth(): Promise<any> {
    try {
      const response = await api.get('/security/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security health:', error);
      throw error;
    }
  }

  // Emergency actions
  async lockAccount(reason?: string): Promise<void> {
    try {
      await api.post('/security/lock-account', { reason });
    } catch (error) {
      console.error('Failed to lock account:', error);
      throw error;
    }
  }

  async unlockAccount(): Promise<void> {
    try {
      await api.post('/security/unlock-account');
    } catch (error) {
      console.error('Failed to unlock account:', error);
      throw error;
    }
  }

  async emergencyLogout(): Promise<void> {
    try {
      await api.post('/security/emergency-logout');
    } catch (error) {
      console.error('Failed to perform emergency logout:', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();
