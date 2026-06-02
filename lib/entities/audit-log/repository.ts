// Repository for audit_log reads.
// Writes happen through lib/audit/emit.ts inside service transactions.

import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type AuditLogDto,
  type AuditActionDto,
  type ListAuditLogsQuery,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

type PrismaLog = Awaited<ReturnType<PrismaClient["auditLog"]["findFirst"]>>

function toDto(l: NonNullable<PrismaLog>): AuditLogDto {
  return {
    id: l.id,
    userId: l.userId,
    userName: l.userName,
    entityType: l.entityType,
    entityId: l.entityId,
    action: l.action as AuditActionDto,
    description: l.description,
    oldValue: l.oldValue,
    newValue: l.newValue,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt,
  }
}

export async function listAuditLogs(
  ctx: Ctx,
  query: ListAuditLogsQuery,
): Promise<AuditLogDto[]> {
  const where: Prisma.AuditLogWhereInput = {
    organizationId: ctx.orgId,
    userId: query.userId,
    entityType: query.entityType,
    action: query.action,
    createdAt:
      query.startDate || query.endDate
        ? { gte: query.startDate, lte: query.endDate }
        : undefined,
    OR: query.search
      ? [
          { userName: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          { entityType: { contains: query.search, mode: "insensitive" } },
        ]
      : undefined,
  }

  const rows = await db(ctx).auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    skip: query.offset,
  })
  return rows.map(toDto)
}

export async function countAuditLogs(
  ctx: Ctx,
  query: Omit<ListAuditLogsQuery, "limit" | "offset">,
): Promise<number> {
  return db(ctx).auditLog.count({
    where: {
      organizationId: ctx.orgId,
      userId: query.userId,
      entityType: query.entityType,
      action: query.action,
      createdAt:
        query.startDate || query.endDate
          ? { gte: query.startDate, lte: query.endDate }
          : undefined,
    },
  })
}

export async function listRecentLogs(ctx: Ctx, limit = 5): Promise<AuditLogDto[]> {
  const rows = await db(ctx).auditLog.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return rows.map(toDto)
}
