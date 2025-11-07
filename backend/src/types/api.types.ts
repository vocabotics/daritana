import { User, Project, Task, UserRole, ProjectStatus, TaskStatus } from '@prisma/client';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Request Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
  filter?: Record<string, any>;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  company?: string;
  position?: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  linkedin?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  theme?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Management Types
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  company?: string;
  position?: string;
  avatar?: string;
  isActive: boolean;
  isBanned: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    projects: number;
    tasks: number;
  };
}

export interface UserStats {
  overview: {
    total: number;
    active: number;
    banned: number;
    unverified: number;
    inactive: number;
  };
  roleDistribution: Record<UserRole, number>;
  recentUsers: UserListItem[];
}

// Project Types
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: ProjectStatus;
  priority: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  actualCost?: number;
  progress: number;
  address?: string;
  city?: string;
  state?: string;
  type?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    tasks: number;
    documents: number;
  };
}

export interface ProjectDetail extends ProjectListItem {
  tasks: TaskListItem[];
  documents: DocumentListItem[];
  timelines: ProjectTimeline[];
  designBriefs: DesignBrief[];
  milestones: Milestone[];
}

// Task Types
export interface TaskListItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: string;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  project: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignments: TaskAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAssignment {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  assignedAt: Date;
}

// Document Types
export interface DocumentListItem {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  category: string;
  url?: string;
  version: string;
  isLatest: boolean;
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Timeline Types
export interface ProjectTimeline {
  id: string;
  phase: string;
  startDate: Date;
  endDate: Date;
  status: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Design Brief Types
export interface DesignBrief {
  id: string;
  stylePreferences: string[];
  roomRequirements: Record<string, any>;
  budget: number;
  timeline: string;
  specialRequests?: string;
  culturalElements: string[];
  sustainabilityFeatures: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Milestone Types
export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  payment?: number;
  createdAt: Date;
  updatedAt: Date;
}

// System Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    storage?: 'up' | 'down';
  };
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    version: string;
    platform: string;
  };
}

// Audit Log Types
export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Session Types
export interface SessionInfo {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
}

// Notification Types
export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}