import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

const API_BASE_URL = 'http://localhost:7001/api'

// Create axios instance with credentials support for HTTP-Only cookies
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // IMPORTANT: Send cookies with requests
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor (no longer needed for auth - cookies handled automatically)
// Keep for potential future middleware needs
api.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically with withCredentials: true
    // No need to manually add Authorization header
    return config
  },
  (error) => Promise.reject(error)
)

// Token refresh flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  
  failedQueue = []
}

// Enhanced response interceptor with automatic token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers!.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject: (err: any) => {
              reject(err)
            }
          })
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true

      // Refresh token is in HTTP-Only cookie, no need to get from localStorage
      try {
        // Call refresh endpoint (refresh_token cookie sent automatically)
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true // Send cookies
        })

        if (response.data.success) {
          // New tokens are set as HTTP-Only cookies automatically
          // No need to store in localStorage

          // Process queued requests
          processQueue(null, 'refreshed')

          toast.success('Session refreshed', {
            description: 'Your session has been automatically renewed',
            duration: 3000
          })

          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        processQueue(refreshError, null)

        // No need to clear localStorage - cookies cleared by server

        toast.error('Session expired', {
          description: 'Please log in again to continue',
          duration: 5000
        })

        // Redirect to login after session expiry
        setTimeout(() => {
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }, 1000)
      } finally {
        isRefreshing = false
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied', {
        description: 'You do not have permission to perform this action',
      })
    } else if (error.response?.status === 429) {
      toast.error('Too many requests', {
        description: 'Please wait a moment before trying again',
      })
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server error', {
        description: 'Something went wrong on our end. Please try again later.',
      })
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Network error', {
        description: 'Please check your internet connection and try again',
      })
    }
    
    return Promise.reject(error)
  }
)

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Auth API calls
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{
    user: any
    tokens: {
      accessToken: string
      refreshToken: string
    }
  }>> => {
    const response = await api.post('/auth/login', { email, password })
    return response
  },

  register: async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    role: string
    companyName?: string
    phoneNumber?: string
  }): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset-password', { token, password, confirmPassword })
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{
    token: string
    refreshToken: string
  }>> => {
    // Use a separate axios instance to avoid interceptor conflicts
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return refreshResponse.data
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  resendVerification: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/resend-verification', { email })
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

// Projects API calls
export const projectsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<any> => {
    const response = await api.get('/projects', { params })
    console.log('Projects API response:', response.data)
    // Return the response data directly, not response.data.data
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  create: async (projectData: any): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.post('/projects', projectData)
    return response.data
  },

  update: async (id: string, projectData: any): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.put(`/projects/${id}`, projectData)
    return response.data
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/projects/${id}`)
    return response.data
  },

  getStatistics: async (id: string): Promise<ApiResponse<{ statistics: any }>> => {
    const response = await api.get(`/projects/${id}/statistics`)
    return response.data
  },

  getTeam: async (id: string): Promise<ApiResponse<{ team: any }>> => {
    const response = await api.get(`/projects/${id}/team`)
    return response.data
  },

  getDashboardStatistics: async (): Promise<ApiResponse<{ statistics: any }>> => {
    const response = await api.get('/projects/dashboard/statistics')
    return response.data
  },

  search: async (query: string, filters?: {
    status?: string
    type?: string
    limit?: number
  }): Promise<ApiResponse<{ projects: any[] }>> => {
    const response = await api.get('/projects/search', { 
      params: { q: query, ...filters }
    })
    return response.data
  }
}

// Team API calls
export const teamApi = {
  // Team members
  getMembers: async (): Promise<ApiResponse<{ members: any[] }>> => {
    const response = await api.get('/team/members')
    return response.data
  },

  getMember: async (id: string): Promise<ApiResponse<{ member: any }>> => {
    const response = await api.get(`/team/members/${id}`)
    return response.data
  },

  updateMember: async (id: string, data: any): Promise<ApiResponse<{ member: any }>> => {
    const response = await api.put(`/team/members/${id}`, data)
    return response.data
  },

  removeMember: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/team/members/${id}`)
    return response.data
  },

  // Team analytics
  getAnalytics: async (): Promise<ApiResponse<{ analytics: any }>> => {
    const response = await api.get('/team/analytics')
    return response.data
  },

  getWorkload: async (): Promise<ApiResponse<{ workload: any }>> => {
    const response = await api.get('/team/workload')
    return response.data
  },

  // Chat rooms and messages
  getChannels: async (): Promise<ApiResponse<{ channels: any[] }>> => {
    const response = await api.get('/team/channels')
    return response.data
  },

  getMessages: async (channelId?: string): Promise<ApiResponse<{ messages: any[] }>> => {
    const response = await api.get('/team/messages', {
      params: { channelId }
    })
    return response.data
  },

  sendMessage: async (data: { channelId?: string, content: string, type?: string }): Promise<ApiResponse<{ message: any }>> => {
    const response = await api.post('/team/messages', data)
    return response.data
  },

  // Presence and activity
  getOnlineUsers: async (): Promise<ApiResponse<{ users: any[] }>> => {
    const response = await api.get('/team/presence/online')
    return response.data
  },

  updatePresence: async (data: { status: string, activity?: string, location?: string }): Promise<ApiResponse> => {
    const response = await api.post('/team/presence', data)
    return response.data
  },

  getActivity: async (): Promise<ApiResponse<{ activities: any[] }>> => {
    const response = await api.get('/team-activity/activity')
    return response.data
  },

  // Virtual rooms (if implemented)
  getVirtualRooms: async (): Promise<ApiResponse<{ rooms: any[] }>> => {
    const response = await api.get('/team/virtual-rooms')
    return response.data
  },

  joinRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/team/virtual-rooms/${roomId}/join`)
    return response.data
  },

  leaveRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/team/virtual-rooms/${roomId}/leave`)
    return response.data
  }
}

