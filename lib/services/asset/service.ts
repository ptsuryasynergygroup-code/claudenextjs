import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/asset/repository"
import {
  type AssetDto,
  type AssetMaintenanceDto,
  CreateAssetSchema,
  UpdateAssetSchema,
  CreateMaintenanceSchema,
  SetMaintenanceStatusSchema,
} from "@/lib/entities/asset/schema"
import { notFound } from "@/lib/errors"

const MODULE = "assets"

export async function getAssets(): Promise<AssetDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.view")
  return repo.listAssets({ orgId: s.orgId })
}

export async function createAsset(input: unknown): Promise<AssetDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.create")
  const data = CreateAssetSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const a = await repo.createAsset({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Asset", entityId: a.id, action: "create",
      description: `Created asset: ${a.code} ${a.name}`, newValue: { code: a.code },
    })
    return a
  })
}

export async function updateAsset(id: string, input: unknown): Promise<AssetDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.edit")
  const data = UpdateAssetSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findAsset({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Asset")
    const after = await repo.updateAsset({ orgId: s.orgId, tx }, id, data)
    const d = diff({ name: before.name, status: before.status }, { name: after.name, status: after.status })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Asset", entityId: after.id, action: "update",
      description: `Updated asset: ${after.code}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteAsset(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findAsset({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Asset")
    await repo.softDeleteAsset({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Asset", entityId: id, action: "delete",
      description: `Deleted asset: ${before.code}`, oldValue: { code: before.code },
    })
  })
}

export async function getMaintenances(): Promise<AssetMaintenanceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.view")
  return repo.listMaintenances({ orgId: s.orgId })
}

export async function createMaintenance(input: unknown): Promise<AssetMaintenanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.create")
  const data = CreateMaintenanceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const m = await repo.createMaintenance({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "AssetMaintenance", entityId: m.id, action: "create",
      description: `Scheduled maintenance for asset ${m.assetId}`,
      newValue: { assetId: m.assetId, scheduledDate: m.scheduledDate },
    })
    return m
  })
}

export async function setMaintenanceStatus(id: string, input: unknown): Promise<AssetMaintenanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "assets.edit")
  const { status } = SetMaintenanceStatusSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findMaintenance({ orgId: s.orgId, tx }, id)
    if (!before) notFound("AssetMaintenance")
    const after = await repo.setMaintenanceStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "AssetMaintenance", entityId: after.id, action: "update",
      description: `Maintenance ${after.id}: ${before.status} → ${after.status}`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}
