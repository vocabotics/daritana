import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles, 
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If user is authenticated but shouldn't be (e.g., login page when already logged in)
  if (!requireAuth && isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access if roles are specified
  if (requireAuth && isAuthenticated && allowedRoles && user) {
    const hasPermission = allowedRoles.includes(user.role) || 
                         user.permissions?.includes('all') ||
                         user.role === 'admin';
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

// Specific guards for common use cases
export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  );
}

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      {children}
    </AuthGuard>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={['admin', 'staff']}>
      {children}
    </AuthGuard>
  );
}

export function StaffRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={['admin', 'staff', 'project_lead']}>
      {children}
    </AuthGuard>
  );
}

export function DesignerRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={['admin', 'staff', 'project_lead', 'designer']}>
      {children}
    </AuthGuard>
  );
}

// Unauthorized page component
export function UnauthorizedPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Signed in as: <strong>{user.name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Role: {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to check permissions
export function usePermissions() {
  const { user, isAuthenticated } = useAuthStore();

  const hasPermission = (requiredPermission: string | string[]) => {
    if (!isAuthenticated || !user) return false;
    
    // Admin and staff have all permissions
    if (user.role === 'admin' || user.permissions?.includes('all')) {
      return true;
    }

    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(perm => user.permissions?.includes(perm));
    }

    return user.permissions?.includes(requiredPermission) || false;
  };

  const hasRole = (requiredRole: string | string[]) => {
    if (!isAuthenticated || !user) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    return user.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]) => {
    if (!isAuthenticated || !user) return false;
    return roles.includes(user.role);
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    user,
    isAuthenticated
  };
}