// HR API calls
export const hrApi = {
  // Employees
  getEmployees: async (): Promise<ApiResponse<{ employees: any[] }>> => {
    const response = await api.get('/hr/employees')
    return response.data
  },

  getEmployee: async (id: string): Promise<ApiResponse<{ employee: any }>> => {
    const response = await api.get(`/hr/employees/${id}`)
    return response.data
  },

  updateEmployee: async (id: string, data: any): Promise<ApiResponse<{ employee: any }>> => {
    const response = await api.put(`/hr/employees/${id}`, data)
    return response.data
  },

  // Leave requests
  getLeaveRequests: async (): Promise<ApiResponse<{ leaveRequests: any[] }>> => {
    const response = await api.get('/hr/leaves')
    return response.data
  },

  createLeaveRequest: async (data: any): Promise<ApiResponse<{ leaveRequest: any }>> => {
    const response = await api.post('/hr/leaves', data)
    return response.data
  },

  updateLeaveRequest: async (id: string, data: any): Promise<ApiResponse<{ leaveRequest: any }>> => {
    const response = await api.put(`/hr/leaves/${id}`, data)
    return response.data
  },

  // HR statistics
  getHRStatistics: async (): Promise<ApiResponse<{ statistics: any }>> => {
    const response = await api.get('/hr/statistics')
    return response.data
  }
}

// Learning API calls
export const learningApi = {
  // Courses
  getCourses: async (params?: { category?: string, level?: string, search?: string }): Promise<ApiResponse<{ courses: any[] }>> => {
    const response = await api.get('/learning/courses', { params })
    return response.data
  },

  getCourse: async (id: string): Promise<ApiResponse<{ course: any }>> => {
    const response = await api.get(`/learning/courses/${id}`)
    return response.data
  },

  enrollCourse: async (courseId: string): Promise<ApiResponse<{ enrollment: any }>> => {
    const response = await api.post(`/learning/courses/${courseId}/enroll`)
    return response.data
  },

  // Learning activities
  getActivities: async (): Promise<ApiResponse<{ activities: any[] }>> => {
    const response = await api.get('/learning/activities')
    return response.data
  },

  getProgress: async (): Promise<ApiResponse<{ progress: any }>> => {
    const response = await api.get('/learning/progress')
    return response.data
  },

  // Certifications
  getCertifications: async (): Promise<ApiResponse<{ certifications: any[] }>> => {
    const response = await api.get('/learning/certifications')
    return response.data
  },

  // Modules and lessons
  getModules: async (courseId: string): Promise<ApiResponse<{ modules: any[] }>> => {
    const response = await api.get(`/learning/courses/${courseId}/modules`)
    return response.data
  },

  getLessons: async (moduleId: string): Promise<ApiResponse<{ lessons: any[] }>> => {
    const response = await api.get(`/learning/modules/${moduleId}/lessons`)
    return response.data
  }
}

