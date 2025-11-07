export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  settings?: Record<string, any>;
  permissions?: string[];
}

export type WidgetType = 
  // Project Management
  | 'project-overview'
  | 'active-projects'
  | 'project-timeline'
  | 'project-budget'
  | 'project-progress'
  | 'upcoming-deadlines'
  | 'recent-projects'
  
  // Task Management
  | 'task-list'
  | 'task-calendar'
  | 'task-kanban'
  | 'my-tasks'
  | 'team-tasks'
  | 'overdue-tasks'
  
  // Financial
  | 'revenue-chart'
  | 'expense-tracker'
  | 'invoice-summary'
  | 'payment-pending'
  | 'quotation-status'
  | 'cash-flow'
  | 'profit-loss'
  
  // Team & Resources
  | 'team-overview'
  | 'team-availability'
  | 'resource-allocation'
  | 'team-performance'
  | 'workload-distribution'
  
  // Client Specific
  | 'project-updates'
  | 'approval-requests'
  | 'design-gallery'
  | 'milestone-tracker'
  | 'document-vault'
  | 'payment-history'
  
  // Contractor Specific
  | 'bid-opportunities'
  | 'active-bids'
  | 'work-schedule'
  | 'material-orders'
  | 'site-progress'
  | 'safety-compliance'
  
  // Analytics
  | 'performance-metrics'
  | 'client-satisfaction'
  | 'project-analytics'
  | 'time-tracking'
  | 'productivity-chart'
  
  // Communication
  | 'recent-messages'
  | 'announcements'
  | 'meeting-schedule'
  | 'activity-feed'
  | 'notifications'
  
  // Compliance & Documentation
  | 'compliance-status'
  | 'regulatory-updates'
  | 'document-status'
  | 'permit-tracker'
  | 'inspection-schedule'
  
  // AI & Insights
  | 'ai-recommendations'
  | 'risk-assessment'
  | 'trend-analysis'
  | 'predictive-insights'
  | 'market-intelligence'
  
  // Quick Actions
  | 'quick-actions'
  | 'shortcuts'
  | 'recent-files'
  | 'bookmarks'
  
  // Weather & Environment
  | 'weather-forecast'
  | 'site-conditions'
  
  // Custom
  | 'custom-chart'
  | 'custom-table'
  | 'custom-metric'
  | 'iframe-embed';

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetLibrary {
  category: string;
  widgets: {
    type: WidgetType;
    title: string;
    description: string;
    icon: string;
    defaultSize: { width: number; height: number };
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    roles: string[];
    premium?: boolean;
  }[];
}

