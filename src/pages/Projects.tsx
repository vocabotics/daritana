import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { QuickProjectModal } from '@/components/projects/QuickProjectModal';
import { ProjectsLayoutManager } from '@/components/projects/ProjectsLayoutManager';
import { ProjectsEmptyState } from '@/components/ui/empty-state';
import { useDemoStore } from '@/store/demoStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase } from 'lucide-react';
import { toast, notifications } from '@/utils/toast';
import { ProjectCardSkeleton } from '@/components/ui/skeleton';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';

interface ProjectLayoutData {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  location: string;
  client: string;
  team: string[];
  image?: string;
  priority?: 'low' | 'medium' | 'high';
  type: string;
}

export function Projects() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    projects, 
    fetchProjects, 
    createProject, 
    updateProject, 
    deleteProject,
    isLoading 
  } = useProjectStore();
  const { user } = useAuthStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const { mode, currentProject, addRecentProject, refreshProjectsList } = useProjectContextStore();
  const { showCreateProjectModal, closeCreateProjectModal, openCreateProjectModal } = useUIStore();
  const [editingProject, setEditingProject] = useState<any>(null);
  const [currentLayout, setCurrentLayout] = useState('grid');
  
  useEffect(() => {
    // Fetch projects when component mounts
    fetchProjects();
  }, [fetchProjects]);
  
  if (!user) return null;
  
  const getPageTitle = () => {
    switch (user.role) {
      case 'client':
        return t('projects.myProjects');
      case 'project_lead':
        return t('projects.allProjects');
      case 'designer':
        return t('projects.designProjects') || 'Design Projects';
      case 'contractor':
        return t('projects.contractProjects') || 'Contract Projects';
      default:
        return t('projects.title');
    }
  };

  // Convert store projects to layout manager format
  const formattedProjects: ProjectLayoutData[] = projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    status: p.status || 'planning',
    progress: p.progress || 0,
    budget: p.budget || 0,
    startDate: p.startDate ? new Date(p.startDate) : new Date(),
    endDate: p.endDate ? new Date(p.endDate) : undefined,
    location: `${p.city || 'Kuala Lumpur'}, ${p.state || 'Malaysia'}`,
    client: p.client ? `${p.client.firstName} ${p.client.lastName}` : 'Unknown Client',
    team: [
      p.projectLead ? `${p.projectLead.firstName} ${p.projectLead.lastName}` : 'Project Lead',
      'Designer', 'Architect', 'Contractor'
    ].filter(Boolean),
    priority: (p.priority as 'low' | 'medium' | 'high') || 'medium',
    type: p.type || 'Residential Design'
  }));

  // Optimistic update hook for project creation
  const { execute: executeCreate, isLoading: isCreating } = useOptimisticUpdate({
    mutationFn: async (data: any) => {
      const newProject = await createProject(data);
      if (!newProject) throw new Error('Failed to create project');
      return newProject;
    },
    onSuccess: async (newProject) => {
      closeCreateProjectModal();

      // Refresh projects list
      await fetchProjects();

      // Add to recent projects for quick switching
      if (newProject) {
        addRecentProject({
          id: newProject.id,
          name: newProject.name,
          type: newProject.type,
          status: newProject.status || 'planning',
          progress: newProject.progress || 0,
          lastAccessedAt: new Date().toISOString(),
        });
      }

      // Refresh the project context list
      await refreshProjectsList();
    },
    successMessage: t('success.created') || 'Project created successfully',
    errorMessage: t('errors.createError') || 'Failed to create project',
  });

  const handleCreateProject = async (data: any) => {
    await executeCreate(data);
  };

  const handleProjectClick = (project: ProjectLayoutData) => {
    // Navigate to project detail page
    navigate(`/projects/${project.id}`);
    
    // Add to recent projects for quick switching
    addRecentProject({
      id: project.id,
      name: project.name,
      type: project.type,
      status: project.status,
      progress: project.progress,
      lastAccessedAt: new Date().toISOString(),
      client: { name: project.client }
    });
  };

  const handleProjectEdit = (project: ProjectLayoutData) => {
    // For now, navigate to project detail page for editing
    navigate(`/projects/${project.id}`);
  };

  // Optimistic update hook for project deletion
  const { execute: executeDelete } = useOptimisticUpdate({
    mutationFn: async (projectId: string) => {
      const success = await deleteProject(projectId);
      if (!success) throw new Error('Failed to delete project');
      return success;
    },
    onSuccess: async () => {
      await fetchProjects();
    },
    successMessage: t('success.archived') || 'Project archived successfully',
    errorMessage: t('errors.deleteError') || 'Failed to archive project',
  });

  // Optimistic update hook for project status update
  const { execute: executeUpdate } = useOptimisticUpdate({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: any }) => {
      const success = await updateProject(projectId, updates);
      if (!success) throw new Error('Failed to update project');
      return success;
    },
    onSuccess: async () => {
      await fetchProjects();
    },
    successMessage: t('success.updated') || 'Project updated successfully',
    errorMessage: t('errors.updateError') || 'Failed to update project',
  });

  const handleProjectArchive = async (project: ProjectLayoutData) => {
    if (confirm('Are you sure you want to archive this project?')) {
      await executeDelete(project.id);
    }
  };

  const handleProjectMove = async (projectId: string, newStatus: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await executeUpdate({ projectId, updates: { ...project, status: newStatus } });
    }
  };
  
  const getContextualTitle = () => {
    if (mode === 'project' && currentProject) {
      return `${currentProject.name} - Overview`;
    }
    return getPageTitle();
  };

  const getContextualDescription = () => {
    if (mode === 'project' && currentProject) {
      return t('projects.projectDetails');
    }
    return user.role === 'client' 
      ? t('projects.trackProgress') || 'Track the progress of your design and renovation projects'
      : t('projects.managePortfolio') || 'Manage and oversee project portfolio';
  };

  const canCreateProject = user.role === 'project_lead' || user.role === 'staff';
  
  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Briefcase className="h-5 w-5 text-gray-700" />
        <span className="text-lg font-semibold text-gray-900">{getPageTitle()}</span>
      </div>
      <div className="flex items-center gap-2">
        {canCreateProject && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={openCreateProjectModal}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm">{t('projects.newProject')}</span>
          </Button>
        )}
      </div>
    </div>
  );

  const shouldShowEmptyState = !isLoading && projects.length === 0 && !isDemoMode;

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="h-full flex flex-col">
        {/* Show loading skeleton */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : shouldShowEmptyState ? (
          /* Show empty state when no projects in real mode */
          <div className="flex-1 flex items-center justify-center">
            <ProjectsEmptyState onCreateProject={openCreateProjectModal} />
          </div>
        ) : (
          /* Projects Layout Manager */
          <ProjectsLayoutManager
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            projects={formattedProjects}
            onProjectClick={handleProjectClick}
            onProjectEdit={handleProjectEdit}
            onProjectArchive={handleProjectArchive}
            onProjectMove={handleProjectMove}
            showSearch={true}
            showFilters={true}
          />
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <QuickProjectModal
            open={showCreateProjectModal}
            onClose={closeCreateProjectModal}
            onSubmit={handleCreateProject}
            isLoading={isCreating}
          />
        )}
      </div>
    </Layout>
  );
}