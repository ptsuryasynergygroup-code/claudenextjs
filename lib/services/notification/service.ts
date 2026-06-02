import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import * as repo from "@/lib/entities/notification/repository"
import {
  type NotificationDto,
  type ListNotificationsQuery,
  ListNotificationsQuerySchema,
} from "@/lib/entities/notification/schema"

const MODULE = "notifications"

export async function getNotifications(
  query: Partial<ListNotificationsQuery> = {},
): Promise<NotificationDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "notifications.view")
  const q = ListNotificationsQuerySchema.parse(query)
  return repo.listForUser({ orgId: s.orgId }, s.userId, q)
}

export async function getUnreadCount(): Promise<number> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "notifications.view")
  return repo.countUnread({ orgId: s.orgId }, s.userId)
}

export async function markNotificationRead(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "notifications.view")
  await repo.markRead({ orgId: s.orgId }, s.userId, id)
}

export async function markAllNotificationsRead(): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "notifications.view")
  await repo.markAllRead({ orgId: s.orgId }, s.userId)
}
