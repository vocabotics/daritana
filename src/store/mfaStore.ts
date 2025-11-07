import { create } from 'zustand';
import {
  MFASettings,
  MFAMethod,
  MFAType,
  BackupCode,
  TrustedDevice,
  MFAChallenge,
  MFAVerificationResult,
  MFASetupRequest,
  MFASetupResponse,
  LoginAttempt,
  SecurityAlert
} from '@/types';

interface MFAStore {
  // State
  userMFASettings: Record<string, MFASettings>;
  activeChallenges: MFAChallenge[];
  loginAttempts: LoginAttempt[];
  securityAlerts: SecurityAlert[];
  
  // Actions
  setupMFA: (request: MFASetupRequest) => Promise<MFASetupResponse>;
  verifyMFA: (challengeId: string, code: string) => Promise<MFAVerificationResult>;
  disableMFA: (userId: string, password: string) => Promise<boolean>;
  generateBackupCodes: (userId: string) => Promise<string[]>;
  addTrustedDevice: (userId: string, deviceInfo: Partial<TrustedDevice>) => void;
  removeTrustedDevice: (userId: string, deviceId: string) => void;
  createMFAChallenge: (userId: string, method: MFAType) => Promise<MFAChallenge>;
  recordLoginAttempt: (attempt: Omit<LoginAttempt, 'id'>) => void;
  createSecurityAlert: (alert: Omit<SecurityAlert, 'id'>) => void;
  acknowledgeSecurityAlert: (alertId: string) => void;
  
  // Getters
  getUserMFASettings: (userId: string) => MFASettings | undefined;
  getActiveChallenges: (userId: string) => MFAChallenge[];
  getRecentLoginAttempts: (userId: string, limit?: number) => LoginAttempt[];
  getUnacknowledgedAlerts: (userId: string) => SecurityAlert[];
  isMFARequired: (userId: string) => boolean;
  getTrustedDevices: (userId: string) => TrustedDevice[];
}