// Project API calls
export const projectApi = {
  // Project details
  getProject: async (id: string): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  updateProject: async (id: string, data: any): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  deleteProject: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/projects/${id}`)
    return response.data
  },

  // Project team
  getProjectTeam: async (id: string): Promise<ApiResponse<{ team: any[] }>> => {
    const response = await api.get(`/projects/${id}/team`)
    return response.data
  },

  // Project statistics
  getProjectStatistics: async (id: string): Promise<ApiResponse<{ statistics: any }>> => {
    const response = await api.get(`/projects/${id}/statistics`)
    return response.data
  },

  // Project milestones
  getProjectMilestones: async (id: string): Promise<ApiResponse<{ milestones: any[] }>> => {
    const response = await api.get(`/projects/${id}/milestones`)
    return response.data
  },

  createMilestone: async (projectId: string, data: any): Promise<ApiResponse<{ milestone: any }>> => {
    const response = await api.post(`/projects/${projectId}/milestones`, data)
    return response.data
  },

  updateMilestone: async (projectId: string, milestoneId: string, data: any): Promise<ApiResponse<{ milestone: any }>> => {
    const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, data)
    return response.data
  },

  deleteMilestone: async (projectId: string, milestoneId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`)
    return response.data
  }
}

// Admin API calls
export const adminApi = {
  // User management
  getUsers: async (params?: { page?: number, limit?: number, search?: string, status?: string, role?: string }): Promise<ApiResponse<{ users: any[], total: number }>> => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  getUser: async (userId: string): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  createUser: async (data: any): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.post('/admin/users', data)
    return response.data
  },

  updateUser: async (userId: string, data: any): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.put(`/admin/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  getUserAnalytics: async (timeframe?: string): Promise<ApiResponse<{ analytics: any }>> => {
    const response = await api.get('/admin/users/analytics', { params: { timeframe } })
    return response.data
  },

  // Audit logs
  getAuditLogs: async (params?: { page?: number, limit?: number, type?: string, userId?: string, startDate?: string, endDate?: string }): Promise<ApiResponse<{ logs: any[], total: number }>> => {
    const response = await api.get('/admin/audit-logs', { params })
    return response.data
  },

  getAuditLog: async (logId: string): Promise<ApiResponse<{ log: any }>> => {
    const response = await api.get(`/admin/audit-logs/${logId}`)
    return response.data
  },

  getAuditStats: async (params?: { timeframe?: string, organizationId?: string }): Promise<ApiResponse<{ totalEvents: number, securityEvents: number, highPriorityEvents: number, failedLogins: number, failedLoginsChange: number, dataChanges: number, dataChangesChange: number }>> => {
    const response = await api.get('/admin/audit-logs/stats', { params })
    return response.data
  },

  exportAuditLogs: async (params?: any): Promise<ApiResponse<{ downloadUrl: string }>> => {
    const response = await api.post('/admin/audit-logs/export', params)
    return response.data
  },

  // System settings
  getSystemSettings: async (): Promise<ApiResponse<{ settings: any }>> => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  updateSystemSettings: async (data: any): Promise<ApiResponse<{ settings: any }>> => {
    const response = await api.put('/admin/settings', data)
    return response.data
  },

  // System health
  getSystemHealth: async (): Promise<ApiResponse<{ health: any }>> => {
    const response = await api.get('/admin/system/health')
    return response.data
  },

  // Backups
  createBackup: async (): Promise<ApiResponse<{ backup: any }>> => {
    const response = await api.post('/admin/backups')
    return response.data
  },

  getBackupHistory: async (): Promise<ApiResponse<{ backups: any[] }>> => {
    const response = await api.get('/admin/backups')
    return response.data
  }
}

// Document API calls
export const documentApi = {
  // Document management
  getDocuments: async (params?: { projectId?: string, category?: string, status?: string, search?: string }): Promise<ApiResponse<{ documents: any[] }>> => {
    const response = await api.get('/documents', { params })
    return response.data
  },

  getDocument: async (documentId: string): Promise<ApiResponse<{ document: any }>> => {
    const response = await api.get(`/documents/${documentId}`)
    return response.data
  },

  createDocument: async (data: any): Promise<ApiResponse<{ document: any }>> => {
    const response = await api.post('/documents', data)
    return response.data
  },

  updateDocument: async (documentId: string, data: any): Promise<ApiResponse<{ document: any }>> => {
    const response = await api.put(`/documents/${documentId}`, data)
    return response.data
  },

  deleteDocument: async (documentId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/documents/${documentId}`)
    return response.data
  },

  // Document versions
  getDocumentVersions: async (documentId: string): Promise<ApiResponse<{ versions: any[] }>> => {
    const response = await api.get(`/documents/${documentId}/versions`)
    return response.data
  },

  createDocumentVersion: async (documentId: string, data: any): Promise<ApiResponse<{ version: any }>> => {
    const response = await api.post(`/documents/${documentId}/versions`, data)
    return response.data
  },

  getDocumentVersion: async (documentId: string, versionId: string): Promise<ApiResponse<{ version: any }>> => {
    const response = await api.get(`/documents/${documentId}/versions/${versionId}`)
    return response.data
  },

  // Document statistics
  getDocumentStatistics: async (): Promise<ApiResponse<{ statistics: any }>> => {
    const response = await api.get('/documents/statistics')
    return response.data
  },

  // Document categories
  getDocumentCategories: async (): Promise<ApiResponse<{ categories: any[] }>> => {
    const response = await api.get('/documents/categories')
    return response.data
  }
}

