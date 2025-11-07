import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  avatarFile?: File | null;
  
  // Address
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  
  // Professional
  company: string;
  position: string;
  website: string;
  linkedin: string;
  credentials: Array<{
    id: string;
    name: string;
    organization: string;
    status: 'verified' | 'pending' | 'expired';
  }>;
  
  // Preferences
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  projectUpdates: boolean;
  taskAssignments: boolean;
  deadlineReminders: boolean;
  teamMessages: boolean;
  clientMessages: boolean;
  marketingEmails: boolean;
  
  // Security
  twoFactorAuth: boolean;
  sessionTimeout: string;
  loginAlerts: boolean;
}

interface UserProfileStore {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  addCredential: (credential: Omit<UserProfile['credentials'][0], 'id'>) => void;
  removeCredential: (id: string) => void;
  resetProfile: () => void;
}

const defaultProfile: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  avatar: '',
  address: '',
  city: 'Kuala Lumpur',
  state: 'Wilayah Persekutuan',
  postcode: '',
  country: 'Malaysia',
  company: '',
  position: '',
  website: '',
  linkedin: '',
  credentials: [],
  language: 'en',
  timezone: 'Asia/Kuala_Lumpur',
  dateFormat: 'dd/mm/yyyy',
  currency: 'MYR',
  emailNotifications: true,
  smsNotifications: false,
  projectUpdates: true,
  taskAssignments: true,
  deadlineReminders: true,
  teamMessages: true,
  clientMessages: true,
  marketingEmails: false,
  twoFactorAuth: false,
  sessionTimeout: '30',
  loginAlerts: true,
};

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      
      updateProfile: async (updates) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
        
        // In production, this would sync with backend
        console.log('Profile updated:', updates);
      },
      
      uploadAvatar: async (file) => {
        // Simulate file upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Convert file to base64 for local storage
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            set((state) => ({
              profile: { ...state.profile, avatar: base64String },
            }));
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });
      },
      
      addCredential: (credential) => {
        const newCredential = {
          ...credential,
          id: Date.now().toString(),
        };
        
        set((state) => ({
          profile: {
            ...state.profile,
            credentials: [...state.profile.credentials, newCredential],
          },
        }));
      },
      
      removeCredential: (id) => {
        set((state) => ({
          profile: {
            ...state.profile,
            credentials: state.profile.credentials.filter(c => c.id !== id),
          },
        }));
      },
      
      resetProfile: () => {
        set({ profile: defaultProfile });
      },
    }),
    {
      name: 'user-profile',
    }
  )
);