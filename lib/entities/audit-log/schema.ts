// Zod schemas for AuditLog reads.
// Writes go through lib/audit/emit.ts — there's no public Create schema here
// since logs are append-only and emitted by services, never user-submitted.

import { z } from "zod"

export const AuditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "view",
  "export",
  "approve",
  "reject",
  "grant",
  "revoke",
])
export type AuditActionDto = z.infer<typeof AuditActionSchema>

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  userName: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  action: AuditActionSchema,
  description: z.string().nullable(),
  oldValue: z.unknown().nullable(),
  newValue: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
})
export type AuditLogDto = z.infer<typeof AuditLogSchema>

export const ListAuditLogsQuerySchema = z.object({
  search: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  action: AuditActionSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
})
export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>
