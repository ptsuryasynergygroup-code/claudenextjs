import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type AssetDto,
  type AssetMaintenanceDto,
  type AssetStatus,
  type DepreciationMethod,
  type MaintenanceStatus,
  type CreateAssetInput,
  type UpdateAssetInput,
  type CreateMaintenanceInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const statusOut: Record<string, AssetStatus> = {
  ACTIVE: "active",
  MAINTENANCE: "maintenance",
  DISPOSED: "disposed",
}
const statusIn: Record<AssetStatus, "ACTIVE" | "MAINTENANCE" | "DISPOSED"> = {
  active: "ACTIVE",
  maintenance: "MAINTENANCE",
  disposed: "DISPOSED",
}
const depOut: Record<string, DepreciationMethod> = {
  NONE: "none",
  STRAIGHT_LINE: "straight_line",
}
const depIn: Record<DepreciationMethod, "NONE" | "STRAIGHT_LINE"> = {
  none: "NONE",
  straight_line: "STRAIGHT_LINE",
}
const mStatusOut: Record<string, MaintenanceStatus> = {
  SCHEDULED: "scheduled",
  DONE: "done",
  CANCELLED: "cancelled",
}
const mStatusIn: Record<MaintenanceStatus, "SCHEDULED" | "DONE" | "CANCELLED"> = {
  scheduled: "SCHEDULED",
  done: "DONE",
  cancelled: "CANCELLED",
}

type AssetRow = Prisma.AssetGetPayload<object>
type MaintRow = Prisma.AssetMaintenanceGetPayload<object>

function toAsset(a: AssetRow): AssetDto {
  return {
    id: a.id,
    organizationId: a.organizationId,
    code: a.code,
    name: a.name,
    category: a.category,
    acquisitionDate: a.acquisitionDate,
    acquisitionCost: a.acquisitionCost,
    usefulLifeMonths: a.usefulLifeMonths,
    depreciationMethod: depOut[a.depreciationMethod] ?? "none",
    status: statusOut[a.status] ?? "active",
    assignedToId: a.assignedToId,
    createdAt: a.createdAt,
  }
}
function toMaint(m: MaintRow): AssetMaintenanceDto {
  return {
    id: m.id,
    organizationId: m.organizationId,
    assetId: m.assetId,
    scheduledDate: m.scheduledDate,
    description: m.description,
    cost: m.cost,
    status: mStatusOut[m.status] ?? "scheduled",
    createdAt: m.createdAt,
  }
}

export async function listAssets(ctx: Ctx): Promise<AssetDto[]> {
  const rows = await db(ctx).asset.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toAsset)
}

export async function findAsset(ctx: Ctx, id: string): Promise<AssetDto | null> {
  const row = await db(ctx).asset.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toAsset(row) : null
}

export async function createAsset(ctx: Ctx, data: CreateAssetInput): Promise<AssetDto> {
  const row = await db(ctx).asset.create({
    data: {
      organizationId: ctx.orgId,
      code: data.code,
      name: data.name,
      category: data.category ?? null,
      acquisitionDate: data.acquisitionDate,
      acquisitionCost: data.acquisitionCost,
      usefulLifeMonths: data.usefulLifeMonths ?? null,
      depreciationMethod: depIn[data.depreciationMethod],
      status: statusIn[data.status],
      assignedToId: data.assignedToId ?? null,
    },
  })
  return toAsset(row)
}

export async function updateAsset(
  ctx: Ctx,
  id: string,
  data: UpdateAssetInput,
): Promise<AssetDto> {
  const row = await db(ctx).asset.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      code: data.code,
      name: data.name,
      category: data.category,
      acquisitionDate: data.acquisitionDate,
      acquisitionCost: data.acquisitionCost,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod ? depIn[data.depreciationMethod] : undefined,
      status: data.status ? statusIn[data.status] : undefined,
      assignedToId: data.assignedToId,
    },
  })
  return toAsset(row)
}

export async function softDeleteAsset(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).asset.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Asset not found")
  await db(ctx).asset.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listMaintenances(ctx: Ctx): Promise<AssetMaintenanceDto[]> {
  const rows = await db(ctx).assetMaintenance.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { scheduledDate: "desc" },
  })
  return rows.map(toMaint)
}

export async function findMaintenance(
  ctx: Ctx,
  id: string,
): Promise<AssetMaintenanceDto | null> {
  const row = await db(ctx).assetMaintenance.findFirst({
    where: { id, organizationId: ctx.orgId },
  })
  return row ? toMaint(row) : null
}

export async function createMaintenance(
  ctx: Ctx,
  data: CreateMaintenanceInput,
): Promise<AssetMaintenanceDto> {
  const asset = await db(ctx).asset.findFirst({
    where: { id: data.assetId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!asset) throw new Error("Asset not found in this organization")
  const row = await db(ctx).assetMaintenance.create({
    data: {
      organizationId: ctx.orgId,
      assetId: data.assetId,
      scheduledDate: data.scheduledDate,
      description: data.description ?? null,
      cost: data.cost ?? null,
      status: "SCHEDULED",
    },
  })
  return toMaint(row)
}

export async function setMaintenanceStatus(
  ctx: Ctx,
  id: string,
  status: MaintenanceStatus,
): Promise<AssetMaintenanceDto> {
  const row = await db(ctx).assetMaintenance.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: mStatusIn[status] },
  })
  return toMaint(row)
}
