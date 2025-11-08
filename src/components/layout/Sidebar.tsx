import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ARIASidebarAssistant } from '@/components/aria/ARIASidebarAssistant';
import { useFilteredNavigation } from '@/hooks/useFilteredNavigation';
import {
  Home,
  FolderOpen,
  Calendar,
  CheckSquare,
  Users,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Clock,
  Building,
  Globe,
  TrendingUp,
  FolderTree,
  DollarSign,
  Shield,
  Palette,
  ArrowLeft,
  Layers,
  Brain,
  Briefcase,
  UserCheck,
  GraduationCap,
  Plug,
  Activity,
  Zap,
  Lock,
  HardHat,
  Ruler,
  ClipboardList,
  Edit3,
  Construction,
  ClipboardCheck,
  FileSignature,
  Receipt,
  Upload,
  Calculator,
  FileCheck
} from 'lucide-react';

// Global navigation (when in global mode)
const globalNavigation = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'System overview' },
    { name: 'ARIA Command Center', href: '/aria', icon: Brain, description: 'AI Assistant Hub', highlight: true },
    { name: 'Construction Monitor', href: '/construction/1', icon: HardHat, description: 'All Sites Overview', highlight: true },
    { name: 'Admin Portal', href: '/admin', icon: Shield, description: 'System administration' },
    { name: 'Permissions', href: '/admin-permissions', icon: Lock, description: 'Group permissions', highlight: true },
    { name: 'All Projects', href: '/projects', icon: FolderOpen, description: 'All projects' },
    { name: 'Documents', href: '/documents', icon: FileText, description: 'Document management' },
    { name: 'Analytics', href: '/analytics', icon: Activity, description: 'Advanced analytics' },
    { name: 'Integrations', href: '/integrations', icon: Plug, description: 'Third-party apps' },
    { name: 'Security Center', href: '/security-enhanced', icon: Lock, description: 'Enhanced security' },
    { name: 'Performance', href: '/performance', icon: Zap, description: 'Performance monitoring' },
    { name: 'User Management', href: '/admin/users', icon: Users, description: 'Manage users' },
    { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3, description: 'System metrics' },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, description: 'Security audit' },
    { name: 'System Settings', href: '/admin/settings', icon: Settings, description: 'System configuration' },
    { name: 'Maintenance', href: '/admin/maintenance', icon: Settings, description: 'System maintenance' },
  ],
  client: [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview and stats' },
    { name: 'ARIA Assistant', href: '/aria', icon: Brain, description: 'Your AI Project Helper', highlight: true },
    { name: 'My Projects', href: '/projects', icon: FolderOpen, description: 'All your projects' },
    { name: 'My Calendar', href: '/calendar', icon: Calendar, description: 'Meetings and deadlines' },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare, description: 'Tasks across projects' },
    { name: 'Design Briefs', href: '/design-brief', icon: Palette, description: 'Brief templates' },
    { name: 'Files & Documents', href: '/files', icon: FileText, description: 'Shared documents' },
    { name: 'Messages', href: '/messages', icon: MessageSquare, description: 'Studio communications' },
  ],
  staff: [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Company overview' },
    { name: 'ARIA Assistant', href: '/aria', icon: Brain, description: 'AI Work Manager', highlight: true },
    { name: 'Construction Monitor', href: '/construction/1', icon: HardHat, description: 'Site Progress Tracking' },
    { name: 'Enterprise PM', href: '/enterprise-pm', icon: Briefcase, description: 'Advanced PM Tools' },

    // Architect Tools
    { name: 'divider', label: 'ARCHITECT TOOLS' },
    { name: 'RFI Management', href: '/architect/rfi', icon: ClipboardList, description: 'Request for Information' },
    { name: 'Change Orders', href: '/architect/change-orders', icon: Edit3, description: 'Variation management' },
    { name: 'Drawings', href: '/architect/drawings', icon: Ruler, description: 'Drawing register' },
    { name: 'Site Visits', href: '/architect/site-visits', icon: Construction, description: 'Site inspections' },
    { name: 'Punch List', href: '/architect/punch-list', icon: ClipboardCheck, description: 'Defect tracking' },
    { name: 'PAM Contracts', href: '/architect/contracts', icon: FileSignature, description: 'Contract admin' },
    { name: 'Payment Certificates', href: '/architect/payment-certificates', icon: Receipt, description: 'PAM certificates', highlight: true },
    { name: 'UBBL Compliance', href: '/architect/ubbl', icon: Shield, description: 'Building compliance' },
    { name: 'Authorities', href: '/architect/authorities', icon: Building, description: 'Submissions tracking' },
    { name: 'Site Instructions', href: '/architect/site-instructions', icon: FileSignature, description: 'AI register', highlight: true },
    { name: 'Submittals', href: '/architect/submittals', icon: Upload, description: 'Submittal tracking' },
    { name: 'Meeting Minutes', href: '/architect/meeting-minutes', icon: Users, description: 'Meeting records' },
    { name: 'DLP Management', href: '/architect/dlp', icon: Shield, description: 'Defects liability' },
    { name: 'Fee Calculator', href: '/architect/fee-calculator', icon: Calculator, description: 'LAM scale fees', highlight: true },
    { name: 'CCC Tracking', href: '/architect/ccc-tracking', icon: FileCheck, description: 'Completion certificates' },
    { name: 'Retention Tracking', href: '/architect/retention-tracking', icon: DollarSign, description: 'Retention money' },

    { name: 'divider', label: 'COMPANY' },
    { name: 'HR Management', href: '/hr', icon: UserCheck, description: 'Human Resources' },
    { name: 'Learning Platform', href: '/learning', icon: GraduationCap, description: 'Digital Learning' },
    { name: 'Analytics', href: '/analytics', icon: Activity, description: 'Advanced analytics' },
    { name: 'All Projects', href: '/projects', icon: FolderOpen, description: 'Project management' },
    { name: 'Documents', href: '/documents', icon: FileText, description: 'Document management' },
    { name: 'Financial', href: '/financial', icon: DollarSign, description: 'Financial overview' },
    { name: 'Compliance', href: '/compliance', icon: Shield, description: 'Regulatory compliance' },
    { name: 'Integrations', href: '/integrations', icon: Plug, description: 'Connected apps' },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare, description: 'Personal task list' },
    { name: 'Studio Calendar', href: '/calendar', icon: Calendar, description: 'Studio schedule' },
    { name: 'Virtual Studio', href: '/team', icon: Users, description: 'Collaborative workspace' },
    { name: 'Reports', href: '/reports', icon: BarChart3, description: 'Analytics and reports' },
  ],
  contractor: [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Your project overview' },
    { name: 'ARIA Assistant', href: '/aria', icon: Brain, description: 'AI Task Helper', highlight: true },
    { name: 'Construction Monitor', href: '/construction/1', icon: HardHat, description: 'Site Progress' },
    { name: 'My Projects', href: '/projects', icon: FolderOpen, description: 'Assigned projects' },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare, description: 'Work assignments' },
    { name: 'Quotations', href: '/quotations', icon: FileText, description: 'Submit quotes' },
    { name: 'Invoices', href: '/invoices', icon: Building, description: 'Invoice management' },
    { name: 'My Calendar', href: '/calendar', icon: Calendar, description: 'Schedule and deadlines' },
  ],
  project_lead: [
    // Main
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Leadership overview' },
    { name: 'ARIA AI', href: '/aria', icon: Brain, description: 'AI Assistant' },

    // Project Management
    { name: 'divider', label: 'PROJECT MANAGEMENT' },
    { name: 'Projects', href: '/projects', icon: FolderOpen, description: 'All projects' },
    { name: 'Enterprise PM', href: '/enterprise-pm', icon: Briefcase, description: 'Advanced tools' },
    { name: 'Construction', href: '/construction/1', icon: HardHat, description: 'Site monitoring' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, description: 'Schedule' },

    // Architect Tools
    { name: 'divider', label: 'ARCHITECT TOOLS' },
    { name: 'RFI Management', href: '/architect/rfi', icon: ClipboardList, description: 'Request for Information' },
    { name: 'Change Orders', href: '/architect/change-orders', icon: Edit3, description: 'Variation management' },
    { name: 'Drawings', href: '/architect/drawings', icon: Ruler, description: 'Drawing register' },
    { name: 'Site Visits', href: '/architect/site-visits', icon: Construction, description: 'Site inspections' },
    { name: 'Punch List', href: '/architect/punch-list', icon: ClipboardCheck, description: 'Defect tracking' },
    { name: 'PAM Contracts', href: '/architect/contracts', icon: FileSignature, description: 'Contract admin' },
    { name: 'Payment Certificates', href: '/architect/payment-certificates', icon: Receipt, description: 'PAM certificates', highlight: true },
    { name: 'UBBL Compliance', href: '/architect/ubbl', icon: Shield, description: 'Building compliance' },
    { name: 'Authorities', href: '/architect/authorities', icon: Building, description: 'Submissions tracking' },

    // Operations
    { name: 'divider', label: 'OPERATIONS' },
    { name: 'Financial', href: '/financial', icon: DollarSign, description: 'Finance & Budget' },
    { name: 'HR Management', href: '/hr', icon: UserCheck, description: 'Human resources' },
    { name: 'Virtual Studio', href: '/team', icon: Users, description: 'Team workspace' },
    { name: 'Documents', href: '/documents', icon: FileText, description: 'File management' },

    // Analytics & Compliance
    { name: 'divider', label: 'INSIGHTS' },
    { name: 'Analytics', href: '/analytics', icon: Activity, description: 'Data analytics' },
    { name: 'Reports', href: '/reports', icon: BarChart3, description: 'Reports' },
    { name: 'Compliance', href: '/compliance', icon: Shield, description: 'Regulations' },

    // System
    { name: 'divider', label: 'SYSTEM' },
    { name: 'Integrations', href: '/integrations', icon: Plug, description: 'Apps' },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'Configuration' },
  ],
  designer: [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Creative overview' },
    { name: 'ARIA Creative AI', href: '/aria', icon: Brain, description: 'AI Design Assistant', highlight: true },
    { name: 'Virtual Studio', href: '/team', icon: Users, description: 'Team collaboration', highlight: true },
    { name: 'Learning Platform', href: '/learning', icon: GraduationCap, description: 'Design Learning' },
    { name: 'My Projects', href: '/projects', icon: FolderOpen, description: 'Design projects' },
    { name: 'Design Tasks', href: '/tasks', icon: CheckSquare, description: 'Creative assignments' },
    { name: 'Design Briefs', href: '/design-brief', icon: Palette, description: 'Client requirements' },
    { name: 'Documents', href: '/documents', icon: FileText, description: 'Design documents' },

    // Architect Tools
    { name: 'divider', label: 'ARCHITECT TOOLS' },
    { name: 'RFI Management', href: '/architect/rfi', icon: ClipboardList, description: 'Request for Information', highlight: true },
    { name: 'Change Orders', href: '/architect/change-orders', icon: Edit3, description: 'Variation management' },
    { name: 'Drawings', href: '/architect/drawings', icon: Ruler, description: 'Drawing register' },
    { name: 'Site Visits', href: '/architect/site-visits', icon: Construction, description: 'Site inspections' },
    { name: 'Punch List', href: '/architect/punch-list', icon: ClipboardCheck, description: 'Defect tracking' },
    { name: 'PAM Contracts', href: '/architect/contracts', icon: FileSignature, description: 'Contract admin' },
    { name: 'Payment Certificates', href: '/architect/payment-certificates', icon: Receipt, description: 'PAM certificates', highlight: true },
    { name: 'UBBL Compliance', href: '/architect/ubbl', icon: Shield, description: 'Building compliance' },
    { name: 'Authorities', href: '/architect/authorities', icon: Building, description: 'Submissions tracking' },

    { name: 'divider', label: 'PROFESSIONAL' },
    { name: 'Portfolio', href: '/portfolio', icon: Layers, description: 'Your work showcase' },
    { name: 'Marketplace', href: '/marketplace', icon: TrendingUp, description: 'Find opportunities' },
    { name: 'Community', href: '/community', icon: Globe, description: 'Designer network' },
    { name: 'My Calendar', href: '/calendar', icon: Calendar, description: 'Design schedule' },
  ]
};

