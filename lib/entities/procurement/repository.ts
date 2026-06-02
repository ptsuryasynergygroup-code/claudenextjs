import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type VendorDto,
  type PurchaseRequestDto,
  type PurchaseOrderDto,
  type PrStatus,
  type PoStatus,
  type CreateVendorInput,
  type UpdateVendorInput,
  type CreatePurchaseRequestInput,
  type CreatePurchaseOrderInput,
} from "./schema"
import type { Status } from "@/lib/entities/organization/schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const entOut: Record<string, Status> = { ACTIVE: "active", INACTIVE: "inactive" }
const entIn: Record<Status, "ACTIVE" | "INACTIVE"> = { active: "ACTIVE", inactive: "INACTIVE" }
const prOut: Record<string, PrStatus> = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}
const prIn: Record<PrStatus, "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"> = {
  draft: "DRAFT",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
}
const poOut: Record<string, PoStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  RECEIVED: "received",
  CLOSED: "closed",
  CANCELLED: "cancelled",
}
const poIn: Record<PoStatus, "DRAFT" | "SENT" | "RECEIVED" | "CLOSED" | "CANCELLED"> = {
  draft: "DRAFT",
  sent: "SENT",
  received: "RECEIVED",
  closed: "CLOSED",
  cancelled: "CANCELLED",
}

type VendorRow = Prisma.VendorGetPayload<object>
type PrRow = Prisma.PurchaseRequestGetPayload<object>
type PoRow = Prisma.PurchaseOrderGetPayload<object>

function toVendor(v: VendorRow): VendorDto {
  return {
    id: v.id,
    organizationId: v.organizationId,
    name: v.name,
    taxNumber: v.taxNumber,
    phone: v.phone,
    email: v.email,
    status: entOut[v.status] ?? "inactive",
    createdAt: v.createdAt,
  }
}
function toPr(p: PrRow): PurchaseRequestDto {
  return {
    id: p.id,
    organizationId: p.organizationId,
    number: p.number,
    requesterId: p.requesterId,
    status: prOut[p.status] ?? "draft",
    totalAmount: p.totalAmount,
    notes: p.notes,
    createdAt: p.createdAt,
  }
}
function toPo(p: PoRow): PurchaseOrderDto {
  return {
    id: p.id,
    organizationId: p.organizationId,
    number: p.number,
    vendorId: p.vendorId,
    purchaseRequestId: p.purchaseRequestId,
    status: poOut[p.status] ?? "draft",
    totalAmount: p.totalAmount,
    createdAt: p.createdAt,
  }
}

export async function listVendors(ctx: Ctx): Promise<VendorDto[]> {
  const rows = await db(ctx).vendor.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toVendor)
}

export async function findVendor(ctx: Ctx, id: string): Promise<VendorDto | null> {
  const row = await db(ctx).vendor.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toVendor(row) : null
}

export async function createVendor(ctx: Ctx, data: CreateVendorInput): Promise<VendorDto> {
  const row = await db(ctx).vendor.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      taxNumber: data.taxNumber ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      status: entIn[data.status],
    },
  })
  return toVendor(row)
}

export async function updateVendor(
  ctx: Ctx,
  id: string,
  data: UpdateVendorInput,
): Promise<VendorDto> {
  const row = await db(ctx).vendor.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      taxNumber: data.taxNumber,
      phone: data.phone,
      email: data.email,
      status: data.status ? entIn[data.status] : undefined,
    },
  })
  return toVendor(row)
}

export async function softDeleteVendor(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).vendor.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Vendor not found")
  await db(ctx).vendor.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listPurchaseRequests(ctx: Ctx): Promise<PurchaseRequestDto[]> {
  const rows = await db(ctx).purchaseRequest.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toPr)
}

export async function findPurchaseRequest(
  ctx: Ctx,
  id: string,
): Promise<PurchaseRequestDto | null> {
  const row = await db(ctx).purchaseRequest.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toPr(row) : null
}

export async function createPurchaseRequest(
  ctx: Ctx,
  data: CreatePurchaseRequestInput,
  requesterId: string,
): Promise<PurchaseRequestDto> {
  const row = await db(ctx).purchaseRequest.create({
    data: {
      organizationId: ctx.orgId,
      number: data.number,
      requesterId,
      totalAmount: data.totalAmount,
      notes: data.notes ?? null,
      status: "PENDING",
    },
  })
  return toPr(row)
}

export async function setPurchaseRequestStatus(
  ctx: Ctx,
  id: string,
  status: PrStatus,
): Promise<PurchaseRequestDto> {
  const row = await db(ctx).purchaseRequest.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: prIn[status] },
  })
  return toPr(row)
}

export async function listPurchaseOrders(ctx: Ctx): Promise<PurchaseOrderDto[]> {
  const rows = await db(ctx).purchaseOrder.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toPo)
}

export async function createPurchaseOrder(
  ctx: Ctx,
  data: CreatePurchaseOrderInput,
): Promise<PurchaseOrderDto> {
  const vendor = await db(ctx).vendor.findFirst({
    where: { id: data.vendorId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!vendor) throw new Error("Vendor not found in this organization")
  if (data.purchaseRequestId) {
    const pr = await db(ctx).purchaseRequest.findFirst({
      where: { id: data.purchaseRequestId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    })
    if (!pr) throw new Error("Purchase request not found in this organization")
  }
  const row = await db(ctx).purchaseOrder.create({
    data: {
      organizationId: ctx.orgId,
      number: data.number,
      vendorId: data.vendorId,
      purchaseRequestId: data.purchaseRequestId ?? null,
      totalAmount: data.totalAmount,
      status: "DRAFT",
    },
  })
  return toPo(row)
}

export async function findPurchaseOrder(ctx: Ctx, id: string): Promise<PurchaseOrderDto | null> {
  const row = await db(ctx).purchaseOrder.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toPo(row) : null
}

export async function setPurchaseOrderStatus(
  ctx: Ctx,
  id: string,
  status: PoStatus,
): Promise<PurchaseOrderDto> {
  const row = await db(ctx).purchaseOrder.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: poIn[status] },
  })
  return toPo(row)
}
