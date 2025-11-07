import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types/index';
import { useProjectStore } from './projectStore';

export type ContextMode = 'global' | 'project';

export interface ProjectContextItem {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'renovation' | 'interior_design' | 'landscape';
  status: 'draft' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  coverImage?: string;
  color?: string; // For visual project indicators
  lastAccessedAt: string;
  client?: {
    name: string;
    companyName?: string;
  };
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | number;
  isActive?: boolean;
}

export interface ProjectContextState {
  // Core context state
  mode: ContextMode;
  currentProject: ProjectContextItem | null;
  
  // Recent projects and suggestions
  recentProjects: ProjectContextItem[];
  suggestedProjects: ProjectContextItem[];
  
  // Search and filtering
  searchQuery: string;
  searchResults: ProjectContextItem[];
  isSearching: boolean;
  
  // Navigation state
  globalNavigation: NavigationItem[];
  projectNavigation: NavigationItem[];
  breadcrumbs: BreadcrumbItem[];
  
  // UI state
  isContextSwitcherOpen: boolean;
  isCommandPaletteOpen: boolean;
  contextTransitioning: boolean;
  
  // Project colors for visual indicators
  projectColors: { [projectId: string]: string };
  
  // Actions
  setMode: (mode: ContextMode) => void;
  setCurrentProject: (project: ProjectContextItem | null) => void;
  addRecentProject: (project: ProjectContextItem) => void;
  removeRecentProject: (projectId: string) => void;
  clearRecentProjects: () => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  searchProjects: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // UI actions
  toggleContextSwitcher: (open?: boolean) => void;
  toggleCommandPalette: (open?: boolean) => void;
  setContextTransitioning: (transitioning: boolean) => void;
  
  // Navigation actions
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  getNavigationForMode: () => NavigationItem[];
  
  // Project management
  refreshProjectsList: () => Promise<void>;
  getProjectColor: (projectId: string) => string;
  setProjectColor: (projectId: string, color: string) => void;
  
  // Smart suggestions
  updateSuggestedProjects: () => void;
  
  // Context switching
  switchToGlobal: () => void;
  switchToProject: (project: ProjectContextItem) => void;
  quickSwitchProject: (projectId: string) => Promise<void>;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentProject?: boolean;
  projectColor?: string;
}

// Project color palette for visual indicators
const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6366F1', // indigo
];

// Global navigation items (when in global mode)
const GLOBAL_NAVIGATION: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
  { name: 'All Projects', href: '/projects', icon: 'FolderOpen' },
  { name: 'My Calendar', href: '/calendar', icon: 'Calendar' },
  { name: 'My Tasks', href: '/tasks', icon: 'CheckSquare' },
  { name: 'Files & Documents', href: '/files', icon: 'FileText' },
  { name: 'Team Directory', href: '/team', icon: 'Users' },
  { name: 'Reports & Analytics', href: '/reports', icon: 'BarChart3' },
];

// Project-specific navigation items (when in project mode)
const PROJECT_NAVIGATION: NavigationItem[] = [
  { name: 'Project Dashboard', href: '/project/dashboard', icon: 'Home' },
  { name: 'Kanban Board', href: '/project/kanban', icon: 'CheckSquare' },
  { name: 'Timeline', href: '/project/timeline', icon: 'Clock' },
  { name: 'Files & Documents', href: '/project/files', icon: 'FolderTree' },
  { name: 'Team Members', href: '/project/team', icon: 'Users' },
  { name: 'Design Brief', href: '/project/design-brief', icon: 'Palette' },
  { name: 'Meetings', href: '/project/meetings', icon: 'Calendar' },
  { name: 'Project Settings', href: '/project/settings', icon: 'Settings' },
];

