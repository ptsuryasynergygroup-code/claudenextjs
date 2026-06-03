"use server"

import { revalidatePath } from "next/cache"
import {
  createVendor,
  createEvaluation,
  createPurchaseRequest,
  decidePurchaseRequest,
  createPurchaseOrder,
  setPurchaseOrderStatus,
  receivePurchaseOrder,
} from "@/lib/services/procurement/service"
import type { PoStatus } from "@/lib/entities/procurement/schema"

type Item = { description: string; quantity: number; unitPrice: number }

export async function createVendorAction(input: { name: string; email?: string; phone?: string }) {
  await createVendor({ name: input.name, email: input.email || null, phone: input.phone || null })
  revalidatePath("/dashboard/procurement")
}

export async function createEvaluationAction(input: { vendorId: string; score: number; notes?: string }) {
  await createEvaluation({ vendorId: input.vendorId, score: input.score, notes: input.notes || null })
  revalidatePath("/dashboard/procurement")
}

export async function createPurchaseRequestAction(input: { number: string; notes?: string; items: Item[] }) {
  await createPurchaseRequest(input)
  revalidatePath("/dashboard/procurement")
}

export async function decidePurchaseRequestAction(id: string, status: "approved" | "rejected") {
  await decidePurchaseRequest(id, { status })
  revalidatePath("/dashboard/procurement")
}

export async function createPurchaseOrderAction(input: { number: string; vendorId: string; items: Item[] }) {
  await createPurchaseOrder(input)
  revalidatePath("/dashboard/procurement")
}

export async function setPurchaseOrderStatusAction(id: string, status: PoStatus) {
  await setPurchaseOrderStatus(id, { status })
  revalidatePath("/dashboard/procurement")
}

export async function receivePurchaseOrderAction(id: string, items: { itemId: string; receivedQty: number }[]) {
  await receivePurchaseOrder(id, { items })
  revalidatePath("/dashboard/procurement")
}
