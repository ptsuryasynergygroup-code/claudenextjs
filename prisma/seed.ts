/**
 * EOS seed entry-point.
 *
 * Idempotent: re-runnable without unique-violations. Every block uses `upsert`.
 *
 * Order matters:
 *   1. modules + features (entitlement registry)
 *   2. packages + package-module/feature joins
 *   3. permissions (system-defined codes)
 *   4. organization + branches/departments/positions (from lib/data fixtures)
 *   5. organization-package + organization-modules (grant default package)
 *   6. roles (system + org default roles) + role-permissions
 *   7. users (admin + sample) + user-roles
 *
 * Run: `pnpm db:seed`
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("[seed] start")

  // -------------------------------------------------------------------------
  // 1. Module registry
  // -------------------------------------------------------------------------
  await prisma.module.upsert({
    where: { code: "organization" },
    update: {},
    create: { code: "organization", name: "Organization", description: "Company, branches, departments, positions" },
  })
  await prisma.module.upsert({
    where: { code: "users" },
    update: {},
    create: { code: "users", name: "User Management", description: "Users and authentication" },
  })
  await prisma.module.upsert({
    where: { code: "roles" },
    update: {},
    create: { code: "roles", name: "Roles & Permissions", description: "RBAC matrix", dependencies: ["users"] },
  })
  await prisma.module.upsert({
    where: { code: "audit-log" },
    update: {},
    create: { code: "audit-log", name: "Audit Log", description: "Activity tracking", dependencies: ["users"] },
  })

  // -------------------------------------------------------------------------
  // 2. Packages (Tier C → S)
  // -------------------------------------------------------------------------
  await prisma.package.upsert({
    where: { code: "core" },
    update: {},
    create: { code: "core", name: "Core", description: "Tier C — Digitalisasi Dasar", tier: 1, userLimit: 10 },
  })

  // Phase 1 grant: Core package includes all 4 Phase 1 modules.
  const corePkg = await prisma.package.findUniqueOrThrow({ where: { code: "core" } })
  for (const mc of ["organization", "users", "roles", "audit-log"]) {
    const m = await prisma.module.findUniqueOrThrow({ where: { code: mc } })
    await prisma.packageModule.upsert({
      where: { packageId_moduleId: { packageId: corePkg.id, moduleId: m.id } },
      update: {},
      create: { packageId: corePkg.id, moduleId: m.id },
    })
  }

  // -------------------------------------------------------------------------
  // 3. Permissions
  // -------------------------------------------------------------------------
  const permissionMatrix: Array<{ module: string; actions: string[] }> = [
    { module: "organization", actions: ["view", "create", "edit", "delete"] },
    { module: "users", actions: ["view", "create", "edit", "delete", "suspend"] },
    { module: "roles", actions: ["view", "create", "edit", "delete"] },
    { module: "audit-log", actions: ["view", "export"] }, // append-only
  ]
  for (const { module, actions } of permissionMatrix) {
    for (const action of actions) {
      const code = `${module}.${action}`
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, module, action, description: `${action} on ${module}` },
      })
    }
  }

  // -------------------------------------------------------------------------
  // 4. Organization + structure (TODO: import from lib/data fixtures)
  //    Will be populated by migrate-mock-to-db skill per-module.
  // -------------------------------------------------------------------------
  console.log("[seed] TODO: organization fixtures — run migrate-mock-to-db skill")

  // -------------------------------------------------------------------------
  // 5-7. Org-package grant, system roles, admin user — TODO
  // -------------------------------------------------------------------------
  console.log("[seed] TODO: org-package grant, system roles, admin user")

  console.log("[seed] done")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
