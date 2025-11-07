// Role-Based Access Control (RBAC) System
// Defines permissions for each role in the Daritana platform

export type UserRole = 'client' | 'staff' | 'contractor' | 'project_lead' | 'designer' | 'admin'

export type Permission = 
  // Project permissions
  | 'project.create'
  | 'project.read'
  | 'project.update'
  | 'project.delete'
  | 'project.assign_team'
  | 'project.manage_budget'
  | 'project.approve'
  
  // Task permissions
  | 'task.create'
  | 'task.read'
  | 'task.update'
  | 'task.delete'
  | 'task.assign'
  | 'task.complete'
  
  // File permissions
  | 'file.upload'
  | 'file.read'
  | 'file.delete'
  | 'file.share'
  | 'file.download'
  
  // User permissions
  | 'user.create'
  | 'user.read'
  | 'user.update'
  | 'user.delete'
  | 'user.manage_roles'
  | 'user.invite'
  
  // Financial permissions
  | 'finance.create_quotation'
  | 'finance.approve_quotation'
  | 'finance.create_invoice'
  | 'finance.view_reports'
  | 'finance.manage_payments'
  
  // Client permissions
  | 'client.view_own_projects'
  | 'client.approve_designs'
  | 'client.request_changes'
  | 'client.view_invoices'
  
  // Design permissions
  | 'design.create'
  | 'design.update'
  | 'design.approve'
  | 'design.share'
  
  // Compliance permissions
  | 'compliance.submit'
  | 'compliance.approve'
  | 'compliance.verify'
  
  // Admin permissions
  | 'admin.access_dashboard'
  | 'admin.manage_system'
  | 'admin.view_analytics'
  | 'admin.manage_integrations'

// Role permission mappings
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    'project.create',
    'project.read',
    'project.update',
    'project.delete',
    'project.assign_team',
    'project.manage_budget',
    'project.approve',
    'task.create',
    'task.read',
    'task.update',
    'task.delete',
    'task.assign',
    'task.complete',
    'file.upload',
    'file.read',
    'file.delete',
    'file.share',
    'file.download',
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.manage_roles',
    'user.invite',
    'finance.create_quotation',
    'finance.approve_quotation',
    'finance.create_invoice',
    'finance.view_reports',
    'finance.manage_payments',
    'design.create',
    'design.update',
    'design.approve',
    'design.share',
    'compliance.submit',
    'compliance.approve',
    'compliance.verify',
    'admin.access_dashboard',
    'admin.manage_system',
    'admin.view_analytics',
    'admin.manage_integrations'
  ],
  
  project_lead: [
    'project.create',
    'project.read',
    'project.update',
    'project.delete',
    'project.assign_team',
    'project.manage_budget',
    'project.approve',
    'task.create',
    'task.read',
    'task.update',
    'task.delete',
    'task.assign',
    'task.complete',
    'file.upload',
    'file.read',
    'file.delete',
    'file.share',
    'file.download',
    'user.read',
    'user.invite',
    'finance.create_quotation',
    'finance.approve_quotation',
    'finance.create_invoice',
    'finance.view_reports',
    'design.create',
    'design.update',
    'design.approve',
    'design.share',
    'compliance.submit',
    'compliance.approve'
  ],
  
  designer: [
    'project.read',
    'project.update',
    'task.create',
    'task.read',
    'task.update',
    'task.complete',
    'file.upload',
    'file.read',
    'file.share',
    'file.download',
    'user.read',
    'design.create',
    'design.update',
    'design.share',
    'compliance.submit'
  ],
  
  contractor: [
    'project.read',
    'task.read',
    'task.update',
    'task.complete',
    'file.upload',
    'file.read',
    'file.download',
    'finance.create_quotation',
    'finance.view_reports'
  ],
  
  staff: [
    'project.read',
    'project.update',
    'task.create',
    'task.read',
    'task.update',
    'task.assign',
    'task.complete',
    'file.upload',
    'file.read',
    'file.share',
    'file.download',
    'user.read',
    'compliance.submit'
  ],
  
  client: [
    'client.view_own_projects',
    'client.approve_designs',
    'client.request_changes',
    'client.view_invoices',
    'project.read', // Only their own projects
    'task.read',    // Only their project tasks
    'file.read',    // Only their project files
    'file.download' // Only their project files
  ]
}

