// Repository for the Organization domain.
// All functions are scoped by organizationId and filter out soft-deleted rows.
// Status enum (Prisma SCREAMING_CASE) is mapped to lowercase string in DTOs.

import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type OrganizationDto,
  type BranchDto,
  type DepartmentDto,
  type PositionDto,
  type CreateBranchInput,
  type UpdateBranchInput,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type CreatePositionInput,
  type UpdatePositionInput,
  type UpdateOrganizationInput,
  type Status,
  type OrgStatus,
} from "./schema"
import { type ScopeCtx, branchSelf } from "@/lib/scope"

type Ctx = {
  orgId: string
  sc?: ScopeCtx
  tx?: Prisma.TransactionClient | PrismaClient
}

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

function branchScopeWhere(ctx: Ctx) {
  return ctx.sc ? branchSelf(ctx.sc) : {}
}
function deptScopeWhere(ctx: Ctx) {
  if (!ctx.sc || ctx.sc.scope === "org") return {}
  return { branchId: ctx.sc.branchId ?? "__no_access__" }
}

// -----------------------------------------------------------------------------
// Mappers (Prisma → DTO)
// -----------------------------------------------------------------------------

const orgStatusOut: Record<string, OrgStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
}

const entStatusOut: Record<string, Status> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}

const orgStatusIn: Record<OrgStatus, "ACTIVE" | "INACTIVE" | "SUSPENDED"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  suspended: "SUSPENDED",
}

const entStatusIn: Record<Status, "ACTIVE" | "INACTIVE"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
}

type PrismaOrg = Awaited<ReturnType<PrismaClient["organization"]["findFirst"]>>
type PrismaBranch = Awaited<ReturnType<PrismaClient["branch"]["findFirst"]>>
type PrismaDept = Awaited<ReturnType<PrismaClient["department"]["findFirst"]>>
type PrismaPos = Awaited<ReturnType<PrismaClient["position"]["findFirst"]>>

function toOrgDto(o: NonNullable<PrismaOrg>): OrganizationDto {
  return {
    id: o.id,
    name: o.name,
    code: o.code,
    taxNumber: o.taxNumber,
    address: o.address,
    phone: o.phone,
    email: o.email,
    website: o.website,
    status: orgStatusOut[o.status] ?? "inactive",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

function toBranchDto(b: NonNullable<PrismaBranch>): BranchDto {
  return {
    id: b.id,
    organizationId: b.organizationId,
    name: b.name,
    code: b.code,
    address: b.address,
    phone: b.phone,
    manager: b.manager,
    status: entStatusOut[b.status] ?? "inactive",
    createdAt: b.createdAt,
  }
}

function toDeptDto(d: NonNullable<PrismaDept>): DepartmentDto {
  return {
    id: d.id,
    organizationId: d.organizationId,
    branchId: d.branchId,
    parentId: d.parentId,
    name: d.name,
    code: d.code,
    description: d.description,
    headCount: d.headCount,
    status: entStatusOut[d.status] ?? "inactive",
    createdAt: d.createdAt,
  }
}

function toPosDto(p: NonNullable<PrismaPos>): PositionDto {
  return {
    id: p.id,
    departmentId: p.departmentId,
    name: p.name,
    code: p.code,
    level: p.level,
    description: p.description,
    status: entStatusOut[p.status] ?? "inactive",
    createdAt: p.createdAt,
  }
}

// -----------------------------------------------------------------------------
// Organization
// -----------------------------------------------------------------------------

export async function findOrganization(ctx: Ctx): Promise<OrganizationDto | null> {
  const row = await db(ctx).organization.findFirst({
    where: { id: ctx.orgId, deletedAt: null },
  })
  return row ? toOrgDto(row) : null
}

export async function updateOrganization(
  ctx: Ctx,
  data: UpdateOrganizationInput,
): Promise<OrganizationDto> {
  const row = await db(ctx).organization.update({
    where: { id: ctx.orgId },
    data: {
      ...data,
      status: data.status ? orgStatusIn[data.status] : undefined,
    },
  })
  return toOrgDto(row)
}

// -----------------------------------------------------------------------------
// Branch
// -----------------------------------------------------------------------------

export async function listBranches(ctx: Ctx): Promise<BranchDto[]> {
  const rows = await db(ctx).branch.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null, ...branchScopeWhere(ctx) },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toBranchDto)
}

export async function findBranch(ctx: Ctx, id: string): Promise<BranchDto | null> {
  const row = await db(ctx).branch.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null, ...branchScopeWhere(ctx) },
  })
  return row ? toBranchDto(row) : null
}

