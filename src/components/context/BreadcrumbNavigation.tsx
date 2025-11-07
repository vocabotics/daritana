import React from 'react';
import { ChevronRight, Home, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProjectContextStore, BreadcrumbItem } from '@/store/projectContextStore';
import { motion, AnimatePresence } from 'framer-motion';

// Context to provide toolbar content from pages
const BreadcrumbToolbarContext = React.createContext<React.ReactNode>(null);

export const BreadcrumbToolbarProvider = BreadcrumbToolbarContext.Provider;
export const useBreadcrumbToolbar = () => React.useContext(BreadcrumbToolbarContext);

export function BreadcrumbNavigation() {
  const location = useLocation();
  const { mode, breadcrumbs, currentProject, contextTransitioning } = useProjectContextStore();
  const toolbarContent = useBreadcrumbToolbar();

  // Generate dynamic breadcrumbs based on current route and context
  const getDynamicBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const dynamicBreadcrumbs: BreadcrumbItem[] = [];

    // Add root based on context mode
    if (mode === 'global') {
      dynamicBreadcrumbs.push({ 
        label: 'All Projects', 
        href: '/dashboard'
      });
    } else if (currentProject) {
      dynamicBreadcrumbs.push({ 
        label: 'All Projects', 
        href: '/projects' 
      });
      dynamicBreadcrumbs.push({ 
        label: currentProject.name, 
        href: `/projects/${currentProject.id}`,
        isCurrentProject: true,
        projectColor: currentProject.color
      });
    }

    // Add route-specific breadcrumbs
    if (pathSegments.length > 0) {
      const routeName = pathSegments[pathSegments.length - 1];
      const routeLabel = formatRouteLabel(routeName);
      
      // Don't duplicate if it's the same as current project
      if (routeLabel !== currentProject?.name) {
        dynamicBreadcrumbs.push({ 
          label: routeLabel 
        });
      }
    }

    return dynamicBreadcrumbs;
  };

  const formatRouteLabel = (route: string): string => {
    const routeMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'projects': 'Projects',
      'kanban': 'Kanban Board',
      'timeline': 'Timeline',
      'calendar': 'Calendar',
      'tasks': 'Tasks',
      'team': 'Team',
      'files': 'Files',
      'settings': 'Settings',
      'design-brief': 'Design Brief',
      'meetings': 'Meetings',
      'reports': 'Reports',
      'compliance': 'Compliance',
      'financial': 'Financial',
      'marketplace': 'Marketplace',
      'community': 'Community',
      'portfolio': 'Portfolio'
    };

    return routeMap[route] || route.charAt(0).toUpperCase() + route.slice(1).replace('-', ' ');
  };

  const currentBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : getDynamicBreadcrumbs();

  // Only show toolbar, no breadcrumbs
  if (!toolbarContent) return null;

  return (
    <div className={cn(
      "flex items-center justify-between w-full transition-all duration-300 min-h-[32px]",
      contextTransitioning && "opacity-50"
    )}>
      {/* Toolbar Content */}
      {toolbarContent}
    </div>
  );
}