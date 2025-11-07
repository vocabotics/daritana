import { api, authApi } from '@/lib/api';
import { toast } from 'sonner';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  isEmailVerified?: boolean;
  organization?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  organization?: any;
  isNewOrganization?: boolean;
}

class AuthService {
  private static instance: AuthService;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    
    if (tokens.expiresAt) {
      localStorage.setItem('token_expires_at', tokens.expiresAt.toString());
    }
    
    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getTokenExpiresAt(): number | null {
    const expiresAt = localStorage.getItem('token_expires_at');
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return false;
    
    // Consider token expired 5 minutes before actual expiry
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() > (expiresAt - buffer);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    delete api.defaults.headers.common['Authorization'];
  }

  // User management
  setUser(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  clearUser(): void {
    localStorage.removeItem('user_data');
  }

  // Organization management
  setOrganization(organization: any): void {
    localStorage.setItem('organization', JSON.stringify(organization));
  }

  getOrganization(): any | null {
    const orgData = localStorage.getItem('organization');
    if (!orgData) return null;
    
    try {
      return JSON.parse(orgData);
    } catch (error) {
      console.error('Failed to parse organization data:', error);
      return null;
    }
  }

  clearOrganization(): void {
    localStorage.removeItem('organization');
  }

  // Auth operations
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authApi.login(email, password);
      
      if (response.data?.user && response.data?.tokens) {
        const { user, tokens, organization, isNewOrganization } = response.data;
        
        // Set tokens
        this.setTokens(tokens);
        
        // Set user data
        this.setUser(user);
        
        // Set organization if provided
        if (organization) {
          this.setOrganization(organization);
        }
        
        toast.success('Login successful', {
          description: `Welcome back, ${user.firstName}!`,
        });
        
        return { user, tokens, organization, isNewOrganization };
      } else {
        throw new Error(response.data?.message || 'Invalid login response');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Login failed';
      
      toast.error('Login failed', {
        description: message,
      });
      
      throw new Error(message);
    }
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: string;
    companyName?: string;
    phoneNumber?: string;
  }): Promise<{ user: User; requiresVerification?: boolean }> {
    try {
      const response = await authApi.register(userData);
      
      if (response.user) {
        toast.success('Registration successful', {
          description: response.requiresVerification 
            ? 'Please check your email to verify your account'
            : 'Welcome to Daritana!',
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Registration failed';
      
      toast.error('Registration failed', {
        description: message,
      });
      
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a valid token
      const accessToken = this.getAccessToken();
      if (accessToken) {
        await authApi.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local data
      this.clearTokens();
      this.clearUser();
      this.clearOrganization();
      
      // Clear other auth-related storage
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('last_token_check');
      
      toast.success('Logged out successfully');
    }
  }

  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performRefresh(refreshToken);
    
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await authApi.refreshToken(refreshToken);
      
      if (response.data?.token) {
        const newTokens: AuthTokens = {
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken || refreshToken,
          expiresAt: response.data.expiresAt,
        };
        
        this.setTokens(newTokens);
        
        return newTokens.accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error: any) {
      // Refresh failed, clear all auth data
      this.clearTokens();
      this.clearUser();
      this.clearOrganization();
      
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Session expired';
      
      throw new Error(message);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await authApi.getCurrentUser();
      
      if (response.data?.user) {
        this.setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error('Invalid user response');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Failed to get current user';
      
      throw new Error(message);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await authApi.forgotPassword(email);
      
      toast.success('Reset email sent', {
        description: 'Please check your email for password reset instructions',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Failed to send reset email';
      
      toast.error('Reset failed', {
        description: message,
      });
      
      throw new Error(message);
    }
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    try {
      const response = await authApi.resetPassword(token, password, confirmPassword);
      
      toast.success('Password reset successful', {
        description: 'You can now log in with your new password',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Failed to reset password';
      
      toast.error('Reset failed', {
        description: message,
      });
      
      throw new Error(message);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await authApi.verifyEmail(token);
      
      toast.success('Email verified', {
        description: 'Your email has been successfully verified',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Failed to verify email';
      
      toast.error('Verification failed', {
        description: message,
      });
      
      throw new Error(message);
    }
  }

  // Auth state checks
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  requiresTokenRefresh(): boolean {
    return this.isAuthenticated() && this.isTokenExpired();
  }

  // Initialize auth state from localStorage
  initialize(): void {
    const token = this.getAccessToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Initialize on import
authService.initialize();