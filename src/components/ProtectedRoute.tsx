import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState, PageLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  fallback,
}) => {
  const { isAuthenticated, user, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return fallback || <PageLoading title="Verifying access..." />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedAccess requiredPermission={requiredPermission} />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <UnauthorizedAccess requiredRole={requiredRole} />;
  }

  // Wrap children with error boundary
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Unauthorized access component
const UnauthorizedAccess: React.FC<{
  requiredPermission?: string;
  requiredRole?: string;
}> = ({ requiredPermission, requiredRole }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        
        <p className="text-muted-foreground mb-6">
          {requiredPermission 
            ? `You need the "${requiredPermission}" permission to access this page.`
            : requiredRole 
            ? `You need the "${requiredRole}" role to access this page.`
            : 'You do not have permission to access this page.'
          }
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Current role: <span className="font-medium text-foreground">{user?.role || 'Unknown'}</span>
          </p>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for route protection
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean;
    requiredPermission?: string;
    requiredRole?: string;
    fallback?: React.ReactNode;
  }
) => {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

// Public route component (redirects to dashboard if authenticated)
export const PublicRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoading title="Loading..." />;
  }
  
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};