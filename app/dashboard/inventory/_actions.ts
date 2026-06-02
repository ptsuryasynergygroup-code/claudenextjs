"use server"

import { revalidatePath } from "next/cache"
import {
  createProduct,
  createWarehouse,
  recordMovement,
} from "@/lib/services/inventory/service"
import type { StockMovementType } from "@/lib/entities/inventory/schema"

export async function createProductAction(input: { sku: string; name: string; unit: string }) {
  await createProduct(input)
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