// Calendar/Event API calls
export const calendarApi = {
  // Event management
  getEvents: async (params?: { startDate?: string, endDate?: string, type?: string, projectId?: string }): Promise<ApiResponse<{ events: any[] }>> => {
    const response = await api.get('/community/events', { params })
    return response.data
  },

  createEvent: async (data: any): Promise<ApiResponse<{ event: any }>> => {
    const response = await api.post('/community/events', data)
    return response.data
  },

  updateEvent: async (eventId: string, data: any): Promise<ApiResponse<{ event: any }>> => {
    const response = await api.put(`/community/events/${eventId}`, data)
    return response.data
  },

  deleteEvent: async (eventId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/community/events/${eventId}`)
    return response.data
  },

  registerForEvent: async (eventId: string): Promise<ApiResponse> => {
    const response = await api.post(`/community/events/${eventId}/register`)
    return response.data
  },

  // Project events (if available)
  getProjectEvents: async (projectId: string): Promise<ApiResponse<{ events: any[] }>> => {
    const response = await api.get(`/projects/${projectId}/events`)
    return response.data
  }
}

// Enterprise/Project Management API calls
export const enterpriseApi = {
  // Risk management
  getRiskAssessments: async (params?: { projectId?: string }): Promise<ApiResponse<{ risks: any[] }>> => {
    const response = await api.get('/enterprise/risks', { params })
    return response.data
  },

  createRiskAssessment: async (data: any): Promise<ApiResponse<{ risk: any }>> => {
    const response = await api.post('/enterprise/risks', data)
    return response.data
  },

  updateRiskAssessment: async (riskId: string, data: any): Promise<ApiResponse<{ risk: any }>> => {
    const response = await api.put(`/enterprise/risks/${riskId}`, data)
    return response.data
  },

  deleteRiskAssessment: async (riskId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/enterprise/risks/${riskId}`)
    return response.data
  },

  // Monte Carlo simulations
  runMonteCarloSimulation: async (projectId: string, data: any): Promise<ApiResponse<{ simulation: any }>> => {
    const response = await api.post(`/enterprise/projects/${projectId}/monte-carlo`, data)
    return response.data
  },

  getMonteCarloSimulation: async (simulationId: string): Promise<ApiResponse<{ simulation: any }>> => {
    const response = await api.get(`/enterprise/simulations/${simulationId}`)
    return response.data
  },

  getProjectSimulations: async (projectId: string): Promise<ApiResponse<{ simulations: any[] }>> => {
    const response = await api.get(`/enterprise/projects/${projectId}/simulations`)
    return response.data
  },

  // Resource management
  getResourceAllocations: async (params?: { projectId?: string }): Promise<ApiResponse<{ allocations: any[] }>> => {
    const response = await api.get('/enterprise/resource-allocations', { params })
    return response.data
  },

  createResourceAllocation: async (data: any): Promise<ApiResponse<{ allocation: any }>> => {
    const response = await api.post('/enterprise/resource-allocations', data)
    return response.data
  },

  updateResourceAllocation: async (allocationId: string, data: any): Promise<ApiResponse<{ allocation: any }>> => {
    const response = await api.put(`/enterprise/resource-allocations/${allocationId}`, data)
    return response.data
  },

  deleteResourceAllocation: async (allocationId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/enterprise/resource-allocations/${allocationId}`)
    return response.data
  },

  getResourceUtilization: async (): Promise<ApiResponse<{ utilization: any }>> => {
    const response = await api.get('/enterprise/resource-utilization')
    return response.data
  },

  // WBS (Work Breakdown Structure)
  getWBSNodes: async (projectId: string): Promise<ApiResponse<{ nodes: any[] }>> => {
    const response = await api.get(`/enterprise/projects/${projectId}/wbs`)
    return response.data
  },

  createWBSNode: async (data: any): Promise<ApiResponse<{ node: any }>> => {
    const response = await api.post('/enterprise/wbs', data)
    return response.data
  },

  updateWBSNode: async (nodeId: string, data: any): Promise<ApiResponse<{ node: any }>> => {
    const response = await api.put(`/enterprise/wbs/${nodeId}`, data)
    return response.data
  },

  deleteWBSNode: async (nodeId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/enterprise/wbs/${nodeId}`)
    return response.data
  }
}

