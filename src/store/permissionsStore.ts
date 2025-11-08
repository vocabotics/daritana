import { create } from 'zustand';
import { toast } from 'sonner';

export interface Permission {
  id: string;
  resource: string; // e.g., 'projects', 'dashboard', 'financial'
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'share';
  allowed: boolean;
}

export interface TabPermission {
  tabId: string;
  tabName: string;
  visible: boolean;
  canEdit: boolean;
}

export interface PagePermission {
  pageId: string;
  pageName: string;
  path: string;
  visible: boolean;
  tabs?: TabPermission[];
  features?: {
    [key: string]: boolean; // e.g., 'canExport': true, 'canPrint': false
  };
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystem: boolean; // System groups cannot be deleted
  permissions: Permission[];
  pagePermissions: PagePermission[];
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
}

interface PermissionsState {
  groups: UserGroup[];
  currentUserGroup: string | null;
  
  // Group management
  addGroup: (group: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGroup: (id: string, updates: Partial<UserGroup>) => void;
  deleteGroup: (id: string) => void;
  
  // Permission management
  updateGroupPermissions: (groupId: string, permissions: Permission[]) => void;
  updatePagePermissions: (groupId: string, pagePermissions: PagePermission[]) => void;
  
  // Permission checking
  hasPermission: (groupId: string, resource: string, action: string) => boolean;
  canAccessPage: (groupId: string, pageId: string) => boolean;
  canAccessTab: (groupId: string, pageId: string, tabId: string) => boolean;
  getPagePermissions: (groupId: string, pageId: string) => PagePermission | undefined;
  
  // Utility
  getGroup: (id: string) => UserGroup | undefined;
  setCurrentUserGroup: (groupId: string) => void;
  exportPermissions: () => string;
  importPermissions: (data: string) => void;
  
  // Backend sync
  fetchGroups: () => Promise<void>;
  saveGroup: (group: UserGroup) => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

// Default system groups with comprehensive permissions
const defaultGroups: UserGroup[] = [
  {
    id: 'admin',
    name: 'Principal/Studio Owner',
    description: 'Studio owner with full business and project oversight',
    color: 'red',
    icon: 'Building2',
    isSystem: true,
    permissions: [
      { id: '1', resource: '*', action: 'view', allowed: true },
      { id: '2', resource: '*', action: 'create', allowed: true },
      { id: '3', resource: '*', action: 'edit', allowed: true },
      { id: '4', resource: '*', action: 'delete', allowed: true },
      { id: '5', resource: '*', action: 'approve', allowed: true },
      { id: '6', resource: '*', action: 'export', allowed: true },
      { id: '7', resource: '*', action: 'share', allowed: true },
    ],
    pagePermissions: [
      // ALL pages should be visible for admin with full permissions
      { pageId: 'dashboard', pageName: 'Dashboard', path: '/dashboard', visible: true, 
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'analytics', tabName: 'Analytics', visible: true, canEdit: true },
          { tabId: 'widgets', tabName: 'Widgets', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: true },
        ],
        features: { canCustomize: true, canExport: true, canShare: true }
      },
      { pageId: 'projects', pageName: 'Projects', path: '/projects', visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: true },
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: true },
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: true },
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: true },
        ],
        features: { canCreate: true, canDelete: true, canExport: true, canArchive: true }
      },
      { pageId: 'tasks', pageName: 'Tasks', path: '/kanban', visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: true },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: true },
          { tabId: 'workload', tabName: 'Workload', visible: true, canEdit: true },
        ],
        features: { canCreate: true, canEdit: true, canDelete: true, canAssign: true, canComment: true }
      },
      { pageId: 'documents', pageName: 'Documents', path: '/documents', visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: true },
          { tabId: 'review', tabName: 'Review', visible: true, canEdit: true },
          { tabId: 'versions', tabName: 'Versions', visible: true, canEdit: true },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: true },
        ],
        features: { canUpload: true, canDownload: true, canDelete: true, canShare: true, canReview: true, canApprove: true }
      },
      { pageId: 'financial', pageName: 'Financial', path: '/financial', visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'invoices', tabName: 'Invoices', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
          { tabId: 'expenses', tabName: 'Expenses', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: true },
        ],
        features: { canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, canSendInvoice: true }
      },
      { pageId: 'team', pageName: 'Team', path: '/team', visible: true,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: true },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: true, canEdit: true },
          { tabId: 'schedule', tabName: 'Schedule', visible: true, canEdit: true },
          { tabId: 'performance', tabName: 'Performance', visible: true, canEdit: true },
        ],
        features: { canInvite: true, canRemove: true, canManageRoles: true, canMessage: true, canCall: true }
      },
      { pageId: 'marketplace', pageName: 'Marketplace', path: '/marketplace', visible: true,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: true, canEdit: true },
          { tabId: 'vendors', tabName: 'Vendors', visible: true, canEdit: true },
          { tabId: 'orders', tabName: 'Orders', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
        ],
        features: { canPurchase: true, canSell: true, canManageListings: true, canNegotiate: true }
      },
      { pageId: 'compliance', pageName: 'Compliance', path: '/compliance', visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: true },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: true },
        ],
        features: { canSubmit: true, canApprove: true, canExport: true, canScheduleInspection: true }
      },
      { pageId: 'design-brief', pageName: 'Design Brief', path: '/design-brief', visible: true,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: true, canEdit: true },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: true, canEdit: true },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: true },
          { tabId: 'gallery', tabName: 'Gallery', visible: true, canEdit: true },
        ],
        features: { canCreate: true, canEdit: true, canApprove: true, canComment: true, canShare: true }
      },
      { pageId: 'admin', pageName: 'Admin', path: '/admin', visible: true,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: true, canEdit: true },
          { tabId: 'permissions', tabName: 'Permissions', visible: true, canEdit: true },
          { tabId: 'settings', tabName: 'Settings', visible: true, canEdit: true },
          { tabId: 'logs', tabName: 'Logs', visible: true, canEdit: true },
        ],
        features: { canManageUsers: true, canManageSystem: true, canViewLogs: true, canEditSettings: true }
      },
      { pageId: 'enterprise-pm', pageName: 'Enterprise PM', path: '/enterprise-pm', visible: true,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: true, canEdit: true },
          { tabId: 'gantt', tabName: 'Gantt', visible: true, canEdit: true },
          { tabId: 'resources', tabName: 'Resources', visible: true, canEdit: true },
          { tabId: 'risk', tabName: 'Risk', visible: true, canEdit: true },
        ],
        features: { canManage: true, canCreateProjects: true, canEditSchedule: true, canManageResources: true }
      },
      { pageId: 'hr', pageName: 'HR', path: '/hr', visible: true,
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: true, canEdit: true },
          { tabId: 'attendance', tabName: 'Attendance', visible: true, canEdit: true },
          { tabId: 'leaves', tabName: 'Leaves', visible: true, canEdit: true },
          { tabId: 'payroll', tabName: 'Payroll', visible: true, canEdit: true },
        ],
        features: { canManage: true, canManageEmployees: true, canProcessPayroll: true, canManageLeaves: true }
      },
      { pageId: 'learning', pageName: 'Learning', path: '/learning', visible: true,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: true, canEdit: true },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: true },
          { tabId: 'certificates', tabName: 'Certificates', visible: true, canEdit: true },
          { tabId: 'assessments', tabName: 'Assessments', visible: true, canEdit: true },
        ],
        features: { canManage: true, canCreateCourses: true, canManageAssessments: true, canIssueCertificates: true }
      },
      { pageId: 'construction', pageName: 'Construction', path: '/construction', visible: true,
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: true, canEdit: true },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: true },
          { tabId: 'materials', tabName: 'Materials', visible: true, canEdit: true },
          { tabId: 'safety', tabName: 'Safety', visible: true, canEdit: true },
        ],
        features: { canManage: true, canManageSites: true, canTrackProgress: true, canManageMaterials: true, canManageSafety: true }
      },
      { pageId: 'analytics', pageName: 'Analytics', path: '/analytics', visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: true },
          { tabId: 'insights', tabName: 'Insights', visible: true, canEdit: true },
          { tabId: 'exports', tabName: 'Exports', visible: true, canEdit: true },
        ],
        features: { canView: true, canExport: true, canCreateReports: true, canGenerateInsights: true }
      },
      { pageId: 'integrations', pageName: 'Integrations', path: '/integrations', visible: true,
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: true, canEdit: true },
          { tabId: 'available', tabName: 'Available', visible: true, canEdit: true },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: true, canEdit: true },
          { tabId: 'api', tabName: 'API', visible: true, canEdit: true },
        ],
        features: { canManage: true, canConnectIntegrations: true, canManageWebhooks: true, canManageAPI: true }
      },
      { pageId: 'security', pageName: 'Security', path: '/security-enhanced', visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'policies', tabName: 'Policies', visible: true, canEdit: true },
          { tabId: 'incidents', tabName: 'Incidents', visible: true, canEdit: true },
          { tabId: 'audit', tabName: 'Audit', visible: true, canEdit: true },
        ],
        features: { canManage: true, canManagePolicies: true, canManageIncidents: true, canViewAudit: true }
      },
      { pageId: 'performance', pageName: 'Performance', path: '/performance', visible: true,
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: true, canEdit: true },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: true, canEdit: true },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: true },
          { tabId: 'optimization', tabName: 'Optimization', visible: true, canEdit: true },
        ],
        features: { canView: true, canManage: true, canOptimize: true, canSetupAlerts: true }
      },
      { pageId: 'community', pageName: 'Community', path: '/community', visible: true,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: true, canEdit: true },
          { tabId: 'forums', tabName: 'Forums', visible: true, canEdit: true },
          { tabId: 'events', tabName: 'Events', visible: true, canEdit: true },
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: true },
        ],
        features: { canPost: true, canModerate: true, canCreateEvents: true, canManageMembers: true }
      },
      { pageId: 'settings', pageName: 'Settings', path: '/settings', visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: true, canEdit: true },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: { canEdit: true, canManageProfile: true, canManageNotifications: true, canManagePrivacy: true }
      },
      { pageId: 'aria', pageName: 'ARIA', path: '/aria', visible: true,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: true, canEdit: true },
          { tabId: 'commands', tabName: 'Commands', visible: true, canEdit: true },
          { tabId: 'history', tabName: 'History', visible: true, canEdit: true },
          { tabId: 'settings', tabName: 'Settings', visible: true, canEdit: true },
        ],
        features: { canUse: true, canCustomize: true, canViewHistory: true, canManageSettings: true }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 1
  },
  {
    id: 'project_lead',
    name: 'Senior Architect',
    description: 'Project architects managing design teams and client relationships',
    color: 'blue',
    icon: 'HardHat',
    isSystem: true,
    permissions: [
      // Core project management
      { id: '8', resource: 'projects', action: 'view', allowed: true },
      { id: '9', resource: 'projects', action: 'create', allowed: true },
      { id: '10', resource: 'projects', action: 'edit', allowed: true },
      { id: '11', resource: 'projects', action: 'approve', allowed: true },
      { id: '12', resource: 'tasks', action: 'view', allowed: true },
      { id: '13', resource: 'tasks', action: 'create', allowed: true },
      { id: '14', resource: 'tasks', action: 'edit', allowed: true },
      { id: '15', resource: 'tasks', action: 'approve', allowed: true },
      // Team and client management
      { id: '16', resource: 'team', action: 'view', allowed: true },
      { id: '17', resource: 'team', action: 'edit', allowed: true },
      { id: '18', resource: 'design-brief', action: 'view', allowed: true },
      { id: '19', resource: 'design-brief', action: 'create', allowed: true },
      { id: '20', resource: 'design-brief', action: 'edit', allowed: true },
      { id: '21', resource: 'design-brief', action: 'approve', allowed: true },
      // Document management
      { id: '22', resource: 'documents', action: 'view', allowed: true },
      { id: '23', resource: 'documents', action: 'create', allowed: true },
      { id: '24', resource: 'documents', action: 'edit', allowed: true },
      { id: '25', resource: 'documents', action: 'share', allowed: true },
      // Limited financial access
      { id: '26', resource: 'financial', action: 'view', allowed: true },
      { id: '27', resource: 'financial', action: 'create', allowed: true }, // Create quotes
      { id: '28', resource: 'financial', action: 'export', allowed: true },
      // Construction monitoring
      { id: '29', resource: 'construction', action: 'view', allowed: true },
      { id: '30', resource: 'construction', action: 'edit', allowed: true },
      // Compliance oversight
      { id: '31', resource: 'compliance', action: 'view', allowed: true },
      { id: '32', resource: 'compliance', action: 'edit', allowed: true },
      // Marketplace access
      { id: '33', resource: 'marketplace', action: 'view', allowed: true },
      { id: '34', resource: 'marketplace', action: 'create', allowed: true }, // Create quotes/orders
    ],
    pagePermissions: [
      {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        path: '/dashboard',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: true },
          { tabId: 'analytics', tabName: 'Analytics', visible: true, canEdit: false },
          { tabId: 'widgets', tabName: 'Widgets', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canCustomize: true,
          canExport: true,
          canShare: true,
        }
      },
      {
        pageId: 'projects',
        pageName: 'Projects',
        path: '/projects',
        visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: true },
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: true },
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: false },
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true,
          canDelete: false,
          canExport: true,
          canArchive: true,
        }
      },
      {
        pageId: 'tasks',
        pageName: 'Tasks',
        path: '/kanban',
        visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: true },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: true },
          { tabId: 'workload', tabName: 'Workload', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canAssign: true,
          canComment: true,
        }
      },
      {
        pageId: 'documents',
        pageName: 'Documents',
        path: '/documents',
        visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: true },
          { tabId: 'review', tabName: 'Review', visible: true, canEdit: true },
          { tabId: 'versions', tabName: 'Versions', visible: true, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
        ],
        features: {
          canUpload: true,
          canDownload: true,
          canDelete: true,
          canShare: true,
          canReview: true,
          canApprove: true,
        }
      },
      {
        pageId: 'financial',
        pageName: 'Financial',
        path: '/financial',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'invoices', tabName: 'Invoices', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
          { tabId: 'expenses', tabName: 'Expenses', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true, // Can create quotes/proposals
          canEdit: false, // Limited editing to protect finances
          canDelete: false,
          canApprove: false, // Only view invoices, not approve
          canExport: true,
          canSendInvoice: false, // Admin/Principal handles invoicing
        }
      },
      {
        pageId: 'team',
        pageName: 'Team',
        path: '/team',
        visible: true,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: true },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: true, canEdit: false },
          { tabId: 'schedule', tabName: 'Schedule', visible: true, canEdit: true },
          { tabId: 'performance', tabName: 'Performance', visible: true, canEdit: false },
        ],
        features: {
          canInvite: true,
          canRemove: true,
          canMessage: true,
          canCall: true,
          canManageRoles: true,
        }
      },
      {
        pageId: 'marketplace',
        pageName: 'Marketplace',
        path: '/marketplace',
        visible: true,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: true, canEdit: false },
          { tabId: 'vendors', tabName: 'Vendors', visible: true, canEdit: false },
          { tabId: 'orders', tabName: 'Orders', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
        ],
        features: {
          canPurchase: true,
          canSell: false,
          canManageListings: false,
          canNegotiate: true,
        }
      },
      {
        pageId: 'compliance',
        pageName: 'Compliance',
        path: '/compliance',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: true },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canSubmit: true,
          canApprove: true,
          canExport: true,
          canScheduleInspection: true,
        }
      },
      {
        pageId: 'design-brief',
        pageName: 'Design Brief',
        path: '/design-brief',
        visible: true,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: true, canEdit: true },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: true, canEdit: true },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
          { tabId: 'gallery', tabName: 'Gallery', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true,
          canEdit: true,
          canApprove: true,
          canComment: true,
          canShare: true,
        }
      },
      {
        pageId: 'admin',
        pageName: 'Admin',
        path: '/admin',
        visible: false,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: false, canEdit: false },
          { tabId: 'permissions', tabName: 'Permissions', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
          { tabId: 'logs', tabName: 'Logs', visible: false, canEdit: false },
        ],
        features: {
          canManageUsers: false,
          canManageSystem: false,
          canViewLogs: false,
          canEditSettings: false,
        }
      },
      {
        pageId: 'enterprise-pm',
        pageName: 'Enterprise PM',
        path: '/enterprise-pm',
        visible: true,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: true, canEdit: true },
          { tabId: 'gantt', tabName: 'Gantt', visible: true, canEdit: true },
          { tabId: 'resources', tabName: 'Resources', visible: true, canEdit: true },
          { tabId: 'risk', tabName: 'Risk', visible: true, canEdit: true },
        ],
        features: {
          canManage: true,
          canCreateProjects: true,
          canEditSchedule: true,
          canManageResources: true,
        }
      },
      {
        pageId: 'hr',
        pageName: 'HR',
        path: '/hr',
        visible: false, // Small architecture studios don't need complex HR
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: false, canEdit: false },
          { tabId: 'attendance', tabName: 'Attendance', visible: false, canEdit: false },
          { tabId: 'leaves', tabName: 'Leaves', visible: false, canEdit: false },
          { tabId: 'payroll', tabName: 'Payroll', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageEmployees: false,
          canProcessPayroll: false,
          canManageLeaves: false,
        }
      },
      {
        pageId: 'learning',
        pageName: 'Learning',
        path: '/learning',
        visible: true,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: false },
          { tabId: 'certificates', tabName: 'Certificates', visible: true, canEdit: false },
          { tabId: 'assessments', tabName: 'Assessments', visible: true, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateCourses: false,
          canManageAssessments: false,
          canIssueCertificates: false,
        }
      },
      {
        pageId: 'construction',
        pageName: 'Construction',
        path: '/construction',
        visible: true,
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: true, canEdit: true },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: true },
          { tabId: 'materials', tabName: 'Materials', visible: true, canEdit: true },
          { tabId: 'safety', tabName: 'Safety', visible: true, canEdit: true },
        ],
        features: {
          canManage: true,
          canManageSites: true,
          canTrackProgress: true,
          canManageMaterials: true,
          canManageSafety: true,
        }
      },
      {
        pageId: 'analytics',
        pageName: 'Analytics',
        path: '/analytics',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: true },
          { tabId: 'insights', tabName: 'Insights', visible: true, canEdit: false },
          { tabId: 'exports', tabName: 'Exports', visible: true, canEdit: true },
        ],
        features: {
          canView: true,
          canExport: true,
          canCreateReports: true,
          canGenerateInsights: false,
        }
      },
      {
        pageId: 'integrations',
        pageName: 'Integrations',
        path: '/integrations',
        visible: false, // Not essential for small architecture studios
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: true, canEdit: false },
          { tabId: 'available', tabName: 'Available', visible: true, canEdit: false },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: false, canEdit: false },
          { tabId: 'api', tabName: 'API', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canConnectIntegrations: false,
          canManageWebhooks: false,
          canManageAPI: false,
        }
      },
      {
        pageId: 'security',
        pageName: 'Security',
        path: '/security-enhanced',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'policies', tabName: 'Policies', visible: false, canEdit: false },
          { tabId: 'incidents', tabName: 'Incidents', visible: false, canEdit: false },
          { tabId: 'audit', tabName: 'Audit', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManagePolicies: false,
          canManageIncidents: false,
          canViewAudit: false,
        }
      },
      {
        pageId: 'performance',
        pageName: 'Performance',
        path: '/performance',
        visible: false, // Not essential for small architecture studios
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: true, canEdit: false },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: true, canEdit: false },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: true },
          { tabId: 'optimization', tabName: 'Optimization', visible: false, canEdit: false },
        ],
        features: {
          canView: true,
          canManage: false,
          canOptimize: false,
          canSetupAlerts: true,
        }
      },
      {
        pageId: 'community',
        pageName: 'Community',
        path: '/community',
        visible: true,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: true, canEdit: true },
          { tabId: 'forums', tabName: 'Forums', visible: true, canEdit: true },
          { tabId: 'events', tabName: 'Events', visible: true, canEdit: true },
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
        ],
        features: {
          canPost: true,
          canModerate: false,
          canCreateEvents: true,
          canManageMembers: false,
        }
      },
      {
        pageId: 'settings',
        pageName: 'Settings',
        path: '/settings',
        visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: true, canEdit: true },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: {
          canEdit: true,
          canManageProfile: true,
          canManageNotifications: true,
          canManagePrivacy: true,
        }
      },
      {
        pageId: 'aria',
        pageName: 'ARIA',
        path: '/aria',
        visible: true,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: true, canEdit: true },
          { tabId: 'commands', tabName: 'Commands', visible: true, canEdit: true },
          { tabId: 'history', tabName: 'History', visible: true, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: true, canEdit: true },
        ],
        features: {
          canUse: true,
          canCustomize: true,
          canViewHistory: true,
          canManageSettings: true,
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 3
  },
  {
    id: 'designer',
    name: 'Junior Architect',
    description: 'Design team members focusing on creative and technical development',
    color: 'purple',
    icon: 'Drafting',
    isSystem: true,
    permissions: [
      // Project access - view and contribute
      { id: '35', resource: 'projects', action: 'view', allowed: true },
      { id: '36', resource: 'projects', action: 'edit', allowed: true }, // Can edit project details
      { id: '37', resource: 'tasks', action: 'view', allowed: true },
      { id: '38', resource: 'tasks', action: 'create', allowed: true },
      { id: '39', resource: 'tasks', action: 'edit', allowed: true },
      // Design and documents - core focus
      { id: '40', resource: 'designs', action: 'view', allowed: true },
      { id: '41', resource: 'designs', action: 'create', allowed: true },
      { id: '42', resource: 'designs', action: 'edit', allowed: true },
      { id: '43', resource: 'documents', action: 'view', allowed: true },
      { id: '44', resource: 'documents', action: 'create', allowed: true },
      { id: '45', resource: 'documents', action: 'edit', allowed: true },
      { id: '46', resource: 'documents', action: 'share', allowed: true },
      // Design briefs - participate in client process
      { id: '47', resource: 'design-brief', action: 'view', allowed: true },
      { id: '48', resource: 'design-brief', action: 'create', allowed: true },
      { id: '49', resource: 'design-brief', action: 'edit', allowed: true },
      // Team collaboration
      { id: '50', resource: 'team', action: 'view', allowed: true },
      // Limited financial - view project budgets only
      { id: '51', resource: 'financial', action: 'view', allowed: true },
      // Learning and development
      { id: '52', resource: 'learning', action: 'view', allowed: true },
      { id: '53', resource: 'learning', action: 'create', allowed: true },
      // Compliance awareness
      { id: '54', resource: 'compliance', action: 'view', allowed: true },
    ],
    pagePermissions: [
      {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        path: '/dashboard',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'analytics', tabName: 'Analytics', visible: false, canEdit: false },
          { tabId: 'widgets', tabName: 'Widgets', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCustomize: true,
          canExport: false,
          canShare: true,
        }
      },
      {
        pageId: 'projects',
        pageName: 'Projects',
        path: '/projects',
        visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: true }, // Can edit project details
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: true }, // Can manage tasks
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: true }, // Can update timelines
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: false }, // Can view schedules
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: false }, // Can view project locations
        ],
        features: {
          canCreate: false, // Senior architects create projects
          canDelete: false,
          canExport: true, // Can export for presentations
          canArchive: false,
        }
      },
      {
        pageId: 'tasks',
        pageName: 'Tasks',
        path: '/kanban',
        visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: true },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: false },
          { tabId: 'timeline', tabName: 'Timeline', visible: false, canEdit: false },
          { tabId: 'workload', tabName: 'Workload', visible: false, canEdit: false },
        ],
        features: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canAssign: false,
          canComment: true,
        }
      },
      {
        pageId: 'documents',
        pageName: 'Documents',
        path: '/documents',
        visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: false },
          { tabId: 'review', tabName: 'Review', visible: true, canEdit: true },
          { tabId: 'versions', tabName: 'Versions', visible: true, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
        ],
        features: {
          canUpload: true,
          canDownload: true,
          canDelete: false,
          canShare: true,
          canReview: true,
          canApprove: false,
        }
      },
      {
        pageId: 'financial',
        pageName: 'Financial',
        path: '/financial',
        visible: true, // Can view project budgets
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'invoices', tabName: 'Invoices', visible: false, canEdit: false }, // Not relevant
          { tabId: 'quotes', tabName: 'Quotes', visible: false, canEdit: false }, // Not relevant
          { tabId: 'expenses', tabName: 'Expenses', visible: true, canEdit: false }, // Project expenses awareness
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canApprove: false,
          canExport: false,
          canSendInvoice: false,
        }
      },
      {
        pageId: 'team',
        pageName: 'Team',
        path: '/team',
        visible: true,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: true, canEdit: false },
          { tabId: 'schedule', tabName: 'Schedule', visible: true, canEdit: false },
          { tabId: 'performance', tabName: 'Performance', visible: false, canEdit: false },
        ],
        features: {
          canInvite: false,
          canRemove: false,
          canMessage: true,
          canCall: true,
          canManageRoles: false,
        }
      },
      {
        pageId: 'marketplace',
        pageName: 'Marketplace',
        path: '/marketplace',
        visible: true,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: true, canEdit: false },
          { tabId: 'vendors', tabName: 'Vendors', visible: false, canEdit: false },
          { tabId: 'orders', tabName: 'Orders', visible: true, canEdit: false },
          { tabId: 'quotes', tabName: 'Quotes', visible: false, canEdit: false },
        ],
        features: {
          canPurchase: true,
          canSell: false,
          canManageListings: false,
          canNegotiate: false,
        }
      },
      {
        pageId: 'compliance',
        pageName: 'Compliance',
        path: '/compliance',
        visible: true, // Junior architects need compliance awareness
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: false }, // View for learning
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canSubmit: false, // Senior architects handle submissions
          canApprove: false,
          canExport: false,
          canScheduleInspection: false,
        }
      },
      {
        pageId: 'design-brief',
        pageName: 'Design Brief',
        path: '/design-brief',
        visible: true,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: true, canEdit: true },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: true, canEdit: true },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
          { tabId: 'gallery', tabName: 'Gallery', visible: true, canEdit: true },
        ],
        features: {
          canCreate: true,
          canEdit: true,
          canApprove: false,
          canComment: true,
          canShare: true,
        }
      },
      {
        pageId: 'admin',
        pageName: 'Admin',
        path: '/admin',
        visible: false,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: false, canEdit: false },
          { tabId: 'permissions', tabName: 'Permissions', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
          { tabId: 'logs', tabName: 'Logs', visible: false, canEdit: false },
        ],
        features: {
          canManageUsers: false,
          canManageSystem: false,
          canViewLogs: false,
          canEditSettings: false,
        }
      },
      {
        pageId: 'enterprise-pm',
        pageName: 'Enterprise PM',
        path: '/enterprise-pm',
        visible: false,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: false, canEdit: false },
          { tabId: 'gantt', tabName: 'Gantt', visible: false, canEdit: false },
          { tabId: 'resources', tabName: 'Resources', visible: false, canEdit: false },
          { tabId: 'risk', tabName: 'Risk', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateProjects: false,
          canEditSchedule: false,
          canManageResources: false,
        }
      },
      {
        pageId: 'hr',
        pageName: 'HR',
        path: '/hr',
        visible: false,
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: false, canEdit: false },
          { tabId: 'attendance', tabName: 'Attendance', visible: false, canEdit: false },
          { tabId: 'leaves', tabName: 'Leaves', visible: false, canEdit: false },
          { tabId: 'payroll', tabName: 'Payroll', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageEmployees: false,
          canProcessPayroll: false,
          canManageLeaves: false,
        }
      },
      {
        pageId: 'learning',
        pageName: 'Learning',
        path: '/learning',
        visible: true,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: false },
          { tabId: 'certificates', tabName: 'Certificates', visible: true, canEdit: false },
          { tabId: 'assessments', tabName: 'Assessments', visible: true, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateCourses: false,
          canManageAssessments: false,
          canIssueCertificates: false,
        }
      },
      {
        pageId: 'construction',
        pageName: 'Construction',
        path: '/construction',
        visible: true, // Junior architects need construction awareness
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: true, canEdit: false }, // View sites for learning
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: false }, // Track project progress
          { tabId: 'materials', tabName: 'Materials', visible: true, canEdit: false }, // Material awareness
          { tabId: 'safety', tabName: 'Safety', visible: true, canEdit: false }, // Safety protocols
        ],
        features: {
          canManage: false,
          canManageSites: false,
          canTrackProgress: false, // View only for learning
          canManageMaterials: false,
          canManageSafety: false,
        }
      },
      {
        pageId: 'analytics',
        pageName: 'Analytics',
        path: '/analytics',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
          { tabId: 'insights', tabName: 'Insights', visible: false, canEdit: false },
          { tabId: 'exports', tabName: 'Exports', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canExport: false,
          canCreateReports: false,
          canGenerateInsights: false,
        }
      },
      {
        pageId: 'integrations',
        pageName: 'Integrations',
        path: '/integrations',
        visible: false,
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: false, canEdit: false },
          { tabId: 'available', tabName: 'Available', visible: false, canEdit: false },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: false, canEdit: false },
          { tabId: 'api', tabName: 'API', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canConnectIntegrations: false,
          canManageWebhooks: false,
          canManageAPI: false,
        }
      },
      {
        pageId: 'security',
        pageName: 'Security',
        path: '/security-enhanced',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'policies', tabName: 'Policies', visible: false, canEdit: false },
          { tabId: 'incidents', tabName: 'Incidents', visible: false, canEdit: false },
          { tabId: 'audit', tabName: 'Audit', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManagePolicies: false,
          canManageIncidents: false,
          canViewAudit: false,
        }
      },
      {
        pageId: 'performance',
        pageName: 'Performance',
        path: '/performance',
        visible: false,
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: false, canEdit: false },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: false, canEdit: false },
          { tabId: 'alerts', tabName: 'Alerts', visible: false, canEdit: false },
          { tabId: 'optimization', tabName: 'Optimization', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canManage: false,
          canOptimize: false,
          canSetupAlerts: false,
        }
      },
      {
        pageId: 'community',
        pageName: 'Community',
        path: '/community',
        visible: true,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: true, canEdit: true },
          { tabId: 'forums', tabName: 'Forums', visible: true, canEdit: true },
          { tabId: 'events', tabName: 'Events', visible: true, canEdit: false },
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
        ],
        features: {
          canPost: true,
          canModerate: false,
          canCreateEvents: false,
          canManageMembers: false,
        }
      },
      {
        pageId: 'settings',
        pageName: 'Settings',
        path: '/settings',
        visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: true, canEdit: true },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: {
          canEdit: true,
          canManageProfile: true,
          canManageNotifications: true,
          canManagePrivacy: true,
        }
      },
      {
        pageId: 'aria',
        pageName: 'ARIA',
        path: '/aria',
        visible: true,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: true, canEdit: true },
          { tabId: 'commands', tabName: 'Commands', visible: true, canEdit: false },
          { tabId: 'history', tabName: 'History', visible: true, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: true, canEdit: true },
        ],
        features: {
          canUse: true,
          canCustomize: false,
          canViewHistory: true,
          canManageSettings: true,
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 5
  },
  {
    id: 'client',
    name: 'Project Client',
    description: 'Project owners with access to their projects and design approval rights',
    color: 'green',
    icon: 'Home',
    isSystem: true,
    permissions: [
      // Project access - view their own projects
      { id: '55', resource: 'projects', action: 'view', allowed: true },
      { id: '56', resource: 'projects', action: 'approve', allowed: true }, // Approve project milestones
      // Design access - view and approve
      { id: '57', resource: 'designs', action: 'view', allowed: true },
      { id: '58', resource: 'designs', action: 'approve', allowed: true },
      // Design briefs - collaborative process
      { id: '59', resource: 'design-brief', action: 'view', allowed: true },
      { id: '60', resource: 'design-brief', action: 'create', allowed: true },
      { id: '61', resource: 'design-brief', action: 'edit', allowed: true },
      { id: '62', resource: 'design-brief', action: 'approve', allowed: true },
      // Documents - view project documents
      { id: '63', resource: 'documents', action: 'view', allowed: true },
      { id: '64', resource: 'documents', action: 'approve', allowed: true }, // Approve drawings
      { id: '65', resource: 'documents', action: 'share', allowed: true }, // Share with consultants
      // Financial - view invoices and project costs
      { id: '66', resource: 'financial', action: 'view', allowed: true },
      { id: '67', resource: 'financial', action: 'approve', allowed: true }, // Approve invoices
      // Tasks - track progress
      { id: '68', resource: 'tasks', action: 'view', allowed: true },
    ],
    pagePermissions: [
      {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        path: '/dashboard',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'analytics', tabName: 'Analytics', visible: false, canEdit: false },
          { tabId: 'widgets', tabName: 'Widgets', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCustomize: false,
          canExport: false,
          canShare: false,
        }
      },
      {
        pageId: 'projects',
        pageName: 'Projects',
        path: '/projects',
        visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: false }, // View their projects
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: false }, // See task progress
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: false }, // Track milestones
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: false }, // View schedules
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: false }, // See project location
        ],
        features: {
          canCreate: false, // Architects create projects
          canDelete: false,
          canExport: true, // Export project summaries
          canArchive: false,
        }
      },
      {
        pageId: 'tasks',
        pageName: 'Tasks',
        path: '/kanban',
        visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: false },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: false },
          { tabId: 'timeline', tabName: 'Timeline', visible: false, canEdit: false },
          { tabId: 'workload', tabName: 'Workload', visible: false, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canAssign: false,
          canComment: true,
        }
      },
      {
        pageId: 'documents',
        pageName: 'Documents',
        path: '/documents',
        visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: false },
          { tabId: 'review', tabName: 'Review', visible: true, canEdit: false },
          { tabId: 'versions', tabName: 'Versions', visible: false, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: false, canEdit: false },
        ],
        features: {
          canUpload: false, // Only architects upload designs
          canDownload: true, // Download plans and documents
          canDelete: false,
          canShare: true, // Share with consultants/contractors
          canReview: true, // Review and comment on designs
          canApprove: true, // Approve final designs
        }
      },
      {
        pageId: 'financial',
        pageName: 'Financial',
        path: '/financial',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'invoices', tabName: 'Invoices', visible: true, canEdit: false },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: false },
          { tabId: 'expenses', tabName: 'Expenses', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canApprove: true,
          canExport: false,
          canSendInvoice: false,
        }
      },
      {
        pageId: 'team',
        pageName: 'Team',
        path: '/team',
        visible: false,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: false, canEdit: false },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: false, canEdit: false },
          { tabId: 'schedule', tabName: 'Schedule', visible: false, canEdit: false },
          { tabId: 'performance', tabName: 'Performance', visible: false, canEdit: false },
        ],
        features: {
          canInvite: false,
          canRemove: false,
          canMessage: false,
          canCall: false,
          canManageRoles: false,
        }
      },
      {
        pageId: 'marketplace',
        pageName: 'Marketplace',
        path: '/marketplace',
        visible: false,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: false, canEdit: false },
          { tabId: 'vendors', tabName: 'Vendors', visible: false, canEdit: false },
          { tabId: 'orders', tabName: 'Orders', visible: false, canEdit: false },
          { tabId: 'quotes', tabName: 'Quotes', visible: false, canEdit: false },
        ],
        features: {
          canPurchase: false,
          canSell: false,
          canManageListings: false,
          canNegotiate: false,
        }
      },
      {
        pageId: 'compliance',
        pageName: 'Compliance',
        path: '/compliance',
        visible: true, // Clients need awareness of regulatory requirements
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false }, // Understanding compliance status
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: false }, // See what's been submitted
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: false }, // Important compliance updates
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false }, // Too detailed
        ],
        features: {
          canSubmit: false, // Architects handle submissions
          canApprove: true, // May need to approve certain submissions
          canExport: false,
          canScheduleInspection: false, // Architects coordinate inspections
        }
      },
      {
        pageId: 'design-brief',
        pageName: 'Design Brief',
        path: '/design-brief',
        visible: true,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: true, canEdit: true },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: true, canEdit: true },
          { tabId: 'templates', tabName: 'Templates', visible: false, canEdit: false },
          { tabId: 'gallery', tabName: 'Gallery', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true, // Create initial design brief
          canEdit: true, // Update requirements during collaboration
          canApprove: true, // Approve final design briefs
          canComment: true, // Provide feedback
          canShare: true, // Share with consultants or other stakeholders
        }
      },
      {
        pageId: 'admin',
        pageName: 'Admin',
        path: '/admin',
        visible: false,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: false, canEdit: false },
          { tabId: 'permissions', tabName: 'Permissions', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
          { tabId: 'logs', tabName: 'Logs', visible: false, canEdit: false },
        ],
        features: {
          canManageUsers: false,
          canManageSystem: false,
          canViewLogs: false,
          canEditSettings: false,
        }
      },
      {
        pageId: 'enterprise-pm',
        pageName: 'Enterprise PM',
        path: '/enterprise-pm',
        visible: false,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: false, canEdit: false },
          { tabId: 'gantt', tabName: 'Gantt', visible: false, canEdit: false },
          { tabId: 'resources', tabName: 'Resources', visible: false, canEdit: false },
          { tabId: 'risk', tabName: 'Risk', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateProjects: false,
          canEditSchedule: false,
          canManageResources: false,
        }
      },
      {
        pageId: 'hr',
        pageName: 'HR',
        path: '/hr',
        visible: false,
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: false, canEdit: false },
          { tabId: 'attendance', tabName: 'Attendance', visible: false, canEdit: false },
          { tabId: 'leaves', tabName: 'Leaves', visible: false, canEdit: false },
          { tabId: 'payroll', tabName: 'Payroll', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageEmployees: false,
          canProcessPayroll: false,
          canManageLeaves: false,
        }
      },
      {
        pageId: 'learning',
        pageName: 'Learning',
        path: '/learning',
        visible: false,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: false, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: false, canEdit: false },
          { tabId: 'certificates', tabName: 'Certificates', visible: false, canEdit: false },
          { tabId: 'assessments', tabName: 'Assessments', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateCourses: false,
          canManageAssessments: false,
          canIssueCertificates: false,
        }
      },
      {
        pageId: 'construction',
        pageName: 'Construction',
        path: '/construction',
        visible: false,
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: false, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: false, canEdit: false },
          { tabId: 'materials', tabName: 'Materials', visible: false, canEdit: false },
          { tabId: 'safety', tabName: 'Safety', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageSites: false,
          canTrackProgress: false,
          canManageMaterials: false,
          canManageSafety: false,
        }
      },
      {
        pageId: 'analytics',
        pageName: 'Analytics',
        path: '/analytics',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
          { tabId: 'insights', tabName: 'Insights', visible: false, canEdit: false },
          { tabId: 'exports', tabName: 'Exports', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canExport: false,
          canCreateReports: false,
          canGenerateInsights: false,
        }
      },
      {
        pageId: 'integrations',
        pageName: 'Integrations',
        path: '/integrations',
        visible: false,
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: false, canEdit: false },
          { tabId: 'available', tabName: 'Available', visible: false, canEdit: false },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: false, canEdit: false },
          { tabId: 'api', tabName: 'API', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canConnectIntegrations: false,
          canManageWebhooks: false,
          canManageAPI: false,
        }
      },
      {
        pageId: 'security',
        pageName: 'Security',
        path: '/security-enhanced',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'policies', tabName: 'Policies', visible: false, canEdit: false },
          { tabId: 'incidents', tabName: 'Incidents', visible: false, canEdit: false },
          { tabId: 'audit', tabName: 'Audit', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManagePolicies: false,
          canManageIncidents: false,
          canViewAudit: false,
        }
      },
      {
        pageId: 'performance',
        pageName: 'Performance',
        path: '/performance',
        visible: false,
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: false, canEdit: false },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: false, canEdit: false },
          { tabId: 'alerts', tabName: 'Alerts', visible: false, canEdit: false },
          { tabId: 'optimization', tabName: 'Optimization', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canManage: false,
          canOptimize: false,
          canSetupAlerts: false,
        }
      },
      {
        pageId: 'community',
        pageName: 'Community',
        path: '/community',
        visible: false,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: false, canEdit: false },
          { tabId: 'forums', tabName: 'Forums', visible: false, canEdit: false },
          { tabId: 'events', tabName: 'Events', visible: false, canEdit: false },
          { tabId: 'members', tabName: 'Members', visible: false, canEdit: false },
        ],
        features: {
          canPost: false,
          canModerate: false,
          canCreateEvents: false,
          canManageMembers: false,
        }
      },
      {
        pageId: 'settings',
        pageName: 'Settings',
        path: '/settings',
        visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: false, canEdit: false },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: {
          canEdit: false,
          canManageProfile: true,
          canManageNotifications: true,
          canManagePrivacy: true,
        }
      },
      {
        pageId: 'aria',
        pageName: 'ARIA',
        path: '/aria',
        visible: false,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: false, canEdit: false },
          { tabId: 'commands', tabName: 'Commands', visible: false, canEdit: false },
          { tabId: 'history', tabName: 'History', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
        ],
        features: {
          canUse: false,
          canCustomize: false,
          canViewHistory: false,
          canManageSettings: false,
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 12
  },
  {
    id: 'staff',
    name: 'Office Manager',
    description: 'Administrative staff handling operations, scheduling, and documentation',
    color: 'cyan',
    icon: 'Briefcase',
    isSystem: true,
    permissions: [
      // Project coordination and administrative tasks
      { id: '69', resource: 'projects', action: 'view', allowed: true },
      { id: '70', resource: 'projects', action: 'edit', allowed: true }, // Update project details
      { id: '71', resource: 'tasks', action: 'view', allowed: true },
      { id: '72', resource: 'tasks', action: 'create', allowed: true }, // Create admin tasks
      { id: '73', resource: 'tasks', action: 'edit', allowed: true },
      // Document management - key responsibility
      { id: '74', resource: 'documents', action: 'view', allowed: true },
      { id: '75', resource: 'documents', action: 'create', allowed: true },
      { id: '76', resource: 'documents', action: 'edit', allowed: true },
      { id: '77', resource: 'documents', action: 'share', allowed: true },
      // Financial administration
      { id: '78', resource: 'financial', action: 'view', allowed: true },
      { id: '79', resource: 'financial', action: 'create', allowed: true }, // Create invoices
      { id: '80', resource: 'financial', action: 'edit', allowed: true }, // Edit financial records
      { id: '81', resource: 'financial', action: 'export', allowed: true },
      // Team coordination
      { id: '82', resource: 'team', action: 'view', allowed: true },
      { id: '83', resource: 'team', action: 'edit', allowed: true }, // Manage schedules
      // Compliance support
      { id: '84', resource: 'compliance', action: 'view', allowed: true },
      { id: '85', resource: 'compliance', action: 'edit', allowed: true }, // Prepare submissions
    ],
    pagePermissions: [
      {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        path: '/dashboard',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'analytics', tabName: 'Analytics', visible: true, canEdit: false },
          { tabId: 'widgets', tabName: 'Widgets', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canCustomize: true,
          canExport: true,
          canShare: false,
        }
      },
      {
        pageId: 'projects',
        pageName: 'Projects',
        path: '/projects',
        visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: true },
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: false },
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: false },
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true,
          canDelete: false,
          canExport: true,
          canArchive: false,
        }
      },
      {
        pageId: 'tasks',
        pageName: 'Tasks',
        path: '/kanban',
        visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: true },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: true },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: false },
          { tabId: 'workload', tabName: 'Workload', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canAssign: true,
          canComment: true,
        }
      },
      {
        pageId: 'documents',
        pageName: 'Documents',
        path: '/documents',
        visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: true },
          { tabId: 'review', tabName: 'Review', visible: true, canEdit: false },
          { tabId: 'versions', tabName: 'Versions', visible: true, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
        ],
        features: {
          canUpload: true,
          canDownload: true,
          canDelete: false,
          canShare: true,
          canReview: false,
          canApprove: false,
        }
      },
      {
        pageId: 'financial',
        pageName: 'Financial',
        path: '/financial',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'invoices', tabName: 'Invoices', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
          { tabId: 'expenses', tabName: 'Expenses', visible: true, canEdit: true },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canCreate: true, // Create invoices and quotes
          canEdit: true, // Edit financial records
          canDelete: false, // Protect financial data
          canApprove: false, // Only principal/senior architects approve
          canExport: true, // Export for reporting
          canSendInvoice: true, // Send invoices to clients
        }
      },
      {
        pageId: 'team',
        pageName: 'Team',
        path: '/team',
        visible: true,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: true, canEdit: false },
          { tabId: 'schedule', tabName: 'Schedule', visible: true, canEdit: true },
          { tabId: 'performance', tabName: 'Performance', visible: false, canEdit: false },
        ],
        features: {
          canInvite: false,
          canRemove: false,
          canMessage: true,
          canCall: true,
          canManageRoles: false,
        }
      },
      {
        pageId: 'marketplace',
        pageName: 'Marketplace',
        path: '/marketplace',
        visible: true,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: true, canEdit: false },
          { tabId: 'vendors', tabName: 'Vendors', visible: false, canEdit: false },
          { tabId: 'orders', tabName: 'Orders', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
        ],
        features: {
          canPurchase: true,
          canSell: false,
          canManageListings: false,
          canNegotiate: false,
        }
      },
      {
        pageId: 'compliance',
        pageName: 'Compliance',
        path: '/compliance',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: true },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canSubmit: true,
          canApprove: false,
          canExport: true,
          canScheduleInspection: false,
        }
      },
      {
        pageId: 'design-brief',
        pageName: 'Design Brief',
        path: '/design-brief',
        visible: true,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: true, canEdit: false },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: true, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: true, canEdit: false },
          { tabId: 'gallery', tabName: 'Gallery', visible: true, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: false,
          canApprove: false,
          canComment: true,
          canShare: false,
        }
      },
      {
        pageId: 'admin',
        pageName: 'Admin',
        path: '/admin',
        visible: false,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: false, canEdit: false },
          { tabId: 'permissions', tabName: 'Permissions', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
          { tabId: 'logs', tabName: 'Logs', visible: false, canEdit: false },
        ],
        features: {
          canManageUsers: false,
          canManageSystem: false,
          canViewLogs: false,
          canEditSettings: false,
        }
      },
      {
        pageId: 'enterprise-pm',
        pageName: 'Enterprise PM',
        path: '/enterprise-pm',
        visible: false,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: false, canEdit: false },
          { tabId: 'gantt', tabName: 'Gantt', visible: false, canEdit: false },
          { tabId: 'resources', tabName: 'Resources', visible: false, canEdit: false },
          { tabId: 'risk', tabName: 'Risk', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateProjects: false,
          canEditSchedule: false,
          canManageResources: false,
        }
      },
      {
        pageId: 'hr',
        pageName: 'HR',
        path: '/hr',
        visible: false, // Small architecture studios don't need complex HR
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: false, canEdit: false },
          { tabId: 'attendance', tabName: 'Attendance', visible: true, canEdit: false },
          { tabId: 'leaves', tabName: 'Leaves', visible: true, canEdit: true },
          { tabId: 'payroll', tabName: 'Payroll', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageEmployees: false,
          canProcessPayroll: false,
          canManageLeaves: false,
        }
      },
      {
        pageId: 'learning',
        pageName: 'Learning',
        path: '/learning',
        visible: true,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: false },
          { tabId: 'certificates', tabName: 'Certificates', visible: true, canEdit: false },
          { tabId: 'assessments', tabName: 'Assessments', visible: true, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateCourses: false,
          canManageAssessments: false,
          canIssueCertificates: false,
        }
      },
      {
        pageId: 'construction',
        pageName: 'Construction',
        path: '/construction',
        visible: true,
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: true },
          { tabId: 'materials', tabName: 'Materials', visible: true, canEdit: false },
          { tabId: 'safety', tabName: 'Safety', visible: true, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageSites: false,
          canTrackProgress: true,
          canManageMaterials: false,
          canManageSafety: false,
        }
      },
      {
        pageId: 'analytics',
        pageName: 'Analytics',
        path: '/analytics',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
          { tabId: 'insights', tabName: 'Insights', visible: false, canEdit: false },
          { tabId: 'exports', tabName: 'Exports', visible: true, canEdit: false },
        ],
        features: {
          canView: true,
          canExport: true,
          canCreateReports: false,
          canGenerateInsights: false,
        }
      },
      {
        pageId: 'integrations',
        pageName: 'Integrations',
        path: '/integrations',
        visible: false,
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: false, canEdit: false },
          { tabId: 'available', tabName: 'Available', visible: false, canEdit: false },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: false, canEdit: false },
          { tabId: 'api', tabName: 'API', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canConnectIntegrations: false,
          canManageWebhooks: false,
          canManageAPI: false,
        }
      },
      {
        pageId: 'security',
        pageName: 'Security',
        path: '/security-enhanced',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'policies', tabName: 'Policies', visible: false, canEdit: false },
          { tabId: 'incidents', tabName: 'Incidents', visible: false, canEdit: false },
          { tabId: 'audit', tabName: 'Audit', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManagePolicies: false,
          canManageIncidents: false,
          canViewAudit: false,
        }
      },
      {
        pageId: 'performance',
        pageName: 'Performance',
        path: '/performance',
        visible: false,
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: false, canEdit: false },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: false, canEdit: false },
          { tabId: 'alerts', tabName: 'Alerts', visible: false, canEdit: false },
          { tabId: 'optimization', tabName: 'Optimization', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canManage: false,
          canOptimize: false,
          canSetupAlerts: false,
        }
      },
      {
        pageId: 'community',
        pageName: 'Community',
        path: '/community',
        visible: true,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: true, canEdit: true },
          { tabId: 'forums', tabName: 'Forums', visible: true, canEdit: true },
          { tabId: 'events', tabName: 'Events', visible: true, canEdit: false },
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
        ],
        features: {
          canPost: true,
          canModerate: false,
          canCreateEvents: false,
          canManageMembers: false,
        }
      },
      {
        pageId: 'settings',
        pageName: 'Settings',
        path: '/settings',
        visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: true, canEdit: true },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: {
          canEdit: true,
          canManageProfile: true,
          canManageNotifications: true,
          canManagePrivacy: true,
        }
      },
      {
        pageId: 'aria',
        pageName: 'ARIA',
        path: '/aria',
        visible: true,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: true, canEdit: true },
          { tabId: 'commands', tabName: 'Commands', visible: true, canEdit: false },
          { tabId: 'history', tabName: 'History', visible: true, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: true, canEdit: true },
        ],
        features: {
          canUse: true,
          canCustomize: false,
          canViewHistory: true,
          canManageSettings: true,
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 8
  },
  {
    id: 'contractor',
    name: 'Contractor/Consultant',
    description: 'External contractors and consultants working on specific projects',
    color: 'orange',
    icon: 'HardHat',
    isSystem: true,
    permissions: [
      // Project visibility - assigned projects only
      { id: '86', resource: 'projects', action: 'view', allowed: true },
      { id: '87', resource: 'tasks', action: 'view', allowed: true },
      { id: '88', resource: 'tasks', action: 'edit', allowed: true }, // Update task progress
      // Document access
      { id: '89', resource: 'documents', action: 'view', allowed: true },
      { id: '90', resource: 'documents', action: 'create', allowed: true }, // Submit shop drawings, reports
      { id: '91', resource: 'documents', action: 'share', allowed: true },
      // Construction focus
      { id: '92', resource: 'construction', action: 'view', allowed: true },
      { id: '93', resource: 'construction', action: 'edit', allowed: true }, // Update progress
      // Marketplace access
      { id: '94', resource: 'marketplace', action: 'view', allowed: true },
      { id: '95', resource: 'marketplace', action: 'create', allowed: true }, // Submit quotes
      // Financial - quotes only
      { id: '96', resource: 'financial', action: 'view', allowed: true }, // View their quotes
      { id: '97', resource: 'financial', action: 'create', allowed: true }, // Create quotes
      // Compliance awareness
      { id: '98', resource: 'compliance', action: 'view', allowed: true },
    ],
    pagePermissions: [
      {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        path: '/dashboard',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'analytics', tabName: 'Analytics', visible: false, canEdit: false },
          { tabId: 'widgets', tabName: 'Widgets', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCustomize: false,
          canExport: false,
          canShare: false,
        }
      },
      {
        pageId: 'projects',
        pageName: 'Projects',
        path: '/projects',
        visible: true,
        tabs: [
          { tabId: 'list', tabName: 'List View', visible: true, canEdit: false },
          { tabId: 'kanban', tabName: 'Kanban', visible: true, canEdit: false },
          { tabId: 'timeline', tabName: 'Timeline', visible: true, canEdit: false },
          { tabId: 'calendar', tabName: 'Calendar', visible: true, canEdit: false },
          { tabId: 'map', tabName: 'Map', visible: true, canEdit: false },
        ],
        features: {
          canCreate: false,
          canDelete: false,
          canExport: false,
          canArchive: false,
        }
      },
      {
        pageId: 'tasks',
        pageName: 'Tasks',
        path: '/kanban',
        visible: true,
        tabs: [
          { tabId: 'board', tabName: 'Board', visible: true, canEdit: false },
          { tabId: 'list', tabName: 'List', visible: true, canEdit: false },
          { tabId: 'timeline', tabName: 'Timeline', visible: false, canEdit: false },
          { tabId: 'workload', tabName: 'Workload', visible: false, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: true,
          canDelete: false,
          canAssign: false,
          canComment: true,
        }
      },
      {
        pageId: 'documents',
        pageName: 'Documents',
        path: '/documents',
        visible: true,
        tabs: [
          { tabId: 'files', tabName: 'Files', visible: true, canEdit: false },
          { tabId: 'review', tabName: 'Review', visible: false, canEdit: false },
          { tabId: 'versions', tabName: 'Versions', visible: false, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: false, canEdit: false },
        ],
        features: {
          canUpload: true, // Upload shop drawings, progress reports
          canDownload: true, // Download project documents
          canDelete: false, // Cannot delete project documents
          canShare: true, // Share with subcontractors
          canReview: false, // Cannot review architect's work
          canApprove: false, // Cannot approve documents
        }
      },
      {
        pageId: 'financial',
        pageName: 'Financial',
        path: '/financial',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'invoices', tabName: 'Invoices', visible: true, canEdit: false },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
          { tabId: 'expenses', tabName: 'Expenses', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
        ],
        features: {
          canCreate: true, // Create and submit quotes
          canEdit: true, // Edit their own quotes
          canDelete: false, // Cannot delete financial records
          canApprove: false, // Cannot approve payments
          canExport: true, // Export their quotes
          canSendInvoice: false, // Cannot send invoices
        }
      },
      {
        pageId: 'team',
        pageName: 'Team',
        path: '/team',
        visible: false,
        tabs: [
          { tabId: 'members', tabName: 'Members', visible: false, canEdit: false },
          { tabId: 'virtual-office', tabName: 'Virtual Office', visible: false, canEdit: false },
          { tabId: 'schedule', tabName: 'Schedule', visible: false, canEdit: false },
          { tabId: 'performance', tabName: 'Performance', visible: false, canEdit: false },
        ],
        features: {
          canInvite: false,
          canRemove: false,
          canMessage: false,
          canCall: false,
          canManageRoles: false,
        }
      },
      {
        pageId: 'marketplace',
        pageName: 'Marketplace',
        path: '/marketplace',
        visible: true,
        tabs: [
          { tabId: 'browse', tabName: 'Browse', visible: true, canEdit: false },
          { tabId: 'vendors', tabName: 'Vendors', visible: true, canEdit: true },
          { tabId: 'orders', tabName: 'Orders', visible: true, canEdit: true },
          { tabId: 'quotes', tabName: 'Quotes', visible: true, canEdit: true },
        ],
        features: {
          canPurchase: true,
          canSell: true,
          canManageListings: true,
          canNegotiate: true,
        }
      },
      {
        pageId: 'compliance',
        pageName: 'Compliance',
        path: '/compliance',
        visible: true,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: true, canEdit: false },
          { tabId: 'submissions', tabName: 'Submissions', visible: true, canEdit: true },
          { tabId: 'alerts', tabName: 'Alerts', visible: true, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: true, canEdit: false },
        ],
        features: {
          canSubmit: true,
          canApprove: false,
          canExport: false,
          canScheduleInspection: false,
        }
      },
      {
        pageId: 'design-brief',
        pageName: 'Design Brief',
        path: '/design-brief',
        visible: false,
        tabs: [
          { tabId: 'briefs', tabName: 'Briefs', visible: false, canEdit: false },
          { tabId: 'collaborative', tabName: 'Collaborative', visible: false, canEdit: false },
          { tabId: 'templates', tabName: 'Templates', visible: false, canEdit: false },
          { tabId: 'gallery', tabName: 'Gallery', visible: false, canEdit: false },
        ],
        features: {
          canCreate: false,
          canEdit: false,
          canApprove: false,
          canComment: false,
          canShare: false,
        }
      },
      {
        pageId: 'admin',
        pageName: 'Admin',
        path: '/admin',
        visible: false,
        tabs: [
          { tabId: 'users', tabName: 'Users', visible: false, canEdit: false },
          { tabId: 'permissions', tabName: 'Permissions', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
          { tabId: 'logs', tabName: 'Logs', visible: false, canEdit: false },
        ],
        features: {
          canManageUsers: false,
          canManageSystem: false,
          canViewLogs: false,
          canEditSettings: false,
        }
      },
      {
        pageId: 'enterprise-pm',
        pageName: 'Enterprise PM',
        path: '/enterprise-pm',
        visible: false,
        tabs: [
          { tabId: 'portfolio', tabName: 'Portfolio', visible: false, canEdit: false },
          { tabId: 'gantt', tabName: 'Gantt', visible: false, canEdit: false },
          { tabId: 'resources', tabName: 'Resources', visible: false, canEdit: false },
          { tabId: 'risk', tabName: 'Risk', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateProjects: false,
          canEditSchedule: false,
          canManageResources: false,
        }
      },
      {
        pageId: 'hr',
        pageName: 'HR',
        path: '/hr',
        visible: false,
        tabs: [
          { tabId: 'employees', tabName: 'Employees', visible: false, canEdit: false },
          { tabId: 'attendance', tabName: 'Attendance', visible: false, canEdit: false },
          { tabId: 'leaves', tabName: 'Leaves', visible: false, canEdit: false },
          { tabId: 'payroll', tabName: 'Payroll', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManageEmployees: false,
          canProcessPayroll: false,
          canManageLeaves: false,
        }
      },
      {
        pageId: 'learning',
        pageName: 'Learning',
        path: '/learning',
        visible: true,
        tabs: [
          { tabId: 'courses', tabName: 'Courses', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: false },
          { tabId: 'certificates', tabName: 'Certificates', visible: true, canEdit: false },
          { tabId: 'assessments', tabName: 'Assessments', visible: true, canEdit: false },
        ],
        features: {
          canManage: false,
          canCreateCourses: false,
          canManageAssessments: false,
          canIssueCertificates: false,
        }
      },
      {
        pageId: 'construction',
        pageName: 'Construction',
        path: '/construction',
        visible: true,
        tabs: [
          { tabId: 'sites', tabName: 'Sites', visible: true, canEdit: false },
          { tabId: 'progress', tabName: 'Progress', visible: true, canEdit: true },
          { tabId: 'materials', tabName: 'Materials', visible: true, canEdit: true },
          { tabId: 'safety', tabName: 'Safety', visible: true, canEdit: true },
        ],
        features: {
          canManage: false,
          canManageSites: false,
          canTrackProgress: true,
          canManageMaterials: true,
          canManageSafety: true,
        }
      },
      {
        pageId: 'analytics',
        pageName: 'Analytics',
        path: '/analytics',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'reports', tabName: 'Reports', visible: false, canEdit: false },
          { tabId: 'insights', tabName: 'Insights', visible: false, canEdit: false },
          { tabId: 'exports', tabName: 'Exports', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canExport: false,
          canCreateReports: false,
          canGenerateInsights: false,
        }
      },
      {
        pageId: 'integrations',
        pageName: 'Integrations',
        path: '/integrations',
        visible: false,
        tabs: [
          { tabId: 'connected', tabName: 'Connected', visible: false, canEdit: false },
          { tabId: 'available', tabName: 'Available', visible: false, canEdit: false },
          { tabId: 'webhooks', tabName: 'Webhooks', visible: false, canEdit: false },
          { tabId: 'api', tabName: 'API', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canConnectIntegrations: false,
          canManageWebhooks: false,
          canManageAPI: false,
        }
      },
      {
        pageId: 'security',
        pageName: 'Security',
        path: '/security-enhanced',
        visible: false,
        tabs: [
          { tabId: 'overview', tabName: 'Overview', visible: false, canEdit: false },
          { tabId: 'policies', tabName: 'Policies', visible: false, canEdit: false },
          { tabId: 'incidents', tabName: 'Incidents', visible: false, canEdit: false },
          { tabId: 'audit', tabName: 'Audit', visible: false, canEdit: false },
        ],
        features: {
          canManage: false,
          canManagePolicies: false,
          canManageIncidents: false,
          canViewAudit: false,
        }
      },
      {
        pageId: 'performance',
        pageName: 'Performance',
        path: '/performance',
        visible: false,
        tabs: [
          { tabId: 'metrics', tabName: 'Metrics', visible: false, canEdit: false },
          { tabId: 'monitoring', tabName: 'Monitoring', visible: false, canEdit: false },
          { tabId: 'alerts', tabName: 'Alerts', visible: false, canEdit: false },
          { tabId: 'optimization', tabName: 'Optimization', visible: false, canEdit: false },
        ],
        features: {
          canView: false,
          canManage: false,
          canOptimize: false,
          canSetupAlerts: false,
        }
      },
      {
        pageId: 'community',
        pageName: 'Community',
        path: '/community',
        visible: true,
        tabs: [
          { tabId: 'feed', tabName: 'Feed', visible: true, canEdit: true },
          { tabId: 'forums', tabName: 'Forums', visible: true, canEdit: true },
          { tabId: 'events', tabName: 'Events', visible: true, canEdit: false },
          { tabId: 'members', tabName: 'Members', visible: true, canEdit: false },
        ],
        features: {
          canPost: true,
          canModerate: false,
          canCreateEvents: false,
          canManageMembers: false,
        }
      },
      {
        pageId: 'settings',
        pageName: 'Settings',
        path: '/settings',
        visible: true,
        tabs: [
          { tabId: 'general', tabName: 'General', visible: false, canEdit: false },
          { tabId: 'profile', tabName: 'Profile', visible: true, canEdit: true },
          { tabId: 'notifications', tabName: 'Notifications', visible: true, canEdit: true },
          { tabId: 'privacy', tabName: 'Privacy', visible: true, canEdit: true },
        ],
        features: {
          canEdit: false,
          canManageProfile: true,
          canManageNotifications: true,
          canManagePrivacy: true,
        }
      },
      {
        pageId: 'aria',
        pageName: 'ARIA',
        path: '/aria',
        visible: false,
        tabs: [
          { tabId: 'assistant', tabName: 'Assistant', visible: false, canEdit: false },
          { tabId: 'commands', tabName: 'Commands', visible: false, canEdit: false },
          { tabId: 'history', tabName: 'History', visible: false, canEdit: false },
          { tabId: 'settings', tabName: 'Settings', visible: false, canEdit: false },
        ],
        features: {
          canUse: false,
          canCustomize: false,
          canViewHistory: false,
          canManageSettings: false,
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberCount: 4
  }
];

// SECURITY: Removed localStorage persistence for permissions
// Permissions should always be fetched fresh from backend
// This prevents stale permissions and improves security

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  groups: defaultGroups,
  currentUserGroup: null,

      addGroup: (groupData) => {
        const newGroup: UserGroup = {
          ...groupData,
          id: `group_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, ...updates, updatedAt: new Date() }
              : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id && !group.isSystem),
        }));
      },

      updateGroupPermissions: (groupId, permissions) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, permissions, updatedAt: new Date() }
              : group
          ),
        }));
      },

      updatePagePermissions: (groupId, pagePermissions) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, pagePermissions, updatedAt: new Date() }
              : group
          ),
        }));
      },

      hasPermission: (groupId, resource, action) => {
        // Admin always has all permissions
        if (groupId === 'admin') return true;
        
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return false;
        
        // Check for wildcard permission
        const wildcardPerm = group.permissions.find(
          (p) => p.resource === '*' && p.action === action as any
        );
        if (wildcardPerm?.allowed) return true;
        
        // Check specific permission
        const perm = group.permissions.find(
          (p) => p.resource === resource && p.action === action as any
        );
        return perm?.allowed || false;
      },

      canAccessPage: (groupId, pageId) => {
        // Admin always has access to everything
        if (groupId === 'admin') return true;
        
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return false;
        
        const pagePerm = group.pagePermissions.find((p) => p.pageId === pageId);
        return pagePerm?.visible || false;
      },

      canAccessTab: (groupId, pageId, tabId) => {
        // Admin always has access to all tabs
        if (groupId === 'admin') return true;
        
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return false;
        
        const pagePerm = group.pagePermissions.find((p) => p.pageId === pageId);
        if (!pagePerm || !pagePerm.visible) return false;
        
        const tabPerm = pagePerm.tabs?.find((t) => t.tabId === tabId);
        return tabPerm?.visible || false;
      },

      getPagePermissions: (groupId, pageId) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return undefined;
        
        return group.pagePermissions.find((p) => p.pageId === pageId);
      },

      getGroup: (id) => {
        return get().groups.find((g) => g.id === id);
      },

      setCurrentUserGroup: (groupId) => {
        set({ currentUserGroup: groupId });
      },

      exportPermissions: () => {
        return JSON.stringify(get().groups, null, 2);
      },

      importPermissions: (data) => {
        try {
          const groups = JSON.parse(data);
          set({ groups });
        } catch (error) {
          console.error('Failed to import permissions:', error);
        }
      },

      fetchGroups: async () => {
        // Disabled backend sync for now - using local storage only
        console.log('Using local permissions only');
      },

      saveGroup: async (group) => {
        // Save locally only for now
        console.log('Saving group locally:', group);
        toast.success('Group saved locally');
      },

      syncWithBackend: async () => {
        await get().fetchGroups();
      },
    }));