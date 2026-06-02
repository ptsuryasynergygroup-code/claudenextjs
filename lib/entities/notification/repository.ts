import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import { type NotificationDto, type ListNotificationsQuery } from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

type Row = Prisma.NotificationGetPayload<object>

function toDto(n: Row): NotificationDto {
  return {
    id: n.id,
    organizationId: n.organizationId,
    userId: n.userId,
    title: n.title,
    message: n.message,
    channel: n.channel,
    entityType: n.entityType,
    entityId: n.entityId,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }
}

export async function listForUser(
  ctx: Ctx,
  userId: string,
  query: ListNotificationsQuery,
): Promise<NotificationDto[]> {
  const rows = await db(ctx).notification.findMany({
    where: {
      organizationId: ctx.orgId,
      userId,
      readAt: query.unreadOnly ? null : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: query.limit,
  })
  return rows.map(toDto)
}

export async function countUnread(ctx: Ctx, userId: string): Promise<number> {
  return db(ctx).notification.count({
    where: { organizationId: ctx.orgId, userId, readAt: null },
  })
}

export async function markRead(ctx: Ctx, userId: string, id: string): Promise<void> {
  await db(ctx).notification.updateMany({
    where: { id, organizationId: ctx.orgId, userId },
    data: { readAt: new Date() },
  })
}

export async function markAllRead(ctx: Ctx, userId: string): Promise<void> {
  await db(ctx).notification.updateMany({
    where: { organizationId: ctx.orgId, userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function createMany(
  ctx: Ctx,
  rows: Array<{
    userId: string
    title: string
    message: string
    channel?: string
    entityType?: string | null
    entityId?: string | null
  }>,
): Promise<void> {
  if (rows.length === 0) return
  await db(ctx).notification.createMany({
    data: rows.map((r) => ({
      organizationId: ctx.orgId,
      userId: r.userId,
      title: r.title,
      message: r.message,
      channel: r.channel ?? "in_app",
      entityType: r.entityType ?? null,
      entityId: r.entityId ?? null,
    })),
  })
}
