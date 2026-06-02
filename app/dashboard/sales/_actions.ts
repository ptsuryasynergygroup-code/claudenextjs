"use server"

import { revalidatePath } from "next/cache"
import {
  createQuotation,
  setQuotationStatus,
  createSalesOrder,
  setSalesOrderStatus,
} from "@/lib/services/sales/service"
import type { QuotationStatus, SalesOrderStatus } from "@/lib/entities/sales/schema"

export async function createQuotationAction(input: {
  number: string
  customerId: string
  amount: number
}) {
  await createQuotation(input)
  revalidatePath("/dashboard/sales")
}

export async function setQuotationStatusAction(id: string, status: QuotationStatus) {
  await setQuotationStatus(id, { status })
  revalidatePath("/dashboard/sales")
}

export async function createSalesOrderAction(input: {
  number: string
  customerId: string
  amount: number
}) {
  await createSalesOrder(input)
  revalidatePath("/dashboard/sales")
}

export async function setSalesOrderStatusAction(id: string, status: SalesOrderStatus) {
  await setSalesOrderStatus(id, { status })
  revalidatePath("/dashboard/sales")
}
