// Repository for Role + Permission + UserRole.

import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type RoleDto,
  type PermissionDto,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "./schema"
import type { Status } from "@/lib/entities/organization/schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const statusOut: Record<string, Status> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}

const statusIn: Record<Status, "ACTIVE" | "INACTIVE"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
}

// -----------------------------------------------------------------------------
// Permissions (global table — no orgId scoping)
// -----------------------------------------------------------------------------

export async function listAllPermissions(ctx: Ctx): Promise<PermissionDto[]> {
  const rows = await db(ctx).permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  })
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    module: p.module,
    action: p.action,
    description: p.description,
  }))
}

export async function findPermissionsByCode(
  ctx: Ctx,
  codes: string[],
): Promise<PermissionDto[]> {
  if (codes.length === 0) return []
  const rows = await db(ctx).permission.findMany({
    where: { code: { in: codes } },
  })
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    module: p.module,
    action: p.action,
    description: p.description,
  }))
}

// -----------------------------------------------------------------------------
// Roles
// -----------------------------------------------------------------------------

export async function listRoles(ctx: Ctx): Promise<RoleDto[]> {
  const rows = await db(ctx).role.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { userRoles: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    code: r.code,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.userRoles,
    status: statusOut[r.status] ?? "inactive",
    createdAt: r.createdAt,
  }))
}

export async function findRole(ctx: Ctx, id: string): Promise<RoleDto | null> {
  const r = await db(ctx).role.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    include: { _count: { select: { userRoles: true } } },
  })
  if (!r) return null
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    code: r.code,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.userRoles,
    status: statusOut[r.status] ?? "inactive",
    createdAt: r.createdAt,
  }
}

export async function getRolePermissions(ctx: Ctx, roleId: string): Promise<PermissionDto[]> {
  const rows = await db(ctx).rolePermission.findMany({
    where: { role: { id: roleId, organizationId: ctx.orgId } },
    include: { permission: true },
  })
  return rows.map((rp) => ({
    id: rp.permission.id,
    code: rp.permission.code,
    module: rp.permission.module,
    action: rp.permission.action,
    description: rp.permission.description,
  }))
}

/** Map roleId → permission count, for the roles list page. */
export async function countPermissionsByRole(ctx: Ctx): Promise<Record<string, number>> {
  const grouped = await db(ctx).rolePermission.groupBy({
    by: ["roleId"],
    where: { role: { organizationId: ctx.orgId, deletedAt: null } },
    _count: { permissionId: true },
  })
  const map: Record<string, number> = {}
  for (const g of grouped) map[g.roleId] = g._count.permissionId
  return map
}

export async function createRole(ctx: Ctx, data: CreateRoleInput): Promise<RoleDto> {
  const role = await db(ctx).role.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      isSystem: false,
      status: statusIn[data.status],
      rolePermissions: {
        create: data.permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
    include: { _count: { select: { userRoles: true } } },
  })
  return {
    id: role.id,
    organizationId: role.organizationId,
    name: role.name,
    code: role.code,
    description: role.description,
    isSystem: role.isSystem,
    userCount: role._count.userRoles,
    status: statusOut[role.status] ?? "inactive",
    createdAt: role.createdAt,
  }
}

export async function updateRole(
  ctx: Ctx,
  id: string,
  data: UpdateRoleInput,
): Promise<RoleDto> {
  const conn = db(ctx)
  // System roles are immutable for safety; UI should already gate this but
  // enforce server-side too.
  const existing = await conn.role.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { isSystem: true },
  })
  if (!existing) throw new Error("Role not found")
  if (existing.isSystem && (data.code || data.permissionIds)) {
    throw new Error("System roles cannot have code or permissions modified")
  }

  // Replace permissions atomically when provided.
  if (data.permissionIds) {
    await conn.rolePermission.deleteMany({ where: { roleId: id } })
    await conn.rolePermission.createMany({
      data: data.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
      skipDuplicates: true,
    })
  }

  const r = await conn.role.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status ? statusIn[data.status] : undefined,
    },
    include: { _count: { select: { userRoles: true } } },
  })
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    code: r.code,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.userRoles,
    status: statusOut[r.status] ?? "inactive",
    createdAt: r.createdAt,
  }
}

export async function softDeleteRole(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).role.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { isSystem: true },
  })
  if (!existing) throw new Error("Role not found")
  if (existing.isSystem) throw new Error("System roles cannot be deleted")

  await db(ctx).role.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

// -----------------------------------------------------------------------------
// UserRole assignments
// -----------------------------------------------------------------------------

export async function listRolesForUser(ctx: Ctx, userId: string): Promise<RoleDto[]> {
  const rows = await db(ctx).userRole.findMany({
    where: {
      userId,
      role: { organizationId: ctx.orgId, deletedAt: null },
    },
    include: {
      role: { include: { _count: { select: { userRoles: true } } } },
    },
  })
  return rows.map(({ role: r }) => ({
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    code: r.code,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.userRoles,
    status: statusOut[r.status] ?? "inactive",
    createdAt: r.createdAt,
  }))
}

/**
 * Batch: all user→role assignments for the org, as a map userId → role list.
 * Used by the users list page to render role badges without an N+1.
 */
export async function listAllUserRoles(
  ctx: Ctx,
): Promise<Record<string, { id: string; name: string }[]>> {
  const rows = await db(ctx).userRole.findMany({
    where: { role: { organizationId: ctx.orgId, deletedAt: null } },
    select: { userId: true, role: { select: { id: true, name: true } } },
  })
  const map: Record<string, { id: string; name: string }[]> = {}
  for (const r of rows) {
    ;(map[r.userId] ??= []).push({ id: r.role.id, name: r.role.name })
  }
  return map
}

export async function assignUserRole(
  ctx: Ctx,
  userId: string,
  roleId: string,
  assignedBy: string,
): Promise<void> {
  // Defensive: verify role and user both belong to the org.
  const [role, user] = await Promise.all([
    db(ctx).role.findFirst({
      where: { id: roleId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    }),
    db(ctx).user.findFirst({
      where: { id: userId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    }),
  ])
  if (!role || !user) throw new Error("User or role not found in this organization")

  await db(ctx).userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId, assignedBy },
  })
}

export async function removeUserRole(
  ctx: Ctx,
  userId: string,
  roleId: string,
): Promise<void> {
  // Re-verify org-scope via role before delete.
  const role = await db(ctx).role.findFirst({
    where: { id: roleId, organizationId: ctx.orgId },
    select: { id: true },
  })
  if (!role) throw new Error("Role not found in this organization")

  await db(ctx).userRole.deleteMany({ where: { userId, roleId } })
}
