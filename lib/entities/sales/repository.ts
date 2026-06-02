import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type QuotationDto,
  type SalesOrderDto,
  type QuotationStatus,
  type SalesOrderStatus,
  type CreateQuotationInput,
  type CreateSalesOrderInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const quoOut: Record<string, QuotationStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
}
const quoIn: Record<QuotationStatus, "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"> = {
  draft: "DRAFT",
  sent: "SENT",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
}
const soOut: Record<string, SalesOrderStatus> = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
}
const soIn: Record<SalesOrderStatus, "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED"> = {
  draft: "DRAFT",
  confirmed: "CONFIRMED",
  fulfilled: "FULFILLED",
  cancelled: "CANCELLED",
}

type QuoRow = Prisma.QuotationGetPayload<object>
type SoRow = Prisma.SalesOrderGetPayload<object>

function toQuotation(q: QuoRow): QuotationDto {
  return {
    id: q.id,
    organizationId: q.organizationId,
    number: q.number,
    customerId: q.customerId,
    amount: q.amount,
    status: quoOut[q.status] ?? "draft",
    validUntil: q.validUntil,
    createdAt: q.createdAt,
  }
}
function toSalesOrder(s: SoRow): SalesOrderDto {
  return {
    id: s.id,
    organizationId: s.organizationId,
    number: s.number,
    customerId: s.customerId,
    quotationId: s.quotationId,
    amount: s.amount,
    status: soOut[s.status] ?? "draft",
    createdAt: s.createdAt,
  }
}

async function assertCustomer(ctx: Ctx, customerId: string) {
  const c = await db(ctx).customer.findFirst({
    where: { id: customerId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!c) throw new Error("Customer not found in this organization")
}

export async function listQuotations(ctx: Ctx): Promise<QuotationDto[]> {
  const rows = await db(ctx).quotation.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toQuotation)
}

export async function findQuotation(ctx: Ctx, id: string): Promise<QuotationDto | null> {
  const row = await db(ctx).quotation.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toQuotation(row) : null
}

export async function createQuotation(
  ctx: Ctx,
  data: CreateQuotationInput,
): Promise<QuotationDto> {
  await assertCustomer(ctx, data.customerId)
  const row = await db(ctx).quotation.create({
    data: {
      organizationId: ctx.orgId,
      number: data.number,
      customerId: data.customerId,
      amount: data.amount,
      validUntil: data.validUntil ?? null,
      status: "DRAFT",
    },
  })
  return toQuotation(row)
}

export async function setQuotationStatus(
  ctx: Ctx,
  id: string,
  status: QuotationStatus,
): Promise<QuotationDto> {
  const row = await db(ctx).quotation.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: quoIn[status] },
  })
  return toQuotation(row)
}

export async function listSalesOrders(ctx: Ctx): Promise<SalesOrderDto[]> {
  const rows = await db(ctx).salesOrder.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toSalesOrder)
}

export async function findSalesOrder(ctx: Ctx, id: string): Promise<SalesOrderDto | null> {
  const row = await db(ctx).salesOrder.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toSalesOrder(row) : null
}

export async function createSalesOrder(
  ctx: Ctx,
  data: CreateSalesOrderInput,
): Promise<SalesOrderDto> {
  await assertCustomer(ctx, data.customerId)
  if (data.quotationId) {
    const q = await db(ctx).quotation.findFirst({
      where: { id: data.quotationId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    })
    if (!q) throw new Error("Quotation not found in this organization")
  }
  const row = await db(ctx).salesOrder.create({
    data: {
      organizationId: ctx.orgId,
      number: data.number,
      customerId: data.customerId,
      quotationId: data.quotationId ?? null,
      amount: data.amount,
      status: "DRAFT",
    },
  })
  return toSalesOrder(row)
}

export async function setSalesOrderStatus(
  ctx: Ctx,
  id: string,
  status: SalesOrderStatus,
): Promise<SalesOrderDto> {
  const row = await db(ctx).salesOrder.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: soIn[status] },
  })
  return toSalesOrder(row)
}