// AI/Usage API calls
export const aiApi = {
  // AI usage tracking (when implemented)
  getAIUsageStats: async (params?: { startDate?: string, endDate?: string }): Promise<ApiResponse<{ stats: any }>> => {
    const response = await api.get('/ai/usage-stats', { params })
    return response.data
  },

  // AI interactions
  getAIInteractions: async (params?: { limit?: number, type?: string }): Promise<ApiResponse<{ interactions: any[] }>> => {
    const response = await api.get('/ai/interactions', { params })
    return response.data
  },

  // AI insights
  getAIInsights: async (): Promise<ApiResponse<{ insights: any[] }>> => {
    const response = await api.get('/ai/insights')
    return response.data
  },

  // AI suggestions
  getAISuggestions: async (context: string): Promise<ApiResponse<{ suggestions: any[] }>> => {
    const response = await api.post('/ai/suggestions', { context })
    return response.data
  }
}

// Community API calls
export const communityApi = {
  // Posts
  getPosts: async (params?: { category?: string, search?: string, limit?: number }): Promise<ApiResponse<{ posts: any[] }>> => {
    const response = await api.get('/community/posts', { params })
    return response.data
  },

  getPost: async (postId: string): Promise<ApiResponse<{ post: any }>> => {
    const response = await api.get(`/community/posts/${postId}`)
    return response.data
  },

  createPost: async (data: any): Promise<ApiResponse<{ post: any }>> => {
    const response = await api.post('/community/posts', data)
    return response.data
  },

  updatePost: async (postId: string, data: any): Promise<ApiResponse<{ post: any }>> => {
    const response = await api.put(`/community/posts/${postId}`, data)
    return response.data
  },

  deletePost: async (postId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/community/posts/${postId}`)
    return response.data
  },

  // Events
  getEvents: async (params?: { category?: string, upcoming?: boolean }): Promise<ApiResponse<{ events: any[] }>> => {
    const response = await api.get('/community/events', { params })
    return response.data
  },

  registerForEvent: async (eventId: string): Promise<ApiResponse> => {
    const response = await api.post(`/community/events/${eventId}/register`)
    return response.data
  },

  // Groups
  getGroups: async (params?: { category?: string, search?: string }): Promise<ApiResponse<{ groups: any[] }>> => {
    const response = await api.get('/community/groups', { params })
    return response.data
  },

  joinGroup: async (groupId: string): Promise<ApiResponse> => {
    const response = await api.post(`/community/groups/${groupId}/join`)
    return response.data
  },

  leaveGroup: async (groupId: string): Promise<ApiResponse> => {
    const response = await api.post(`/community/groups/${groupId}/leave`)
    return response.data
  }
}

// Files API calls
export const filesApi = {
  upload: async (file: File, metadata?: {
    projectId?: string
    type?: string
    category?: string
    description?: string
    isPublic?: boolean
  }): Promise<ApiResponse<{ document: any }>> => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  uploadMultiple: async (files: File[], metadata?: {
    projectId?: string
    type?: string
    category?: string
    description?: string
    isPublic?: boolean
  }): Promise<ApiResponse<{ documents: any[] }>> => {
    const formData = new FormData()
    
    files.forEach(file => {
      formData.append('files', file)
    })
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
    }

    const response = await api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getInfo: async (id: string): Promise<ApiResponse<{ document: any }>> => {
    const response = await api.get(`/files/${id}`)
    return response.data
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/files/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/files/${id}`)
    return response.data
  },

  getProjectFiles: async (projectId: string, params?: {
    page?: number
    limit?: number
    type?: string
    category?: string
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await api.get(`/files/project/${projectId}`, { params })
    return response.data
  }
}