export const WIDGET_CATEGORIES: WidgetLibrary[] = [
  {
    category: 'Project Management',
    widgets: [
      {
        type: 'project-overview',
        title: 'Project Overview',
        description: 'Summary of all active projects',
        icon: 'Briefcase',
        defaultSize: { width: 4, height: 3 },
        roles: ['all']
      },
      {
        type: 'active-projects',
        title: 'Active Projects',
        description: 'List of currently active projects',
        icon: 'FolderOpen',
        defaultSize: { width: 6, height: 4 },
        roles: ['all']
      },
      {
        type: 'project-timeline',
        title: 'Project Timeline',
        description: 'Gantt chart of project schedules',
        icon: 'Calendar',
        defaultSize: { width: 8, height: 4 },
        roles: ['project_lead', 'designer', 'admin']
      },
      {
        type: 'project-budget',
        title: 'Budget Tracker',
        description: 'Project budget vs actual spending',
        icon: 'DollarSign',
        defaultSize: { width: 4, height: 3 },
        roles: ['project_lead', 'admin', 'client']
      },
      {
        type: 'upcoming-deadlines',
        title: 'Upcoming Deadlines',
        description: 'Projects and tasks due soon',
        icon: 'Clock',
        defaultSize: { width: 4, height: 3 },
        roles: ['all']
      }
    ]
  },
  {
    category: 'Tasks',
    widgets: [
      {
        type: 'my-tasks',
        title: 'My Tasks',
        description: 'Your assigned tasks',
        icon: 'CheckSquare',
        defaultSize: { width: 4, height: 4 },
        roles: ['all']
      },
      {
        type: 'task-kanban',
        title: 'Task Board',
        description: 'Kanban view of tasks',
        icon: 'Trello',
        defaultSize: { width: 8, height: 5 },
        roles: ['project_lead', 'designer', 'admin']
      },
      {
        type: 'overdue-tasks',
        title: 'Overdue Tasks',
        description: 'Tasks past their due date',
        icon: 'AlertTriangle',
        defaultSize: { width: 3, height: 3 },
        roles: ['all']
      }
    ]
  },
  {
    category: 'Financial',
    widgets: [
      {
        type: 'revenue-chart',
        title: 'Revenue Chart',
        description: 'Monthly revenue visualization',
        icon: 'TrendingUp',
        defaultSize: { width: 6, height: 4 },
        roles: ['admin', 'project_lead']
      },
      {
        type: 'invoice-summary',
        title: 'Invoice Summary',
        description: 'Outstanding and paid invoices',
        icon: 'FileText',
        defaultSize: { width: 4, height: 3 },
        roles: ['admin', 'project_lead', 'client']
      },
      {
        type: 'payment-pending',
        title: 'Pending Payments',
        description: 'Payments awaiting processing',
        icon: 'CreditCard',
        defaultSize: { width: 4, height: 3 },
        roles: ['admin', 'contractor', 'client']
      }
    ]
  },
  {
    category: 'Team',
    widgets: [
      {
        type: 'team-overview',
        title: 'Team Overview',
        description: 'Team members and availability',
        icon: 'Users',
        defaultSize: { width: 6, height: 4 },
        roles: ['project_lead', 'admin']
      },
      {
        type: 'workload-distribution',
        title: 'Workload Distribution',
        description: 'Task distribution across team',
        icon: 'PieChart',
        defaultSize: { width: 4, height: 3 },
        roles: ['project_lead', 'admin']
      }
    ]
  },
  {
    category: 'Client Portal',
    widgets: [
      {
        type: 'project-updates',
        title: 'Project Updates',
        description: 'Latest updates on your projects',
        icon: 'MessageSquare',
        defaultSize: { width: 6, height: 4 },
        roles: ['client']
      },
      {
        type: 'approval-requests',
        title: 'Pending Approvals',
        description: 'Items awaiting your approval',
        icon: 'CheckCircle',
        defaultSize: { width: 4, height: 3 },
        roles: ['client']
      },
      {
        type: 'design-gallery',
        title: 'Design Gallery',
        description: 'Latest design concepts and revisions',
        icon: 'Image',
        defaultSize: { width: 6, height: 4 },
        roles: ['client']
      },
      {
        type: 'milestone-tracker',
        title: 'Project Milestones',
        description: 'Track project milestone completion',
        icon: 'Flag',
        defaultSize: { width: 4, height: 3 },
        roles: ['client']
      }
    ]
  },
  {
    category: 'Contractor Portal',
    widgets: [
      {
        type: 'bid-opportunities',
        title: 'Bid Opportunities',
        description: 'New projects open for bidding',
        icon: 'Gavel',
        defaultSize: { width: 6, height: 4 },
        roles: ['contractor']
      },
      {
        type: 'work-schedule',
        title: 'Work Schedule',
        description: 'Your upcoming work schedule',
        icon: 'Calendar',
        defaultSize: { width: 4, height: 3 },
        roles: ['contractor']
      },
      {
        type: 'material-orders',
        title: 'Material Orders',
        description: 'Track material orders and deliveries',
        icon: 'Package',
        defaultSize: { width: 4, height: 3 },
        roles: ['contractor']
      },
      {
        type: 'site-progress',
        title: 'Site Progress',
        description: 'Construction site progress tracking',
        icon: 'Building',
        defaultSize: { width: 6, height: 4 },
        roles: ['contractor']
      }
    ]
  },
  {
    category: 'Analytics & Insights',
    widgets: [
      {
        type: 'performance-metrics',
        title: 'Performance Metrics',
        description: 'Key performance indicators',
        icon: 'BarChart',
        defaultSize: { width: 6, height: 4 },
        roles: ['admin', 'project_lead']
      },
      {
        type: 'ai-recommendations',
        title: 'AI Recommendations',
        description: 'AI-powered insights and suggestions',
        icon: 'Cpu',
        defaultSize: { width: 4, height: 3 },
        roles: ['project_lead', 'designer', 'admin'],
        premium: true
      },
      {
        type: 'trend-analysis',
        title: 'Trend Analysis',
        description: 'Market and project trends',
        icon: 'TrendingUp',
        defaultSize: { width: 4, height: 3 },
        roles: ['admin', 'project_lead'],
        premium: true
      }
    ]
  },
  {
    category: 'Communication',
    widgets: [
      {
        type: 'recent-messages',
        title: 'Recent Messages',
        description: 'Latest messages and chats',
        icon: 'MessageCircle',
        defaultSize: { width: 4, height: 3 },
        roles: ['all']
      },
      {
        type: 'meeting-schedule',
        title: 'Meeting Schedule',
        description: 'Upcoming meetings and calls',
        icon: 'Video',
        defaultSize: { width: 4, height: 3 },
        roles: ['all']
      },
      {
        type: 'activity-feed',
        title: 'Activity Feed',
        description: 'Recent project activities',
        icon: 'Activity',
        defaultSize: { width: 4, height: 4 },
        roles: ['all']
      }
    ]
  },
  {
    category: 'Compliance',
    widgets: [
      {
        type: 'compliance-status',
        title: 'Compliance Status',
        description: 'UBBL and regulatory compliance',
        icon: 'Shield',
        defaultSize: { width: 4, height: 3 },
        roles: ['project_lead', 'admin', 'designer']
      },
      {
        type: 'permit-tracker',
        title: 'Permit Tracker',
        description: 'Building permits and approvals',
        icon: 'FileCheck',
        defaultSize: { width: 4, height: 3 },
        roles: ['project_lead', 'admin']
      }
    ]
  },
  {
    category: 'Quick Access',
    widgets: [
      {
        type: 'quick-actions',
        title: 'Quick Actions',
        description: 'Frequently used actions',
        icon: 'Zap',
        defaultSize: { width: 3, height: 2 },
        roles: ['all']
      },
      {
        type: 'recent-files',
        title: 'Recent Files',
        description: 'Recently accessed documents',
        icon: 'File',
        defaultSize: { width: 4, height: 3 },
        roles: ['all']
      }
    ]
  }
];

