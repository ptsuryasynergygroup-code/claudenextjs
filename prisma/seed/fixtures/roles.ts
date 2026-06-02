// Seed fixtures migrated from lib/data/roles.ts (v0 mock).
//
// Permission wiring is expressed with permission CODES (module.action) rather
// than the mock's perm-xxx ids, so it stays valid as the permission matrix
// evolves. Codes not present in the seeded permission set are ignored.

export const roleFixtures = [
  { id: "role-001", name: "Super Admin", code: "SUPER_ADMIN", description: "Full system access with all permissions", isSystem: true, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "role-002", name: "Administrator", code: "ADMIN", description: "Administrative access to manage users and settings", isSystem: true, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "role-003", name: "HR Manager", code: "HR_MANAGER", description: "Full access to HR modules", isSystem: false, status: "ACTIVE" as const, createdAt: new Date("2020-02-01") },
  { id: "role-004", name: "Finance Manager", code: "FIN_MANAGER", description: "Full access to finance modules", isSystem: false, status: "ACTIVE" as const, createdAt: new Date("2020-02-01") },
  { id: "role-005", name: "Department Head", code: "DEPT_HEAD", description: "Access to department management and approvals", isSystem: false, status: "ACTIVE" as const, createdAt: new Date("2020-03-01") },
  { id: "role-006", name: "Employee", code: "EMPLOYEE", description: "Basic access for regular employees", isSystem: true, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "role-007", name: "Auditor", code: "AUDITOR", description: "Read-only access for audit purposes", isSystem: false, status: "ACTIVE" as const, createdAt: new Date("2021-06-01") },
  { id: "role-008", name: "Sales Representative", code: "SALES_REP", description: "Access to sales and customer modules", isSystem: false, status: "ACTIVE" as const, createdAt: new Date("2020-04-01") },
]

// Wildcard "*" means: grant every seeded permission. Otherwise an explicit
// list of permission codes (only Phase 1 modules exist for now).
export const rolePermissionFixtures: Record<string, string[] | "*"> = {
  "role-001": "*", // Super Admin
  "role-002": [
    "organization.view", "organization.create", "organization.edit", "organization.delete",
    "users.view", "users.create", "users.edit", "users.delete", "users.suspend",
    "roles.view", "roles.create", "roles.edit", // not roles.delete
    "audit-log.view", "audit-log.export",
  ],
  "role-003": ["organization.view", "users.view", "users.create", "users.edit"], // HR Manager
  "role-004": ["organization.view", "users.view", "audit-log.view", "audit-log.export"], // Finance Manager
  "role-005": ["organization.view", "users.view"], // Department Head
  "role-006": ["organization.view"], // Employee
  "role-007": ["organization.view", "users.view", "roles.view", "audit-log.view", "audit-log.export"], // Auditor
  "role-008": ["organization.view"], // Sales Rep
}

// userId → roleId[] (from mock userRoles).
export const userRoleFixtures: Record<string, string[]> = {
  "user-001": ["role-001"],
  "user-002": ["role-003"],
  "user-003": ["role-004"],
  "user-004": ["role-005", "role-008"],
  "user-005": ["role-008"],
  "user-006": ["role-006"],
  "user-007": ["role-006"],
  "user-008": ["role-008"],
  "user-009": ["role-006"],
  "user-010": ["role-003"],
  "user-011": ["role-006"],
  "user-012": ["role-008"],
}
