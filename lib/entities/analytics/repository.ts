import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type KpiDto,
  type CreateKpiInput,
  type UpdateKpiInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

type KpiRow = Prisma.KpiGetPayload<object>

function toKpi(k: KpiRow): KpiDto {
  return {
    id: k.id,
    organizationId: k.organizationId,
    name: k.name,
    metric: k.metric,
    target: k.target,
    current: k.current,
    unit: k.unit,
    period: k.period,
    createdAt: k.createdAt,
  }
}

export async function listKpis(ctx: Ctx): Promise<KpiDto[]> {
  const rows = await db(ctx).kpi.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toKpi)
}

export async function findKpi(ctx: Ctx, id: string): Promise<KpiDto | null> {
  const row = await db(ctx).kpi.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toKpi(row) : null
}

export async function createKpi(ctx: Ctx, data: CreateKpiInput): Promise<KpiDto> {
  const row = await db(ctx).kpi.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      metric: data.metric ?? null,
      target: data.target,
      current: data.current,
      unit: data.unit ?? null,
      period: data.period ?? null,
    },
  })
  return toKpi(row)
}

export async function updateKpi(ctx: Ctx, id: string, data: UpdateKpiInput): Promise<KpiDto> {
  const row = await db(ctx).kpi.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      metric: data.metric,
      target: data.target,
      current: data.current,
      unit: data.unit,
      period: data.period,
    },
  })
  return toKpi(row)
}

export async function softDeleteKpi(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).kpi.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("KPI not found")
  await db(ctx).kpi.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}