// Predefined layouts for different roles
export const DEFAULT_LAYOUTS: Record<string, DashboardWidget[]> = {
  client: [
    { id: '1', type: 'project-updates', title: 'Project Updates', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
    { id: '2', type: 'milestone-tracker', title: 'Project Milestones', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
    { id: '3', type: 'approval-requests', title: 'Pending Approvals', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
    { id: '4', type: 'design-gallery', title: 'Design Gallery', position: { x: 4, y: 4 }, size: { width: 8, height: 4 } },
    { id: '5', type: 'invoice-summary', title: 'Invoices', position: { x: 0, y: 8 }, size: { width: 4, height: 3 } },
    { id: '6', type: 'meeting-schedule', title: 'Meetings', position: { x: 4, y: 8 }, size: { width: 4, height: 3 } },
    { id: '7', type: 'recent-messages', title: 'Messages', position: { x: 8, y: 8 }, size: { width: 4, height: 3 } }
  ],
  contractor: [
    { id: '1', type: 'work-schedule', title: 'Work Schedule', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
    { id: '2', type: 'bid-opportunities', title: 'New Opportunities', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
    { id: '3', type: 'active-bids', title: 'Active Bids', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
    { id: '4', type: 'site-progress', title: 'Site Progress', position: { x: 4, y: 4 }, size: { width: 8, height: 4 } },
    { id: '5', type: 'material-orders', title: 'Material Orders', position: { x: 0, y: 8 }, size: { width: 4, height: 3 } },
    { id: '6', type: 'payment-pending', title: 'Pending Payments', position: { x: 4, y: 8 }, size: { width: 4, height: 3 } },
    { id: '7', type: 'safety-compliance', title: 'Safety Compliance', position: { x: 8, y: 8 }, size: { width: 4, height: 3 } }
  ],
  designer: [
    { id: '1', type: 'project-overview', title: 'Projects', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
    { id: '2', type: 'my-tasks', title: 'My Tasks', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
    { id: '3', type: 'task-kanban', title: 'Task Board', position: { x: 0, y: 4 }, size: { width: 12, height: 5 } },
    { id: '4', type: 'quick-actions', title: 'Quick Actions', position: { x: 0, y: 9 }, size: { width: 3, height: 2 } },
    { id: '5', type: 'recent-files', title: 'Recent Files', position: { x: 3, y: 9 }, size: { width: 4, height: 3 } },
    { id: '6', type: 'activity-feed', title: 'Activity', position: { x: 7, y: 9 }, size: { width: 5, height: 3 } }
  ],
  project_lead: [
    { id: '1', type: 'project-overview', title: 'Projects Overview', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
    { id: '2', type: 'team-overview', title: 'Team Status', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
    { id: '3', type: 'revenue-chart', title: 'Revenue', position: { x: 0, y: 4 }, size: { width: 6, height: 4 } },
    { id: '4', type: 'task-kanban', title: 'Tasks', position: { x: 6, y: 4 }, size: { width: 6, height: 4 } },
    { id: '5', type: 'upcoming-deadlines', title: 'Deadlines', position: { x: 0, y: 8 }, size: { width: 4, height: 3 } },
    { id: '6', type: 'performance-metrics', title: 'KPIs', position: { x: 4, y: 8 }, size: { width: 4, height: 3 } },
    { id: '7', type: 'ai-recommendations', title: 'AI Insights', position: { x: 8, y: 8 }, size: { width: 4, height: 3 } }
  ]
};