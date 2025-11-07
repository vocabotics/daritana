import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { usePermissionsStore, UserGroup, PagePermission, TabPermission } from '@/store/permissionsStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  Shield,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Palette,
  User,
  UserPlus,
  FileText,
  Layout as LayoutIcon,
  Grid,
  List,
  Calendar,
  Clock,
  DollarSign,
  Building,
  ShoppingCart,
  AlertCircle,
  Info,
  Search,
  Filter,
  RefreshCw,
  Database,
  Key,
  Globe,
  Folder,
  File,
  Star,
  Award,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  Layers,
  Command,
  Terminal,
  Code,
  Cpu,
  HardDrive,
  Wifi,
  Cloud,
  Server,
  GitBranch,
  GitCommit,
  GitMerge,
  Hash,
  Tag,
  Bookmark,
  CheckSquare,
  GraduationCap,
  Plug,
  Brain
} from 'lucide-react';

// Icon mapping for groups
const iconMap: Record<string, any> = {
  Shield, Users, Briefcase, Palette, User, UserPlus,
  FileText, Layout: LayoutIcon, Grid, List, Calendar,
  Clock, DollarSign, Building, ShoppingCart, AlertCircle,
  Star, Award, Zap, Activity, Package, Layers
};

// Available pages and their tabs
const availablePages = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutIcon,
    path: '/dashboard',
    tabs: [
      { id: 'overview', name: 'Overview', description: 'Main dashboard view' },
      { id: 'analytics', name: 'Analytics', description: 'Performance metrics' },
      { id: 'widgets', name: 'Widgets', description: 'Customizable widgets' },
      { id: 'reports', name: 'Reports', description: 'Generated reports' }
    ],
    features: ['canCustomize', 'canExport', 'canShare', 'canPrint']
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: Briefcase,
    path: '/projects',
    tabs: [
      { id: 'list', name: 'List View', description: 'Table view of projects' },
      { id: 'kanban', name: 'Kanban', description: 'Board view' },
      { id: 'timeline', name: 'Timeline', description: 'Gantt chart view' },
      { id: 'calendar', name: 'Calendar', description: 'Calendar view' },
      { id: 'map', name: 'Map', description: 'Geographic view' }
    ],
    features: ['canCreate', 'canEdit', 'canDelete', 'canArchive', 'canExport', 'canImport', 'canClone']
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    path: '/kanban',
    tabs: [
      { id: 'board', name: 'Board', description: 'Kanban board' },
      { id: 'list', name: 'List', description: 'Task list' },
      { id: 'timeline', name: 'Timeline', description: 'Task timeline' },
      { id: 'workload', name: 'Workload', description: 'Team workload' }
    ],
    features: ['canCreate', 'canEdit', 'canDelete', 'canAssign', 'canComment']
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    path: '/documents',
    tabs: [
      { id: 'files', name: 'Files', description: 'Document library' },
      { id: 'review', name: 'Review', description: 'Review hub' },
      { id: 'versions', name: 'Versions', description: 'Version control' },
      { id: 'templates', name: 'Templates', description: 'Document templates' }
    ],
    features: ['canUpload', 'canDownload', 'canDelete', 'canShare', 'canReview', 'canApprove']
  },
  {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    path: '/financial',
    tabs: [
      { id: 'overview', name: 'Overview', description: 'Financial summary' },
      { id: 'invoices', name: 'Invoices', description: 'Invoice management' },
      { id: 'quotes', name: 'Quotes', description: 'Quotations' },
      { id: 'expenses', name: 'Expenses', description: 'Expense tracking' },
      { id: 'reports', name: 'Reports', description: 'Financial reports' }
    ],
    features: ['canCreate', 'canEdit', 'canDelete', 'canApprove', 'canExport', 'canSendInvoice']
  },
  {
    id: 'team',
    name: 'Team',
    icon: Users,
    path: '/team',
    tabs: [
      { id: 'members', name: 'Members', description: 'Team members' },
      { id: 'virtual-office', name: 'Virtual Office', description: 'Collaboration space' },
      { id: 'schedule', name: 'Schedule', description: 'Team schedule' },
      { id: 'performance', name: 'Performance', description: 'Performance metrics' }
    ],
    features: ['canInvite', 'canRemove', 'canMessage', 'canCall', 'canManageRoles']
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: ShoppingCart,
    path: '/marketplace',
    tabs: [
      { id: 'browse', name: 'Browse', description: 'Product catalog' },
      { id: 'vendors', name: 'Vendors', description: 'Vendor portal' },
      { id: 'orders', name: 'Orders', description: 'Order management' },
      { id: 'quotes', name: 'Quotes', description: 'Quote requests' }
    ],
    features: ['canPurchase', 'canSell', 'canManageListings', 'canNegotiate']
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: Shield,
    path: '/compliance',
    tabs: [
      { id: 'overview', name: 'Overview', description: 'Compliance status' },
      { id: 'submissions', name: 'Submissions', description: 'Authority submissions' },
      { id: 'alerts', name: 'Alerts', description: 'Compliance alerts' },
      { id: 'reports', name: 'Reports', description: 'Compliance reports' }
    ],
    features: ['canSubmit', 'canApprove', 'canExport', 'canScheduleInspection']
  },
  {
    id: 'design-brief',
    name: 'Design Brief',
    icon: Palette,
    path: '/design-brief',
    tabs: [
      { id: 'briefs', name: 'Briefs', description: 'Design briefs' },
      { id: 'collaborative', name: 'Collaborative', description: 'Real-time editing' },
      { id: 'templates', name: 'Templates', description: 'Brief templates' },
      { id: 'gallery', name: 'Gallery', description: 'Design gallery' }
    ],
    features: ['canCreate', 'canEdit', 'canApprove', 'canComment', 'canShare']
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: Shield,
    path: '/admin',
    tabs: [
      { id: 'users', name: 'Users', description: 'User management' },
      { id: 'permissions', name: 'Permissions', description: 'Role permissions' },
      { id: 'settings', name: 'Settings', description: 'System settings' },
      { id: 'logs', name: 'Audit Logs', description: 'System audit logs' }
    ],
    features: ['canManageUsers', 'canManageSystem', 'canViewLogs', 'canBackup']
  },
  {
    id: 'enterprise-pm',
    name: 'Enterprise PM',
    icon: Briefcase,
    path: '/enterprise-pm',
    tabs: [
      { id: 'portfolio', name: 'Portfolio', description: 'Portfolio dashboard' },
      { id: 'gantt', name: 'Gantt Chart', description: 'Project timelines' },
      { id: 'resources', name: 'Resources', description: 'Resource management' },
      { id: 'risk', name: 'Risk Analysis', description: 'Risk assessment' }
    ],
    features: ['canManagePortfolio', 'canEditGantt', 'canManageResources', 'canAnalyzeRisk']
  },
  {
    id: 'hr',
    name: 'HR',
    icon: Users,
    path: '/hr',
    tabs: [
      { id: 'employees', name: 'Employees', description: 'Employee directory' },
      { id: 'attendance', name: 'Attendance', description: 'Attendance tracking' },
      { id: 'leaves', name: 'Leaves', description: 'Leave management' },
      { id: 'payroll', name: 'Payroll', description: 'Payroll processing' }
    ],
    features: ['canManageEmployees', 'canApproveLeaves', 'canProcessPayroll', 'canViewReports']
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: GraduationCap,
    path: '/learning',
    tabs: [
      { id: 'courses', name: 'Courses', description: 'Course catalog' },
      { id: 'progress', name: 'Progress', description: 'Learning progress' },
      { id: 'certificates', name: 'Certificates', description: 'Certifications' },
      { id: 'assessments', name: 'Assessments', description: 'Tests and quizzes' }
    ],
    features: ['canCreateCourses', 'canEnroll', 'canGrade', 'canIssueCertificates']
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: HardDrive,
    path: '/construction',
    tabs: [
      { id: 'sites', name: 'Sites', description: 'Construction sites' },
      { id: 'progress', name: 'Progress', description: 'Site progress' },
      { id: 'materials', name: 'Materials', description: 'Material tracking' },
      { id: 'safety', name: 'Safety', description: 'Safety reports' }
    ],
    features: ['canManageSites', 'canUpdateProgress', 'canOrderMaterials', 'canFileReports']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    tabs: [
      { id: 'overview', name: 'Overview', description: 'Analytics dashboard' },
      { id: 'reports', name: 'Reports', description: 'Custom reports' },
      { id: 'insights', name: 'Insights', description: 'AI insights' },
      { id: 'exports', name: 'Exports', description: 'Data exports' }
    ],
    features: ['canViewAnalytics', 'canCreateReports', 'canExportData', 'canScheduleReports']
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Plug,
    path: '/integrations',
    tabs: [
      { id: 'connected', name: 'Connected', description: 'Active integrations' },
      { id: 'available', name: 'Available', description: 'Available apps' },
      { id: 'webhooks', name: 'Webhooks', description: 'Webhook config' },
      { id: 'api', name: 'API', description: 'API settings' }
    ],
    features: ['canConnect', 'canDisconnect', 'canConfigureWebhooks', 'canManageAPI']
  },
  {
    id: 'security',
    name: 'Security',
    icon: Lock,
    path: '/security-enhanced',
    tabs: [
      { id: 'overview', name: 'Overview', description: 'Security status' },
      { id: 'policies', name: 'Policies', description: 'Security policies' },
      { id: 'incidents', name: 'Incidents', description: 'Security incidents' },
      { id: 'audit', name: 'Audit', description: 'Security audit' }
    ],
    features: ['canManageSecurity', 'canViewIncidents', 'canRunAudit', 'canUpdatePolicies']
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Zap,
    path: '/performance',
    tabs: [
      { id: 'metrics', name: 'Metrics', description: 'Performance metrics' },
      { id: 'monitoring', name: 'Monitoring', description: 'Real-time monitoring' },
      { id: 'alerts', name: 'Alerts', description: 'Performance alerts' },
      { id: 'optimization', name: 'Optimization', description: 'Optimization tools' }
    ],
    features: ['canViewMetrics', 'canSetAlerts', 'canOptimize', 'canExportReports']
  },
  {
    id: 'community',
    name: 'Community',
    icon: Globe,
    path: '/community',
    tabs: [
      { id: 'feed', name: 'Feed', description: 'Community feed' },
      { id: 'forums', name: 'Forums', description: 'Discussion forums' },
      { id: 'events', name: 'Events', description: 'Community events' },
      { id: 'members', name: 'Members', description: 'Member directory' }
    ],
    features: ['canPost', 'canModerate', 'canCreateEvents', 'canManageMembers']
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    path: '/settings',
    tabs: [
      { id: 'general', name: 'General', description: 'General settings' },
      { id: 'profile', name: 'Profile', description: 'Profile settings' },
      { id: 'notifications', name: 'Notifications', description: 'Notification preferences' },
      { id: 'privacy', name: 'Privacy', description: 'Privacy settings' }
    ],
    features: ['canEditSettings', 'canManageNotifications', 'canExportData', 'canDeleteAccount']
  },
  {
    id: 'aria',
    name: 'ARIA',
    icon: Brain,
    path: '/aria',
    tabs: [
      { id: 'assistant', name: 'Assistant', description: 'AI assistant' },
      { id: 'commands', name: 'Commands', description: 'Command center' },
      { id: 'history', name: 'History', description: 'Chat history' },
      { id: 'settings', name: 'Settings', description: 'AI settings' }
    ],
    features: ['canUseAI', 'canTrainAI', 'canViewHistory', 'canConfigureAI']
  }
];

