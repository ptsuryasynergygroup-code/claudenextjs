"use server"

import { revalidatePath } from "next/cache"
import { decide, startInstance } from "@/lib/services/workflow/service"
import type { ApprovalDecision } from "@/lib/entities/workflow/schema"

export async function decideAction(
  instanceId: string,
  decision: ApprovalDecision,
  comment?: string,
) {
  await decide(instanceId, { decision, comment: comment ?? null })
  revalidatePath("/dashboard/workflows")
}

export async function startInstanceAction(entityType: string, entityId: string) {
  await startInstance({ entityType, entityId })
  revalidatePath("/dashboard/workflows")
}
