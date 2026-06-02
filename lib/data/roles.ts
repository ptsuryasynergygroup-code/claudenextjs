import type { Role, Permission, RolePermission, UserRole } from '@/lib/types'

export const roles: Role[] = [
  {
    id: 'role-001',
    organizationId: 'org-001',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full system access with all permissions',
    isSystem: true,
    userCount: 2,
    status: 'active',
    createdAt: new Date('2020-01-15'),
  },
  {
    id: 'role-002',
    organizationId: 'org-001',
    name: 'Administrator',
    code: 'ADMIN',
    description: 'Administrative access to manage users and settings',
    isSystem: true,
    userCount: 5,
    status: 'active',
    createdAt: new Date('2020-01-15'),
  },
  {
    id: 'role-003',
    organizationId: 'org-001',
    name: 'HR Manager',
    code: 'HR_MANAGER',
    description: 'Full access to HR modules',
    isSystem: false,
    userCount: 3,
    status: 'active',
    createdAt: new Date('2020-02-01'),
  },
  {
    id: 'role-004',
    organizationId: 'org-001',
    name: 'Finance Manager',
    code: 'FIN_MANAGER',
    description: 'Full access to finance modules',
    isSystem: false,
    userCount: 4,
    status: 'active',
    createdAt: new Date('2020-02-01'),
  },
  {
    id: 'role-005',
    organizationId: 'org-001',
    name: 'Department Head',
    code: 'DEPT_HEAD',
    description: 'Access to department management and approvals',
    isSystem: false,
    userCount: 8,
    status: 'active',
    createdAt: new Date('2020-03-01'),
  },
  {
    id: 'role-006',
    organizationId: 'org-001',
    name: 'Employee',
    code: 'EMPLOYEE',
    description: 'Basic access for regular employees',
    isSystem: true,
    userCount: 120,
    status: 'active',
    createdAt: new Date('2020-01-15'),
  },
  {
    id: 'role-007',
    organizationId: 'org-001',
    name: 'Auditor',
    code: 'AUDITOR',
    description: 'Read-only access for audit purposes',
    isSystem: false,
    userCount: 2,
    status: 'active',
    createdAt: new Date('2021-06-01'),
  },
  {
    id: 'role-008',
    organizationId: 'org-001',
    name: 'Sales Representative',
    code: 'SALES_REP',
    description: 'Access to sales and customer modules',
    isSystem: false,
    userCount: 25,
    status: 'active',
    createdAt: new Date('2020-04-01'),
  },
]