// Permission checking functions
export class PermissionService {
  /**
   * Check if a user role has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[role] || []
    return permissions.includes(permission)
  }

  /**
   * Check if a user role has any of the specified permissions
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission))
  }

  /**
   * Check if a user role has all of the specified permissions
   */
  static hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission))
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return rolePermissions[role] || []
  }

  /**
   * Check if user can access a resource
   */
  static canAccessResource(
    userRole: UserRole,
    resourceType: 'project' | 'task' | 'file' | 'user' | 'finance',
    action: 'create' | 'read' | 'update' | 'delete',
    isOwner: boolean = false
  ): boolean {
    // Clients have special rules - they can only access their own resources
    if (userRole === 'client' && !isOwner && action !== 'create') {
      return false
    }

    const permission = `${resourceType}.${action}` as Permission
    return this.hasPermission(userRole, permission)
  }

  /**
   * Get accessible menu items based on role
   */
  static getAccessibleMenuItems(role: UserRole): string[] {
    const menuItems: string[] = ['dashboard']

    if (this.hasPermission(role, 'project.read')) {
      menuItems.push('projects')
    }
    if (this.hasPermission(role, 'task.read')) {
      menuItems.push('tasks', 'kanban')
    }
    if (this.hasPermission(role, 'file.read')) {
      menuItems.push('files')
    }
    if (this.hasPermission(role, 'design.create') || this.hasPermission(role, 'design.update')) {
      menuItems.push('design-brief')
    }
    if (this.hasAnyPermission(role, ['finance.create_quotation', 'finance.create_invoice', 'finance.view_reports'])) {
      menuItems.push('finance')
    }
    if (this.hasPermission(role, 'compliance.submit')) {
      menuItems.push('compliance')
    }
    if (this.hasPermission(role, 'user.read')) {
      menuItems.push('team')
    }
    if (this.hasPermission(role, 'admin.access_dashboard')) {
      menuItems.push('admin')
    }
    if (role === 'client') {
      menuItems.push('approvals', 'messages')
    }

    return menuItems
  }

  /**
   * Check if user can perform bulk operations
   */
  static canPerformBulkOperation(role: UserRole, operation: 'delete' | 'export' | 'archive'): boolean {
    const bulkPermissions: Record<string, UserRole[]> = {
      delete: ['admin', 'project_lead'],
      export: ['admin', 'project_lead', 'staff'],
      archive: ['admin', 'project_lead']
    }

    return bulkPermissions[operation]?.includes(role) || false
  }
}

// React Hook for using permissions
import { useAuthStore } from '@/store/authStore'

export function usePermissions() {
  const { user } = useAuthStore()
  const userRole = user?.role as UserRole

  return {
    hasPermission: (permission: Permission) => 
      PermissionService.hasPermission(userRole, permission),
    
    hasAnyPermission: (permissions: Permission[]) => 
      PermissionService.hasAnyPermission(userRole, permissions),
    
    hasAllPermissions: (permissions: Permission[]) => 
      PermissionService.hasAllPermissions(userRole, permissions),
    
    canAccessResource: (
      resourceType: 'project' | 'task' | 'file' | 'user' | 'finance',
      action: 'create' | 'read' | 'update' | 'delete',
      isOwner: boolean = false
    ) => PermissionService.canAccessResource(userRole, resourceType, action, isOwner),
    
    getAccessibleMenuItems: () => 
      PermissionService.getAccessibleMenuItems(userRole),
    
    canPerformBulkOperation: (operation: 'delete' | 'export' | 'archive') =>
      PermissionService.canPerformBulkOperation(userRole, operation),
    
    role: userRole,
    permissions: PermissionService.getRolePermissions(userRole)
  }
}

// Protected component wrapper
import React from 'react'

interface ProtectedComponentProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function ProtectedComponent({ 
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children 
}: ProtectedComponentProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return hasAccess ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback)
}