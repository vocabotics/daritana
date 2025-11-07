import { useState, useEffect, useCallback } from 'react';
import { authService, LoginResponse, User } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (userData: RegisterData) => Promise<{ user: User; requiresVerification?: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  getCurrentUser: () => Promise<User>;
  clearError: () => void;

  // Utilities
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  requiresTokenRefresh: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
  companyName?: string;
  phoneNumber?: string;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Refresh user data if token needs refresh
          if (authService.requiresTokenRefresh()) {
            try {
              await authService.refreshToken();
              const updatedUser = await authService.getCurrentUser();
              setUser(updatedUser);
            } catch (error) {
              console.error('Failed to refresh auth on init:', error);
              handleLogout();
            }
          }
        }
      }
    };

    initializeAuth();
  }, []);

  // Token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefreshToken = async () => {
      if (authService.requiresTokenRefresh()) {
        try {
          await authService.refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          handleLogout();
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      navigate('/login');
    }
  }, [navigate]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(email, password);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.register(userData);
      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await handleLogout();
    setIsLoading(false);
  }, [handleLogout]);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password, confirmPassword);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.verifyEmail(token);
      
      // Refresh user data to update verification status
      if (isAuthenticated) {
        const updatedUser = await authService.getCurrentUser();
        setUser(updatedUser);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getCurrentUser = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check organization role permissions
    const rolePermissions: Record<string, string[]> = {
      'admin': ['all'],
      'project_lead': ['manage_projects', 'view_analytics', 'manage_team'],
      'designer': ['edit_designs', 'view_projects', 'upload_files'],
      'contractor': ['view_assigned_tasks', 'submit_quotes', 'upload_files'],
      'client': ['view_projects', 'approve_designs', 'view_invoices'],
      'staff': ['view_projects', 'manage_tasks'],
    };
    
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('all') || permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getCurrentUser,
    clearError,

    // Utilities
    hasPermission,
    hasRole,
    requiresTokenRefresh: authService.requiresTokenRefresh(),
  };
};

// Hook for protecting routes
export const useAuthGuard = (
  requiredPermission?: string,
  requiredRole?: string,
  redirectTo: string = '/login'
) => {
  const { isAuthenticated, hasPermission, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate(redirectTo);
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      navigate('/unauthorized');
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, hasPermission, hasRole, isLoading, navigate, redirectTo, requiredPermission, requiredRole]);

  return {
    isAuthenticated,
    isAuthorized: (!requiredPermission || hasPermission(requiredPermission)) && 
                  (!requiredRole || hasRole(requiredRole)),
    isLoading,
  };
};