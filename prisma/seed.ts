/**
 * EOS seed entry-point. Idempotent (every block upserts).
 *
 * Run: `pnpm db:seed`
 *
 * Order:
 *   1. modules + packages + package-module joins (entitlement registry)
 *   2. permissions (system-defined codes)
 *   3. organization + branches/departments/positions
 *   4. org-package grant + org-modules (denormalized activation)
 *   5. roles + role-permissions
 *   6. users (default dev password) + user-roles
 *   7. audit-log seed entries
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import {
  organizationFixture,
  branchFixtures,
  departmentFixtures,
  positionFixtures,
} from "./seed/fixtures/organization"
import { userFixtures, DEFAULT_DEV_PASSWORD } from "./seed/fixtures/users"
import {
  roleFixtures,
  rolePermissionFixtures,
  userRoleFixtures,
} from "./seed/fixtures/roles"
import { auditLogFixtures } from "./seed/fixtures/audit-log"

const prisma = new PrismaClient()

// Phase 1 modules.
const MODULES = [
  { code: "organization", name: "Organization", description: "Company, branches, departments, positions", dependencies: [] as string[] },
  { code: "users", name: "User Management", description: "Users and authentication", dependencies: [] as string[] },
  { code: "roles", name: "Roles & Permissions", description: "RBAC matrix", dependencies: ["users"] },
  { code: "audit-log", name: "Audit Log", description: "Activity tracking", dependencies: ["users"] },
  { code: "workflows", name: "Workflow Engine", description: "Approval flows, SLA, escalation", dependencies: ["users", "roles"] },
  { code: "notifications", name: "Notification", description: "In-app notifications", dependencies: ["users"] },
]

// Permission matrix per module. Audit-log is append-only (no create/edit/delete).
const PERMISSION_MATRIX: Array<{ module: string; actions: string[] }> = [
  { module: "organization", actions: ["view", "create", "edit", "delete"] },
  { module: "users", actions: ["view", "create", "edit", "delete", "suspend"] },
  { module: "roles", actions: ["view", "create", "edit", "delete"] },
  { module: "audit-log", actions: ["view", "export"] },
  { module: "workflows", actions: ["view", "create", "edit", "delete", "approve"] },
  { module: "notifications", actions: ["view"] },
]

async function main() {
  console.log("[seed] start")

  // ---------------------------------------------------------------------------
  // 1. Modules + Core package
  // ---------------------------------------------------------------------------
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name, description: m.description, dependencies: m.dependencies },
      create: m,
    })
  }

  const corePkg = await prisma.package.upsert({
    where: { code: "core" },
    update: {},
    create: { code: "core", name: "Core", description: "Tier C — Digitalisasi Dasar", tier: 1, userLimit: 50 },
  })

  for (const m of MODULES) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { code: m.code } })
    await prisma.packageModule.upsert({
      where: { packageId_moduleId: { packageId: corePkg.id, moduleId: mod.id } },
      update: {},
      create: { packageId: corePkg.id, moduleId: mod.id },
    })
  }

  // ---------------------------------------------------------------------------
  // 2. Permissions
  // ---------------------------------------------------------------------------
  for (const { module, actions } of PERMISSION_MATRIX) {
    for (const action of actions) {
      const code = `${module}.${action}`
      await prisma.permission.upsert({
        where: { code },
        update: { module, action, description: `${action} on ${module}` },
        create: { code, module, action, description: `${action} on ${module}` },
      })
    }
  }
  const allPermissions = await prisma.permission.findMany()

  // ---------------------------------------------------------------------------
  // 3. Organization + structure
  // ---------------------------------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { id: organizationFixture.id },
    update: {},
    create: organizationFixture,
  })

  for (const b of branchFixtures) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {},
      create: { ...b, organizationId: org.id },
    })
  }
  for (const d of departmentFixtures) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, organizationId: org.id },
    })
  }
  for (const p of positionFixtures) {
    await prisma.position.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }

  // ---------------------------------------------------------------------------
  // 4. Org-package grant + denormalized org-modules
  // ---------------------------------------------------------------------------
  const existingOrgPkg = await prisma.organizationPackage.findFirst({
    where: { organizationId: org.id, packageId: corePkg.id, status: "active" },
  })
  if (!existingOrgPkg) {
    await prisma.organizationPackage.create({
      data: { organizationId: org.id, packageId: corePkg.id, status: "active" },
    })
  }
  for (const m of MODULES) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { code: m.code } })
    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: org.id, moduleId: mod.id } },
      update: { enabled: true },
      create: { organizationId: org.id, moduleId: mod.id, enabled: true, source: "package" },
    })
  }

  // ---------------------------------------------------------------------------
  // 5. Roles + role-permissions
  // ---------------------------------------------------------------------------
  for (const r of roleFixtures) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, organizationId: org.id },
    })

    const grant = rolePermissionFixtures[r.id]
    const codes =
      grant === "*"
        ? allPermissions.map((p) => p.code)
        : (grant ?? [])
    const permIds = allPermissions.filter((p) => codes.includes(p.code)).map((p) => p.id)

    // Replace the role's permission set deterministically.
    await prisma.rolePermission.deleteMany({ where: { roleId: r.id } })
    if (permIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ roleId: r.id, permissionId })),
        skipDuplicates: true,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Users + user-roles
  // ---------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash(DEFAULT_DEV_PASSWORD, 10)
  for (const u of userFixtures) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, organizationId: org.id, passwordHash },
    })
  }
  for (const [userId, roleIds] of Object.entries(userRoleFixtures)) {
    for (const roleId of roleIds) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        update: {},
        create: { userId, roleId, assignedBy: "user-001" },
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Audit-log seed entries
  // ---------------------------------------------------------------------------
  for (const log of auditLogFixtures) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: { ...log, organizationId: org.id },
    })
  }

  const finManager = await prisma.role.findFirst({ where: { id: "role-004" } })
  const deptHead = await prisma.role.findFirst({ where: { id: "role-005" } })
  if (finManager && deptHead) {
    const existingWf = await prisma.workflow.findFirst({
      where: { organizationId: org.id, entityType: "purchase-request" },
    })
    if (!existingWf) {
      await prisma.workflow.create({
        data: {
          organizationId: org.id,
          name: "Purchase Request Approval",
          description: "Two-step approval for purchase requests",
          entityType: "purchase-request",
          status: "ACTIVE",
          steps: {
            create: [
              {
                stepOrder: 1,
                name: "Department Head Approval",
                slaHours: 24,
                escalationHours: 48,
                approvers: { create: [{ roleId: deptHead.id }] },
              },
              {
                stepOrder: 2,
                name: "Finance Manager Approval",
                slaHours: 24,
                escalationHours: 48,
                approvers: { create: [{ roleId: finManager.id }] },
              },
            ],
          },
        },
      })
    }
  }

  console.log("[seed] done")
  console.log(`[seed] login with any seeded email + password "${DEFAULT_DEV_PASSWORD}"`)
  console.log(`[seed] super-admin: ${userFixtures[0].email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