// Notifications API calls
export const notificationsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
    types?: string[]
    priority?: string
  }): Promise<ApiResponse<PaginatedResponse<any> & { unreadCount: number }>> => {
    const response = await api.get('/notifications', { 
      params: {
        ...params,
        types: params?.types?.join(',')
      }
    })
    return response.data
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },

  markAsRead: async (id: string): Promise<ApiResponse> => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async (): Promise<ApiResponse<{ updatedCount: number }>> => {
    const response = await api.patch('/notifications/mark-all-read')
    return response.data
  },

  getTypes: async (): Promise<ApiResponse<{
    types: string[]
    priorities: string[]
  }>> => {
    const response = await api.get('/notifications/types')
    return response.data
  },

  sendTestNotification: async (data: {
    title?: string
    message?: string
    type?: string
  }): Promise<ApiResponse> => {
    const response = await api.post('/notifications/test', data)
    return response.data
  }
}

// Tasks API calls
export const tasksApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    projectId?: string
    status?: string
    priority?: string
    assignedTo?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await api.get('/tasks', { params })
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<{ task: any }>> => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  create: async (taskData: any): Promise<ApiResponse<{ task: any }>> => {
    const response = await api.post('/tasks', taskData)
    return response.data
  },

  update: async (id: string, taskData: any): Promise<ApiResponse<{ task: any }>> => {
    const response = await api.put(`/tasks/${id}`, taskData)
    return response.data
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<{ task: any }>> => {
    const response = await api.patch(`/tasks/${id}/status`, { status })
    return response.data
  },

  getProjectTasks: async (projectId: string, params?: {
    status?: string
    assignedTo?: string
  }): Promise<ApiResponse<{ tasks: any[] }>> => {
    const response = await api.get(`/tasks`, { 
      params: {
        projectId,
        ...params
      }
    })
    return response.data
  }
}

