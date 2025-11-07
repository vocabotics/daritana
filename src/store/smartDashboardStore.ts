import { create } from 'zustand';
import { DashboardWidget } from '@/types/dashboard';
import { layoutStorage, SavedLayout } from '@/services/layoutStorage';

interface DashboardContext {
  mode: 'global' | 'project';
  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  userRole: string;
  department?: string;
}

interface SmartTemplate {
  id: string;
  name: string;
  description: string;
  context: 'global' | 'project' | 'both';
  userRoles: string[];
  category: 'productivity' | 'analytics' | 'collaboration' | 'executive' | 'operational';
  widgets: DashboardWidget[];
  aiScore: number; // 0-100 relevance score based on user behavior
  usage: number; // How many times this template has been used
  lastUsed?: Date;
  isCustom: boolean;
  isRecommended: boolean;
  tags: string[];
  previewImage?: string;
}

interface UserPreferences {
  preferredWidgets: string[];
  recentlyUsedTemplates: string[];
  customizations: Record<string, any>;
  workPatterns: {
    activeHours: { start: number; end: number };
    preferredViews: string[];
    frequentActions: string[];
  };
}

interface DashboardAnalytics {
  widgetUsage: Record<string, number>;
  templateUsage: Record<string, number>;
  timeSpentByWidget: Record<string, number>;
  clickPatterns: Array<{
    widget: string;
    timestamp: Date;
    action: string;
  }>;
}

interface SmartDashboardStore {
  // Current state
  currentContext: DashboardContext;
  currentTemplate: SmartTemplate | null;
  currentLayout: DashboardWidget[];
  isSmartMode: boolean;
  
  // Templates and customization
  availableTemplates: SmartTemplate[];
  userPreferences: UserPreferences;
  analytics: DashboardAnalytics;
  
  // Saved layouts
  savedLayouts: SavedLayout[];
  currentSavedLayoutId: string | null;
  
  // UI state
  isEditMode: boolean;
  showTemplateRecommendations: boolean;
  selectedWidget: string | null;
  
  // Actions
  setContext: (context: Partial<DashboardContext>) => void;
  switchToSmartMode: (enabled: boolean) => void;
  applyTemplate: (templateId: string) => void;
  createCustomTemplate: (name: string, description: string) => void;
  getRecommendedTemplates: () => SmartTemplate[];
  getContextualWidgets: () => DashboardWidget[];
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  trackWidgetUsage: (widgetId: string, action: string) => void;
  
  // Layout management
  addWidget: (widget: DashboardWidget) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  setEditMode: (enabled: boolean) => void;
  resetToDefaultForContext: () => void;
  
  // Layout persistence
  saveCurrentLayout: (name: string, description?: string) => Promise<SavedLayout>;
  loadSavedLayout: (layoutId: string) => Promise<void>;
  loadUserLayouts: (userId: string) => Promise<void>;
  deleteSavedLayout: (layoutId: string) => Promise<boolean>;
  setDefaultLayout: (layoutId: string) => Promise<void>;
  exportLayout: (layoutId: string) => Promise<string>;
  importLayout: (layoutData: string, userId: string) => Promise<void>;
  
  // AI-powered features
  generateSmartLayout: () => Promise<DashboardWidget[]>;
  suggestOptimizations: () => Array<{
    type: 'widget' | 'layout' | 'template';
    suggestion: string;
    confidence: number;
  }>;
}

