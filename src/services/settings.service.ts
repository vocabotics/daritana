import axios from 'axios';
import { UserSettings } from '@/store/settingsStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';

// Create axios instance with default config
// SECURITY: Using HTTP-Only cookies for authentication
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth handled by HTTP-Only cookies - no manual token management needed
// Cookies are sent automatically with each request

// Settings service interface
export interface SettingsResponse {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications?: boolean;
  projectUpdates: boolean;
  taskAssignments: boolean;
  meetingReminders: boolean;
  twoFactorAuth: boolean;
  allowTeamInvitations: boolean;
  requireApproval: boolean;
  shareProjectVisibility: boolean;
  userId?: string;
  email?: string;
  name?: string;
  organizationSettings?: any;
}

export interface PreferencesResponse {
  regional: {
    language: {
      current: string;
      available: string[];
    };
    timezone: {
      current: string;
      available: Array<{ value: string; label: string }>;
    };
    currency: {
      current: string;
      available: Array<{ value: string; label: string; symbol: string }>;
    };
    dateFormat: {
      current: string;
      available: Array<{ value: string; label: string; example: string }>;
    };
  };
  appearance: {
    theme: {
      current: string;
      available: Array<{ value: string; label: string; icon: string }>;
    };
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

class SettingsService {
  /**
   * Get current user settings
   */
  async getSettings(): Promise<SettingsResponse> {
    try {
      const response = await api.get<SettingsResponse>('/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<SettingsResponse> {
    try {
      const response = await api.put<{ message: string; settings: SettingsResponse }>(
        '/settings',
        settings
      );
      return response.data.settings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Get detailed user preferences with available options
   */
  async getPreferences(): Promise<PreferencesResponse> {
    try {
      const response = await api.get<PreferencesResponse>('/settings/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference category
   */
  async updatePreferenceCategory(
    category: 'regional' | 'appearance' | 'notifications',
    preferences: any
  ): Promise<{ message: string; updated: any }> {
    try {
      const response = await api.put<{ message: string; updated: any }>(
        `/settings/preferences/${category}`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update ${category} preferences:`, error);
      throw error;
    }
  }

  /**
   * Update user preferences (alias for updatePreferenceCategory for compatibility)
   */
  async updatePreferences(
    category: 'general' | 'notifications' | 'workspace' | 'regional' | 'appearance',
    preferences: any
  ): Promise<{ message: string; updated: any }> {
    try {
      // Map general categories to backend categories
      const backendCategory = category === 'general' ? 'regional' : 
                             category === 'workspace' ? 'appearance' : category;
      
      const response = await api.put<{ message: string; updated: any }>(
        `/settings/preferences/${backendCategory}`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update ${category} preferences:`, error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<SettingsResponse> {
    try {
      const response = await api.post<{ message: string; settings: SettingsResponse }>(
        '/settings/reset'
      );
      return response.data.settings;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Load settings from backend and sync with local store
   */
  async loadAndSyncSettings(): Promise<UserSettings> {
    try {
      const settings = await this.getSettings();
      
      // Convert backend response to UserSettings format
      const userSettings: UserSettings = {
        language: settings.language,
        timezone: settings.timezone,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        theme: settings.theme,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        projectUpdates: settings.projectUpdates,
        taskAssignments: settings.taskAssignments,
        meetingReminders: settings.meetingReminders,
        twoFactorAuth: settings.twoFactorAuth,
        allowTeamInvitations: settings.allowTeamInvitations,
        requireApproval: settings.requireApproval,
        shareProjectVisibility: settings.shareProjectVisibility,
      };

      return userSettings;
    } catch (error) {
      console.error('Failed to load and sync settings:', error);
      // Return default settings if backend fails
      return {
        language: 'en',
        timezone: 'Asia/Kuala_Lumpur',
        currency: 'MYR',
        dateFormat: 'dd/mm/yyyy',
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        projectUpdates: true,
        taskAssignments: true,
        meetingReminders: true,
        twoFactorAuth: false,
        allowTeamInvitations: true,
        requireApproval: true,
        shareProjectVisibility: false,
      };
    }
  }

  /**
   * Save settings to backend
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      await this.updateSettings(settings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme: 'light' | 'dark' | 'auto') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }

  /**
   * Initialize settings on app load
   */
  async initialize(): Promise<UserSettings> {
    try {
      const settings = await this.loadAndSyncSettings();
      
      // Apply theme immediately
      this.applyTheme(settings.theme);
      
      // Set up system theme change listener for auto mode
      if (settings.theme === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          document.documentElement.classList.toggle('dark', e.matches);
        });
      }

      return settings;
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

// Export for type usage
export type { SettingsService };