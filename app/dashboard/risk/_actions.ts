"use server"

import { revalidatePath } from "next/cache"
import { createRisk, updateRisk, createControl } from "@/lib/services/risk/service"
import type { RiskLevel, RiskStatus } from "@/lib/entities/risk/schema"

export async function createRiskAction(input: {
  title: string
  likelihood: RiskLevel
  impact: RiskLevel
}) {
  await createRisk(input)
  revalidatePath("/dashboard/risk")
}

export async function setRiskStatusAction(id: string, status: RiskStatus) {
  await updateRisk(id, { status })
  revalidatePath("/dashboard/risk")
}

export async function createControlAction(input: {
  riskId: string
  name: string
  effectiveness: RiskLevel
}) {
  await createControl(input)
  revalidatePath("/dashboard/risk")
}
