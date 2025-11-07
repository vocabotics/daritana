import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Command,
  Search,
  Globe,
  FolderOpen,
  Clock,
  Users,
  Settings,
  ArrowRight,
  Hash,
  ChevronRight,
  Zap,
  Home,
  Calendar,
  CheckSquare,
  FileText,
  BarChart3,
  Plus,
  MessageSquare,
  DollarSign,
  Shield,
  Palette,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProjectContextStore, ProjectContextItem } from '@/store/projectContextStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { searchService } from '@/services/search.service';

interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  section: string;
  keywords: string[];
  action: () => void;
  badge?: string;
  hotkey?: string;
  projectColor?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    isCommandPaletteOpen,
    toggleCommandPalette,
    recentProjects,
    searchProjects,
    switchToProject,
    switchToGlobal,
    mode,
    currentProject,
    getProjectColor
  } = useProjectContextStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectResults, setProjectResults] = useState<ProjectContextItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Handle keyboard shortcuts and custom events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Only handle these keys when palette is open
      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        toggleCommandPalette(false);
        setQuery('');
        setSelectedIndex(0);
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          toggleCommandPalette(false);
          setQuery('');
          setSelectedIndex(0);
        }
      }
    };

    // Also listen for custom event from ResponsiveLayout
    const handleToggleEvent = () => {
      toggleCommandPalette();
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('toggle-command-palette', handleToggleEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('toggle-command-palette', handleToggleEvent);
    };
  }, [isCommandPaletteOpen, selectedIndex, query, toggleCommandPalette]);

  // Search for projects when query changes
  useEffect(() => {
    const searchForProjects = async () => {
      if (query.length > 1) {
        setIsSearching(true);
        try {
          // Use the search service to find projects
          const projects = await searchService.searchProjects(query);
          setProjectResults(projects.slice(0, 5)); // Limit to 5 results
        } catch (error) {
          console.error('Project search failed:', error);
          // Fallback to local search if API fails
          const results = await searchProjects(query);
          setProjectResults(results.slice(0, 5));
        } finally {
          setIsSearching(false);
        }
      } else {
        setProjectResults([]);
      }
    };

    const debounceTimer = setTimeout(searchForProjects, 200);
    return () => clearTimeout(debounceTimer);
  }, [query, searchProjects]);

  // Generate command actions based on user role and context
  const generateActions = useCallback((): CommandAction[] => {
    const actions: CommandAction[] = [];

    // Navigation actions
    const navigationActions: CommandAction[] = [
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        subtitle: 'Overview and stats',
        icon: Home,
        section: 'Navigation',
        keywords: ['dashboard', 'home', 'overview'],
        action: () => navigate('/dashboard')
      },
      {
        id: 'nav-projects',
        title: 'Go to Projects',
        subtitle: 'View all projects',
        icon: FolderOpen,
        section: 'Navigation',
        keywords: ['projects', 'list', 'all'],
        action: () => navigate('/projects')
      },
      {
        id: 'nav-calendar',
        title: 'Go to Calendar',
        subtitle: 'Meetings and deadlines',
        icon: Calendar,
        section: 'Navigation',
        keywords: ['calendar', 'schedule', 'meetings'],
        action: () => navigate('/calendar')
      },
      {
        id: 'nav-tasks',
        title: 'Go to Tasks',
        subtitle: 'Your task list',
        icon: CheckSquare,
        section: 'Navigation',
        keywords: ['tasks', 'todo', 'work'],
        action: () => navigate('/tasks')
      }
    ];

    actions.push(...navigationActions);

    // Context switching actions
    const contextActions: CommandAction[] = [
      {
        id: 'switch-global',
        title: 'Switch to Global View',
        subtitle: 'All projects workspace',
        icon: Globe,
        section: 'Context',
        keywords: ['global', 'all', 'workspace', 'switch'],
        action: () => switchToGlobal(),
        badge: mode === 'global' ? 'Current' : undefined
      }
    ];

    if (currentProject) {
      contextActions.push({
        id: 'current-project',
        title: `Stay in ${currentProject.name}`,
        subtitle: 'Project context',
        icon: Building,
        section: 'Context',
        keywords: ['project', 'current', 'context'],
        action: () => {},
        badge: 'Current',
        projectColor: getProjectColor(currentProject.id)
      });
    }

    actions.push(...contextActions);

    // Recent projects
    if (recentProjects.length > 0) {
      const recentActions: CommandAction[] = recentProjects.slice(0, 3).map(project => ({
        id: `recent-${project.id}`,
        title: `Switch to ${project.name}`,
        subtitle: `${project.client?.name || project.type} • ${project.progress}% complete`,
        icon: Building,
        section: 'Recent Projects',
        keywords: ['project', project.name.toLowerCase(), 'recent', 'switch'],
        action: () => switchToProject(project),
        projectColor: getProjectColor(project.id)
      }));
      actions.push(...recentActions);
    }

    // Project search results
    if (projectResults.length > 0) {
      const searchActions: CommandAction[] = projectResults.map(project => ({
        id: `search-${project.id}`,
        title: `Switch to ${project.name}`,
        subtitle: `${project.client?.name || project.type} • ${project.status}`,
        icon: Search,
        section: 'Search Results',
        keywords: ['project', project.name.toLowerCase(), 'search'],
        action: () => switchToProject(project),
        projectColor: getProjectColor(project.id)
      }));
      actions.push(...searchActions);
    }

    // Quick actions based on user role
    if (user?.role === 'project_lead' || user?.role === 'staff') {
      actions.push(
        {
          id: 'create-project',
          title: 'Create New Project',
          subtitle: 'Start a new project',
          icon: Plus,
          section: 'Quick Actions',
          keywords: ['create', 'new', 'project', 'add'],
          action: () => navigate('/projects/new')
        },
        {
          id: 'reports',
          title: 'View Reports',
          subtitle: 'Analytics and insights',
          icon: BarChart3,
          section: 'Quick Actions',
          keywords: ['reports', 'analytics', 'data'],
          action: () => navigate('/reports')
        }
      );
    }

    if (user?.role === 'designer') {
      actions.push(
        {
          id: 'design-brief',
          title: 'Create Design Brief',
          subtitle: 'New design requirements',
          icon: Palette,
          section: 'Quick Actions',
          keywords: ['design', 'brief', 'create', 'new'],
          action: () => navigate('/design-brief/new')
        },
        {
          id: 'portfolio',
          title: 'View Portfolio',
          subtitle: 'Your work showcase',
          icon: BarChart3,
          section: 'Quick Actions',
          keywords: ['portfolio', 'work', 'showcase'],
          action: () => navigate('/portfolio')
        }
      );
    }

    // General actions
    actions.push(
      {
        id: 'settings',
        title: 'Open Settings',
        subtitle: 'Account and preferences',
        icon: Settings,
        section: 'General',
        keywords: ['settings', 'preferences', 'account'],
        action: () => navigate('/settings')
      },
      {
        id: 'help',
        title: 'Help & Support',
        subtitle: 'Documentation and support',
        icon: MessageSquare,
        section: 'General',
        keywords: ['help', 'support', 'docs'],
        action: () => window.open('https://docs.daritana.com/help', '_blank')
      }
    );

    return actions;
  }, [user, mode, currentProject, recentProjects, projectResults, navigate, switchToGlobal, switchToProject, getProjectColor]);

  // Filter actions based on search query
  const filteredActions = useMemo(() => {
    const actions = generateActions();
    
    if (!query.trim()) return actions;

    const lowercaseQuery = query.toLowerCase();
    return actions.filter(action =>
      action.title.toLowerCase().includes(lowercaseQuery) ||
      action.subtitle?.toLowerCase().includes(lowercaseQuery) ||
      action.keywords.some(keyword => keyword.includes(lowercaseQuery))
    );
  }, [generateActions, query]);

  // Group actions by section
  const groupedActions = useMemo(() => {
    const groups: { [key: string]: CommandAction[] } = {};
    
    filteredActions.forEach(action => {
      if (!groups[action.section]) {
        groups[action.section] = [];
      }
      groups[action.section].push(action);
    });

    return groups;
  }, [filteredActions]);

  // Reset selection when filtered actions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredActions]);

  const handleClose = () => {
    toggleCommandPalette(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const handleActionClick = (action: CommandAction) => {
    action.action();
    handleClose();
  };

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-lg shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Command className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-400"
            />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {isSearching && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              <span>ESC to close</span>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedActions).length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedActions).map(([section, actions], sectionIndex) => (
                  <div key={section} className={sectionIndex > 0 ? 'mt-4' : ''}>
                    {/* Section Header */}
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {section}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="px-2">
                      {actions.map((action, actionIndex) => {
                        const globalIndex = filteredActions.indexOf(action);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={action.id}
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: actionIndex * 0.02 }}
                            onClick={() => handleActionClick(action)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                              isSelected
                                ? "bg-blue-50 text-blue-900"
                                : "hover:bg-gray-50 text-gray-900"
                            )}
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              {action.projectColor ? (
                                <div 
                                  className="w-5 h-5 rounded-full"
                                  style={{ backgroundColor: action.projectColor }}
                                />
                              ) : (
                                <action.icon className={cn(
                                  "w-5 h-5",
                                  isSelected ? "text-blue-600" : "text-gray-400"
                                )} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {action.title}
                                </span>
                                {action.badge && (
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    action.badge === 'Current'
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-600"
                                  )}>
                                    {action.badge}
                                  </span>
                                )}
                              </div>
                              {action.subtitle && (
                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                  {action.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Arrow */}
                            <ChevronRight className={cn(
                              "w-4 h-4 flex-shrink-0",
                              isSelected ? "text-blue-600" : "text-gray-300"
                            )} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span>Command Palette</span>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}