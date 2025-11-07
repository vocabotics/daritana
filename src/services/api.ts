import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { performanceMonitor } from '@/hooks/usePerformanceMonitor';
import { cacheManager, projectsCache, tasksCache, usersCache, filesCache } from '@/utils/caching';

// API base URL - Updated to match backend route structure
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5004';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
let authToken: string | null = localStorage.getItem('access_token');

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Generate cache key for requests
const generateCacheKey = (config: AxiosRequestConfig): string => {
  const { method = 'GET', url = '', data } = config;
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method.toUpperCase()}:${url}:${btoa(dataStr)}`;
};

// Request interceptor with retry logic and deduplication
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: new Date() };
    
    // Add cache key for deduplication
    config.cacheKey = generateCacheKey(config);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with performance monitoring and caching
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    
    // Performance monitoring
    if (config.metadata) {
      const duration = new Date().getTime() - config.metadata.startTime.getTime();
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
      }
      
      // Monitor performance
      if (duration > 2000) {
        console.warn(`Slow API response: ${config.url} took ${duration}ms`);
      }
    }
    
    // Cache GET responses
    if (config.method?.toUpperCase() === 'GET' && config.url && response.data) {
      const cacheKey = config.cacheKey || generateCacheKey(config);
      const tags = getCacheTagsFromUrl(config.url);
      
      cacheManager.set(cacheKey, response.data, {
        ttl: getCacheTTLFromUrl(config.url),
        tags,
      });
    }
    
    // Remove from pending requests
    if (config.cacheKey && pendingRequests.has(config.cacheKey)) {
      pendingRequests.delete(config.cacheKey);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; cacheKey?: string };
    
    // Remove from pending requests on error
    if (originalRequest?.cacheKey && pendingRequests.has(originalRequest.cacheKey)) {
      pendingRequests.delete(originalRequest.cacheKey);
    }
    
    // Log error details
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }
    
    // Handle different error types
    if (error.response?.status === 401) {
      // Try to refresh token first
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          if (response.data.tokens) {
            authToken = response.data.tokens.accessToken;
            localStorage.setItem('access_token', authToken);
            localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${authToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // Token refresh failed or no refresh token
      authToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      
      toast.error('Session expired', {
        description: 'Please log in again to continue',
      });
      
      // Disabled redirect to prevent loops
      // setTimeout(() => {
      //   window.location.href = '/login';
      // }, 1000);
    } else if (error.response?.status === 403) {
      toast.error('Access denied', {
        description: 'You do not have permission to perform this action',
      });
    } else if (error.response?.status === 429) {
      toast.error('Too many requests', {
        description: 'Please wait a moment before trying again',
      });
    } else if (error.response?.status >= 500) {
      toast.error('Server error', {
        description: 'Something went wrong on our end. Please try again later.',
      });
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Network error', {
        description: 'Please check your internet connection and try again',
      });
    } else if (error.response?.status === 400) {
      // Don't show generic toast for 400 errors as they're usually handled specifically
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Invalid request';
      if (process.env.NODE_ENV === 'development') {
        toast.error('Bad request', {
          description: errorMessage,
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Socket connection
let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Function to update auth token (call this after login)
export const updateAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('access_token', token);
  // Update axios default header
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Auth API - Updated to handle backend response structure
export const authAPI = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    // Handle multi-tenant backend response
    if (response.data.token) {
      authToken = response.data.token;
      localStorage.setItem('access_token', authToken);
      
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Store organization data
      if (response.data.organization) {
        localStorage.setItem('organization', JSON.stringify(response.data.organization));
      }
      
      if (socket) {
        socket.auth = { token: authToken };
        socket.connect();
      }
    } else if (response.data.tokens) {
      // Fallback for other auth format
      authToken = response.data.tokens.accessToken;
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  async register(data: {
    email: string;
    username?: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phoneNumber?: string;
    companyName?: string;
  }) {
    const response = await apiClient.post('/auth/register', data);
    // Backend returns tokens object
    if (response.data.tokens) {
      authToken = response.data.tokens.accessToken;
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
      
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      disconnectSocket();
    }
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    if (response.data.tokens) {
      authToken = response.data.tokens.accessToken;
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
    }
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

// Documents API
export const documentsAPI = {
  async getAll(params?: { status?: string; category?: string; projectId?: string }) {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  async upload(file: File, data: { name: string; category?: string; projectId?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: { name?: string; status?: string; category?: string }) {
    const response = await apiClient.patch(`/documents/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },

  async createVersion(
    documentId: string,
    data: {
      version: string;
      branch?: string;
      message: string;
      description?: string;
      file?: File;
    }
  ) {
    const formData = new FormData();
    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('version', data.version);
    formData.append('message', data.message);
    if (data.branch) formData.append('branch', data.branch);
    if (data.description) formData.append('description', data.description);

    const response = await apiClient.post(`/documents/${documentId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  async getAll(params?: { documentId?: string; status?: string; participantId?: string }) {
    const response = await apiClient.get('/reviews', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },

  async create(data: {
    documentId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
  }) {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      endTime?: string;
    }
  ) {
    const response = await apiClient.patch(`/reviews/${id}`, data);
    return response.data;
  },

  async start(id: string) {
    const response = await apiClient.post(`/reviews/${id}/start`);
    return response.data;
  },

  async end(id: string) {
    const response = await apiClient.post(`/reviews/${id}/end`);
    return response.data;
  },

  async addParticipant(reviewId: string, userId: string, role?: string) {
    const response = await apiClient.post(`/reviews/${reviewId}/participants`, {
      userId,
      role,
    });
    return response.data;
  },

  async recordDecision(reviewId: string, type: string, description: string) {
    const response = await apiClient.post(`/reviews/${reviewId}/decisions`, {
      type,
      description,
    });
    return response.data;
  },
};

// WebRTC helpers
export const webRTCService = {
  socket: null as Socket | null,
  peerConnections: new Map<string, RTCPeerConnection>(),

  initialize() {
    this.socket = getSocket();
    if (!this.socket) {
      this.socket = connectSocket();
    }
  },

  async joinRoom(roomId: string, userId: string, username: string) {
    this.initialize();
    this.socket?.emit('webrtc-join-room', { roomId, userId, username });

    return new Promise((resolve) => {
      this.socket?.once('webrtc-room-joined', resolve);
    });
  },

  async createPeerConnection(targetUserId: string, isInitiator: boolean = false) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    this.peerConnections.set(targetUserId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          targetUserId,
          roomId: this.getCurrentRoomId(),
        });
      }
    };

    return pc;
  },

  getCurrentRoomId(): string {
    // This should be managed by your application state
    return '';
  },

  cleanup() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
  },
};

// Cache utility functions
const getCacheTagsFromUrl = (url: string): string[] => {
  const tags: string[] = [];
  
  if (url.includes('/projects')) tags.push('projects');
  if (url.includes('/tasks')) tags.push('tasks');
  if (url.includes('/users')) tags.push('users');
  if (url.includes('/files')) tags.push('files');
  if (url.includes('/dashboard')) tags.push('dashboard');
  if (url.includes('/team')) tags.push('team');
  
  return tags;
};

const getCacheTTLFromUrl = (url: string): number => {
  // Different cache TTL based on data freshness requirements
  if (url.includes('/dashboard')) return 2 * 60 * 1000; // 2 minutes
  if (url.includes('/tasks')) return 1 * 60 * 1000; // 1 minute
  if (url.includes('/projects')) return 5 * 60 * 1000; // 5 minutes
  if (url.includes('/users')) return 10 * 60 * 1000; // 10 minutes
  if (url.includes('/files')) return 5 * 60 * 1000; // 5 minutes
  
  return 3 * 60 * 1000; // Default 3 minutes
};

// Enhanced API wrapper with caching and performance monitoring
export const apiWrapper = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      // Check cache first
      const cacheKey = generateCacheKey({ method: 'GET', url, ...config });
      const cached = cacheManager.get<T>(cacheKey);
      
      if (cached !== null) {
        return cached;
      }
      
      // Check for pending identical requests (deduplication)
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
      }
      
      // Measure API call performance
      const requestPromise = performanceMonitor.measureApiCall(async () => {
        const response = await apiClient.get<T>(url, config);
        return response.data;
      }, url);
      
      // Store pending request
      pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'GET', url);
    }
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'POST', url);
    }
  },

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'PUT', url);
    }
  },

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'PATCH', url);
    }
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, 'DELETE', url);
    }
  },

  handleError(error: AxiosError, method: string, url: string): Error {
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'An unexpected error occurred';
    
    const enhancedError = new Error(message);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).method = method;
    (enhancedError as any).url = url;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  },
};

// Retry wrapper for critical operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`${context || 'Operation'} failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      console.warn(`${context || 'Operation'} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Exponential backoff
    }
  }
  
  throw lastError!;
};

export { apiClient };
export default apiClient;