// Default templates for different contexts
const createGlobalTemplates = (): SmartTemplate[] => [
  {
    id: 'global-executive-overview',
    name: 'Executive Command Center',
    description: 'High-level overview of all projects, finances, and team performance',
    context: 'global',
    userRoles: ['admin', 'project_lead'],
    category: 'executive',
    aiScore: 95,
    usage: 142,
    isCustom: false,
    isRecommended: true,
    tags: ['overview', 'kpi', 'executive', 'analytics'],
    widgets: [
      { id: '1', type: 'performance-metrics', title: 'Key Performance Indicators', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'revenue-chart', title: 'Revenue Overview', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'project-overview', title: 'Portfolio Status', position: { x: 0, y: 4 }, size: { width: 8, height: 3 } },
      { id: '4', type: 'team-performance', title: 'Team Utilization', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'ai-recommendations', title: 'Strategic Insights', position: { x: 0, y: 7 }, size: { width: 12, height: 3 } }
    ]
  },
  {
    id: 'global-operational-hub',
    name: 'Operations Hub',
    description: 'Day-to-day operational oversight and task management',
    context: 'global',
    userRoles: ['project_lead', 'staff', 'designer'],
    category: 'operational',
    aiScore: 88,
    usage: 89,
    isCustom: false,
    isRecommended: true,
    tags: ['operations', 'tasks', 'projects', 'daily'],
    widgets: [
      { id: '1', type: 'active-projects', title: 'Active Projects', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'my-tasks', title: 'My Tasks', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'upcoming-deadlines', title: 'Upcoming Deadlines', position: { x: 0, y: 4 }, size: { width: 6, height: 3 } },
      { id: '4', type: 'team-overview', title: 'Team Status', position: { x: 6, y: 4 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'activity-feed', title: 'Recent Activity', position: { x: 0, y: 7 }, size: { width: 12, height: 3 } }
    ]
  }
];

const createProjectTemplates = (): SmartTemplate[] => [
  {
    id: 'project-command-center',
    name: 'Project Command Center',
    description: 'Complete project oversight with tasks, timeline, and team coordination',
    context: 'project',
    userRoles: ['project_lead', 'designer', 'admin'],
    category: 'operational',
    aiScore: 92,
    usage: 156,
    isCustom: false,
    isRecommended: true,
    tags: ['project', 'tasks', 'timeline', 'team'],
    widgets: [
      { id: '1', type: 'project-progress', title: 'Project Progress', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'project-timeline', title: 'Timeline', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'task-kanban', title: 'Task Board', position: { x: 0, y: 4 }, size: { width: 12, height: 5 } },
      { id: '4', type: 'team-overview', title: 'Project Team', position: { x: 0, y: 9 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'project-budget', title: 'Budget Tracker', position: { x: 6, y: 9 }, size: { width: 6, height: 3 } }
    ]
  },
  {
    id: 'project-client-view',
    name: 'Client Portal',
    description: 'Client-focused view with progress, approvals, and communication',
    context: 'project',
    userRoles: ['client'],
    category: 'collaboration',
    aiScore: 94,
    usage: 78,
    isCustom: false,
    isRecommended: true,
    tags: ['client', 'progress', 'approvals', 'communication'],
    widgets: [
      { id: '1', type: 'project-updates', title: 'Latest Updates', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'milestone-tracker', title: 'Milestones', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'design-gallery', title: 'Design Gallery', position: { x: 0, y: 4 }, size: { width: 8, height: 4 } },
      { id: '4', type: 'approval-requests', title: 'Pending Approvals', position: { x: 8, y: 4 }, size: { width: 4, height: 4 } },
      { id: '5', type: 'meeting-schedule', title: 'Meetings', position: { x: 0, y: 8 }, size: { width: 6, height: 3 } },
      { id: '6', type: 'recent-messages', title: 'Messages', position: { x: 6, y: 8 }, size: { width: 6, height: 3 } }
    ]
  }
];

export const useSmartDashboardStore = create<SmartDashboardStore>((set, get) => ({
  // Initial state
  currentContext: {
    mode: 'global',
    userRole: 'designer'
  },
  currentTemplate: null,
  currentLayout: [],
  isSmartMode: true,
  
  availableTemplates: [...createGlobalTemplates(), ...createProjectTemplates()],
  userPreferences: {
    preferredWidgets: [],
    recentlyUsedTemplates: [],
    customizations: {},
    workPatterns: {
      activeHours: { start: 9, end: 17 },
      preferredViews: ['kanban', 'timeline'],
      frequentActions: ['view_project', 'update_task']
    }
  },
  analytics: {
    widgetUsage: {},
    templateUsage: {},
    timeSpentByWidget: {},
    clickPatterns: []
  },
  
  savedLayouts: [],
  currentSavedLayoutId: null,
  
  isEditMode: false,
  showTemplateRecommendations: false,
  selectedWidget: null,
  
  // Actions
  setContext: (context) => set((state) => ({
    currentContext: { ...state.currentContext, ...context }
  })),
  
  switchToSmartMode: (enabled) => set({ isSmartMode: enabled }),
  
  applyTemplate: (templateId) => {
    const template = get().availableTemplates.find(t => t.id === templateId);
    if (template) {
      set({
        currentTemplate: template,
        currentLayout: [...template.widgets]
      });
      
      // Track usage
      const analytics = get().analytics;
      set({
        analytics: {
          ...analytics,
          templateUsage: {
            ...analytics.templateUsage,
            [templateId]: (analytics.templateUsage[templateId] || 0) + 1
          }
        }
      });
    }
  },
  
  createCustomTemplate: (name, description) => {
    const currentLayout = get().currentLayout;
    const currentContext = get().currentContext;
    
    const customTemplate: SmartTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      context: currentContext.mode,
      userRoles: [currentContext.userRole],
      category: 'productivity',
      widgets: [...currentLayout],
      aiScore: 75,
      usage: 1,
      isCustom: true,
      isRecommended: false,
      tags: ['custom'],
      lastUsed: new Date()
    };
    
    set((state) => ({
      availableTemplates: [...state.availableTemplates, customTemplate]
    }));
  },
  
  getRecommendedTemplates: () => {
    const { currentContext, availableTemplates, analytics, userPreferences } = get();
    
    return availableTemplates
      .filter(template => 
        template.context === currentContext.mode || template.context === 'both'
      )
      .filter(template => 
        template.userRoles.includes(currentContext.userRole)
      )
      .sort((a, b) => {
        // Sort by AI score, usage, and user preferences
        const aScore = a.aiScore * 0.4 + 
                      (analytics.templateUsage[a.id] || 0) * 0.3 + 
                      (userPreferences.recentlyUsedTemplates.includes(a.id) ? 20 : 0);
        const bScore = b.aiScore * 0.4 + 
                      (analytics.templateUsage[b.id] || 0) * 0.3 + 
                      (userPreferences.recentlyUsedTemplates.includes(b.id) ? 20 : 0);
        return bScore - aScore;
      })
      .slice(0, 6);
  },
  
  getContextualWidgets: () => {
    const { currentContext } = get();
    // Return widgets that are relevant to current context
    // This would be expanded with more intelligent filtering
    return [];
  },
  
  updateUserPreferences: (preferences) => set((state) => ({
    userPreferences: { ...state.userPreferences, ...preferences }
  })),
  
  trackWidgetUsage: (widgetId, action) => {
    const analytics = get().analytics;
    set({
      analytics: {
        ...analytics,
        widgetUsage: {
          ...analytics.widgetUsage,
          [widgetId]: (analytics.widgetUsage[widgetId] || 0) + 1
        },
        clickPatterns: [
          ...analytics.clickPatterns.slice(-99), // Keep last 100 entries
          { widget: widgetId, timestamp: new Date(), action }
        ]
      }
    });
  },
  
  // Layout management
  addWidget: (widget) => set((state) => ({
    currentLayout: [...state.currentLayout, widget]
  })),
  
  removeWidget: (widgetId) => set((state) => ({
    currentLayout: state.currentLayout.filter(w => w.id !== widgetId)
  })),
  
  updateWidget: (widgetId, updates) => set((state) => ({
    currentLayout: state.currentLayout.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    )
  })),
  
  setEditMode: (enabled) => set({ isEditMode: enabled }),
  
  resetToDefaultForContext: () => {
    const { currentContext, availableTemplates } = get();
    const defaultTemplate = availableTemplates.find(t => 
      t.context === currentContext.mode && 
      t.userRoles.includes(currentContext.userRole) &&
      t.isRecommended
    );
    
    if (defaultTemplate) {
      get().applyTemplate(defaultTemplate.id);
    }
  },
  
  // Layout persistence
  saveCurrentLayout: async (name: string, description?: string) => {
    const { currentLayout, currentContext } = get();
    const userId = 'current-user'; // In real app, get from auth store
    
    const savedLayout = await layoutStorage.saveLayout({
      name,
      description,
      context: currentContext.mode,
      projectId: currentContext.projectId,
      userId,
      widgets: currentLayout
    });
    
    set((state) => ({
      savedLayouts: [...state.savedLayouts, savedLayout],
      currentSavedLayoutId: savedLayout.id
    }));
    
    return savedLayout;
  },
  
  loadSavedLayout: async (layoutId: string) => {
    const layout = await layoutStorage.loadLayout(layoutId);
    if (layout) {
      set({
        currentLayout: layout.widgets,
        currentSavedLayoutId: layoutId
      });
    }
  },
  
  loadUserLayouts: async (userId: string) => {
    const layouts = await layoutStorage.loadUserLayouts(userId);
    set({ savedLayouts: layouts });
  },
  
  deleteSavedLayout: async (layoutId: string) => {
    const success = await layoutStorage.deleteLayout(layoutId);
    if (success) {
      set((state) => ({
        savedLayouts: state.savedLayouts.filter(l => l.id !== layoutId),
        currentSavedLayoutId: state.currentSavedLayoutId === layoutId ? null : state.currentSavedLayoutId
      }));
    }
    return success;
  },
  
  setDefaultLayout: async (layoutId: string) => {
    const { currentContext } = get();
    await layoutStorage.setDefaultLayout(
      layoutId,
      currentContext.mode,
      currentContext.projectId
    );
  },
  
  exportLayout: async (layoutId: string) => {
    return await layoutStorage.exportLayout(layoutId);
  },
  
  importLayout: async (layoutData: string, userId: string) => {
    const imported = await layoutStorage.importLayout(layoutData, userId);
    set((state) => ({
      savedLayouts: [...state.savedLayouts, imported],
      currentLayout: imported.widgets,
      currentSavedLayoutId: imported.id
    }));
  },
  
  // AI-powered features
  generateSmartLayout: async () => {
    // Simulate AI layout generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { currentContext, analytics, userPreferences } = get();
    
    // This would use actual AI to generate optimal layouts
    // For now, return a contextually relevant layout
    return get().getRecommendedTemplates()[0]?.widgets || [];
  },
  
  suggestOptimizations: () => {
    const { analytics, currentLayout } = get();
    
    const suggestions = [];
    
    // Analyze widget usage patterns
    const unusedWidgets = currentLayout.filter(w => 
      (analytics.widgetUsage[w.id] || 0) < 5
    );
    
    if (unusedWidgets.length > 0) {
      suggestions.push({
        type: 'widget' as const,
        suggestion: `Consider removing ${unusedWidgets.length} rarely used widgets to improve focus`,
        confidence: 0.8
      });
    }
    
    return suggestions;
  }
}));