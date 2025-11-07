import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  // Regional Settings
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  projectUpdates: boolean;
  taskAssignments: boolean;
  meetingReminders: boolean;
  
  // Security
  twoFactorAuth: boolean;
  
  // Team Settings
  allowTeamInvitations: boolean;
  requireApproval: boolean;
  shareProjectVisibility: boolean;
}

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      
      resetSettings: () =>
        set({ settings: defaultSettings }),
    }),
    {
      name: 'user-settings',
    }
  )
);