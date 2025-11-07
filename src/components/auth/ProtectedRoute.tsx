import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionsStore } from '@/store/permissionsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  pageId?: string;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  pageId, 
  resource, 
  action = 'view',
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { canAccessPage, hasPermission, groups } = usePermissionsStore();

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Map user role to group ID
  const getUserGroupId = () => {
    const role = user?.role?.toLowerCase();
    
    // Handle role mapping (includes both frontend and backend role names)
    switch (role) {
      case 'admin':
      case 'system_admin':
      case 'org_admin': // Backend sends ORG_ADMIN
        return 'admin';
      case 'project_lead':
      case 'project lead':
        return 'project_lead';
      case 'designer':
        return 'designer';
      case 'client':
        return 'client';
      case 'contractor':
        return 'contractor';
      case 'staff':
        return 'staff';
      default:
        // Try to find a matching group by name
        const group = groups.find(g => 
          g.name.toLowerCase() === role || 
          g.id.toLowerCase() === role
        );
        return group?.id || 'client'; // Default to client if no match
    }
  };

  const userGroupId = getUserGroupId();

  // Check page access permission
  if (pageId && !canAccessPage(userGroupId, pageId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              This page requires additional permissions. Please contact your administrator if you believe you should have access.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.history.back()} 
                variant="default"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check resource action permission
  if (resource && !hasPermission(userGroupId, resource, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Permission Denied</CardTitle>
            <CardDescription>
              You don't have permission to {action} {resource}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Your current role ({user?.role}) doesn't include the necessary permissions for this action.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.history.back()} 
                variant="default"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Hook for checking permissions programmatically
export function usePermissions() {
  const { user } = useAuthStore();
  const { canAccessPage, hasPermission, getPagePermissions, canAccessTab, groups } = usePermissionsStore();

  const getUserGroupId = () => {
    const role = user?.role?.toLowerCase();
    
    switch (role) {
      case 'admin':
      case 'system_admin':
      case 'org_admin': // Backend sends ORG_ADMIN
        return 'admin';
      case 'project_lead':
      case 'project lead':
        return 'project_lead';
      case 'designer':
        return 'designer';
      case 'client':
        return 'client';
      case 'contractor':
        return 'contractor';
      case 'staff':
        return 'staff';
      default:
        const group = groups.find(g => 
          g.name.toLowerCase() === role || 
          g.id.toLowerCase() === role
        );
        return group?.id || 'client';
    }
  };

  const userGroupId = getUserGroupId();

  return {
    canAccessPage: (pageId: string) => canAccessPage(userGroupId, pageId),
    canAccessTab: (pageId: string, tabId: string) => canAccessTab(userGroupId, pageId, tabId),
    hasPermission: (resource: string, action: string) => hasPermission(userGroupId, resource, action),
    getPagePermissions: (pageId: string) => getPagePermissions(userGroupId, pageId),
    userGroupId,
    userRole: user?.role
  };
}