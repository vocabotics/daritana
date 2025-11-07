import { useMemo } from 'react';
import { usePermissions } from '@/components/auth/ProtectedRoute';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  highlight?: boolean;
  label?: string;
}

// Map navigation paths to page IDs
const pathToPageId: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/kanban': 'tasks',
  '/tasks': 'tasks',
  '/timeline': 'projects',
  '/calendar': 'projects',
  '/design-brief': 'design-brief',
  '/files': 'documents',
  '/documents': 'documents',
  '/financial': 'financial',
  '/compliance': 'compliance',
  '/team': 'team',
  '/marketplace': 'marketplace',
  '/admin': 'admin',
  '/admin-permissions': 'admin',
  '/enterprise-pm': 'enterprise-pm',
  '/hr': 'hr',
  '/learning': 'learning',
  '/construction': 'construction',
  '/analytics': 'analytics',
  '/integrations': 'integrations',
  '/security-enhanced': 'security',
  '/performance': 'performance',
  '/community': 'community',
  '/settings': 'settings',
  '/portfolio': 'portfolio',
  '/quotations': 'financial',
  '/invoices': 'financial',
  '/reports': 'reports',
  '/meetings': 'meetings',
  '/approvals': 'approvals',
  '/messages': 'messages',
  '/aria': 'aria',
};

export function useFilteredNavigation(navigation: NavigationItem[]): NavigationItem[] {
  const { canAccessPage, userRole } = usePermissions();

  return useMemo(() => {
    // If user is admin, show everything
    if (userRole === 'admin') {
      return navigation;
    }

    return navigation.filter(item => {
      // Always show dividers
      if (item.name === 'divider') {
        return true;
      }

      // Extract the base path from the href
      const basePath = item.href?.split('/').slice(0, 2).join('/') || item.href;
      
      // Get the page ID from the mapping
      const pageId = pathToPageId[basePath] || pathToPageId[item.href];
      
      // If no page ID mapping exists, default to showing the item
      // This ensures new pages are visible by default
      if (!pageId) {
        return true;
      }

      // Check if the user has permission to access this page
      return canAccessPage(pageId);
    });
  }, [navigation, canAccessPage, userRole]);
}

// Hook to check if a specific tab is accessible
export function useTabAccess(pageId: string) {
  const { canAccessTab, getPagePermissions } = usePermissions();

  return {
    canAccessTab: (tabId: string) => canAccessTab(pageId, tabId),
    pagePermissions: getPagePermissions(pageId),
  };
}