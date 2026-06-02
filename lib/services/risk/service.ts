import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/risk/repository"
import {
  type RiskDto,
  type RiskControlDto,
  CreateRiskSchema,
  UpdateRiskSchema,
  CreateRiskControlSchema,
} from "@/lib/entities/risk/schema"
import { notFound } from "@/lib/errors"

const MODULE = "risk"

export async function getRisks(): Promise<RiskDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.view")
  return repo.listRisks({ orgId: s.orgId })
}

export async function createRisk(input: unknown): Promise<RiskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.create")
  const data = CreateRiskSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const r = await repo.createRisk({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Risk", entityId: r.id, action: "create",
      description: `Created risk: ${r.title}`, newValue: { title: r.title, likelihood: r.likelihood, impact: r.impact },
    })
    return r
  })
}

export async function updateRisk(id: string, input: unknown): Promise<RiskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.edit")
  const data = UpdateRiskSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findRisk({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Risk")
    const after = await repo.updateRisk({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { status: before.status, likelihood: before.likelihood, impact: before.impact },
      { status: after.status, likelihood: after.likelihood, impact: after.impact },
    )
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Risk", entityId: after.id, action: "update",
      description: `Updated risk: ${after.title}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteRisk(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findRisk({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Risk")
    await repo.softDeleteRisk({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Risk", entityId: id, action: "delete",
      description: `Deleted risk: ${before.title}`, oldValue: { title: before.title },
    })
  })
}

export async function getControls(): Promise<RiskControlDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.view")
  return repo.listControls({ orgId: s.orgId })
}

export async function createControl(input: unknown): Promise<RiskControlDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "risk.create")
  const data = CreateRiskControlSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const c = await repo.createControl({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "RiskControl", entityId: c.id, action: "create",
      description: `Added control: ${c.name}`, newValue: { name: c.name, riskId: c.riskId },
    })
    return c
  })
}
