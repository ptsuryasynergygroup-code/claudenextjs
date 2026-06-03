"use server"

import { revalidatePath } from "next/cache"
import {
  createAccount,
  createInvoice,
  createTransaction,
  createPayment,
  createJournalEntry,
  postJournalEntry,
  setBudget,
} from "@/lib/services/finance/service"

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

export async function createPaymentAction(input: {
  invoiceId?: string | null
  amount: number
  method: string
  paymentDate: string
}) {
  await createPayment(input)
  revalidatePath("/dashboard/finance")
}

export async function createJournalEntryAction(input: {
  entryDate: string
  reference?: string | null
  memo?: string | null
  lines: { accountId: string; debit: number; credit: number; description?: string | null }[]
}) {
  await createJournalEntry(input)
  revalidatePath("/dashboard/finance")
}

export async function postJournalEntryAction(id: string) {
  await postJournalEntry(id)
  revalidatePath("/dashboard/finance")
}

export async function setBudgetAction(input: { accountId: string; period: string; amount: number }) {
  await setBudget(input)
  revalidatePath("/dashboard/finance")
}
