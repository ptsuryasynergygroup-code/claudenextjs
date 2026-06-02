import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type RiskDto,
  type RiskControlDto,
  type RiskLevel,
  type RiskStatus,
  type CreateRiskInput,
  type UpdateRiskInput,
  type CreateRiskControlInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const levelOut: Record<string, RiskLevel> = { LOW: "low", MEDIUM: "medium", HIGH: "high" }
const levelIn: Record<RiskLevel, "LOW" | "MEDIUM" | "HIGH"> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
}
const statusOut: Record<string, RiskStatus> = {
  OPEN: "open",
  MITIGATED: "mitigated",
  CLOSED: "closed",
}
const statusIn: Record<RiskStatus, "OPEN" | "MITIGATED" | "CLOSED"> = {
  open: "OPEN",
  mitigated: "MITIGATED",
  closed: "CLOSED",
}

type RiskRow = Prisma.RiskGetPayload<object>
type ControlRow = Prisma.RiskControlGetPayload<object>

function toRisk(r: RiskRow): RiskDto {
  return {
    id: r.id,
    organizationId: r.organizationId,
    title: r.title,
    category: r.category,
    likelihood: levelOut[r.likelihood] ?? "medium",
    impact: levelOut[r.impact] ?? "medium",
    status: statusOut[r.status] ?? "open",
    ownerId: r.ownerId,
    createdAt: r.createdAt,
  }
}
function toControl(c: ControlRow): RiskControlDto {
  return {
    id: c.id,
    organizationId: c.organizationId,
    riskId: c.riskId,
    name: c.name,
    description: c.description,
    effectiveness: levelOut[c.effectiveness] ?? "medium",
    createdAt: c.createdAt,
  }
}

export async function listRisks(ctx: Ctx): Promise<RiskDto[]> {
  const rows = await db(ctx).risk.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toRisk)
}

export async function findRisk(ctx: Ctx, id: string): Promise<RiskDto | null> {
  const row = await db(ctx).risk.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toRisk(row) : null
}

export async function createRisk(ctx: Ctx, data: CreateRiskInput): Promise<RiskDto> {
  const row = await db(ctx).risk.create({
    data: {
      organizationId: ctx.orgId,
      title: data.title,
      category: data.category ?? null,
      likelihood: levelIn[data.likelihood],
      impact: levelIn[data.impact],
      ownerId: data.ownerId ?? null,
      status: "OPEN",
    },
  })
  return toRisk(row)
}

export async function updateRisk(ctx: Ctx, id: string, data: UpdateRiskInput): Promise<RiskDto> {
  const row = await db(ctx).risk.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      title: data.title,
      category: data.category,
      likelihood: data.likelihood ? levelIn[data.likelihood] : undefined,
      impact: data.impact ? levelIn[data.impact] : undefined,
      status: data.status ? statusIn[data.status] : undefined,
      ownerId: data.ownerId,
    },
  })
  return toRisk(row)
}

export async function softDeleteRisk(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).risk.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Risk not found")
  await db(ctx).risk.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listControls(ctx: Ctx): Promise<RiskControlDto[]> {
  const rows = await db(ctx).riskControl.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toControl)
}

export async function createControl(
  ctx: Ctx,
  data: CreateRiskControlInput,
): Promise<RiskControlDto> {
  const risk = await db(ctx).risk.findFirst({
    where: { id: data.riskId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!risk) throw new Error("Risk not found in this organization")
  const row = await db(ctx).riskControl.create({
    data: {
      organizationId: ctx.orgId,
      riskId: data.riskId,
      name: data.name,
      description: data.description ?? null,
      effectiveness: levelIn[data.effectiveness],
    },
  })
  return toControl(row)
}
