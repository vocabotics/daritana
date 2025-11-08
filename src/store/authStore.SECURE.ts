/**
 * SECURE authStore - localStorage ELIMINATED
 *
 * This version removes ALL localStorage usage for production security.
 * Authentication tokens are managed via HTTP-Only cookies (backend).
 * User state is stored in memory only (resets on page refresh - expected behavior).
 *
 * Key Changes:
 * 1. Removed persist() middleware - no localStorage persistence
 * 2. Removed all localStorage.setItem() / getItem() calls
 * 3. Added fetchUserData() method to call /api/auth/me
 * 4. Tokens managed by backend via HTTP-Only cookies
 * 5. Onboarding flags stored in backend User table
 */

import { create } from 'zustand';
// REMOVED: import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { toast } from 'sonner';
import { withRetry } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresMFA: boolean;
  pendingUserId: string | null;
  isNewOrganization: boolean;
  needsMemberOnboarding: boolean;
  needsVendorOnboarding: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<{ success: boolean; requiresMFA?: boolean; userId?: string; isNewOrg?: boolean }>;
  completeMFALogin: (userId: string) => void;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: User['role'];
  companyName?: string;
  phoneNumber?: string;
}

const transformBackendUser = (backendUser: any): User => {
  return {
    id: backendUser.id,
    name: `${backendUser.firstName} ${backendUser.lastName}`,
    email: backendUser.email,
    role: backendUser.role,
    avatar: backendUser.profileImage || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`,
    permissions: getPermissionsForRole(backendUser.role)
  };
};

const getPermissionsForRole = (role: User['role']): string[] => {
  switch (role) {
    case 'admin':
      return [
        'all',
        'admin_panel',
        'manage_users',
        'view_system_analytics',
        'manage_system_settings',
        'export_all_data',
        'manage_compliance',
        'view_audit_logs',
        'manage_backup_restore',
        'system_maintenance'
      ];
    case 'staff':
    case 'project_lead':
      return ['all'];
    case 'client':
      return ['view_project', 'approve_designs', 'upload_documents'];
    case 'designer':
      return ['edit_designs', 'view_tasks', 'upload_documents', 'manage_projects'];
    case 'contractor':
      return ['submit_quotes', 'view_assigned_tasks', 'upload_documents'];
    default:
      return ['view_project'];
  }
};

// REMOVED persist() wrapper - memory-only storage
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresMFA: false,
  pendingUserId: null,
  isNewOrganization: false,
  needsMemberOnboarding: false,
  needsVendorOnboarding: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null, requiresMFA: false, pendingUserId: null });

    try {
      // Backend returns HTTP-Only cookies (access_token, refresh_token)
      // No need to manually store tokens in frontend
      const response = await authApi.login(email, password);
      const result = response.data;

      if (result.user) {
        const apiUser = result.user;

        // Determine user role from backend
        let userRole: User['role'] = 'client';

        if (apiUser.email === 'admin@daritana.com' || apiUser.email === 'admin@test.com') {
          userRole = 'admin';
        } else if (result.role) {
          const roleMap: Record<string, User['role']> = {
            'ORG_ADMIN': 'admin',
            'ORG_OWNER': 'admin',
            'PROJECT_LEAD': 'project_lead',
            'PROJECT_MANAGER': 'project_lead',
            'DESIGNER': 'designer',
            'CONTRACTOR': 'contractor',
            'CLIENT': 'client',
            'STAFF': 'staff',
            'MEMBER': 'staff'
          };

          userRole = roleMap[result.role] || 'client';
        }

        // Create user object (stored in memory only)
        const user: User = {
          id: apiUser.id,
          name: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
          email: apiUser.email,
          role: userRole,
          permissions: getPermissionsForRole(userRole),
          avatar: apiUser.profileImage || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`
        };

        // Check onboarding status from backend response
        const isNewOrg = result.organization?.onboardingCompleted === false;
        const needsMember = apiUser.memberOnboardingCompleted === false && !isNewOrg;
        const needsVendor = apiUser.vendorOnboardingCompleted === false && !isNewOrg && !needsMember;

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isNewOrganization: isNewOrg,
          needsMemberOnboarding: needsMember,
          needsVendorOnboarding: needsVendor
        });

        // Connect to WebSocket
        socketManager.connect(user.id);

        toast.success(`Welcome back, ${user.name}!`);
        return {
          success: true,
          isNewOrg
        };
      }

      // Handle MFA if required
      if (result.requiresMFA) {
        set({
          requiresMFA: true,
          pendingUserId: result.userId,
          isLoading: false
        });
        return {
          success: true,
          requiresMFA: true,
          userId: result.userId
        };
      }

      throw new Error(result.message || 'Login failed');

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return { success: false };
    }
  },

  completeMFALogin: (userId: string) => {
    // TODO: Call backend to verify MFA and complete login
    console.log('MFA login completed for user:', userId);
    set({ requiresMFA: false, pendingUserId: null });
  },

  register: async (userData: RegisterData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register(userData);
      const result = response.data;

      if (result.success) {
        toast.success('Registration successful! Please log in.');
        set({ isLoading: false });
        return true;
      }

      throw new Error(result.message || 'Registration failed');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  logout: async () => {
    try {
      // Call backend logout to clear HTTP-Only cookies
      await authApi.logout();

      // Disconnect socket
      const currentUser = get().user;
      if (currentUser) {
        socketManager.disconnect(currentUser.id);
      }

      // Clear memory state
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        requiresMFA: false,
        pendingUserId: null,
        isNewOrganization: false,
        needsMemberOnboarding: false,
        needsVendorOnboarding: false
      });

      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      // Call /api/auth/me - backend verifies HTTP-Only cookie
      await get().fetchUserData();
    } catch (error) {
      console.error('Auth check failed:', error);
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    }
  },

  fetchUserData: async () => {
    try {
      // Backend verifies access_token cookie and returns user data
      const response = await withRetry(
        () => fetch('http://localhost:7001/api/auth/me', {
          credentials: 'include' // Important: send cookies
        }),
        3,
        1000,
        'Fetch user data'
      );

      if (response.ok) {
        const result = await response.json();
        const apiUser = result.user;
        const role = result.role;

        // Map backend role to frontend role
        let userRole: User['role'] = 'client';

        if (apiUser.email === 'admin@daritana.com') {
          userRole = 'admin';
        } else if (role) {
          const roleMap: Record<string, User['role']> = {
            'OWNER': 'admin',
            'PROJECT_LEAD': 'project_lead',
            'STAFF': 'staff',
            'DESIGNER': 'designer',
            'CONTRACTOR': 'contractor',
            'CLIENT': 'client'
          };
          userRole = roleMap[role] || 'client';
        }

        const user: User = {
          id: apiUser.id,
          name: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
          email: apiUser.email,
          role: userRole,
          permissions: getPermissionsForRole(userRole),
          avatar: apiUser.profileImage || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`
        };

        // Get onboarding status from backend
        const isNewOrg = result.organization?.onboardingCompleted === false;
        const needsMember = apiUser.memberOnboardingCompleted === false && !isNewOrg;
        const needsVendor = apiUser.vendorOnboardingCompleted === false && !isNewOrg && !needsMember;

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isNewOrganization: isNewOrg,
          needsMemberOnboarding: needsMember,
          needsVendorOnboarding: needsVendor
        });

        // Connect socket
        socketManager.connect(user.id);
      } else {
        // Not authenticated
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.forgotPassword(email);
      const result = response.data;

      if (result.success) {
        toast.success('Password reset link sent to your email');
        set({ isLoading: false });
        return true;
      }

      throw new Error(result.message || 'Failed to send reset email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await authApi.resetPassword(token, password, confirmPassword);
      const result = response.data;

      if (result.success) {
        toast.success('Password reset successful! Please log in.');
        set({ isLoading: false });
        return true;
      }

      throw new Error(result.message || 'Password reset failed');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  completeOnboarding: async () => {
    const currentState = get();

    try {
      // Determine onboarding type
      let type: 'organization' | 'member' | 'vendor' = 'organization';

      if (currentState.isNewOrganization) {
        type = 'organization';
      } else if (currentState.needsMemberOnboarding) {
        type = 'member';
      } else if (currentState.needsVendorOnboarding) {
        type = 'vendor';
      }

      // Call backend to mark onboarding complete
      const response = await fetch('http://localhost:7001/api/auth/onboarding-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Send cookies
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        // Update local state
        if (type === 'organization') {
          set({ isNewOrganization: false });
        } else if (type === 'member') {
          set({ needsMemberOnboarding: false });
        } else if (type === 'vendor') {
          set({ needsVendorOnboarding: false });
        }

        toast.success('Onboarding completed!');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to save onboarding status');

      // Fallback: update local state anyway
      if (currentState.isNewOrganization) {
        set({ isNewOrganization: false });
      } else if (currentState.needsMemberOnboarding) {
        set({ needsMemberOnboarding: false });
      } else if (currentState.needsVendorOnboarding) {
        set({ needsVendorOnboarding: false });
      }
    }
  }
}));

// NO persist middleware wrapper
// State is memory-only and resets on page refresh (expected behavior)
