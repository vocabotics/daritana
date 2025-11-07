import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { projectService } from '@/services/project.service';
import { projectsApi, tasksApi, usersApi } from '@/lib/api';
import { useDemoStore } from './demoStore';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'renovation' | 'interior_design' | 'landscape';
  status: 'draft' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  budget?: number;
  actualCost?: number;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coverImage?: string;
  
  // Team members
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
  };
  projectLead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  designer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Computed fields
  isOverdue?: boolean;
  daysRemaining?: number;
  budgetUtilization?: number;
  
  // Malaysian-specific features
  culturalConsiderations?: Record<string, any>;
  sustainabilityFeatures?: string[];
  complianceRequirements?: string[];
  
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

interface ProjectState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  stats: ProjectStats | null;
  recentProjects: Project[];
  
  // Extended project data
  projectTeam: any[];
  projectBudget: any;
  projectTimeline: any;
  projectFiles: any[];
  projectTasks: any[];
  projectMilestones: any[];
  
  // UI State
  isLoading: boolean;
  isLoadingProject: boolean;
  isLoadingTeam: boolean;
  isLoadingBudget: boolean;
  isLoadingTimeline: boolean;
  isLoadingFiles: boolean;
  isLoadingTasks: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  
  // Filters
  filters: {
    status?: string;
    type?: string;
    priority?: string;
    clientId?: string;
    search?: string;
  };
  
  // Actions
  fetchProjects: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
  }) => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: any) => Promise<Project | null>;
  updateProject: (id: string, data: any) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  searchProjects: (query: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
  fetchDashboardStats: () => Promise<void>;
  
  // Enhanced project management methods
  fetchProjectTeam: (projectId: string) => Promise<void>;
  addTeamMember: (projectId: string, member: any) => Promise<void>;
  updateTeamMember: (projectId: string, memberId: string, updates: any) => Promise<void>;
  removeTeamMember: (projectId: string, memberId: string) => Promise<void>;
  
  // Budget management
  fetchProjectBudget: (projectId: string) => Promise<void>;
  updateProjectBudget: (projectId: string, budget: any) => Promise<void>;
  addBudgetItem: (projectId: string, item: any) => Promise<void>;
  updateBudgetItem: (projectId: string, itemId: string, updates: any) => Promise<void>;
  removeBudgetItem: (projectId: string, itemId: string) => Promise<void>;
  
  // Timeline management
  fetchProjectTimeline: (projectId: string) => Promise<void>;
  updateProjectTimeline: (projectId: string, timeline: any) => Promise<void>;
  addMilestone: (projectId: string, milestone: any) => Promise<void>;
  updateMilestone: (projectId: string, milestoneId: string, updates: any) => Promise<void>;
  removeMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  
  // File management
  fetchProjectFiles: (projectId: string) => Promise<void>;
  uploadProjectFile: (projectId: string, file: File, metadata?: any) => Promise<void>;
  deleteProjectFile: (projectId: string, fileId: string) => Promise<void>;
  
  // Task management
  fetchProjectTasks: (projectId: string) => Promise<void>;
  createProjectTask: (projectId: string, task: any) => Promise<void>;
  updateProjectTask: (projectId: string, taskId: string, updates: any) => Promise<void>;
  deleteProjectTask: (projectId: string, taskId: string) => Promise<void>;
  
  // Project insights
  getProjectInsights: (projectId: string) => Promise<any>;
  getProjectHealth: (projectId: string) => Promise<any>;
  getProjectProgress: (projectId: string) => Promise<any>;
  
  clearError: () => void;
  clearProjectData: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      stats: null,
      recentProjects: [],
      
      // Extended project data
      projectTeam: [],
      projectBudget: null,
      projectTimeline: null,
      projectFiles: [],
      projectTasks: [],
      projectMilestones: [],
      
      isLoading: false,
      isLoadingProject: false,
      isLoadingTeam: false,
      isLoadingBudget: false,
      isLoadingTimeline: false,
      isLoadingFiles: false,
      isLoadingTasks: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      filters: {},

      // Fetch all projects
      fetchProjects: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
          const response = await projectService.getAllProjects({
            page: params.page || get().currentPage,
            limit: params.limit || 20,
            ...params
          });
          
          if (response.success && response.data) {
            set({
              projects: response.data.projects || [],
              currentPage: response.data.pagination?.page || 1,
              totalPages: response.data.pagination?.totalPages || 1,
              totalCount: response.data.pagination?.total || 0,
              isLoading: false
            });
            
            // Update recent projects (last 5)
            const recent = (response.data.projects || []).slice(0, 5);
            set({ recentProjects: recent });
          }
        } catch (error: any) {
          console.error('Error fetching projects:', error);
          set({ 
            error: error.message || 'Failed to fetch projects',
            isLoading: false 
          });
          toast.error(error.message || 'Failed to fetch projects');
        }
      },

      // Fetch single project
      fetchProjectById: async (id: string) => {
        set({ isLoadingProject: true, error: null });
        try {
          const project = await projectService.getProjectById(id);
          set({ 
            currentProject: project,
            isLoadingProject: false 
          });
        } catch (error: any) {
          console.error('Error fetching project:', error);
          set({ 
            error: error.message || 'Failed to fetch project',
            isLoadingProject: false 
          });
          toast.error(error.message || 'Failed to fetch project');
        }
      },

      // Create project
      createProject: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const project = await projectService.createProject(data);
          
          if (project) {
            // Add to projects list
            set(state => ({
              projects: [project, ...state.projects],
              totalCount: state.totalCount + 1,
              isLoading: false
            }));
            
            // Update recent projects
            set(state => ({
              recentProjects: [project, ...state.recentProjects.slice(0, 4)]
            }));
            
            toast.success('Project created successfully');
            return project;
          }
          
          throw new Error('Project creation failed');
        } catch (error: any) {
          console.error('Error creating project:', error);
          set({ 
            error: error.message || 'Failed to create project',
            isLoading: false 
          });
          toast.error(error.message || 'Failed to create project');
          return null;
        }
      },

      // Update project
      updateProject: async (id: string, data: any) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await projectService.updateProject(id, data);
          
          // Update in projects list
          set(state => ({
            projects: state.projects.map(p => 
              p.id === id ? updatedProject : p
            ),
            currentProject: state.currentProject?.id === id 
              ? updatedProject 
              : state.currentProject,
            isLoading: false
          }));
          
          toast.success('Project updated successfully');
          return updatedProject;
        } catch (error: any) {
          console.error('Error updating project:', error);
          set({ 
            error: error.message || 'Failed to update project',
            isLoading: false 
          });
          toast.error(error.message || 'Failed to update project');
          return null;
        }
      },

      // Delete project
      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await projectService.deleteProject(id);
          
          // Remove from projects list
          set(state => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id 
              ? null 
              : state.currentProject,
            isLoading: false
          }));
          
          toast.success('Project deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Error deleting project:', error);
          set({ 
            error: error.message || 'Failed to delete project',
            isLoading: false 
          });
          toast.error(error.message || 'Failed to delete project');
          return false;
        }
      },

      // Search projects
      searchProjects: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
          const projects = await projectService.searchProjects(query, get().filters);
          set({ 
            projects,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Error searching projects:', error);
          set({ 
            error: error.message || 'Failed to search projects',
            isLoading: false 
          });
          toast.error(error.message || 'Failed to search projects');
        }
      },

      // Fetch dashboard statistics
      fetchDashboardStats: async () => {
        try {
          const stats = await projectService.getDashboardStatistics();
          set({ stats });
        } catch (error: any) {
          console.error('Error fetching dashboard stats:', error);
          toast.error('Failed to fetch dashboard statistics');
        }
      },

      // Set current project
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      // Set filters
      setFilters: (filters: any) => {
        set({ filters });
      },

      // Reset filters
      resetFilters: () => {
        set({ filters: {} });
      },

      // Enhanced project management methods
      fetchProjectTeam: async (projectId: string) => {
        set({ isLoadingTeam: true, error: null });
        try {
          const response = await projectsApi.getTeam(projectId);
          set({ 
            projectTeam: response.team || [],
            isLoadingTeam: false 
          });
        } catch (error: any) {
          console.error('Error fetching project team:', error);
          set({ 
            projectTeam: [],
            error: 'Failed to fetch project team',
            isLoadingTeam: false 
          });
        }
      },
      
      addTeamMember: async (projectId: string, member: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.addTeamMember?.(projectId, member);
          set((state) => ({
            projectTeam: [...state.projectTeam, response.member],
            isLoading: false
          }));
          toast.success('Team member added successfully');
        } catch (error: any) {
          console.error('Error adding team member:', error);
          set({ 
            error: 'Failed to add team member',
            isLoading: false 
          });
          toast.error('Failed to add team member');
        }
      },
      
      updateTeamMember: async (projectId: string, memberId: string, updates: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.updateTeamMember?.(projectId, memberId, updates);
          set((state) => ({
            projectTeam: state.projectTeam.map(member => 
              member.id === memberId ? response.member : member
            ),
            isLoading: false
          }));
          toast.success('Team member updated successfully');
        } catch (error: any) {
          console.error('Error updating team member:', error);
          set({ 
            error: 'Failed to update team member',
            isLoading: false 
          });
          toast.error('Failed to update team member');
        }
      },
      
      removeTeamMember: async (projectId: string, memberId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          await projectsApi.removeTeamMember?.(projectId, memberId);
          set((state) => ({
            projectTeam: state.projectTeam.filter(member => member.id !== memberId),
            isLoading: false
          }));
          toast.success('Team member removed successfully');
        } catch (error: any) {
          console.error('Error removing team member:', error);
          set({ 
            error: 'Failed to remove team member',
            isLoading: false 
          });
          toast.error('Failed to remove team member');
        }
      },
      
      // Budget management
      fetchProjectBudget: async (projectId: string) => {
        set({ isLoadingBudget: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.getBudget?.(projectId) || { budget: null };
          set({ 
            projectBudget: response.budget,
            isLoadingBudget: false 
          });
        } catch (error: any) {
          console.error('Error fetching project budget:', error);
          set({ 
            projectBudget: null,
            error: 'Failed to fetch project budget',
            isLoadingBudget: false 
          });
        }
      },
      
      updateProjectBudget: async (projectId: string, budget: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.updateBudget?.(projectId, budget);
          set({ 
            projectBudget: response?.budget || budget,
            isLoading: false 
          });
          toast.success('Project budget updated successfully');
        } catch (error: any) {
          console.error('Error updating project budget:', error);
          set({ 
            error: 'Failed to update project budget',
            isLoading: false 
          });
          toast.error('Failed to update project budget');
        }
      },
      
      addBudgetItem: async (projectId: string, item: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.addBudgetItem?.(projectId, item);
          set((state) => ({
            projectBudget: {
              ...state.projectBudget,
              items: [...(state.projectBudget?.items || []), response?.item || item]
            },
            isLoading: false
          }));
          toast.success('Budget item added successfully');
        } catch (error: any) {
          console.error('Error adding budget item:', error);
          set({ 
            error: 'Failed to add budget item',
            isLoading: false 
          });
          toast.error('Failed to add budget item');
        }
      },
      
      updateBudgetItem: async (projectId: string, itemId: string, updates: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.updateBudgetItem?.(projectId, itemId, updates);
          set((state) => ({
            projectBudget: {
              ...state.projectBudget,
              items: state.projectBudget?.items?.map(item => 
                item.id === itemId ? response?.item || { ...item, ...updates } : item
              ) || []
            },
            isLoading: false
          }));
          toast.success('Budget item updated successfully');
        } catch (error: any) {
          console.error('Error updating budget item:', error);
          set({ 
            error: 'Failed to update budget item',
            isLoading: false 
          });
          toast.error('Failed to update budget item');
        }
      },
      
      removeBudgetItem: async (projectId: string, itemId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          await projectsApi.removeBudgetItem?.(projectId, itemId);
          set((state) => ({
            projectBudget: {
              ...state.projectBudget,
              items: state.projectBudget?.items?.filter(item => item.id !== itemId) || []
            },
            isLoading: false
          }));
          toast.success('Budget item removed successfully');
        } catch (error: any) {
          console.error('Error removing budget item:', error);
          set({ 
            error: 'Failed to remove budget item',
            isLoading: false 
          });
          toast.error('Failed to remove budget item');
        }
      },
      
      // Timeline management
      fetchProjectTimeline: async (projectId: string) => {
        set({ isLoadingTimeline: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.getTimeline?.(projectId) || { timeline: null };
          set({ 
            projectTimeline: response.timeline,
            isLoadingTimeline: false 
          });
        } catch (error: any) {
          console.error('Error fetching project timeline:', error);
          set({ 
            projectTimeline: null,
            error: 'Failed to fetch project timeline',
            isLoadingTimeline: false 
          });
        }
      },
      
      updateProjectTimeline: async (projectId: string, timeline: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.updateTimeline?.(projectId, timeline);
          set({ 
            projectTimeline: response?.timeline || timeline,
            isLoading: false 
          });
          toast.success('Project timeline updated successfully');
        } catch (error: any) {
          console.error('Error updating project timeline:', error);
          set({ 
            error: 'Failed to update project timeline',
            isLoading: false 
          });
          toast.error('Failed to update project timeline');
        }
      },
      
      addMilestone: async (projectId: string, milestone: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.addMilestone?.(projectId, milestone);
          set((state) => ({
            projectMilestones: [...state.projectMilestones, response?.milestone || milestone],
            isLoading: false
          }));
          toast.success('Milestone added successfully');
        } catch (error: any) {
          console.error('Error adding milestone:', error);
          set({ 
            error: 'Failed to add milestone',
            isLoading: false 
          });
          toast.error('Failed to add milestone');
        }
      },
      
      updateMilestone: async (projectId: string, milestoneId: string, updates: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.updateMilestone?.(projectId, milestoneId, updates);
          set((state) => ({
            projectMilestones: state.projectMilestones.map(milestone => 
              milestone.id === milestoneId ? response?.milestone || { ...milestone, ...updates } : milestone
            ),
            isLoading: false
          }));
          toast.success('Milestone updated successfully');
        } catch (error: any) {
          console.error('Error updating milestone:', error);
          set({ 
            error: 'Failed to update milestone',
            isLoading: false 
          });
          toast.error('Failed to update milestone');
        }
      },
      
      removeMilestone: async (projectId: string, milestoneId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need a specific API endpoint
          await projectsApi.removeMilestone?.(projectId, milestoneId);
          set((state) => ({
            projectMilestones: state.projectMilestones.filter(milestone => milestone.id !== milestoneId),
            isLoading: false
          }));
          toast.success('Milestone removed successfully');
        } catch (error: any) {
          console.error('Error removing milestone:', error);
          set({ 
            error: 'Failed to remove milestone',
            isLoading: false 
          });
          toast.error('Failed to remove milestone');
        }
      },
      
      // File management
      fetchProjectFiles: async (projectId: string) => {
        set({ isLoadingFiles: true, error: null });
        try {
          // Note: This would need to use the files API
          const response = await projectsApi.getProjectFiles?.(projectId) || { files: [] };
          set({ 
            projectFiles: response.files || [],
            isLoadingFiles: false 
          });
        } catch (error: any) {
          console.error('Error fetching project files:', error);
          set({ 
            projectFiles: [],
            error: 'Failed to fetch project files',
            isLoadingFiles: false 
          });
        }
      },
      
      uploadProjectFile: async (projectId: string, file: File, metadata?: any) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need to use the files API
          const response = await projectsApi.uploadFile?.(projectId, file, metadata);
          set((state) => ({
            projectFiles: [...state.projectFiles, response?.file || { id: Date.now().toString(), name: file.name, size: file.size }],
            isLoading: false
          }));
          toast.success('File uploaded successfully');
        } catch (error: any) {
          console.error('Error uploading file:', error);
          set({ 
            error: 'Failed to upload file',
            isLoading: false 
          });
          toast.error('Failed to upload file');
        }
      },
      
      deleteProjectFile: async (projectId: string, fileId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: This would need to use the files API
          await projectsApi.deleteFile?.(projectId, fileId);
          set((state) => ({
            projectFiles: state.projectFiles.filter(file => file.id !== fileId),
            isLoading: false
          }));
          toast.success('File deleted successfully');
        } catch (error: any) {
          console.error('Error deleting file:', error);
          set({ 
            error: 'Failed to delete file',
            isLoading: false 
          });
          toast.error('Failed to delete file');
        }
      },
      
      // Task management
      fetchProjectTasks: async (projectId: string) => {
        set({ isLoadingTasks: true, error: null });
        try {
          const response = await tasksApi.getProjectTasks(projectId);
          set({ 
            projectTasks: response.tasks || [],
            isLoadingTasks: false 
          });
        } catch (error: any) {
          console.error('Error fetching project tasks:', error);
          set({ 
            projectTasks: [],
            error: 'Failed to fetch project tasks',
            isLoadingTasks: false 
          });
        }
      },
      
      createProjectTask: async (projectId: string, task: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await tasksApi.create({ ...task, projectId });
          set((state) => ({
            projectTasks: [...state.projectTasks, response.task],
            isLoading: false
          }));
          toast.success('Task created successfully');
        } catch (error: any) {
          console.error('Error creating task:', error);
          set({ 
            error: 'Failed to create task',
            isLoading: false 
          });
          toast.error('Failed to create task');
        }
      },
      
      updateProjectTask: async (projectId: string, taskId: string, updates: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await tasksApi.update(taskId, updates);
          set((state) => ({
            projectTasks: state.projectTasks.map(task => 
              task.id === taskId ? response.task : task
            ),
            isLoading: false
          }));
          toast.success('Task updated successfully');
        } catch (error: any) {
          console.error('Error updating task:', error);
          set({ 
            error: 'Failed to update task',
            isLoading: false 
          });
          toast.error('Failed to update task');
        }
      },
      
      deleteProjectTask: async (projectId: string, taskId: string) => {
        set({ isLoading: true, error: null });
        try {
          await tasksApi.delete(taskId);
          set((state) => ({
            projectTasks: state.projectTasks.filter(task => task.id !== taskId),
            isLoading: false
          }));
          toast.success('Task deleted successfully');
        } catch (error: any) {
          console.error('Error deleting task:', error);
          set({ 
            error: 'Failed to delete task',
            isLoading: false 
          });
          toast.error('Failed to delete task');
        }
      },
      
      // Project insights
      getProjectInsights: async (projectId: string) => {
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.getInsights?.(projectId) || { insights: null };
          return response.insights;
        } catch (error: any) {
          console.error('Error getting project insights:', error);
          return null;
        }
      },
      
      getProjectHealth: async (projectId: string) => {
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.getHealth?.(projectId) || { health: null };
          return response.health;
        } catch (error: any) {
          console.error('Error getting project health:', error);
          return null;
        }
      },
      
      getProjectProgress: async (projectId: string) => {
        try {
          // Note: This would need a specific API endpoint
          const response = await projectsApi.getProgress?.(projectId) || { progress: null };
          return response.progress;
        } catch (error: any) {
          console.error('Error getting project progress:', error);
          return null;
        }
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Clear project data
      clearProjectData: () => {
        set({
          projectTeam: [],
          projectBudget: null,
          projectTimeline: null,
          projectFiles: [],
          projectTasks: [],
          projectMilestones: []
        });
      }
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        currentProject: state.currentProject,
        filters: state.filters
        // Don't persist extended project data as it comes from API
      })
    }
  )
);