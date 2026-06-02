// Role + Permission service.

import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/role/repository"
import {
  type RoleDto,
  type PermissionDto,
  CreateRoleSchema,
  UpdateRoleSchema,
  AssignUserRoleSchema,
} from "@/lib/entities/role/schema"
import { notFound, forbidden } from "@/lib/errors"

const MODULE = "roles"

// -----------------------------------------------------------------------------
// Reads
// -----------------------------------------------------------------------------

export async function getRoles(): Promise<RoleDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.listRoles({ orgId: s.orgId })
}

export async function getRole(id: string): Promise<RoleDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  const r = await repo.findRole({ orgId: s.orgId }, id)
  if (!r) notFound("Role")
  return r
}

/** roleId → permission count, for the roles list. */
export async function getRolePermissionCounts(): Promise<Record<string, number>> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.countPermissionsByRole({ orgId: s.orgId })
}

export async function getPermissions(): Promise<PermissionDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.listAllPermissions({ orgId: s.orgId })
}

export async function getRolePermissions(roleId: string): Promise<PermissionDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.getRolePermissions({ orgId: s.orgId }, roleId)
}

export async function getUserRoles(userId: string): Promise<RoleDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.listRolesForUser({ orgId: s.orgId }, userId)
}

/** Batch role-name map for the users list (userId → [{id,name}]). */
export async function getAllUserRoles(): Promise<
  Record<string, { id: string; name: string }[]>
> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.view")
  return repo.listAllUserRoles({ orgId: s.orgId })
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export async function createRole(input: unknown): Promise<RoleDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.create")
  const data = CreateRoleSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const r = await repo.createRole({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Role",
      entityId: r.id,
      action: "create",
      description: `Created role: ${r.name}`,
      newValue: { name: r.name, code: r.code, permissionIds: data.permissionIds },
    })
    return r
  })
}

export async function updateRole(id: string, input: unknown): Promise<RoleDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.edit")
  const data = UpdateRoleSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findRole({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Role")
    if (before.isSystem && (data.code || data.permissionIds)) {
      // belt-and-suspenders: repo already throws, but tag a clean FORBIDDEN here
      forbidden({ reason: "system role immutable" })
    }
    const after = await repo.updateRole({ orgId: s.orgId, tx }, id, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Role",
      entityId: after.id,
      action: "update",
      description: `Updated role: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteRole(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findRole({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Role")
    if (before.isSystem) forbidden({ reason: "system role cannot be deleted" })
    await repo.softDeleteRole({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Role",
      entityId: id,
      action: "delete",
      description: `Deleted role: ${before.name}`,
      oldValue: before,
    })
  })
}

export async function assignRoleToUser(input: unknown): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.edit")
  const { userId, roleId } = AssignUserRoleSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    await repo.assignUserRole({ orgId: s.orgId, tx }, userId, roleId, s.userId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: userId,
      action: "grant",
      description: `Assigned role ${roleId} to user`,
      newValue: { roleId },
    })
  })
}

export async function removeRoleFromUser(input: unknown): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "roles.edit")
  const { userId, roleId } = AssignUserRoleSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    await repo.removeUserRole({ orgId: s.orgId, tx }, userId, roleId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: userId,
      action: "revoke",
      description: `Removed role ${roleId} from user`,
      oldValue: { roleId },
    })
  })
}
