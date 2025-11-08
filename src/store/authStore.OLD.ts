import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { toast } from 'sonner';
import { withRetry, updateAuthToken } from '@/services/api';

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
  login: (email: string, password: string) => Promise<{ success: boolean; requiresMFA?: boolean; userId?: string; isNewOrg?: boolean }>;
  completeMFALogin: (userId: string) => void;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
  completeOnboarding: () => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          const response = await authApi.login(email, password);
          const result = response.data;
          
          // Handle the new backend response format
          if (result.user && result.token) {
            const apiUser = result.user;
            
            // Store tokens (backend returns single token and organization info)
            localStorage.setItem('access_token', result.token);
            updateAuthToken(result.token); // Update the API client with the new token
            if (result.refreshToken) {
              localStorage.setItem('refresh_token', result.refreshToken);
            }
            
            // Store organization if present
            if (result.organization) {
              localStorage.setItem('organization', JSON.stringify(result.organization));
            }
            
            // Determine user role - use the role from backend
            let userRole: User['role'] = 'client';
            
            // Map backend roles to frontend roles
            if (apiUser.email === 'admin@daritana.com' || apiUser.email === 'admin@test.com') {
              userRole = 'admin';
            } else if (result.role) {
              // Use the organization role from the response
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
            
            // Transform API user to match our User type
            const user: User = {
              id: apiUser.id,
              name: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
              email: apiUser.email,
              role: userRole,
              permissions: getPermissionsForRole(userRole),
              avatar: apiUser.profileImage || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`
            };
            
            // Cache user data for persistence
            localStorage.setItem('user_data', JSON.stringify(user));
            
            // Check if this is a new organization that needs onboarding
            const needsOrgOnboarding = result.isNewOrganization || (result.organization && !result.organization.onboardingCompleted);
            
            // Check if member needs personal onboarding (not admin, first login, profile incomplete)
            const isMember = userRole !== 'admin' && userRole !== 'project_lead';
            const profileComplete = localStorage.getItem('memberOnboardingComplete') === 'true';
            const needsMemberOnboarding = isMember && !profileComplete && !needsOrgOnboarding;
            
            // Check if contractor/supplier needs vendor onboarding
            const isVendor = userRole === 'contractor' || userRole === 'supplier';
            const vendorComplete = localStorage.getItem('vendorOnboardingComplete') === 'true';
            const needsVendorOnboarding = isVendor && !vendorComplete && !needsOrgOnboarding;
            
            // Connect to socket after successful login
            socketManager.connect();
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null,
              requiresMFA: false,
              pendingUserId: null,
              isNewOrganization: needsOrgOnboarding || false,
              needsMemberOnboarding: needsMemberOnboarding || false,
              needsVendorOnboarding: needsVendorOnboarding || false
            });
            
            return { success: true, isNewOrg: needsOrgOnboarding };
          } else {
            set({ 
              isLoading: false, 
              error: result.error || 'Invalid credentials' 
            });
            return { success: false, error: result.error || 'Invalid credentials' };
          }
        } catch (error) {
          console.error('Login error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
          
          // Show toast notification for login error
          toast.error('Login failed', {
            description: errorMessage,
          });
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          return { success: false, error: errorMessage };
        }
      },

      completeMFALogin: (userId: string) => {
        // Complete login after successful MFA verification
        const transformedUser = {
          id: userId,
          name: 'Project Lead',
          email: 'lead@daritana.com',
          role: 'project_lead',
          permissions: getPermissionsForRole('project_lead'),
          avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`
        } as User;
        
        set({ 
          user: transformedUser, 
          isAuthenticated: true, 
          requiresMFA: false,
          pendingUserId: null,
          error: null
        });
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(userData);
          
          if (response.user && response.tokens) {
            set({ 
              isLoading: false,
              error: null 
            });
            return true;
          } else {
            set({ 
              error: response.error || 'Registration failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
          
          // Show toast notification for registration error
          toast.error('Registration failed', {
            description: errorMessage,
          });
          
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        }
        
        // Disconnect socket
        socketManager.disconnect();
        
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('organization');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('rememberMe');
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        // Check if already authenticated to prevent loops
        const currentState = get();
        if (currentState.isAuthenticated && currentState.user) {
          return; // Already authenticated, don't run again
        }
        
        set({ isLoading: true });
        
        // Check for stored authentication
        const token = localStorage.getItem('access_token');
        const cachedUserData = localStorage.getItem('user_data');
        
        // If we have both token and cached user data, immediately authenticate
        if (token && cachedUserData) {
          try {
            const user = JSON.parse(cachedUserData);
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            
            // Verify token in background (don't await) - only if token is older than 5 minutes
            const lastCheck = localStorage.getItem('last_token_check');
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (!lastCheck || (now - parseInt(lastCheck)) > fiveMinutes) {
              localStorage.setItem('last_token_check', now.toString());
              
                                     // Use withRetry for token verification
                       withRetry(
                         () => fetch('http://localhost:7001/api/auth/me', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }).then(response => {
                  if (!response.ok) {
                    throw new Error('Token verification failed');
                  }
                  return response;
                }),
                2, // Only 2 retries for background verification
                1000,
                'Token verification'
              ).then(() => {
                // Token is still valid
              }).catch(() => {
                // Token expired or invalid - but don't logout to prevent loops
                console.log('Token verification failed, but keeping user logged in to prevent loops');
                // Don't clear auth state to prevent infinite logout/login loops
              });
            }
            
            return;
          } catch (e) {
            console.error('Failed to parse cached user data:', e);
          }
        }
        
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }
        
        try {
                                   // Verify token with backend using retry logic
                         const response = await withRetry(
                           () => fetch('http://localhost:7001/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }),
            3,
            1000,
            'Auth verification'
          );

          if (response.ok) {
            const result = await response.json();
            const apiUser = result.user;
            const role = result.role;
            
            // Determine user role - use the role from backend directly
            let userRole: User['role'] = 'client';
            
            // Check if this is the system admin first (admin@daritana.com)
            if (apiUser.email === 'admin@daritana.com') {
              userRole = 'admin';
            } else if (role) {
              // Use the organization role from the backend (it's the primary role)
              // Convert from uppercase (PROJECT_LEAD) to lowercase (project_lead)
              // Special handling for ORG_ADMIN to map to 'admin'
              if (role === 'ORG_ADMIN') {
                userRole = 'admin';
              } else {
                userRole = role.toLowerCase() as User['role'];
              }
            } else if (apiUser.role) {
              // Fallback to user role if no org role
              userRole = apiUser.role.toLowerCase() as User['role'];
            }
            
            const user: User = {
              id: apiUser.id,
              name: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.username || apiUser.email,
              email: apiUser.email,
              role: userRole,
              permissions: getPermissionsForRole(userRole),
              avatar: apiUser.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`
            };
            
            // Cache user data for persistence
            localStorage.setItem('user_data', JSON.stringify(user));
            
            set({ 
              user, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            // Token is invalid or expired
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ 
              user: null, 
              isAuthenticated: false,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Network error or server is down
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.forgotPassword(email);
          set({ isLoading: false });
          return !!response.data;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to send reset email.';
          
          toast.error('Reset email failed', {
            description: errorMessage,
          });
          
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      resetPassword: async (token: string, password: string, confirmPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.resetPassword(token, password, confirmPassword);
          set({ isLoading: false });
          return !!response.data;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to reset password.';
          
          toast.error('Password reset failed', {
            description: errorMessage,
          });
          
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      completeOnboarding: () => {
        const currentState = get();
        
        // Mark appropriate onboarding as complete
        if (currentState.isNewOrganization) {
          // Organization admin completing org onboarding
          set({ isNewOrganization: false });
          
          // Update organization in localStorage
          const orgStr = localStorage.getItem('organization');
          if (orgStr) {
            try {
              const org = JSON.parse(orgStr);
              org.onboardingCompleted = true;
              localStorage.setItem('organization', JSON.stringify(org));
            } catch (e) {
              console.error('Failed to update organization onboarding status');
            }
          }
        } else if (currentState.needsMemberOnboarding) {
          // Team member completing personal onboarding
          set({ needsMemberOnboarding: false });
          localStorage.setItem('memberOnboardingComplete', 'true');
        } else if (currentState.needsVendorOnboarding) {
          // Vendor/contractor completing marketplace registration
          set({ needsVendorOnboarding: false });
          localStorage.setItem('vendorOnboardingComplete', 'true');
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);