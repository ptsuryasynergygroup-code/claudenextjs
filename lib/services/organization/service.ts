// Organization domain service — orchestrates repository + guards + audit.
// Every public function follows the PRD §1 invariant chain:
//   requireSession → requireEntitlement → requirePermission → service body.

import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/organization/repository"
import {
  type BranchDto,
  type DepartmentDto,
  type PositionDto,
  type OrganizationDto,
  CreateBranchSchema,
  UpdateBranchSchema,
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  CreatePositionSchema,
  UpdatePositionSchema,
  UpdateOrganizationSchema,
} from "@/lib/entities/organization/schema"
import { notFound } from "@/lib/errors"

const MODULE = "organization"

// -----------------------------------------------------------------------------
// Reads (no permission gate beyond entitlement + view)
// -----------------------------------------------------------------------------

export async function getOrganization(): Promise<OrganizationDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.view")
  const org = await repo.findOrganization({ orgId: s.orgId })
  if (!org) notFound("Organization")
  return org
}

export async function getBranches(): Promise<BranchDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.view")
  return repo.listBranches({ orgId: s.orgId })
}

export async function getDepartments(): Promise<DepartmentDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.view")
  return repo.listDepartments({ orgId: s.orgId })
}

export async function getPositions(): Promise<PositionDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.view")
  return repo.listPositions({ orgId: s.orgId })
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export async function updateOrganization(input: unknown): Promise<OrganizationDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.edit")
  const data = UpdateOrganizationSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findOrganization({ orgId: s.orgId, tx })
    if (!before) notFound("Organization")
    const after = await repo.updateOrganization({ orgId: s.orgId, tx }, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Organization",
      entityId: after.id,
      action: "update",
      description: "Updated organization details",
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function createBranch(input: unknown): Promise<BranchDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.create")
  const data = CreateBranchSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const b = await repo.createBranch({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Branch",
      entityId: b.id,
      action: "create",
      description: `Created branch: ${b.name}`,
      newValue: b,
    })
    return b
  })
}

export async function updateBranch(id: string, input: unknown): Promise<BranchDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.edit")
  const data = UpdateBranchSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findBranch({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Branch")
    const after = await repo.updateBranch({ orgId: s.orgId, tx }, id, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Branch",
      entityId: after.id,
      action: "update",
      description: `Updated branch: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteBranch(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findBranch({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Branch")
    await repo.softDeleteBranch({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Branch",
      entityId: id,
      action: "delete",
      description: `Deleted branch: ${before.name}`,
      oldValue: before,
    })
  })
}

export async function createDepartment(input: unknown): Promise<DepartmentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.create")
  const data = CreateDepartmentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const d = await repo.createDepartment({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Department",
      entityId: d.id,
      action: "create",
      description: `Created department: ${d.name}`,
      newValue: d,
    })
    return d
  })
}

export async function updateDepartment(id: string, input: unknown): Promise<DepartmentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.edit")
  const data = UpdateDepartmentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findDepartment({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Department")
    const after = await repo.updateDepartment({ orgId: s.orgId, tx }, id, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Department",
      entityId: after.id,
      action: "update",
      description: `Updated department: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteDepartment(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findDepartment({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Department")
    await repo.softDeleteDepartment({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Department",
      entityId: id,
      action: "delete",
      description: `Deleted department: ${before.name}`,
      oldValue: before,
    })
  })
}

export async function createPosition(input: unknown): Promise<PositionDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.create")
  const data = CreatePositionSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const p = await repo.createPosition({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Position",
      entityId: p.id,
      action: "create",
      description: `Created position: ${p.name}`,
      newValue: p,
    })
    return p
  })
}

export async function updatePosition(id: string, input: unknown): Promise<PositionDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.edit")
  const data = UpdatePositionSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findPosition({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Position")
    const after = await repo.updatePosition({ orgId: s.orgId, tx }, id, data)
    const d = diff(before, after)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Position",
      entityId: after.id,
      action: "update",
      description: `Updated position: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deletePosition(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "organization.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findPosition({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Position")
    await repo.softDeletePosition({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Position",
      entityId: id,
      action: "delete",
      description: `Deleted position: ${before.name}`,
      oldValue: before,
    })
  })
}
