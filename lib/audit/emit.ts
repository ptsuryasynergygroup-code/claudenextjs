// Audit log emitter — PRD invariant I3.
//
// Rule: MUST be called inside the same prisma.$transaction as the data
// mutation so the audit row commits or rolls back atomically with the
// underlying change.

import type { Prisma, PrismaClient } from "@prisma/client"
import { redact } from "@/lib/audit/redact"

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "view"
  | "export"
  | "approve"
  | "reject"
  | "grant"
  | "revoke"

export type AuditEmitInput = {
  tx: Prisma.TransactionClient | PrismaClient
  orgId: string
  userId: string | null
  userName: string
  entityType: string
  entityId: string
  action: AuditAction
  description?: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

async function emit(input: AuditEmitInput): Promise<void> {
  await input.tx.auditLog.create({
    data: {
      organizationId: input.orgId,
      userId: input.userId,
      userName: input.userName,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description ?? null,
      oldValue: input.oldValue === undefined ? undefined : (redact(input.oldValue) as Prisma.InputJsonValue),
      newValue: input.newValue === undefined ? undefined : (redact(input.newValue) as Prisma.InputJsonValue),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  })
}

export const auditLog = { emit }

/**
 * Compute a minimal diff between two records for update audit entries.
 * Returns { old, new } containing only changed keys.
 */
export function diff<T extends Record<string, unknown>>(
  before: T,
  after: T,
): { old: Partial<T>; new: Partial<T> } {
  const oldOut: Record<string, unknown> = {}
  const newOut: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const k of keys) {
    if (!isEqual(before[k], after[k])) {
      oldOut[k] = before[k]
      newOut[k] = after[k]
    }
  }
  return { old: oldOut as Partial<T>, new: newOut as Partial<T> }
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== "object") return false
  return JSON.stringify(a) === JSON.stringify(b)
}