// Users API calls
export const usersApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  updateProfile: async (data: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    companyName?: string
    designation?: string
  }): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.put('/users/me', data)
    return response.data
  },

  search: async (query: string, options?: {
    role?: string
    limit?: number
  }): Promise<ApiResponse<{ users: any[] }>> => {
    const response = await api.get('/users/search', { 
      params: { q: query, ...options }
    })
    return response.data
  }
}

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    const response = await api.get('/health')
    return response.data
  },

  detailed: async (): Promise<ApiResponse> => {
    const response = await api.get('/health/detailed')
    return response.data
  }
}

// Studio API calls
export const studioApi = {
  getFeed: async (params?: {
    limit?: number
    offset?: number
    filter?: string
    types?: string[]
  }): Promise<ApiResponse<{ items: any[], total: number, hasMore: boolean }>> => {
    const response = await api.get('/studio/feed', { 
      params: {
        ...params,
        types: params?.types?.join(',')
      }
    })
    return response.data
  },

  getStats: async (): Promise<ApiResponse<{
    activeProjects: number
    pendingTasks: number
    overdueInvoices: number
    monthlyRevenue: number
    trends: any
  }>> => {
    const response = await api.get('/studio/stats')
    return response.data
  },

  getActivityChart: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/studio/activity-chart')
    return response.data
  },

  reactToFeedItem: async (itemId: string, type: string = 'like'): Promise<ApiResponse> => {
    const response = await api.post(`/studio/feed/${itemId}/react`, { type })
    return response.data
  }
}

