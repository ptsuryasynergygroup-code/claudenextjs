// Repository for the User domain.

import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type UserDto,
  type UserStatus,
  type CreateUserInput,
  type UpdateUserInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const statusOut: Record<string, UserStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
}

const statusIn: Record<UserStatus, "ACTIVE" | "INACTIVE" | "SUSPENDED"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  suspended: "SUSPENDED",
}

type PrismaUser = Awaited<ReturnType<PrismaClient["user"]["findFirst"]>>

function toDto(u: NonNullable<PrismaUser>): UserDto {
  return {
    id: u.id,
    organizationId: u.organizationId,
    branchId: u.branchId,
    departmentId: u.departmentId,
    positionId: u.positionId,
    employeeId: u.employeeCode,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatar: u.image,
    status: statusOut[u.status] ?? "inactive",
    lastLogin: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export async function listUsers(ctx: Ctx): Promise<UserDto[]> {
  const rows = await db(ctx).user.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toDto)
}

export async function findUser(ctx: Ctx, id: string): Promise<UserDto | null> {
  const row = await db(ctx).user.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toDto(row) : null
}

export async function findUserByEmail(ctx: Ctx, email: string): Promise<UserDto | null> {
  const row = await db(ctx).user.findFirst({
    where: { email, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toDto(row) : null
}

export async function countUsers(ctx: Ctx): Promise<number> {
  return db(ctx).user.count({
    where: { organizationId: ctx.orgId, deletedAt: null },
  })
}

export async function createUser(
  ctx: Ctx,
  data: CreateUserInput & { passwordHash?: string | null },
): Promise<UserDto> {
  const row = await db(ctx).user.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      branchId: data.branchId ?? null,
      departmentId: data.departmentId ?? null,
      positionId: data.positionId ?? null,
      employeeCode: data.employeeId ?? null,
      passwordHash: data.passwordHash ?? null,
      status: statusIn[data.status],
    },
  })
  return toDto(row)
}

export async function updateUser(
  ctx: Ctx,
  id: string,
  data: UpdateUserInput,
): Promise<UserDto> {
  const row = await db(ctx).user.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      branchId: data.branchId,
      departmentId: data.departmentId,
      positionId: data.positionId,
      employeeCode: data.employeeId,
      status: data.status ? statusIn[data.status] : undefined,
    },
  })
  return toDto(row)
}

export async function changeUserStatus(
  ctx: Ctx,
  id: string,
  status: UserStatus,
): Promise<UserDto> {
  const row = await db(ctx).user.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: statusIn[status] },
  })
  return toDto(row)
}

export async function softDeleteUser(ctx: Ctx, id: string): Promise<UserDto> {
  const row = await db(ctx).user.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  })
  return toDto(row)
}