export const permissions: Permission[] = [
  // Organization permissions
  { id: 'perm-001', module: 'organization', action: 'view', description: 'View organization details' },
  { id: 'perm-002', module: 'organization', action: 'edit', description: 'Edit organization settings' },
  
  // User permissions
  { id: 'perm-003', module: 'users', action: 'view', description: 'View user list and profiles' },
  { id: 'perm-004', module: 'users', action: 'create', description: 'Create new users' },
  { id: 'perm-005', module: 'users', action: 'edit', description: 'Edit user information' },
  { id: 'perm-006', module: 'users', action: 'delete', description: 'Delete users' },
  { id: 'perm-007', module: 'users', action: 'export', description: 'Export user data' },
  
  // Role permissions
  { id: 'perm-008', module: 'roles', action: 'view', description: 'View roles and permissions' },
  { id: 'perm-009', module: 'roles', action: 'create', description: 'Create new roles' },
  { id: 'perm-010', module: 'roles', action: 'edit', description: 'Edit role permissions' },
  { id: 'perm-011', module: 'roles', action: 'delete', description: 'Delete roles' },
  
  // Audit log permissions
  { id: 'perm-012', module: 'audit-log', action: 'view', description: 'View audit logs' },
  { id: 'perm-013', module: 'audit-log', action: 'export', description: 'Export audit logs' },
  
  // Document permissions
  { id: 'perm-014', module: 'documents', action: 'view', description: 'View documents' },
  { id: 'perm-015', module: 'documents', action: 'create', description: 'Upload documents' },
  { id: 'perm-016', module: 'documents', action: 'edit', description: 'Edit documents' },
  { id: 'perm-017', module: 'documents', action: 'delete', description: 'Delete documents' },
  { id: 'perm-018', module: 'documents', action: 'approve', description: 'Approve documents' },
  
  // Workflow permissions
  { id: 'perm-019', module: 'workflows', action: 'view', description: 'View workflows' },
  { id: 'perm-020', module: 'workflows', action: 'create', description: 'Create workflows' },
  { id: 'perm-021', module: 'workflows', action: 'edit', description: 'Edit workflows' },
  { id: 'perm-022', module: 'workflows', action: 'approve', description: 'Approve workflow steps' },
  
  // Task permissions
  { id: 'perm-023', module: 'tasks', action: 'view', description: 'View tasks' },
  { id: 'perm-024', module: 'tasks', action: 'create', description: 'Create tasks' },
  { id: 'perm-025', module: 'tasks', action: 'edit', description: 'Edit tasks' },
  { id: 'perm-026', module: 'tasks', action: 'delete', description: 'Delete tasks' },
  
  // Project permissions
  { id: 'perm-027', module: 'projects', action: 'view', description: 'View projects' },
  { id: 'perm-028', module: 'projects', action: 'create', description: 'Create projects' },
  { id: 'perm-029', module: 'projects', action: 'edit', description: 'Edit projects' },
  { id: 'perm-030', module: 'projects', action: 'delete', description: 'Delete projects' },
]

