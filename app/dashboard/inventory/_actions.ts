"use server"

import { revalidatePath } from "next/cache"
import {
  createProduct,
  createWarehouse,
  recordMovement,
  createTransfer,
} from "@/lib/services/inventory/service"
import type { StockMovementType } from "@/lib/entities/inventory/schema"

export async function createProductAction(input: {
  sku: string
  name: string
  unit: string
  category?: string | null
  barcode?: string | null
  costPrice?: number
  sellPrice?: number
  minStock?: number
}) {
  await createProduct(input)
  revalidatePath("/dashboard/inventory")
}

export async function createTransferAction(input: {
  productId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: number
}) {
  await createTransfer(input)
  revalidatePath("/dashboard/inventory")
}

export async function createWarehouseAction(input: { code: string; name: string }) {
  await createWarehouse(input)
  revalidatePath("/dashboard/inventory")
}

export async function recordMovementAction(input: {
  productId: string
  warehouseId: string
  type: StockMovementType
  quantity: number
}) {
  await recordMovement(input)
  revalidatePath("/dashboard/inventory")
}
