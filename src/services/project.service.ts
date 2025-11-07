import { apiClient } from './api';
import { Project, Task } from '@/types';


export interface CreateProjectData {
  name: string;
  description?: string;
  type: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'renovation' | 'interior_design' | 'landscape';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  startDate?: string;
  endDate?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  clientId?: string;
  projectLeadId?: string;
  designerId?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'draft' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress?: number;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface ProjectResponse {
  success: boolean;
  data: {
    project?: Project;
    projects?: Project[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  budgetUtilization: number;
  progressPercentage: number;
  teamMembers: number;
  documents: number;
  upcomingMilestones: number;
}

class ProjectService {
  private apiUrl = '/projects';

  // Get all projects with pagination and filters
  async getAllProjects(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    status?: string;
    type?: string;
  }): Promise<ProjectResponse> {
    try {
      const response = await apiClient.get(this.apiUrl, {
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      // Return empty data instead of throwing error for development
      if (error.response?.status === 401) {
        return {
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: params?.page || 1,
            limit: params?.limit || 20,
            totalPages: 0
          }
        };
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch projects');
    }
  }

  // Get single project by ID
  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/${id}`);
      return response.data.data.project;
    } catch (error: any) {
      console.error('Error fetching project:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
  }

  // Get first available project (for default construction site)
  async getFirstProject(): Promise<Project | null> {
    try {
      const response = await apiClient.get(this.apiUrl, {
        params: { limit: 1 }
      });
      console.log('getFirstProject response:', response.data);
      
      // Handle the actual response structure
      if (response.data?.projects?.length > 0) {
        console.log('Found first project:', response.data.projects[0].name, response.data.projects[0].id);
        return response.data.projects[0];
      } else if (response.data?.data?.projects?.length > 0) {
        console.log('Found first project (nested):', response.data.data.projects[0].name);
        return response.data.data.projects[0];
      }
      
      console.log('No projects found');
      return null;
    } catch (error: any) {
      console.error('Error fetching first project:', error);
      return null;
    }
  }

  // Create new project
  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const response = await apiClient.post(this.apiUrl, data);
      return response.data.data.project;
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  }

  // Update project
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      const response = await apiClient.put(`${this.apiUrl}/${id}`, data);
      return response.data.data.project;
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw new Error(error.response?.data?.error || 'Failed to update project');
    }
  }

  // Delete project
  async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.apiUrl}/${id}`);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete project');
    }
  }

  // Search projects
  async searchProjects(query: string, filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<Project[]> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/search`, {
        params: { q: query, ...filters }
      });
      return response.data.data.projects;
    } catch (error: any) {
      console.error('Error searching projects:', error);
      throw new Error(error.response?.data?.error || 'Failed to search projects');
    }
  }

  // Get dashboard statistics
  async getDashboardStatistics(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/dashboard/statistics`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  }

  // Get project statistics
  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/${projectId}/statistics`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching project statistics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch project statistics');
    }
  }

  // Get project team members
  async getProjectTeam(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/${projectId}/team`);
      return response.data.data.team;
    } catch (error: any) {
      console.error('Error fetching project team:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch project team');
    }
  }

  // Add team member to project
  async addTeamMember(projectId: string, userId: string, role: string): Promise<void> {
    try {
      await apiClient.post(`${this.apiUrl}/${projectId}/team`, 
        { userId, role },
        { headers: getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error adding team member:', error);
      throw new Error(error.response?.data?.error || 'Failed to add team member');
    }
  }

  // Remove team member from project
  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.apiUrl}/${projectId}/team/${userId}`);
    } catch (error: any) {
      console.error('Error removing team member:', error);
      throw new Error(error.response?.data?.error || 'Failed to remove team member');
    }
  }

  // Get project tasks
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      // Use the tasks endpoint with projectId filter
      const response = await apiClient.get('/tasks', {
        params: { projectId }
      });
      return response.data.data?.tasks || [];
    } catch (error: any) {
      console.error('Error fetching project tasks:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }

  // Get project documents
  async getProjectDocuments(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/${projectId}/documents`);
      return response.data.data.documents;
    } catch (error: any) {
      console.error('Error fetching project documents:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch project documents');
    }
  }
}

export const projectService = new ProjectService();