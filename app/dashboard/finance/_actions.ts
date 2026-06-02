"use server"

import { revalidatePath } from "next/cache"
import { createAccount, createInvoice } from "@/lib/services/finance/service"

export async function createAccountAction(input: {
  code: string
  name: string
  type: "asset" | "liability" | "equity" | "revenue" | "expense"
}) {
  await createAccount(input)
  revalidatePath("/dashboard/finance")
}

export async function createInvoiceAction(input: {
  number: string
  customerName: string
  amount: number
  issueDate: string
}) {
  await createInvoice(input)
  revalidatePath("/dashboard/finance")
}
