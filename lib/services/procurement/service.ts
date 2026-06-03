import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement, requireFeature } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/procurement/repository"
import {
  type VendorDto,
  type VendorEvaluationDto,
  type PurchaseRequestDto,
  type PurchaseOrderDto,
  CreateVendorSchema,
  UpdateVendorSchema,
  CreateVendorEvaluationSchema,
  CreatePurchaseRequestSchema,
  DecidePurchaseRequestSchema,
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderStatusSchema,
  ReceivePurchaseOrderSchema,
} from "@/lib/entities/procurement/schema"
import { notFound } from "@/lib/errors"

const MODULE = "procurement"
const F_RECEIVING = "procurement.receiving"
const F_EVALUATION = "procurement.evaluation"

// Vendors ---------------------------------------------------------------------

export async function getVendors(): Promise<VendorDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.view")
  return repo.listVendors({ orgId: s.orgId })
}

export async function createVendor(input: unknown): Promise<VendorDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.create")
  const data = CreateVendorSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const v = await repo.createVendor({ orgId: s.orgId, tx }, data)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "Vendor", entityId: v.id, action: "create", description: `Created vendor: ${v.name}`, newValue: { name: v.name } })
    return v
  })
}

export async function updateVendor(id: string, input: unknown): Promise<VendorDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.edit")
  const data = UpdateVendorSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findVendor({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Vendor")
    const after = await repo.updateVendor({ orgId: s.orgId, tx }, id, data)
    const d = diff({ name: before.name, status: before.status }, { name: after.name, status: after.status })
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "Vendor", entityId: after.id, action: "update", description: `Updated vendor: ${after.name}`, oldValue: d.old, newValue: d.new })
    return after
  })
}

export async function deleteVendor(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findVendor({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Vendor")
    await repo.softDeleteVendor({ orgId: s.orgId, tx }, id)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "Vendor", entityId: id, action: "delete", description: `Deleted vendor: ${before.name}`, oldValue: { name: before.name } })
  })
}

// Vendor evaluation (feature: procurement.evaluation) -------------------------

export async function getEvaluations(): Promise<VendorEvaluationDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_EVALUATION)
  await requirePermission(s.userId, "procurement.view")
  return repo.listEvaluations({ orgId: s.orgId })
}

export async function createEvaluation(input: unknown): Promise<VendorEvaluationDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_EVALUATION)
  await requirePermission(s.userId, "procurement.edit")
  const data = CreateVendorEvaluationSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const e = await repo.createEvaluation({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "VendorEvaluation", entityId: e.id, action: "create", description: `Evaluated vendor ${e.vendorId}: ${e.score}/5`, newValue: { vendorId: e.vendorId, score: e.score } })
    return e
  })
}

// Purchase requests -----------------------------------------------------------

export async function getPurchaseRequests(): Promise<PurchaseRequestDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.view")
  return repo.listPurchaseRequests({ orgId: s.orgId })
}

export async function createPurchaseRequest(input: unknown): Promise<PurchaseRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.create")
  const data = CreatePurchaseRequestSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const pr = await repo.createPurchaseRequest({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "PurchaseRequest", entityId: pr.id, action: "create", description: `Created PR: ${pr.number}`, newValue: { number: pr.number, totalAmount: pr.totalAmount, items: pr.items.length } })
    return pr
  })
}

export async function decidePurchaseRequest(id: string, input: unknown): Promise<PurchaseRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.approve")
  const { status } = DecidePurchaseRequestSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findPurchaseRequest({ orgId: s.orgId, tx }, id)
    if (!before) notFound("PurchaseRequest")
    const after = await repo.setPurchaseRequestStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "PurchaseRequest", entityId: after.id, action: status === "approved" ? "approve" : "reject", description: `PR ${status}: ${after.number}`, oldValue: { status: before.status }, newValue: { status: after.status } })
    return after
  })
}

// Purchase orders -------------------------------------------------------------

export async function getPurchaseOrders(): Promise<PurchaseOrderDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.view")
  return repo.listPurchaseOrders({ orgId: s.orgId })
}

export async function createPurchaseOrder(input: unknown): Promise<PurchaseOrderDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.create")
  const data = CreatePurchaseOrderSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const po = await repo.createPurchaseOrder({ orgId: s.orgId, tx }, data)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "PurchaseOrder", entityId: po.id, action: "create", description: `Created PO: ${po.number}`, newValue: { number: po.number, vendorId: po.vendorId, totalAmount: po.totalAmount } })
    return po
  })
}

export async function setPurchaseOrderStatus(id: string, input: unknown): Promise<PurchaseOrderDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "procurement.edit")
  const { status } = UpdatePurchaseOrderStatusSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findPurchaseOrder({ orgId: s.orgId, tx }, id)
    if (!before) notFound("PurchaseOrder")
    const after = await repo.setPurchaseOrderStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "PurchaseOrder", entityId: after.id, action: "update", description: `PO ${after.number}: ${before.status} → ${after.status}`, oldValue: { status: before.status }, newValue: { status: after.status } })
    return after
  })
}

export async function receivePurchaseOrder(id: string, input: unknown): Promise<PurchaseOrderDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_RECEIVING)
  await requirePermission(s.userId, "procurement.edit")
  const data = ReceivePurchaseOrderSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findPurchaseOrder({ orgId: s.orgId, tx }, id)
    if (!before) notFound("PurchaseOrder")
    const after = await repo.receivePurchaseOrder({ orgId: s.orgId, tx }, id, data)
    await auditLog.emit({ tx, orgId: s.orgId, userId: s.userId, userName: s.name, entityType: "PurchaseOrder", entityId: after.id, action: "update", description: `Received goods for PO ${after.number}`, oldValue: { status: before.status }, newValue: { status: after.status } })
    return after
  })
}