// Project-specific navigation (when in project mode)
const projectNavigation = {
  client: [
    { name: 'Project Overview', href: '/project/dashboard', icon: Home, description: 'Project status' },
    { name: 'Timeline', href: '/project/timeline', icon: Clock, description: 'Project milestones' },
    { name: 'Design Brief', href: '/project/design-brief', icon: Palette, description: 'Requirements and vision' },
    { name: 'Meetings', href: '/project/meetings', icon: Calendar, description: 'Project meetings' },
    { name: 'Approvals', href: '/project/approvals', icon: CheckSquare, description: 'Design approvals' },
    { name: 'Files & Documents', href: '/project/files', icon: FileText, description: 'Project documents' },
    { name: 'Messages', href: '/project/messages', icon: MessageSquare, description: 'Project chat' },
  ],
  staff: [
    { name: 'Project Dashboard', href: '/project/dashboard', icon: Home, description: 'Project overview' },
    { name: 'Kanban Board', href: '/project/kanban', icon: CheckSquare, description: 'Task management' },
    { name: 'Timeline', href: '/project/timeline', icon: Clock, description: 'Schedule and milestones' },
    { name: 'Studio Team', href: '/project/team', icon: Users, description: 'Project team' },
    { name: 'Files', href: '/project/files', icon: FolderTree, description: 'Project files' },
    { name: 'Financial', href: '/project/financial', icon: DollarSign, description: 'Budget tracking' },
    { name: 'Compliance', href: '/project/compliance', icon: Shield, description: 'Project compliance' },
    { name: 'Reports', href: '/project/reports', icon: BarChart3, description: 'Project analytics' },
  ],
  contractor: [
    { name: 'Project Overview', href: '/project/dashboard', icon: Home, description: 'Project status' },
    { name: 'My Tasks', href: '/project/tasks', icon: CheckSquare, description: 'Assigned work' },
    { name: 'Timeline', href: '/project/timeline', icon: Clock, description: 'Project schedule' },
    { name: 'Files', href: '/project/files', icon: FileText, description: 'Project documents' },
    { name: 'Quotations', href: '/project/quotations', icon: Building, description: 'Project quotes' },
    { name: 'Studio Team', href: '/project/team', icon: Users, description: 'Project contacts' },
  ],
  project_lead: [
    { name: 'Project Dashboard', href: '/project/dashboard', icon: Home, description: 'Project control center' },
    { name: 'Kanban Board', href: '/project/kanban', icon: CheckSquare, description: 'Advanced task management' },
    { name: 'Timeline', href: '/project/timeline', icon: Clock, description: 'Schedule management' },
    { name: 'Studio Management', href: '/project/team', icon: Users, description: 'Team coordination' },
    { name: 'Files & Documents', href: '/project/files', icon: FolderTree, description: 'Document management' },
    { name: 'Financial', href: '/project/financial', icon: DollarSign, description: 'Budget and costs' },
    { name: 'Compliance', href: '/project/compliance', icon: Shield, description: 'Regulatory tracking' },
    { name: 'Reports', href: '/project/reports', icon: BarChart3, description: 'Performance metrics' },
    { name: 'Project Settings', href: '/project/settings', icon: Settings, description: 'Project configuration' },
  ],
  designer: [
    { name: 'Project Overview', href: '/project/dashboard', icon: Home, description: 'Design project status' },
    { name: 'Design Tasks', href: '/project/tasks', icon: CheckSquare, description: 'Creative assignments' },
    { name: 'Design Brief', href: '/project/design-brief', icon: Palette, description: 'Client vision' },
    { name: 'Timeline', href: '/project/timeline', icon: Clock, description: 'Design milestones' },
    { name: 'Files & Assets', href: '/project/files', icon: FolderTree, description: 'Design files' },
    { name: 'Studio Team', href: '/project/team', icon: Users, description: 'Project collaborators' },
  ]
};

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Function to translate navigation items
  const translateNavItem = (item: any) => {
    // Create translation key from item name
    const nameKey = item.name
      .replace(/\s+/g, '') // Remove spaces
      .replace(/&/g, '') // Remove ampersands
      .replace(/[A-Z]/g, (letter: string, index: number) => 
        index === 0 ? letter.toLowerCase() : letter
      ); // Convert to camelCase
    
    const translatedName = t(`navigation.${nameKey}`, item.name);
    // Don't translate descriptions to avoid missing key errors
    
    return {
      ...item,
      name: translatedName,
      description: item.description // Keep original description
    };
  };
  const { 
    mode, 
    currentProject, 
    switchToGlobal, 
    contextTransitioning,
    getProjectColor 
  } = useProjectContextStore();
  
  if (!user) return null;

  // Get the appropriate navigation based on context mode and user role
  const getNavigation = () => {
    // Map backend roles to frontend navigation roles
    const roleMapping: Record<string, string> = {
      'ORG_ADMIN': 'admin',
      'PROJECT_LEAD': 'project_lead',
      'DESIGNER': 'designer',
      'CONTRACTOR': 'contractor',
      'CLIENT': 'client',
      'STAFF': 'staff',
      // Also support lowercase versions
      'admin': 'admin',
      'project_lead': 'project_lead',
      'designer': 'designer',
      'contractor': 'contractor',
      'client': 'client',
      'staff': 'staff'
    };
    
    const mappedRole = roleMapping[user.role] || user.role;
    
    if (mode === 'project' && currentProject) {
      const navigation = projectNavigation[mappedRole] || [];
      // Replace project route placeholders with actual project ID
      return navigation.map(item => ({
        ...item,
        href: item.href.replace('/project', `/projects/${currentProject.id}`)
      }));
    }
    return globalNavigation[mappedRole] || [];
  };

  const unfilteredNavigation = getNavigation();
  const currentNavigation = useFilteredNavigation(unfilteredNavigation);

  return (
    <div className={cn(
      "flex flex-col w-full h-full bg-white transition-all duration-300",
      contextTransitioning && "opacity-95"
    )}>
      {/* Logo Header */}
      <div className="flex items-center justify-center h-[60px] px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <span className="text-2xl font-light architect-heading">daritana</span>
        </div>
        {mode === 'project' && currentProject && (
          <div className="ml-2">
            <div className="text-xs text-gray-500">
              {currentProject.name}
            </div>
          </div>
        )}
      </div>

      {/* Context Header */}
      <AnimatePresence mode="wait">
        {mode === 'project' && currentProject ? (
          <motion.div
            key="project-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-gray-100 bg-gray-50"
          >
            {/* Back to Global Button */}
            <button
              onClick={switchToGlobal}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to All Projects
            </button>

            {/* Current Project Info */}
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getProjectColor(currentProject.id) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentProject.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {t('navigation.projectContext') || 'Project Context'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${currentProject?.id || 'global'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, staggerChildren: 0.05 }}
            className="space-y-1"
          >
            {currentNavigation.map((item, index) => {
              // Handle dividers/section headers
              if (item.name === 'divider') {
                return (
                  <div key={`divider-${index}`} className="pt-4 pb-2">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t(`navigation.${item.label?.toLowerCase().replace(/\s+/g, '')}`, item.label)}
                    </h3>
                  </div>
                );
              }
              
              const isActive = location.pathname === item.href || 
                             location.pathname.startsWith(item.href + '/');
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]',
                      isActive
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    title={item.description}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                        isActive 
                          ? 'text-white' 
                          : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{translateNavItem(item).name}</span>
                      {!isActive && (
                        <p className="text-xs text-gray-500 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {translateNavItem(item).description}
                        </p>
                      )}
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="w-2 h-2 bg-white rounded-full ml-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </nav>
      
      {/* ARIA Assistant Footer */}
      <ARIASidebarAssistant />
    </div>
  );
}