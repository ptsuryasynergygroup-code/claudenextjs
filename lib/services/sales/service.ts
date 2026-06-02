import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog } from "@/lib/audit"
import * as repo from "@/lib/entities/sales/repository"
import {
  type QuotationDto,
  type SalesOrderDto,
  CreateQuotationSchema,
  UpdateQuotationStatusSchema,
  CreateSalesOrderSchema,
  UpdateSalesOrderStatusSchema,
} from "@/lib/entities/sales/schema"
import { notFound } from "@/lib/errors"

const MODULE = "sales"

export async function getQuotations(): Promise<QuotationDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.view")
  return repo.listQuotations({ orgId: s.orgId })
}

export async function createQuotation(input: unknown): Promise<QuotationDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.create")
  const data = CreateQuotationSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const q = await repo.createQuotation({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Quotation", entityId: q.id, action: "create",
      description: `Created quotation: ${q.number}`, newValue: { number: q.number, amount: q.amount },
    })
    return q
  })
}

export async function setQuotationStatus(id: string, input: unknown): Promise<QuotationDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.edit")
  const { status } = UpdateQuotationStatusSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findQuotation({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Quotation")
    const after = await repo.setQuotationStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Quotation", entityId: after.id, action: "update",
      description: `Quotation ${after.number}: ${before.status} → ${after.status}`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}

export async function getSalesOrders(): Promise<SalesOrderDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.view")
  return repo.listSalesOrders({ orgId: s.orgId })
}

export async function createSalesOrder(input: unknown): Promise<SalesOrderDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.create")
  const data = CreateSalesOrderSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const o = await repo.createSalesOrder({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "SalesOrder", entityId: o.id, action: "create",
      description: `Created sales order: ${o.number}`, newValue: { number: o.number, amount: o.amount },
    })
    return o
  })
}

export async function setSalesOrderStatus(id: string, input: unknown): Promise<SalesOrderDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "sales.edit")
  const { status } = UpdateSalesOrderStatusSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findSalesOrder({ orgId: s.orgId, tx }, id)
    if (!before) notFound("SalesOrder")
    const after = await repo.setSalesOrderStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "SalesOrder", entityId: after.id, action: "update",
      description: `Sales order ${after.number}: ${before.status} → ${after.status}`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}
