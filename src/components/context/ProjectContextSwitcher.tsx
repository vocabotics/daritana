import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Globe, 
  FolderOpen, 
  Search, 
  Clock, 
  Star, 
  Building2,
  ChevronRight,
  Zap,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProjectContextStore, ProjectContextItem } from '@/store/projectContextStore';
import { useProjectStore } from '@/store/projectStore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';

export function ProjectContextSwitcher() {
  const {
    mode,
    currentProject,
    recentProjects,
    suggestedProjects,
    searchQuery,
    searchResults,
    isSearching,
    isContextSwitcherOpen,
    contextTransitioning,
    setSearchQuery,
    clearSearch,
    toggleContextSwitcher,
    switchToGlobal,
    switchToProject,
    getProjectColor
  } = useProjectContextStore();
  
  const { projects, fetchProjects } = useProjectStore();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [allProjects, setAllProjects] = useState<ProjectContextItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [localSearchQuery, setSearchQuery]);

  // Focus search input and load projects when dropdown opens
  useEffect(() => {
    if (isContextSwitcherOpen) {
      // Focus search input
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      // Load all projects for display
      fetchProjects().then(loadedProjects => {
        const contextProjects: ProjectContextItem[] = loadedProjects.map(project => ({
          id: project.id,
          name: project.name,
          type: project.type,
          status: project.status,
          progress: project.progress || 0,
          coverImage: project.coverImage,
          color: getProjectColor(project.id),
          lastAccessedAt: project.updatedAt || new Date().toISOString(),
          client: project.client ? {
            name: `${project.client.firstName} ${project.client.lastName}`,
            companyName: project.client.companyName
          } : undefined
        }));
        setAllProjects(contextProjects);
      });
    }
  }, [isContextSwitcherOpen, fetchProjects, getProjectColor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        toggleContextSwitcher(false);
        clearSearch();
        setLocalSearchQuery('');
      }
    };

    if (isContextSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isContextSwitcherOpen, toggleContextSwitcher, clearSearch]);

  const handleProjectSelect = (project: ProjectContextItem) => {
    switchToProject(project);
    toggleContextSwitcher(false);
    clearSearch();
    setLocalSearchQuery('');
  };

  const handleGlobalSelect = () => {
    switchToGlobal();
    toggleContextSwitcher(false);
    clearSearch();
    setLocalSearchQuery('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ProjectItem = ({ project, isRecent = false }: { project: ProjectContextItem; isRecent?: boolean }) => {
    const projectColor = getProjectColor(project.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 group"
        )}
        onClick={() => handleProjectSelect(project)}
      >
        {/* Project Color Indicator */}
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
        
        {/* Project Thumbnail */}
        <div className="w-8 h-8 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
          {project.coverImage ? (
            <img 
              src={project.coverImage} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: projectColor }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {project.name}
            </p>
            {isRecent && (
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {project.client && (
              <p className="text-xs text-gray-500 truncate">
                {project.client.name}
              </p>
            )}
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-1.5 py-0.5 h-5", getStatusColor(project.status))}
            >
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${project.progress}%`,
                backgroundColor: projectColor
              }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8 text-right">
            {project.progress}%
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Context Switcher Trigger */}
      <Button
        variant="ghost"
        onClick={() => toggleContextSwitcher()}
        className={cn(
          "flex items-center gap-3 px-4 py-2 h-10 rounded-lg border transition-all duration-200",
          "hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "min-w-[200px] max-w-[280px]",
          isContextSwitcherOpen && "ring-2 ring-blue-500 ring-offset-2 border-blue-300",
          contextTransitioning && "animate-pulse"
        )}
      >
        {mode === 'global' ? (
          <>
            <Globe className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                All Projects
              </p>
              <p className="text-xs text-gray-500">
                {projects.length} total
              </p>
            </div>
          </>
        ) : currentProject ? (
          <>
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getProjectColor(currentProject.id) }}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentProject.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentProject.client?.name || currentProject.type}
              </p>
            </div>
          </>
        ) : (
          <>
            <FolderOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900">
                Select Project
              </p>
              <p className="text-xs text-gray-500">
                Choose a project context
              </p>
            </div>
          </>
        )}
        
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200",
          isContextSwitcherOpen && "rotate-180"
        )} />
      </Button>

      {/* Context Switcher Dropdown */}
      <AnimatePresence>
        {isContextSwitcherOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-0 mt-2 w-[420px] bg-white rounded-xl border shadow-xl z-50",
              "max-h-[600px] overflow-hidden"
            )}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-10 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {(localSearchQuery || searchQuery) && (
                  <button
                    onClick={() => {
                      setLocalSearchQuery('');
                      clearSearch();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="max-h-[500px] overflow-y-auto">
              {/* Global Context Option */}
              <div className="p-3">
                <motion.div
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-blue-50 group",
                    mode === 'global' && "bg-blue-50 border border-blue-200"
                  )}
                  onClick={handleGlobalSelect}
                >
                  <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      All Projects
                    </p>
                    <p className="text-xs text-gray-500">
                      Global workspace view
                    </p>
                  </div>
                  {mode === 'global' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </motion.div>
              </div>

              <Separator className="mx-3" />

              {/* Search Results */}
              {localSearchQuery && (
                <>
                  <div className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">
                        Search Results
                      </h3>
                      {isSearching && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                  
                  <div className="px-3 pb-3">
                    {searchResults.length > 0 ? (
                      searchResults.map((project) => (
                        <ProjectItem key={project.id} project={project} />
                      ))
                    ) : !isSearching ? (
                      <div className="px-3 py-8 text-center">
                        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No projects found
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {!localSearchQuery && <Separator className="mx-3" />}
                </>
              )}

              {/* Recent Projects */}
              {!localSearchQuery && recentProjects.length > 0 && (
                <>
                  <div className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">
                        Recent Projects
                      </h3>
                    </div>
                  </div>
                  
                  <div className="px-3 pb-3">
                    {recentProjects.slice(0, 5).map((project) => (
                      <ProjectItem 
                        key={project.id} 
                        project={project} 
                        isRecent={true}
                      />
                    ))}
                  </div>

                  <Separator className="mx-3" />
                </>
              )}

              {/* Suggested Projects */}
              {!localSearchQuery && suggestedProjects.length > 0 && (
                <>
                  <div className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-sm font-medium text-gray-900">
                        Suggested for You
                      </h3>
                    </div>
                  </div>
                  
                  <div className="px-3 pb-3">
                    {suggestedProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} />
                    ))}
                  </div>
                  
                  <Separator className="mx-3" />
                </>
              )}
              
              {/* All Projects */}
              {!localSearchQuery && allProjects.length > 0 && (
                <>
                  <div className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">
                        All Projects
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {allProjects.length}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="px-3 pb-3">
                    {allProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} />
                    ))}
                  </div>
                </>
              )}

              {/* Empty State */}
              {!localSearchQuery && allProjects.length === 0 && recentProjects.length === 0 && suggestedProjects.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No Recent Projects
                  </p>
                  <p className="text-xs text-gray-500">
                    Start working on a project to see it here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press ⌘K for quick access</span>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Daritana</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}