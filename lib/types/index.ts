// Organization Types
export interface Organization {
  id: string
  name: string
  code: string
  taxNumber: string
  address: string
  phone: string
  email: string
  website?: string
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Branch {
  id: string
  organizationId: string
  name: string
  code: string
  address: string
  phone: string
  manager?: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface Department {
  id: string
  organizationId: string
  branchId?: string
  parentId?: string
  name: string
  code: string
  description?: string
  headCount: number
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface Position {
  id: string
  departmentId: string
  name: string
  code: string
  level: number
  description?: string
  status: 'active' | 'inactive'
  createdAt: Date
}

// User Types
export interface User {
  id: string
  organizationId: string
  branchId?: string
  departmentId?: string
  positionId?: string
  employeeId: string
  name: string
  email: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// Role & Permission Types
export interface Role {
  id: string
  organizationId: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  userCount: number
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface Permission {
  id: string
  module: string
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
  description: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
}

export interface UserRole {
  userId: string
  roleId: string
  assignedAt: Date
  assignedBy: string
}

// Audit Log Types
export interface AuditLog {
  id: string
  userId: string
  userName: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export'
  description: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress: string
  userAgent?: string
  createdAt: Date
}

// Module definitions for permissions
export const MODULES = [
  'organization',
  'users',
  'roles',
  'audit-log',
  'documents',
  'workflows',
  'tasks',
  'projects',
] as const

export type ModuleName = (typeof MODULES)[number]

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'] as const
export type ActionType = (typeof ACTIONS)[number]

// Status badge variants
export type StatusType = 'active' | 'inactive' | 'suspended' | 'pending'

export const STATUS_VARIANTS: Record<StatusType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
  pending: 'outline',
}
