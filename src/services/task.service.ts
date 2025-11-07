import { api } from '@/lib/api';
import { Task } from '@/store/taskStore';

// Backend status mapping
const STATUS_MAP = {
  // Frontend to Backend
  toBackend: {
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'review': 'IN_REVIEW',
    'done': 'DONE',
    'completed': 'DONE',
    'blocked': 'TODO'
  },
  // Backend to Frontend
  toFrontend: {
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'IN_REVIEW': 'review',
    'DONE': 'done'
  }
} as const;

// Priority mapping
const PRIORITY_MAP = {
  // Frontend to Backend
  toBackend: {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'urgent': 'URGENT'
  },
  // Backend to Frontend
  toFrontend: {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  }
} as const;

// Transform backend task to frontend format
const transformTaskFromBackend = (backendTask: any): Task => {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description,
    projectId: backendTask.projectId,
    project: backendTask.project ? {
      id: backendTask.project.id,
      name: backendTask.project.name
    } : undefined,
    status: (STATUS_MAP.toFrontend[backendTask.status as keyof typeof STATUS_MAP.toFrontend] || 'todo') as Task['status'],
    priority: (PRIORITY_MAP.toFrontend[backendTask.priority as keyof typeof PRIORITY_MAP.toFrontend] || 'medium') as Task['priority'],
    assignedTo: backendTask.assignedTo ? {
      id: backendTask.assignedTo.id,
      firstName: backendTask.assignedTo.firstName,
      lastName: backendTask.assignedTo.lastName,
      email: backendTask.assignedTo.email
    } : undefined,
    assignedBy: backendTask.createdBy ? {
      id: backendTask.createdBy.id,
      firstName: backendTask.createdBy.firstName,
      lastName: backendTask.createdBy.lastName
    } : undefined,
    assignee: backendTask.assignedTo ? {
      id: backendTask.assignedTo.id,
      name: `${backendTask.assignedTo.firstName} ${backendTask.assignedTo.lastName}`,
      email: backendTask.assignedTo.email
    } : undefined,
    dueDate: backendTask.dueDate,
    startDate: backendTask.startDate,
    endDate: backendTask.endDate,
    completedAt: backendTask.completedAt,
    progress: backendTask.progress || 0,
    estimatedCost: backendTask.estimatedCost,
    actualCost: backendTask.actualCost,
    tags: backendTask.tags || [],
    attachments: backendTask.attachments || [],
    comments: backendTask.comments || [],
    createdAt: backendTask.createdAt,
    updatedAt: backendTask.updatedAt
  };
};

// Transform frontend task to backend format
const transformTaskToBackend = (frontendTask: Partial<Task>): any => {
  const backendTask: any = {};
  
  if (frontendTask.title !== undefined) backendTask.title = frontendTask.title;
  if (frontendTask.description !== undefined) backendTask.description = frontendTask.description;
  if (frontendTask.projectId !== undefined) backendTask.projectId = frontendTask.projectId;
  if (frontendTask.status !== undefined) {
    backendTask.status = STATUS_MAP.toBackend[frontendTask.status] || 'TODO';
  }
  if (frontendTask.priority !== undefined) {
    backendTask.priority = PRIORITY_MAP.toBackend[frontendTask.priority] || 'MEDIUM';
  }
  if (frontendTask.assignedTo?.id !== undefined) {
    backendTask.assignedToId = frontendTask.assignedTo.id;
  }
  if (frontendTask.dueDate !== undefined) backendTask.dueDate = frontendTask.dueDate;
  if (frontendTask.estimatedCost !== undefined) backendTask.estimatedHours = frontendTask.estimatedCost;
  if (frontendTask.actualCost !== undefined) backendTask.actualHours = frontendTask.actualCost;
  if (frontendTask.tags !== undefined) backendTask.tags = frontendTask.tags;
  
  return backendTask;
};

export const taskService = {
  // Get all tasks with pagination and filtering
  async getAll(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    try {
      // Transform frontend status/priority to backend format if provided
      const backendParams: any = { ...params };
      if (params?.status && params.status !== 'all') {
        backendParams.status = STATUS_MAP.toBackend[params.status as keyof typeof STATUS_MAP.toBackend] || params.status;
      }
      if (params?.priority && params.priority !== 'all') {
        backendParams.priority = PRIORITY_MAP.toBackend[params.priority as keyof typeof PRIORITY_MAP.toBackend] || params.priority;
      }
      
      const response = await api.get('/tasks', { params: backendParams });
      
      if (response.data.tasks) {
        const transformedTasks = response.data.tasks.map(transformTaskFromBackend);
        
        return {
          data: {
            data: transformedTasks,
            pagination: response.data.pagination
          }
        };
      }
      
      return {
        error: 'Failed to fetch tasks'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to fetch tasks'
      };
    }
  },

  // Get single task by ID
  async getById(id: string) {
    try {
      const response = await api.get(`/tasks/${id}`);
      
      if (response.data) {
        return {
          data: {
            task: transformTaskFromBackend(response.data)
          }
        };
      }
      
      return {
        error: 'Task not found'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to fetch task'
      };
    }
  },

  // Create new task
  async create(taskData: Partial<Task>) {
    try {
      const backendData = transformTaskToBackend(taskData);
      const response = await api.post('/tasks', backendData);
      
      if (response.data) {
        return {
          data: {
            task: transformTaskFromBackend(response.data)
          }
        };
      }
      
      return {
        error: 'Failed to create task'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to create task'
      };
    }
  },

  // Update task
  async update(id: string, taskData: Partial<Task>) {
    try {
      const backendData = transformTaskToBackend(taskData);
      const response = await api.patch(`/tasks/${id}`, backendData);
      
      if (response.data) {
        return {
          data: {
            task: transformTaskFromBackend(response.data)
          }
        };
      }
      
      return {
        error: 'Failed to update task'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to update task'
      };
    }
  },

  // Delete task
  async delete(id: string) {
    try {
      const response = await api.delete(`/tasks/${id}`);
      
      if (response.data) {
        return {
          data: response.data
        };
      }
      
      return {
        error: 'Failed to delete task'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to delete task'
      };
    }
  },

  // Update task status
  async updateStatus(id: string, status: Task['status']) {
    try {
      const backendStatus = STATUS_MAP.toBackend[status] || 'TODO';
      const response = await api.patch(`/tasks/${id}`, { status: backendStatus });
      
      if (response.data) {
        return {
          data: {
            task: transformTaskFromBackend(response.data)
          }
        };
      }
      
      return {
        error: 'Failed to update task status'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to update task status'
      };
    }
  },

  // Get tasks for a specific project
  async getProjectTasks(projectId: string, params?: {
    status?: string;
    assignedTo?: string;
  }) {
    try {
      const backendParams: any = { projectId, ...params };
      if (params?.status && params.status !== 'all') {
        backendParams.status = STATUS_MAP.toBackend[params.status as keyof typeof STATUS_MAP.toBackend] || params.status;
      }
      
      const response = await api.get('/tasks', { params: backendParams });
      
      if (response.data.tasks) {
        const transformedTasks = response.data.tasks.map(transformTaskFromBackend);
        
        return {
          data: {
            tasks: transformedTasks
          }
        };
      }
      
      return {
        error: 'Failed to fetch project tasks'
      };
    } catch (error: any) {
      console.error('Task service error:', error);
      return {
        error: error.response?.data?.error || 'Failed to fetch project tasks'
      };
    }
  }
};