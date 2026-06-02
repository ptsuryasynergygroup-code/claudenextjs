import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type ProductDto,
  type WarehouseDto,
  type StockDto,
  type StockMovementDto,
  type StockMovementType,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateWarehouseInput,
  type CreateStockMovementInput,
} from "./schema"
import type { Status } from "@/lib/entities/organization/schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const entOut: Record<string, Status> = { ACTIVE: "active", INACTIVE: "inactive" }
const entIn: Record<Status, "ACTIVE" | "INACTIVE"> = { active: "ACTIVE", inactive: "INACTIVE" }
const moveOut: Record<string, StockMovementType> = { IN: "in", OUT: "out", ADJUST: "adjust" }
const moveIn: Record<StockMovementType, "IN" | "OUT" | "ADJUST"> = {
  in: "IN",
  out: "OUT",
  adjust: "ADJUST",
}

type ProductRow = Prisma.ProductGetPayload<object>
type WhRow = Prisma.WarehouseGetPayload<object>
type StockRow = Prisma.StockGetPayload<object>
type MoveRow = Prisma.StockMovementGetPayload<object>

function toProduct(p: ProductRow): ProductDto {
  return {
    id: p.id,
    organizationId: p.organizationId,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    status: entOut[p.status] ?? "inactive",
    createdAt: p.createdAt,
  }
}
function toWarehouse(w: WhRow): WarehouseDto {
  return {
    id: w.id,
    organizationId: w.organizationId,
    code: w.code,
    name: w.name,
    location: w.location,
    status: entOut[w.status] ?? "inactive",
    createdAt: w.createdAt,
  }
}
function toStock(s: StockRow): StockDto {
  return {
    id: s.id,
    organizationId: s.organizationId,
    productId: s.productId,
    warehouseId: s.warehouseId,
    quantity: s.quantity,
  }
}
function toMovement(m: MoveRow): StockMovementDto {
  return {
    id: m.id,
    organizationId: m.organizationId,
    productId: m.productId,
    warehouseId: m.warehouseId,
    type: moveOut[m.type] ?? "adjust",
    quantity: m.quantity,
    reference: m.reference,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
  }
}

export async function listProducts(ctx: Ctx): Promise<ProductDto[]> {
  const rows = await db(ctx).product.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toProduct)
}

export async function findProduct(ctx: Ctx, id: string): Promise<ProductDto | null> {
  const row = await db(ctx).product.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toProduct(row) : null
}

export async function createProduct(ctx: Ctx, data: CreateProductInput): Promise<ProductDto> {
  const row = await db(ctx).product.create({
    data: {
      organizationId: ctx.orgId,
      sku: data.sku,
      name: data.name,
      category: data.category ?? null,
      unit: data.unit,
      status: entIn[data.status],
    },
  })
  return toProduct(row)
}

export async function updateProduct(
  ctx: Ctx,
  id: string,
  data: UpdateProductInput,
): Promise<ProductDto> {
  const row = await db(ctx).product.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      status: data.status ? entIn[data.status] : undefined,
    },
  })
  return toProduct(row)
}

export async function softDeleteProduct(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).product.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Product not found")
  await db(ctx).product.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listWarehouses(ctx: Ctx): Promise<WarehouseDto[]> {
  const rows = await db(ctx).warehouse.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toWarehouse)
}

export async function createWarehouse(
  ctx: Ctx,
  data: CreateWarehouseInput,
): Promise<WarehouseDto> {
  const row = await db(ctx).warehouse.create({
    data: {
      organizationId: ctx.orgId,
      code: data.code,
      name: data.name,
      location: data.location ?? null,
      status: entIn[data.status],
    },
  })
  return toWarehouse(row)
}

export async function listStocks(ctx: Ctx): Promise<StockDto[]> {
  const rows = await db(ctx).stock.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { updatedAt: "desc" },
  })
  return rows.map(toStock)
}

export async function listMovements(ctx: Ctx): Promise<StockMovementDto[]> {
  const rows = await db(ctx).stockMovement.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return rows.map(toMovement)
}

export async function recordMovement(
  ctx: Ctx,
  data: CreateStockMovementInput,
  createdBy: string,
): Promise<StockMovementDto> {
  const product = await db(ctx).product.findFirst({
    where: { id: data.productId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!product) throw new Error("Product not found in this organization")
  const warehouse = await db(ctx).warehouse.findFirst({
    where: { id: data.warehouseId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!warehouse) throw new Error("Warehouse not found in this organization")

  const delta =
    data.type === "in" ? data.quantity : data.type === "out" ? -data.quantity : data.quantity

  const existing = await db(ctx).stock.findUnique({
    where: { productId_warehouseId: { productId: data.productId, warehouseId: data.warehouseId } },
  })
  const currentQty = existing?.quantity ?? 0
  const nextQty = data.type === "adjust" ? data.quantity : currentQty + delta

  await db(ctx).stock.upsert({
    where: { productId_warehouseId: { productId: data.productId, warehouseId: data.warehouseId } },
    update: { quantity: nextQty },
    create: {
      organizationId: ctx.orgId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      quantity: nextQty,
    },
  })

  const row = await db(ctx).stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: moveIn[data.type],
      quantity: data.quantity,
      reference: data.reference ?? null,
      createdBy,
    },
  })
  return toMovement(row)
}
