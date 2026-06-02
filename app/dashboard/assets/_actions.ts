"use server"

import { revalidatePath } from "next/cache"
import {
  createAsset,
  createMaintenance,
  setMaintenanceStatus,
} from "@/lib/services/asset/service"
import type { MaintenanceStatus } from "@/lib/entities/asset/schema"

export async function createAssetAction(input: {
  code: string
  name: string
  acquisitionDate: string
  acquisitionCost: number
}) {
  await createAsset(input)
  revalidatePath("/dashboard/assets")
}

export async function createMaintenanceAction(input: {
  assetId: string
  scheduledDate: string
  description?: string
}) {
  await createMaintenance(input)
  revalidatePath("/dashboard/assets")
}

export async function setMaintenanceStatusAction(id: string, status: MaintenanceStatus) {
  await setMaintenanceStatus(id, { status })
  revalidatePath("/dashboard/assets")
}
