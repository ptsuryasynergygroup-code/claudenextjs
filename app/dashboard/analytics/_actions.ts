"use server"

import { revalidatePath } from "next/cache"
import { createKpi } from "@/lib/services/analytics/service"

export async function createKpiAction(input: {
  name: string
  target: number
  current: number
  unit?: string
}) {
  await createKpi(input)
  revalidatePath("/dashboard/analytics")
}
