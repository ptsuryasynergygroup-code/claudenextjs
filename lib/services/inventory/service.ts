import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement, requireFeature } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import { fromSession } from "@/lib/scope"
import * as repo from "@/lib/entities/inventory/repository"
import {
  type ProductDto,
  type WarehouseDto,
  type StockDto,
  type StockMovementDto,
  type StockTransferDto,
  CreateProductSchema,
  UpdateProductSchema,
  CreateWarehouseSchema,
  CreateStockMovementSchema,
  CreateStockTransferSchema,
} from "@/lib/entities/inventory/schema"
import { notFound } from "@/lib/errors"

const MODULE = "inventory"
const F_TRANSFER = "inventory.transfer"

export async function getProducts(): Promise<ProductDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.view")
  return repo.listProducts({ orgId: s.orgId })
}

export async function createProduct(input: unknown): Promise<ProductDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.create")
  const data = CreateProductSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const p = await repo.createProduct({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Product", entityId: p.id, action: "create",
      description: `Created product: ${p.sku} ${p.name}`, newValue: { sku: p.sku },
    })
    return p
  })
}

export async function updateProduct(id: string, input: unknown): Promise<ProductDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.edit")
  const data = UpdateProductSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findProduct({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Product")
    const after = await repo.updateProduct({ orgId: s.orgId, tx }, id, data)
    const d = diff({ name: before.name, status: before.status }, { name: after.name, status: after.status })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Product", entityId: after.id, action: "update",
      description: `Updated product: ${after.sku}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteProduct(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findProduct({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Product")
    await repo.softDeleteProduct({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Product", entityId: id, action: "delete",
      description: `Deleted product: ${before.sku}`, oldValue: { sku: before.sku },
    })
  })
}

export async function getWarehouses(): Promise<WarehouseDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.view")
  return repo.listWarehouses({ orgId: s.orgId, sc: fromSession(s) })
}

export async function createWarehouse(input: unknown): Promise<WarehouseDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.create")
  const data = CreateWarehouseSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const w = await repo.createWarehouse({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Warehouse", entityId: w.id, action: "create",
      description: `Created warehouse: ${w.code}`, newValue: { code: w.code },
    })
    return w
  })
}

export async function getStocks(): Promise<StockDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.view")
  return repo.listStocks({ orgId: s.orgId, sc: fromSession(s) })
}

export async function getMovements(): Promise<StockMovementDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.view")
  return repo.listMovements({ orgId: s.orgId, sc: fromSession(s) })
}

export async function recordMovement(input: unknown): Promise<StockMovementDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "inventory.create")
  const data = CreateStockMovementSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const m = await repo.recordMovement({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "StockMovement", entityId: m.id, action: "create",
      description: `Stock ${m.type} ${m.quantity} (product ${m.productId})`,
      newValue: { type: m.type, quantity: m.quantity, productId: m.productId, warehouseId: m.warehouseId },
    })
    return m
  })
}

// Stock transfers (feature: inventory.transfer) -------------------------------

export async function getTransfers(): Promise<StockTransferDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_TRANSFER)
  await requirePermission(s.userId, "inventory.view")
  return repo.listTransfers({ orgId: s.orgId })
}

export async function createTransfer(input: unknown): Promise<StockTransferDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_TRANSFER)
  await requirePermission(s.userId, "inventory.create")
  const data = CreateStockTransferSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const t = await repo.createTransfer({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "StockTransfer", entityId: t.id, action: "create",
      description: `Transferred ${t.quantity} of product ${t.productId} between warehouses`,
      newValue: { productId: t.productId, from: t.fromWarehouseId, to: t.toWarehouseId, quantity: t.quantity },
    })
    return t
  })
}