export const useProjectContextStore = create<ProjectContextState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'global',
      currentProject: null,
      recentProjects: [],
      suggestedProjects: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      globalNavigation: GLOBAL_NAVIGATION,
      projectNavigation: PROJECT_NAVIGATION,
      breadcrumbs: [{ label: 'Dashboard' }],
      isContextSwitcherOpen: false,
      isCommandPaletteOpen: false,
      contextTransitioning: false,
      projectColors: {},

      // Mode switching
      setMode: (mode: ContextMode) => {
        const currentState = get();
        if (currentState.mode !== mode) {
          set({ 
            mode, 
            contextTransitioning: true,
            isContextSwitcherOpen: false 
          });
          
          // Clear transition flag after animation
          setTimeout(() => {
            set({ contextTransitioning: false });
          }, 300);
        }
      },

      // Project selection
      setCurrentProject: (project: ProjectContextItem | null) => {
        set({ currentProject: project });
        
        if (project) {
          get().addRecentProject(project);
          get().setMode('project');
        } else {
          get().setMode('global');
        }
        
        get().updateBreadcrumbs(
          project 
            ? [{ label: 'Projects', href: '/projects' }, { label: project.name, isCurrentProject: true, projectColor: get().getProjectColor(project.id) }]
            : [{ label: 'Dashboard' }]
        );
      },

      // Recent projects management
      addRecentProject: (project: ProjectContextItem) => {
        const currentRecent = get().recentProjects;
        const updatedProject = { ...project, lastAccessedAt: new Date().toISOString() };
        
        // Remove if already exists, then add to front
        const filtered = currentRecent.filter(p => p.id !== project.id);
        const newRecent = [updatedProject, ...filtered].slice(0, 8); // Keep max 8 recent
        
        set({ recentProjects: newRecent });
        get().updateSuggestedProjects();
      },

      removeRecentProject: (projectId: string) => {
        set(state => ({
          recentProjects: state.recentProjects.filter(p => p.id !== projectId)
        }));
      },

      clearRecentProjects: () => {
        set({ recentProjects: [] });
      },

      // Search functionality
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        if (query.trim()) {
          get().searchProjects(query);
        } else {
          set({ searchResults: [] });
        }
      },

      searchProjects: async (query: string) => {
        set({ isSearching: true });
        
        try {
          // Use the existing project store's search functionality
          const projectStore = useProjectStore.getState();
          const results = await projectStore.searchProjects(query);
          
          // Transform to ProjectContextItem format
          const contextResults: ProjectContextItem[] = results.map(project => ({
            id: project.id,
            name: project.name,
            type: project.type,
            status: project.status,
            progress: project.progress,
            coverImage: project.coverImage,
            color: get().getProjectColor(project.id),
            lastAccessedAt: new Date().toISOString(),
            client: project.client ? {
              name: `${project.client.firstName} ${project.client.lastName}`,
              companyName: project.client.companyName
            } : undefined
          }));
          
          set({ searchResults: contextResults, isSearching: false });
        } catch (error) {
          console.error('Project search failed:', error);
          set({ searchResults: [], isSearching: false });
        }
      },

      clearSearch: () => {
        set({ searchQuery: '', searchResults: [], isSearching: false });
      },

      // UI state management
      toggleContextSwitcher: (open?: boolean) => {
        set(state => ({ 
          isContextSwitcherOpen: open !== undefined ? open : !state.isContextSwitcherOpen,
          isCommandPaletteOpen: false // Close command palette when opening context switcher
        }));
      },

      toggleCommandPalette: (open?: boolean) => {
        set(state => ({ 
          isCommandPaletteOpen: open !== undefined ? open : !state.isCommandPaletteOpen,
          isContextSwitcherOpen: false // Close context switcher when opening command palette
        }));
      },

      setContextTransitioning: (transitioning: boolean) => {
        set({ contextTransitioning: transitioning });
      },

      // Navigation management
      updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => {
        set({ breadcrumbs });
      },

      getNavigationForMode: () => {
        const { mode, currentProject } = get();
        
        if (mode === 'project' && currentProject) {
          return PROJECT_NAVIGATION.map(item => ({
            ...item,
            href: item.href.replace('/project', `/projects/${currentProject.id}`)
          }));
        }
        
        return GLOBAL_NAVIGATION;
      },

      // Project color management
      getProjectColor: (projectId: string) => {
        const { projectColors } = get();
        
        if (!projectColors[projectId]) {
          // Assign a color based on project ID hash
          const hash = projectId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          const colorIndex = Math.abs(hash) % PROJECT_COLORS.length;
          const color = PROJECT_COLORS[colorIndex];
          
          get().setProjectColor(projectId, color);
          return color;
        }
        
        return projectColors[projectId];
      },

      setProjectColor: (projectId: string, color: string) => {
        set(state => ({
          projectColors: { ...state.projectColors, [projectId]: color }
        }));
      },

      // Project list refresh
      refreshProjectsList: async () => {
        try {
          const projectStore = useProjectStore.getState();
          await projectStore.fetchProjects();
        } catch (error) {
          console.error('Failed to refresh projects list:', error);
        }
      },

      // Smart suggestions based on recent activity and user behavior
      updateSuggestedProjects: () => {
        const { recentProjects } = get();
        
        // For now, suggest most recently accessed projects
        // This could be enhanced with ML-based suggestions
        const suggested = recentProjects
          .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
          .slice(0, 4);
        
        set({ suggestedProjects: suggested });
      },

      // Context switching helpers
      switchToGlobal: () => {
        get().setCurrentProject(null);
      },

      switchToProject: (project: ProjectContextItem) => {
        get().setCurrentProject(project);
      },

      quickSwitchProject: async (projectId: string) => {
        set({ contextTransitioning: true });
        
        try {
          const projectStore = useProjectStore.getState();
          await projectStore.fetchProjectById(projectId);
          
          const project = projectStore.currentProject;
          if (project) {
            const contextProject: ProjectContextItem = {
              id: project.id,
              name: project.name,
              type: project.type,
              status: project.status,
              progress: project.progress,
              coverImage: project.coverImage,
              color: get().getProjectColor(project.id),
              lastAccessedAt: new Date().toISOString(),
              client: project.client ? {
                name: `${project.client.firstName} ${project.client.lastName}`,
                companyName: project.client.companyName
              } : undefined
            };
            
            get().switchToProject(contextProject);
          }
        } catch (error) {
          console.error('Failed to switch to project:', error);
        } finally {
          setTimeout(() => {
            set({ contextTransitioning: false });
          }, 300);
        }
      }
    }),
    {
      name: 'project-context-storage',
      partialize: (state) => ({
        mode: state.mode,
        currentProject: state.currentProject,
        recentProjects: state.recentProjects,
        projectColors: state.projectColors,
      })
    }
  )
);

// Helper hooks
export const useCurrentProjectContext = () => {
  const { mode, currentProject } = useProjectContextStore();
  return { mode, currentProject, isProjectMode: mode === 'project' };
};

export const useContextNavigation = () => {
  const { getNavigationForMode } = useProjectContextStore();
  return getNavigationForMode();
};

export const useProjectContextActions = () => {
  const {
    switchToGlobal,
    switchToProject,
    quickSwitchProject,
    toggleContextSwitcher,
    toggleCommandPalette,
    addRecentProject,
    searchProjects,
    setSearchQuery,
    clearSearch
  } = useProjectContextStore();
  
  return {
    switchToGlobal,
    switchToProject,
    quickSwitchProject,
    toggleContextSwitcher,
    toggleCommandPalette,
    addRecentProject,
    searchProjects,
    setSearchQuery,
    clearSearch
  };
};