// Design Brief API calls
export const designBriefApi = {
  // Get all design briefs
  getAll: async (params?: {
    project_id?: string
    status?: string
    client_id?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ briefs: any[] }>> => {
    const response = await api.get('/design-briefs', { params })
    return response.data
  },

  // Get design brief by ID
  getById: async (id: string): Promise<ApiResponse<{ brief: any }>> => {
    const response = await api.get(`/design-briefs/${id}`)
    return response.data
  },

  // Create new design brief
  create: async (data: any): Promise<ApiResponse<{ brief: any }>> => {
    const response = await api.post('/design-briefs', data)
    return response.data
  },

  // Update design brief
  update: async (id: string, data: any): Promise<ApiResponse<{ brief: any }>> => {
    const response = await api.put(`/design-briefs/${id}`, data)
    return response.data
  },

  // Submit design brief for review
  submit: async (id: string): Promise<ApiResponse> => {
    const response = await api.post(`/design-briefs/${id}/submit`)
    return response.data
  },

  // Review design brief
  review: async (id: string, data: {
    status: string
    feedback?: string
    approved?: boolean
  }): Promise<ApiResponse> => {
    const response = await api.post(`/design-briefs/${id}/review`, data)
    return response.data
  },

  // Convert brief to tasks
  convertToTasks: async (id: string): Promise<ApiResponse<{ tasks: any[] }>> => {
    const response = await api.post(`/design-briefs/${id}/convert-to-tasks`)
    return response.data
  },

  // Delete design brief
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/design-briefs/${id}`)
    return response.data
  }
}

// Virtual Office API calls
export const virtualOfficeApi = {
  // Get virtual office state
  getState: async (): Promise<ApiResponse<{ rooms: any[], onlineUsers: any[], totalUsers: number }>> => {
    const response = await api.get('/virtual-office/state')
    return response.data
  },

  // Get team members for virtual office
  getTeamMembers: async (): Promise<ApiResponse<{ members: any[] }>> => {
    const response = await api.get('/virtual-office/team-members')
    return response.data
  },

  // Get virtual rooms
  getRooms: async (): Promise<ApiResponse<{ rooms: any[] }>> => {
    const response = await api.get('/virtual-office/rooms')
    return response.data
  },

  // Create a new meeting room
  createMeetingRoom: async (data: {
    name: string
    type: 'meeting' | 'presentation' | 'brainstorm' | 'client' | 'training'
    maxParticipants: number
    description?: string
    isPublic?: boolean
    scheduledAt?: string
    duration?: number
  }): Promise<ApiResponse<{ room: any }>> => {
    const response = await api.post('/virtual-office/meeting-rooms', data)
    return response.data
  },

  // Get meeting rooms
  getMeetingRooms: async (params?: {
    type?: string
    status?: string
    isPublic?: boolean
  }): Promise<ApiResponse<{ rooms: any[] }>> => {
    const response = await api.get('/virtual-office/meeting-rooms', { params })
    return response.data
  },

  // Join a meeting room
  joinMeetingRoom: async (roomId: string): Promise<ApiResponse<{ room: any, participants: any[] }>> => {
    const response = await api.post(`/virtual-office/meeting-rooms/${roomId}/join`)
    return response.data
  },

  // Leave a meeting room
  leaveMeetingRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/virtual-office/meeting-rooms/${roomId}/leave`)
    return response.data
  },

  // Get meeting room participants
  getMeetingParticipants: async (roomId: string): Promise<ApiResponse<{ participants: any[] }>> => {
    const response = await api.get(`/virtual-office/meeting-rooms/${roomId}/participants`)
    return response.data
  },

  // Join a virtual room
  joinRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/virtual-office/rooms/${roomId}/join`)
    return response.data
  },

  // Leave a virtual room
  leaveRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/virtual-office/rooms/${roomId}/leave`)
    return response.data
  },

  // Update user presence
  updatePresence: async (data: {
    status: string
    location?: string
    currentActivity?: string
    mood?: string
  }): Promise<ApiResponse> => {
    const response = await api.put('/virtual-office/presence', data)
    return response.data
  },

  // Get chat messages for a room
  getChatMessages: async (roomId: string, params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ messages: any[] }>> => {
    const response = await api.get(`/virtual-office/rooms/${roomId}/messages`, { params })
    return response.data
  },

  // Send a chat message
  sendMessage: async (roomId: string, data: {
    content: string
    type?: string
  }): Promise<ApiResponse<{ message: any }>> => {
    const response = await api.post(`/virtual-office/rooms/${roomId}/messages`, data)
    return response.data
  },

  // Get team locations
  getTeamLocations: async (): Promise<ApiResponse<{ locations: any[] }>> => {
    const response = await api.get('/virtual-office/locations')
    return response.data
  },

  // Update user location
  updateLocation: async (data: {
    location: string
    coordinates?: { lat: number, lng: number }
    address?: string
    isRemote?: boolean
  }): Promise<ApiResponse> => {
    const response = await api.put('/virtual-office/location', data)
    return response.data
  },

  // Get team calendar events
  getCalendarEvents: async (params?: {
    startDate?: string
    endDate?: string
    type?: string
  }): Promise<ApiResponse<{ events: any[] }>> => {
    const response = await api.get('/virtual-office/calendar', { params })
    return response.data
  },

  // Create calendar event
  createCalendarEvent: async (data: {
    title: string
    description?: string
    startTime: string
    endTime: string
    type: 'meeting' | 'presentation' | 'workshop' | 'social'
    participants?: string[]
    location?: string
    isVirtual?: boolean
    meetingLink?: string
  }): Promise<ApiResponse<{ event: any }>> => {
    const response = await api.post('/virtual-office/calendar', data)
    return response.data
  },

  // Get games and activities
  getGames: async (): Promise<ApiResponse<{ games: any[] }>> => {
    const response = await api.get('/virtual-office/games')
    return response.data
  },

  // Start a game session
  startGame: async (gameId: string, data?: {
    participants?: string[]
    settings?: any
  }): Promise<ApiResponse<{ session: any }>> => {
    const response = await api.post(`/virtual-office/games/${gameId}/start`, data)
    return response.data
  },

  // Get ARIA insights
  getARIAInsights: async (): Promise<ApiResponse<{ insights: any[] }>> => {
    const response = await api.get('/virtual-office/aria/insights')
    return response.data
  },

  // Send message to ARIA
  sendARIAMessage: async (message: string): Promise<ApiResponse<{ response: any }>> => {
    const response = await api.post('/virtual-office/aria/chat', { message })
    return response.data
  }
}

export default api