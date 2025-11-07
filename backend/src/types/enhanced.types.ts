import { Request } from 'express'

// Enhanced request interface for file uploads
export interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
  file?: Express.Multer.File
}

// Organization context for multi-tenant operations
export interface OrganizationContext {
  id: string
  name: string
  slug: string
  planId: string
  features: string[]
  limits: {
    maxUsers: number
    maxProjects: number
    maxStorage: number
    usedStorage: number
  }
}

// User context with organization role
export interface UserContext {
  id: string
  email: string
  username: string
  role: string // System role
  organizationId: string
  organizationRole: string // Role within organization
  organizationName?: string
  permissions?: string[]
}

// Enhanced request with multi-tenant context
export interface EnhancedRequest extends Request {
  user?: UserContext
  organization?: OrganizationContext
}

// Socket user interface
export interface SocketUser {
  id: string
  email: string
  name?: string
  organizationId: string
  organizationRole: string
}

// Notification types
export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  title: string
  message: string
  data?: {
    resourceType?: string
    resourceId?: string
    url?: string
    [key: string]: any
  }
}

// Real-time update types
export interface RealtimeUpdate {
  type: string
  resource: string
  resourceId: string
  action: 'created' | 'updated' | 'deleted'
  data: any
  userId?: string
  timestamp: Date
}

// Dashboard widget configuration
export interface WidgetConfiguration {
  id: string
  type: string
  title: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  settings: Record<string, any>
  isVisible: boolean
}

// Project team member role
export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER' | 'GUEST'

// Project member permissions
export type ProjectPermission = 
  | 'view' 
  | 'edit' 
  | 'delete' 
  | 'comment' 
  | 'manage_team' 
  | 'manage_files' 
  | 'manage_tasks'

// Organization role enum
export type OrganizationRole = 
  | 'ORG_ADMIN'
  | 'PROJECT_LEAD'
  | 'SENIOR_DESIGNER'
  | 'SENIOR_ARCHITECT'
  | 'DESIGNER'
  | 'ARCHITECT'
  | 'CONTRACTOR'
  | 'ENGINEER'
  | 'STAFF'
  | 'CLIENT'
  | 'CONSULTANT'
  | 'MEMBER'
  | 'VIEWER'

// File upload result
export interface UploadResult {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  type: string
}

// Invitation status
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'

// Activity types for audit logs
export type ActivityAction = 'create' | 'update' | 'delete' | 'view' | 'download' | 'share'

export type ActivityResource = 
  | 'project'
  | 'task'
  | 'document'
  | 'user'
  | 'organization'
  | 'invitation'
  | 'timeline'
  | 'milestone'

// Timeline and milestone types
export interface TimelineEntry {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  color?: string
}

export interface MilestoneData {
  id: string
  name: string
  description?: string
  dueDate: Date
  completedDate?: Date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED'
  progress: number
}

// Progress tracking
export interface ProjectProgress {
  overall: number
  tasks: number
  milestones: number
  timeline: number
  budget?: number
}

// Statistics interfaces
export interface ProjectStatistics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  statusDistribution: Array<{
    status: string
    count: number
  }>
}

export interface TaskStatistics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  statusDistribution: Array<{
    status: string
    count: number
  }>
}

export interface OrganizationStatistics {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  roleDistribution: Array<{
    role: string
    count: number
  }>
  departmentDistribution: Array<{
    department: string
    count: number
  }>
}

// Storage information
export interface StorageInfo {
  used: number // in MB
  total: number // in MB
  percentage: number
  fileCount: number
  typeDistribution: Array<{
    type: string
    count: number
    size: number
  }>
}

// Collaboration types
export interface PresenceUpdate {
  userId: string
  status: 'online' | 'away' | 'busy' | 'offline'
  timestamp: Date
  location?: {
    page?: string
    projectId?: string
    documentId?: string
  }
}

export interface CursorPosition {
  userId: string
  userEmail: string
  x: number
  y: number
  projectId?: string
  documentId?: string
  timestamp: Date
}

export interface TypingIndicator {
  userId: string
  userEmail: string
  projectId?: string
  taskId?: string
  isTyping: boolean
  timestamp: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Search and filtering
export interface SearchFilters {
  search?: string
  status?: string
  priority?: string
  type?: string
  category?: string
  assignedTo?: string
  createdBy?: string
  startDate?: string
  endDate?: string
  tags?: string[]
}

export interface SortOptions {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}