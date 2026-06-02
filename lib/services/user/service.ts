// User domain service.

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/user/repository"
import {
  type UserDto,
  type UserStatus,
  CreateUserSchema,
  UpdateUserSchema,
  ChangeUserStatusSchema,
} from "@/lib/entities/user/schema"
import { notFound } from "@/lib/errors"

const MODULE = "users"

// -----------------------------------------------------------------------------
// Reads
// -----------------------------------------------------------------------------

export async function getUsers(): Promise<UserDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.view")
  return repo.listUsers({ orgId: s.orgId })
}

export async function getUser(id: string): Promise<UserDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.view")
  const u = await repo.findUser({ orgId: s.orgId }, id)
  if (!u) notFound("User")
  return u
}

export async function getUserCount(): Promise<number> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.view")
  return repo.countUsers({ orgId: s.orgId })
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export async function createUser(input: unknown): Promise<UserDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.create")
  const data = CreateUserSchema.parse(input)

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null

  return prisma.$transaction(async (tx) => {
    const u = await repo.createUser({ orgId: s.orgId, tx }, { ...data, passwordHash })
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: u.id,
      action: "create",
      description: `Created user: ${u.name}`,
      newValue: u,
    })
    return u
  })
}

export async function updateUser(id: string, input: unknown): Promise<UserDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.edit")
  const data = UpdateUserSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findUser({ orgId: s.orgId, tx }, id)
    if (!before) notFound("User")
    const after = await repo.updateUser({ orgId: s.orgId, tx }, id, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: after.id,
      action: "update",
      description: `Updated user: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function changeUserStatus(id: string, input: unknown): Promise<UserDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  // suspend requires its own permission; activate/deactivate falls back to edit.
  const { status } = ChangeUserStatusSchema.parse(input)
  const perm: string = status === "suspended" ? "users.suspend" : "users.edit"
  await requirePermission(s.userId, perm)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findUser({ orgId: s.orgId, tx }, id)
    if (!before) notFound("User")
    const after = await repo.changeUserStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: after.id,
      action: "update",
      description: `Changed user status: ${before.name} (${before.status} → ${after.status})`,
      oldValue: { status: before.status },
      newValue: { status: after.status },
    })
    return after
  })
}

export async function deleteUser(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "users.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findUser({ orgId: s.orgId, tx }, id)
    if (!before) notFound("User")
    await repo.softDeleteUser({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "User",
      entityId: id,
      action: "delete",
      description: `Deleted user: ${before.name}`,
      oldValue: before,
    })
  })
}

// re-export the status type for UI components that need it
export type { UserStatus }
