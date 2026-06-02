"use server"

import { revalidatePath } from "next/cache"
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notification/service"

export async function markReadAction(id: string) {
  await markNotificationRead(id)
  revalidatePath("/dashboard/notifications")
}

export async function markAllReadAction() {
  await markAllNotificationsRead()
  revalidatePath("/dashboard/notifications")
}
