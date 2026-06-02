"use server"

import { revalidatePath } from "next/cache"
import {
  createCustomer,
  createLead,
  createOpportunity,
} from "@/lib/services/crm/service"
import type { LeadStatus, OpportunityStage } from "@/lib/entities/crm/schema"

export async function createCustomerAction(input: { name: string; email?: string; phone?: string }) {
  await createCustomer({ name: input.name, email: input.email || null, phone: input.phone || null })
  revalidatePath("/dashboard/crm")
}

export async function createLeadAction(input: { name: string; source?: string; status: LeadStatus }) {
  await createLead({ name: input.name, source: input.source || null, status: input.status })
  revalidatePath("/dashboard/crm")
}

export async function createOpportunityAction(input: {
  name: string
  amount: number
  stage: OpportunityStage
  customerId?: string | null
}) {
  await createOpportunity({
    name: input.name,
    amount: input.amount,
    stage: input.stage,
    customerId: input.customerId ?? null,
  })
  revalidatePath("/dashboard/crm")
}