export const useMFAStore = create<MFAStore>((set, get) => ({
  // Initial state
  userMFASettings: {
    'user-1': {
      isEnabled: true,
      primaryMethod: {
        id: 'sms-1',
        type: 'sms',
        name: 'Phone +60123456789',
        isActive: true,
        isVerified: true,
        createdAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-01-25'),
        phoneNumber: '+60123456789'
      },
      backupMethods: [
        {
          id: 'email-1',
          type: 'email',
          name: 'Email verification',
          isActive: true,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          email: 'architect@daritana.com'
        }
      ],
      backupCodes: [
        {
          id: 'backup-1',
          code: 'A1B2C3D4',
          used: false
        },
        {
          id: 'backup-2',
          code: 'E5F6G7H8',
          used: false
        },
        {
          id: 'backup-3',
          code: 'I9J0K1L2',
          used: true,
          usedAt: new Date('2024-01-20'),
          usedFrom: '192.168.1.100'
        }
      ],
      lastUpdated: new Date('2024-01-15'),
      trustedDevices: [
        {
          id: 'device-1',
          name: 'MacBook Pro - Chrome',
          deviceType: 'desktop',
          browser: 'Chrome 120',
          os: 'macOS',
          ipAddress: '192.168.1.100',
          location: 'Kuala Lumpur, Malaysia',
          addedAt: new Date('2024-01-10'),
          lastUsed: new Date('2024-01-25'),
          isActive: true
        }
      ],
      recoveryEmail: 'recovery@architect.com',
      recoveryPhone: '+60123456789'
    }
  },

  activeChallenges: [],

  loginAttempts: [
    {
      id: 'attempt-1',
      userId: 'user-1',
      success: true,
      ipAddress: '192.168.1.100',
      location: 'Kuala Lumpur, Malaysia',
      device: 'MacBook Pro',
      browser: 'Chrome 120',
      mfaUsed: true,
      mfaMethod: 'sms',
      timestamp: new Date('2024-01-25T09:00:00'),
      riskLevel: 'low'
    },
    {
      id: 'attempt-2',
      userId: 'user-1',
      success: false,
      ipAddress: '203.123.45.67',
      location: 'Unknown',
      device: 'Unknown Device',
      browser: 'Firefox 118',
      mfaUsed: false,
      timestamp: new Date('2024-01-24T14:30:00'),
      riskLevel: 'high',
      blockedReason: 'Suspicious IP address'
    }
  ],

  securityAlerts: [
    {
      id: 'alert-1',
      userId: 'user-1',
      type: 'new_device_login',
      title: 'New Device Login',
      description: 'A new device accessed your account from Kuala Lumpur, Malaysia',
      severity: 'medium',
      timestamp: new Date('2024-01-25T09:00:00'),
      acknowledged: false,
      metadata: {
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        ipAddress: '192.168.1.100',
        location: 'Kuala Lumpur, Malaysia'
      }
    },
    {
      id: 'alert-2',
      userId: 'user-1',
      type: 'backup_codes_used',
      title: 'Backup Code Used',
      description: 'A backup code was used to access your account',
      severity: 'high',
      timestamp: new Date('2024-01-20T16:45:00'),
      acknowledged: true,
      acknowledgedAt: new Date('2024-01-21T08:00:00'),
      metadata: {
        codeUsed: 'I9J***L2',
        ipAddress: '192.168.1.100'
      }
    }
  ],

  // Actions
  setupMFA: async (request: MFASetupRequest): Promise<MFASetupResponse> => {
    const { userId, method, phoneNumber, email, deviceName } = request;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const methodId = `${method}-${Date.now()}`;
    const newMethod: MFAMethod = {
      id: methodId,
      type: method,
      name: method === 'sms' ? `Phone ${phoneNumber}` : 
            method === 'email' ? `Email ${email}` :
            method === 'totp' ? deviceName || 'Authenticator App' :
            `${method} method`,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      phoneNumber,
      email,
      secretKey: method === 'totp' ? 'JBSWY3DPEHPK3PXP' : undefined
    };

    // Create challenge for verification
    const challengeId = `challenge-${Date.now()}`;
    const challenge: MFAChallenge = {
      id: challengeId,
      userId,
      method,
      challengeCode: Math.random().toString().slice(2, 8),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      isCompleted: false,
      ipAddress: '192.168.1.100',
      userAgent: 'Test User Agent'
    };

    set(state => ({
      activeChallenges: [...state.activeChallenges, challenge]
    }));

    const backupCodes = method === 'totp' ? [
      'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 
      'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2'
    ] : undefined;

    return {
      success: true,
      method,
      qrCodeUrl: method === 'totp' ? 
        `otpauth://totp/Daritana:${userId}?secret=JBSWY3DPEHPK3PXP&issuer=Daritana` : undefined,
      secretKey: method === 'totp' ? 'JBSWY3DPEHPK3PXP' : undefined,
      backupCodes,
      verificationRequired: true,
      challengeId
    };
  },

  verifyMFA: async (challengeId: string, code: string): Promise<MFAVerificationResult> => {
    const state = get();
    const challenge = state.activeChallenges.find(c => c.id === challengeId);
    
    if (!challenge || new Date() > challenge.expiresAt) {
      return {
        success: false,
        method: challenge?.method || 'sms',
        challengeId,
        errorMessage: 'Challenge expired or not found'
      };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      return {
        success: false,
        method: challenge.method,
        challengeId,
        errorMessage: 'Maximum attempts exceeded'
      };
    }

    // Simulate verification logic
    const isValid = code === challenge.challengeCode || 
                   code === '123456' || // Demo code
                   code.length === 6; // Accept any 6-digit code for demo

    set(state => ({
      activeChallenges: state.activeChallenges.map(c => 
        c.id === challengeId 
          ? { 
              ...c, 
              attempts: c.attempts + 1,
              isCompleted: isValid,
              completedAt: isValid ? new Date() : undefined
            }
          : c
      )
    }));

    if (isValid) {
      // Enable MFA for user if this was a setup verification
      const userSettings = state.userMFASettings[challenge.userId];
      if (userSettings) {
        set(state => ({
          userMFASettings: {
            ...state.userMFASettings,
            [challenge.userId]: {
              ...userSettings,
              isEnabled: true,
              lastUpdated: new Date()
            }
          }
        }));
      }
    }

    return {
      success: isValid,
      method: challenge.method,
      challengeId,
      remainingAttempts: isValid ? undefined : challenge.maxAttempts - challenge.attempts - 1,
      backupMethodsAvailable: isValid ? undefined : ['email', 'backup_codes'],
      errorMessage: isValid ? undefined : 'Invalid verification code'
    };
  },

  disableMFA: async (userId: string, password: string): Promise<boolean> => {
    // Simulate password verification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === 'password123') { // Demo password
      set(state => ({
        userMFASettings: {
          ...state.userMFASettings,
          [userId]: {
            ...state.userMFASettings[userId],
            isEnabled: false,
            lastUpdated: new Date()
          }
        }
      }));

      // Create security alert
      get().createSecurityAlert({
        userId,
        type: 'mfa_disabled',
        title: 'MFA Disabled',
        description: 'Multi-factor authentication has been disabled for your account',
        severity: 'high',
        timestamp: new Date(),
        acknowledged: false,
        metadata: {}
      });

      return true;
    }
    return false;
  },

  generateBackupCodes: async (userId: string): Promise<string[]> => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    const backupCodes: BackupCode[] = codes.map(code => ({
      id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      used: false
    }));

    set(state => ({
      userMFASettings: {
        ...state.userMFASettings,
        [userId]: {
          ...state.userMFASettings[userId],
          backupCodes,
          lastUpdated: new Date()
        }
      }
    }));

    return codes;
  },

  addTrustedDevice: (userId: string, deviceInfo: Partial<TrustedDevice>) => {
    const device: TrustedDevice = {
      id: `device-${Date.now()}`,
      name: deviceInfo.name || 'Unknown Device',
      deviceType: deviceInfo.deviceType || 'desktop',
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress: deviceInfo.ipAddress || '0.0.0.0',
      location: deviceInfo.location,
      addedAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    set(state => ({
      userMFASettings: {
        ...state.userMFASettings,
        [userId]: {
          ...state.userMFASettings[userId],
          trustedDevices: [...(state.userMFASettings[userId]?.trustedDevices || []), device]
        }
      }
    }));
  },

  removeTrustedDevice: (userId: string, deviceId: string) => {
    set(state => ({
      userMFASettings: {
        ...state.userMFASettings,
        [userId]: {
          ...state.userMFASettings[userId],
          trustedDevices: state.userMFASettings[userId]?.trustedDevices?.filter(
            device => device.id !== deviceId
          ) || []
        }
      }
    }));
  },

  createMFAChallenge: async (userId: string, method: MFAType): Promise<MFAChallenge> => {
    const challenge: MFAChallenge = {
      id: `challenge-${Date.now()}`,
      userId,
      method,
      challengeCode: Math.random().toString().slice(2, 8),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      isCompleted: false,
      ipAddress: '192.168.1.100',
      userAgent: navigator.userAgent
    };

    set(state => ({
      activeChallenges: [...state.activeChallenges, challenge]
    }));

    return challenge;
  },

  recordLoginAttempt: (attempt: Omit<LoginAttempt, 'id'>) => {
    const loginAttempt: LoginAttempt = {
      ...attempt,
      id: `attempt-${Date.now()}`
    };

    set(state => ({
      loginAttempts: [loginAttempt, ...state.loginAttempts].slice(0, 100) // Keep last 100
    }));
  },

  createSecurityAlert: (alert: Omit<SecurityAlert, 'id'>) => {
    const securityAlert: SecurityAlert = {
      ...alert,
      id: `alert-${Date.now()}`
    };

    set(state => ({
      securityAlerts: [securityAlert, ...state.securityAlerts]
    }));
  },

  acknowledgeSecurityAlert: (alertId: string) => {
    set(state => ({
      securityAlerts: state.securityAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
          : alert
      )
    }));
  },

  // Getters
  getUserMFASettings: (userId: string) => {
    return get().userMFASettings[userId];
  },

  getActiveChallenges: (userId: string) => {
    return get().activeChallenges.filter(challenge => 
      challenge.userId === userId && !challenge.isCompleted
    );
  },

  getRecentLoginAttempts: (userId: string, limit = 10) => {
    return get().loginAttempts
      .filter(attempt => attempt.userId === userId)
      .slice(0, limit);
  },

  getUnacknowledgedAlerts: (userId: string) => {
    return get().securityAlerts.filter(alert => 
      alert.userId === userId && !alert.acknowledged
    );
  },

  isMFARequired: (userId: string) => {
    const settings = get().userMFASettings[userId];
    return settings?.isEnabled || false;
  },

  getTrustedDevices: (userId: string) => {
    const settings = get().userMFASettings[userId];
    return settings?.trustedDevices?.filter(device => device.isActive) || [];
  }
}));