// Permission actions
const permissionActions = [
  { id: 'view', name: 'View', icon: Eye, color: 'blue' },
  { id: 'create', name: 'Create', icon: Plus, color: 'green' },
  { id: 'edit', name: 'Edit', icon: Edit, color: 'yellow' },
  { id: 'delete', name: 'Delete', icon: Trash2, color: 'red' },
  { id: 'approve', name: 'Approve', icon: Check, color: 'purple' },
  { id: 'export', name: 'Export', icon: Download, color: 'cyan' },
  { id: 'share', name: 'Share', icon: Users, color: 'indigo' }
];

export default function AdminPermissions() {
  const { user } = useAuthStore();
  const { 
    groups, 
    addGroup, 
    updateGroup, 
    deleteGroup,
    updateGroupPermissions,
    updatePagePermissions,
    exportPermissions,
    importPermissions,
    fetchGroups,
    saveGroup,
    syncWithBackend
  } = usePermissionsStore();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@daritana.com';

  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');

  // New group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [newGroupIcon, setNewGroupIcon] = useState('Users');

  useEffect(() => {
    // Sync with backend on component mount
    syncWithBackend();
  }, []);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups]);

  const handleCreateGroup = () => {
    if (!newGroupName) {
      toast.error('Please enter a group name');
      return;
    }

    const newGroup = {
      name: newGroupName,
      description: newGroupDescription,
      color: newGroupColor,
      icon: newGroupIcon,
      isSystem: false,
      permissions: [],
      pagePermissions: availablePages.map(page => ({
        pageId: page.id,
        pageName: page.name,
        path: page.path,
        visible: false,
        tabs: page.tabs.map(tab => ({
          tabId: tab.id,
          tabName: tab.name,
          visible: false,
          canEdit: false
        })),
        features: {}
      }))
    };

    addGroup(newGroup);
    toast.success(`Group "${newGroupName}" created successfully`);
    setShowCreateDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupColor('blue');
    setNewGroupIcon('Users');
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group?.isSystem) {
      toast.error('Cannot delete system groups');
      return;
    }
    
    deleteGroup(groupId);
    toast.success('Group deleted successfully');
    setSelectedGroup(groups[0] || null);
  };

  const handleDuplicateGroup = (group: UserGroup) => {
    const duplicatedGroup = {
      ...group,
      name: `${group.name} (Copy)`,
      isSystem: false
    };
    addGroup(duplicatedGroup);
    toast.success(`Group "${group.name}" duplicated successfully`);
  };

  const togglePageVisibility = (groupId: string, pageId: string) => {
    if (!selectedGroup) return;
    
    const updatedPermissions = selectedGroup.pagePermissions.map(p => {
      if (p.pageId === pageId) {
        return { ...p, visible: !p.visible };
      }
      return p;
    });
    
    updatePagePermissions(groupId, updatedPermissions);
    setSelectedGroup({
      ...selectedGroup,
      pagePermissions: updatedPermissions
    });
  };

  const toggleTabVisibility = (groupId: string, pageId: string, tabId: string) => {
    if (!selectedGroup) return;
    
    const updatedPermissions = selectedGroup.pagePermissions.map(p => {
      if (p.pageId === pageId) {
        return {
          ...p,
          tabs: p.tabs?.map(t => {
            if (t.tabId === tabId) {
              return { ...t, visible: !t.visible };
            }
            return t;
          })
        };
      }
      return p;
    });
    
    updatePagePermissions(groupId, updatedPermissions);
    setSelectedGroup({
      ...selectedGroup,
      pagePermissions: updatedPermissions
    });
  };

  const toggleTabEdit = (groupId: string, pageId: string, tabId: string) => {
    if (!selectedGroup) return;
    
    const updatedPermissions = selectedGroup.pagePermissions.map(p => {
      if (p.pageId === pageId) {
        return {
          ...p,
          tabs: p.tabs?.map(t => {
            if (t.tabId === tabId) {
              return { ...t, canEdit: !t.canEdit };
            }
            return t;
          })
        };
      }
      return p;
    });
    
    updatePagePermissions(groupId, updatedPermissions);
    setSelectedGroup({
      ...selectedGroup,
      pagePermissions: updatedPermissions
    });
  };

  const toggleFeature = (groupId: string, pageId: string, feature: string) => {
    if (!selectedGroup) return;
    
    const updatedPermissions = selectedGroup.pagePermissions.map(p => {
      if (p.pageId === pageId) {
        return {
          ...p,
          features: {
            ...p.features,
            [feature]: !p.features?.[feature]
          }
        };
      }
      return p;
    });
    
    updatePagePermissions(groupId, updatedPermissions);
    setSelectedGroup({
      ...selectedGroup,
      pagePermissions: updatedPermissions
    });
  };

  const togglePageExpanded = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const handleExport = () => {
    const data = exportPermissions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissions-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Permissions exported successfully');
  };

  const handleImport = () => {
    try {
      importPermissions(importData);
      toast.success('Permissions imported successfully');
      setShowImportDialog(false);
      setImportData('');
    } catch (error) {
      toast.error('Failed to import permissions');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toolbar = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>
    </div>
  );

  return (
    <Layout 
      title="Permissions Management" 
      description={isAdmin ? "Configure user groups and their access permissions" : "View user groups and their access permissions (Read-only)"}
      toolbar={toolbar}
    >
      {!isAdmin && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle>Read-Only Access</AlertTitle>
          <AlertDescription>
            You are viewing permissions in read-only mode. Only administrators can modify permission settings.
            You are currently logged in as <strong>{user?.email}</strong> with role <strong>{user?.role}</strong>.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-12 gap-6">
        {/* Groups List */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">User Groups</CardTitle>
              <CardDescription>
                {groups.length} groups configured
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 space-y-2">
                  {filteredGroups.map((group) => {
                    const Icon = iconMap[group.icon] || Users;
                    return (
                      <div
                        key={group.id}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors",
                          "hover:bg-accent",
                          selectedGroup?.id === group.id && "bg-accent"
                        )}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              `bg-${group.color}-100 text-${group.color}-600`
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{group.name}</p>
                                {group.isSystem && (
                                  <Badge variant="secondary" className="text-xs">
                                    System
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {group.description}
                              </p>
                              {group.memberCount !== undefined && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {group.memberCount} members
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Configuration */}
        <div className="col-span-9">
          {selectedGroup ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedGroup.name}</CardTitle>
                    <CardDescription>{selectedGroup.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedGroup.isSystem && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateGroup(selectedGroup)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(selectedGroup.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pages" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pages">Pages & Tabs</TabsTrigger>
                    <TabsTrigger value="actions">Actions & Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pages" className="mt-4">
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-4">
                        {availablePages.map((page) => {
                          const PageIcon = page.icon;
                          const pagePerm = selectedGroup.pagePermissions.find(
                            p => p.pageId === page.id
                          );
                          const isExpanded = expandedPages.has(page.id);
                          
                          return (
                            <div key={page.id} className="border rounded-lg">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => togglePageExpanded(page.id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <PageIcon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{page.name}</p>
                                      <p className="text-xs text-muted-foreground">{page.path}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`page-${page.id}`} className="text-sm">
                                        Visible
                                      </Label>
                                      <Switch
                                        id={`page-${page.id}`}
                                        checked={pagePerm?.visible || false}
                                        onCheckedChange={() => 
                                          togglePageVisibility(selectedGroup.id, page.id)
                                        }
                                        disabled={!isAdmin || selectedGroup.isSystem}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && pagePerm?.visible && (
                                  <div className="mt-4 space-y-4">
                                    {/* Tabs */}
                                    <div>
                                      <p className="text-sm font-medium mb-2">Tabs</p>
                                      <div className="space-y-2">
                                        {page.tabs.map((tab) => {
                                          const tabPerm = pagePerm.tabs?.find(
                                            t => t.tabId === tab.id
                                          );
                                          return (
                                            <div
                                              key={tab.id}
                                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                            >
                                              <div className="flex-1">
                                                <p className="text-sm font-medium">{tab.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {tab.description}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-xs">View</Label>
                                                  <Switch
                                                    checked={tabPerm?.visible || false}
                                                    onCheckedChange={() =>
                                                      toggleTabVisibility(
                                                        selectedGroup.id,
                                                        page.id,
                                                        tab.id
                                                      )
                                                    }
                                                    disabled={selectedGroup.isSystem}
                                                  />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-xs">Edit</Label>
                                                  <Switch
                                                    checked={tabPerm?.canEdit || false}
                                                    onCheckedChange={() =>
                                                      toggleTabEdit(
                                                        selectedGroup.id,
                                                        page.id,
                                                        tab.id
                                                      )
                                                    }
                                                    disabled={
                                                      selectedGroup.isSystem || 
                                                      !tabPerm?.visible
                                                    }
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Features */}
                                    <div>
                                      <p className="text-sm font-medium mb-2">Features</p>
                                      <div className="flex flex-wrap gap-2">
                                        {page.features.map((feature) => {
                                          const isEnabled = pagePerm?.features?.[feature] || false;
                                          return (
                                            <Badge
                                              key={feature}
                                              variant={isEnabled ? "default" : "outline"}
                                              className="cursor-pointer"
                                              onClick={() => {
                                                if (!selectedGroup.isSystem) {
                                                  toggleFeature(
                                                    selectedGroup.id,
                                                    page.id,
                                                    feature
                                                  );
                                                }
                                              }}
                                            >
                                              {isEnabled ? (
                                                <Check className="h-3 w-3 mr-1" />
                                              ) : (
                                                <X className="h-3 w-3 mr-1" />
                                              )}
                                              {feature}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="actions" className="mt-4">
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Resource Permissions</AlertTitle>
                          <AlertDescription>
                            Configure what actions this group can perform on different resources
                          </AlertDescription>
                        </Alert>

                        {['projects', 'tasks', 'documents', 'financial', 'team', 'designs'].map(
                          (resource) => (
                            <div key={resource} className="border rounded-lg p-4">
                              <p className="font-medium capitalize mb-3">{resource}</p>
                              <div className="flex gap-2">
                                {permissionActions.map((action) => {
                                  const ActionIcon = action.icon;
                                  const hasPermission = selectedGroup.permissions.some(
                                    p => p.resource === resource && 
                                        p.action === action.id && 
                                        p.allowed
                                  );
                                  
                                  return (
                                    <Button
                                      key={action.id}
                                      variant={hasPermission ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        if (!selectedGroup.isSystem) {
                                          const updatedPerms = [...selectedGroup.permissions];
                                          const existingIndex = updatedPerms.findIndex(
                                            p => p.resource === resource && p.action === action.id as any
                                          );
                                          
                                          if (existingIndex >= 0) {
                                            updatedPerms[existingIndex].allowed = !hasPermission;
                                          } else {
                                            updatedPerms.push({
                                              id: `${resource}-${action.id}`,
                                              resource,
                                              action: action.id as any,
                                              allowed: true
                                            });
                                          }
                                          
                                          updateGroupPermissions(selectedGroup.id, updatedPerms);
                                          setSelectedGroup({
                                            ...selectedGroup,
                                            permissions: updatedPerms
                                          });
                                        }
                                      }}
                                      disabled={selectedGroup.isSystem}
                                    >
                                      <ActionIcon className="h-3 w-3 mr-1" />
                                      {action.name}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <p className="text-muted-foreground">Select a group to configure permissions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Define a new user group with custom permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., External Consultants"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this group"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={newGroupColor} onValueChange={setNewGroupColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo'].map(
                      (color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-3 w-3 rounded-full",
                              `bg-${color}-500`
                            )} />
                            <span className="capitalize">{color}</span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={newGroupIcon} onValueChange={setNewGroupIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map((iconName) => {
                      const Icon = iconMap[iconName];
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Permissions</DialogTitle>
            <DialogDescription>
              Paste the exported permissions JSON data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON data here..."
              className="h-64 font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Import missing components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';