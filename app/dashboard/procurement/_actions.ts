"use server"

import { revalidatePath } from "next/cache"
import {
  createVendor,
  createPurchaseRequest,
  decidePurchaseRequest,
  createPurchaseOrder,
  setPurchaseOrderStatus,
} from "@/lib/services/procurement/service"
import type { PoStatus } from "@/lib/entities/procurement/schema"

export async function createVendorAction(input: { name: string; email?: string; phone?: string }) {
  await createVendor({ name: input.name, email: input.email || null, phone: input.phone || null })
  revalidatePath("/dashboard/procurement")
}

export async function createPurchaseRequestAction(input: { number: string; totalAmount: number }) {
  await createPurchaseRequest(input)
  revalidatePath("/dashboard/procurement")
}

export async function decidePurchaseRequestAction(id: string, status: "approved" | "rejected") {
  await decidePurchaseRequest(id, { status })
  revalidatePath("/dashboard/procurement")
}

export async function createPurchaseOrderAction(input: {
  number: string
  vendorId: string
  totalAmount: number
}) {
  await createPurchaseOrder(input)
  revalidatePath("/dashboard/procurement")
}

export async function setPurchaseOrderStatusAction(id: string, status: PoStatus) {
  await setPurchaseOrderStatus(id, { status })
  revalidatePath("/dashboard/procurement")
}
