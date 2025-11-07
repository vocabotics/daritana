import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { taskService } from '@/services/task.service';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignee?: {
    id: string;
    name: string;
    email?: string;
  };
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  completedAt?: string;
  progress?: number;
  estimatedCost?: number;
  actualCost?: number;
  tags?: string[];
  attachments?: any[];
  comments?: any[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  // Data
  tasks: Task[];
  currentTask: Task | null;
  tasksByProject: Map<string, Task[]>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  
  // Filters
  filters: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  };
  
  // Actions
  fetchTasks: (params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  
  fetchTaskById: (id: string) => Promise<void>;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<boolean>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<boolean>;
  
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearError: () => void;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      currentTask: null,
      tasksByProject: new Map(),
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      filters: {},

      // Fetch all tasks with filtering and pagination
      fetchTasks: async (params = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await taskService.getAll({
            page: 1,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
            ...params
          });
          
          if (response.data) {
            const { data, pagination } = response.data;
            set({
              tasks: data || [],
              currentPage: pagination?.page || 1,
              totalPages: pagination?.pages || 1,
              totalCount: pagination?.total || 0,
              isLoading: false
            });
            
            // Group tasks by project
            const tasksByProject = new Map<string, Task[]>();
            (data || []).forEach((task: Task) => {
              if (task.projectId) {
                const projectTasks = tasksByProject.get(task.projectId) || [];
                projectTasks.push(task);
                tasksByProject.set(task.projectId, projectTasks);
              }
            });
            set({ tasksByProject });
          } else {
            set({
              error: response.error || 'Failed to fetch tasks',
              isLoading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to fetch tasks',
            isLoading: false
          });
        }
      },

      // Fetch single task by ID
      fetchTaskById: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await taskService.getById(id);
          
          if (response.data) {
            set({
              currentTask: response.data.task,
              isLoading: false
            });
          } else {
            set({
              error: response.error || 'Failed to fetch task',
              isLoading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to fetch task',
            isLoading: false
          });
        }
      },

      // Fetch tasks for a specific project
      fetchProjectTasks: async (projectId: string) => {
        try {
          const response = await taskService.getProjectTasks(projectId);
          
          if (response.data) {
            const projectTasks = response.data.tasks || [];
            set(state => {
              const newTasksByProject = new Map(state.tasksByProject);
              newTasksByProject.set(projectId, projectTasks);
              
              // Merge with existing tasks
              const existingTaskIds = new Set(state.tasks.map(t => t.id));
              const newTasks = projectTasks.filter((t: Task) => !existingTaskIds.has(t.id));
              
              return {
                tasks: [...state.tasks, ...newTasks],
                tasksByProject: newTasksByProject
              };
            });
          }
        } catch (error: any) {
          console.warn('Failed to fetch project tasks:', error);
        }
      },

      // Create new task
      createTask: async (taskData: Partial<Task>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await taskService.create(taskData);
          
          if (response.data) {
            const newTask = response.data.task;
            set(state => {
              // Add to tasks array
              const updatedTasks = [newTask, ...state.tasks];
              
              // Update tasksByProject
              const newTasksByProject = new Map(state.tasksByProject);
              if (newTask.projectId) {
                const projectTasks = newTasksByProject.get(newTask.projectId) || [];
                newTasksByProject.set(newTask.projectId, [newTask, ...projectTasks]);
              }
              
              return {
                tasks: updatedTasks,
                tasksByProject: newTasksByProject,
                totalCount: state.totalCount + 1,
                isLoading: false
              };
            });
            return true;
          } else {
            set({
              error: response.error || 'Failed to create task',
              isLoading: false
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to create task',
            isLoading: false
          });
          return false;
        }
      },

      // Update task
      updateTask: async (id: string, taskData: Partial<Task>) => {
        set({ error: null });
        
        try {
          const response = await taskService.update(id, taskData);
          
          if (response.data) {
            const updatedTask = response.data.task;
            set(state => {
              // Update tasks array
              const updatedTasks = state.tasks.map(task =>
                task.id === id ? updatedTask : task
              );
              
              // Update tasksByProject
              const newTasksByProject = new Map(state.tasksByProject);
              if (updatedTask.projectId) {
                const projectTasks = newTasksByProject.get(updatedTask.projectId) || [];
                const updatedProjectTasks = projectTasks.map(task =>
                  task.id === id ? updatedTask : task
                );
                newTasksByProject.set(updatedTask.projectId, updatedProjectTasks);
              }
              
              return {
                tasks: updatedTasks,
                tasksByProject: newTasksByProject,
                currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
              };
            });
            return true;
          } else {
            set({ error: response.error || 'Failed to update task' });
            return false;
          }
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to update task' });
          return false;
        }
      },

      // Delete task
      deleteTask: async (id: string) => {
        set({ error: null });
        
        try {
          const response = await taskService.delete(id);
          
          if (response.data) {
            set(state => {
              // Find the task to get its projectId
              const taskToDelete = state.tasks.find(t => t.id === id);
              
              // Update tasks array
              const updatedTasks = state.tasks.filter(task => task.id !== id);
              
              // Update tasksByProject
              const newTasksByProject = new Map(state.tasksByProject);
              if (taskToDelete?.projectId) {
                const projectTasks = newTasksByProject.get(taskToDelete.projectId) || [];
                const updatedProjectTasks = projectTasks.filter(task => task.id !== id);
                newTasksByProject.set(taskToDelete.projectId, updatedProjectTasks);
              }
              
              return {
                tasks: updatedTasks,
                tasksByProject: newTasksByProject,
                totalCount: Math.max(0, state.totalCount - 1),
                currentTask: state.currentTask?.id === id ? null : state.currentTask
              };
            });
            return true;
          } else {
            set({ error: response.error || 'Failed to delete task' });
            return false;
          }
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to delete task' });
          return false;
        }
      },

      // Update task status
      updateTaskStatus: async (id: string, status: Task['status']) => {
        set({ error: null });
        
        try {
          const response = await taskService.updateStatus(id, status);
          
          if (response.data) {
            const updatedTask = response.data.task;
            set(state => {
              // Update tasks array
              const updatedTasks = state.tasks.map(task =>
                task.id === id ? updatedTask : task
              );
              
              // Update tasksByProject
              const newTasksByProject = new Map(state.tasksByProject);
              if (updatedTask.projectId) {
                const projectTasks = newTasksByProject.get(updatedTask.projectId) || [];
                const updatedProjectTasks = projectTasks.map(task =>
                  task.id === id ? updatedTask : task
                );
                newTasksByProject.set(updatedTask.projectId, updatedProjectTasks);
              }
              
              return {
                tasks: updatedTasks,
                tasksByProject: newTasksByProject,
                currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
              };
            });
            return true;
          } else {
            set({ error: response.error || 'Failed to update task status' });
            return false;
          }
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to update task status' });
          return false;
        }
      },

      // Set filters
      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set current task
      setCurrentTask: (task) => {
        set({ currentTask: task });
      }
    }),
    {
      name: 'task-storage',
      partialize: (state) => ({
        // Don't persist tasks data, fetch fresh from API
      })
    }
  )
);