export async function createBranch(ctx: Ctx, data: CreateBranchInput): Promise<BranchDto> {
  const row = await db(ctx).branch.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      code: data.code,
      address: data.address ?? null,
      phone: data.phone ?? null,
      manager: data.manager ?? null,
      status: entStatusIn[data.status],
    },
  })
  return toBranchDto(row)
}

export async function updateBranch(
  ctx: Ctx,
  id: string,
  data: UpdateBranchInput,
): Promise<BranchDto> {
  const row = await db(ctx).branch.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      ...data,
      status: data.status ? entStatusIn[data.status] : undefined,
    },
  })
  return toBranchDto(row)
}

export async function softDeleteBranch(ctx: Ctx, id: string): Promise<BranchDto> {
  const row = await db(ctx).branch.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
  return toBranchDto(row)
}

// -----------------------------------------------------------------------------
// Department
// -----------------------------------------------------------------------------

export async function listDepartments(ctx: Ctx): Promise<DepartmentDto[]> {
  const rows = await db(ctx).department.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null, ...deptScopeWhere(ctx) },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toDeptDto)
}

export async function findDepartment(ctx: Ctx, id: string): Promise<DepartmentDto | null> {
  const row = await db(ctx).department.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null, ...deptScopeWhere(ctx) },
  })
  return row ? toDeptDto(row) : null
}

export async function createDepartment(
  ctx: Ctx,
  data: CreateDepartmentInput,
): Promise<DepartmentDto> {
  const row = await db(ctx).department.create({
    data: {
      organizationId: ctx.orgId,
      branchId: data.branchId ?? null,
      parentId: data.parentId ?? null,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      headCount: data.headCount,
      status: entStatusIn[data.status],
    },
  })
  return toDeptDto(row)
}

export async function updateDepartment(
  ctx: Ctx,
  id: string,
  data: UpdateDepartmentInput,
): Promise<DepartmentDto> {
  const row = await db(ctx).department.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      ...data,
      status: data.status ? entStatusIn[data.status] : undefined,
    },
  })
  return toDeptDto(row)
}

export async function softDeleteDepartment(ctx: Ctx, id: string): Promise<DepartmentDto> {
  const row = await db(ctx).department.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
  return toDeptDto(row)
}

// -----------------------------------------------------------------------------
// Position
// -----------------------------------------------------------------------------

export async function listPositions(ctx: Ctx): Promise<PositionDto[]> {
  // Positions don't carry organizationId directly — scope through department.
  const rows = await db(ctx).position.findMany({
    where: {
      deletedAt: null,
      department: { organizationId: ctx.orgId, deletedAt: null, ...deptScopeWhere(ctx) },
    },
    orderBy: [{ level: "asc" }, { createdAt: "asc" }],
  })
  return rows.map(toPosDto)
}

export async function findPosition(ctx: Ctx, id: string): Promise<PositionDto | null> {
  const row = await db(ctx).position.findFirst({
    where: {
      id,
      deletedAt: null,
      department: { organizationId: ctx.orgId, ...deptScopeWhere(ctx) },
    },
  })
  return row ? toPosDto(row) : null
}

export async function createPosition(ctx: Ctx, data: CreatePositionInput): Promise<PositionDto> {
  // Validate the department belongs to the org before insert.
  const dept = await db(ctx).department.findFirst({
    where: { id: data.departmentId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!dept) throw new Error("Department not found in this organization")

  const row = await db(ctx).position.create({
    data: {
      departmentId: data.departmentId,
      name: data.name,
      code: data.code,
      level: data.level,
      description: data.description ?? null,
      status: entStatusIn[data.status],
    },
  })
  return toPosDto(row)
}

export async function updatePosition(
  ctx: Ctx,
  id: string,
  data: UpdatePositionInput,
): Promise<PositionDto> {
  // Ensure the position's department belongs to the org (prevents cross-tenant updates).
  const existing = await findPosition(ctx, id)
  if (!existing) throw new Error("Position not found")

  const row = await db(ctx).position.update({
    where: { id },
    data: {
      ...data,
      status: data.status ? entStatusIn[data.status] : undefined,
    },
  })
  return toPosDto(row)
}

export async function softDeletePosition(ctx: Ctx, id: string): Promise<PositionDto> {
  const existing = await findPosition(ctx, id)
  if (!existing) throw new Error("Position not found")
  const row = await db(ctx).position.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return toPosDto(row)
}