// Role-Permission mappings (Super Admin has all)
export const rolePermissions: RolePermission[] = [
  // Super Admin - all permissions
  ...permissions.map((p) => ({ roleId: 'role-001', permissionId: p.id })),
  
  // Administrator - most permissions except delete roles
  ...permissions.filter((p) => !(p.module === 'roles' && p.action === 'delete')).map((p) => ({ roleId: 'role-002', permissionId: p.id })),
  
  // HR Manager
  { roleId: 'role-003', permissionId: 'perm-001' }, // org view
  { roleId: 'role-003', permissionId: 'perm-003' }, // users view
  { roleId: 'role-003', permissionId: 'perm-004' }, // users create
  { roleId: 'role-003', permissionId: 'perm-005' }, // users edit
  { roleId: 'role-003', permissionId: 'perm-007' }, // users export
  { roleId: 'role-003', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-003', permissionId: 'perm-015' }, // documents create
  { roleId: 'role-003', permissionId: 'perm-018' }, // documents approve
  
  // Finance Manager
  { roleId: 'role-004', permissionId: 'perm-001' }, // org view
  { roleId: 'role-004', permissionId: 'perm-003' }, // users view
  { roleId: 'role-004', permissionId: 'perm-012' }, // audit view
  { roleId: 'role-004', permissionId: 'perm-013' }, // audit export
  { roleId: 'role-004', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-004', permissionId: 'perm-018' }, // documents approve
  
  // Department Head
  { roleId: 'role-005', permissionId: 'perm-001' }, // org view
  { roleId: 'role-005', permissionId: 'perm-003' }, // users view
  { roleId: 'role-005', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-005', permissionId: 'perm-018' }, // documents approve
  { roleId: 'role-005', permissionId: 'perm-022' }, // workflow approve
  { roleId: 'role-005', permissionId: 'perm-023' }, // tasks view
  { roleId: 'role-005', permissionId: 'perm-024' }, // tasks create
  { roleId: 'role-005', permissionId: 'perm-025' }, // tasks edit
  
  // Employee - basic access
  { roleId: 'role-006', permissionId: 'perm-001' }, // org view
  { roleId: 'role-006', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-006', permissionId: 'perm-015' }, // documents create
  { roleId: 'role-006', permissionId: 'perm-023' }, // tasks view
  { roleId: 'role-006', permissionId: 'perm-024' }, // tasks create
  
  // Auditor - read-only
  { roleId: 'role-007', permissionId: 'perm-001' }, // org view
  { roleId: 'role-007', permissionId: 'perm-003' }, // users view
  { roleId: 'role-007', permissionId: 'perm-008' }, // roles view
  { roleId: 'role-007', permissionId: 'perm-012' }, // audit view
  { roleId: 'role-007', permissionId: 'perm-013' }, // audit export
  { roleId: 'role-007', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-007', permissionId: 'perm-019' }, // workflows view
  
  // Sales Representative
  { roleId: 'role-008', permissionId: 'perm-001' }, // org view
  { roleId: 'role-008', permissionId: 'perm-014' }, // documents view
  { roleId: 'role-008', permissionId: 'perm-015' }, // documents create
  { roleId: 'role-008', permissionId: 'perm-023' }, // tasks view
  { roleId: 'role-008', permissionId: 'perm-024' }, // tasks create
  { roleId: 'role-008', permissionId: 'perm-025' }, // tasks edit
  { roleId: 'role-008', permissionId: 'perm-027' }, // projects view
]

// User-Role assignments
export const userRoles: UserRole[] = [
  { userId: 'user-001', roleId: 'role-001', assignedAt: new Date('2020-01-15'), assignedBy: 'system' },
  { userId: 'user-002', roleId: 'role-003', assignedAt: new Date('2020-02-01'), assignedBy: 'user-001' },
  { userId: 'user-003', roleId: 'role-004', assignedAt: new Date('2020-03-10'), assignedBy: 'user-001' },
  { userId: 'user-004', roleId: 'role-005', assignedAt: new Date('2020-04-05'), assignedBy: 'user-001' },
  { userId: 'user-004', roleId: 'role-008', assignedAt: new Date('2020-04-05'), assignedBy: 'user-001' },
  { userId: 'user-005', roleId: 'role-008', assignedAt: new Date('2021-04-01'), assignedBy: 'user-001' },
  { userId: 'user-006', roleId: 'role-006', assignedAt: new Date('2021-06-15'), assignedBy: 'user-002' },
  { userId: 'user-007', roleId: 'role-006', assignedAt: new Date('2021-09-01'), assignedBy: 'user-002' },
  { userId: 'user-008', roleId: 'role-008', assignedAt: new Date('2022-08-01'), assignedBy: 'user-004' },
  { userId: 'user-009', roleId: 'role-006', assignedAt: new Date('2022-02-15'), assignedBy: 'user-002' },
  { userId: 'user-010', roleId: 'role-003', assignedAt: new Date('2022-05-01'), assignedBy: 'user-002' },
  { userId: 'user-011', roleId: 'role-006', assignedAt: new Date('2023-01-10'), assignedBy: 'user-002' },
  { userId: 'user-012', roleId: 'role-008', assignedAt: new Date('2023-03-15'), assignedBy: 'user-004' },
]

// Helper functions
export function getRoleById(id: string): Role | undefined {
  return roles.find((r) => r.id === id)
}

export function getPermissionById(id: string): Permission | undefined {
  return permissions.find((p) => p.id === id)
}

export function getRolePermissions(roleId: string): Permission[] {
  const permissionIds = rolePermissions.filter((rp) => rp.roleId === roleId).map((rp) => rp.permissionId)
  return permissions.filter((p) => permissionIds.includes(p.id))
}

export function getUserRoles(userId: string): Role[] {
  const roleIds = userRoles.filter((ur) => ur.userId === userId).map((ur) => ur.roleId)
  return roles.filter((r) => roleIds.includes(r.id))
}

export function getPermissionsByModule(module: string): Permission[] {
  return permissions.filter((p) => p.module === module)
}

export function hasPermission(roleId: string, module: string, action: string): boolean {
  const perms = getRolePermissions(roleId)
  return perms.some((p) => p.module === module && p.action === action)
}
