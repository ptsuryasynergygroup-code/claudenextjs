import { z } from "zod"

export const NotificationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  channel: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
})
export type NotificationDto = z.infer<typeof NotificationSchema>

export const ListNotificationsQuerySchema = z.object({
  unreadOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(50),
})
export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>
