import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/analytics/repository"
import {
  type KpiDto,
  CreateKpiSchema,
  UpdateKpiSchema,
} from "@/lib/entities/analytics/schema"
import { notFound } from "@/lib/errors"

const MODULE = "analytics"

export async function getKpis(): Promise<KpiDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "analytics.view")
  return repo.listKpis({ orgId: s.orgId })
}

export async function createKpi(input: unknown): Promise<KpiDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "analytics.create")
  const data = CreateKpiSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const k = await repo.createKpi({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Kpi", entityId: k.id, action: "create",
      description: `Created KPI: ${k.name}`, newValue: { name: k.name, target: k.target },
    })
    return k
  })
}

export async function updateKpi(id: string, input: unknown): Promise<KpiDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "analytics.edit")
  const data = UpdateKpiSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findKpi({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Kpi")
    const after = await repo.updateKpi({ orgId: s.orgId, tx }, id, data)
    const d = diff({ target: before.target, current: before.current }, { target: after.target, current: after.current })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Kpi", entityId: after.id, action: "update",
      description: `Updated KPI: ${after.name}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteKpi(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "analytics.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findKpi({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Kpi")
    await repo.softDeleteKpi({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Kpi", entityId: id, action: "delete",
      description: `Deleted KPI: ${before.name}`, oldValue: { name: before.name },
    })
  })
}
