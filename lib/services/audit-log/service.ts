// AuditLog read service. Writes happen through lib/audit/emit.ts.

import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import * as repo from "@/lib/entities/audit-log/repository"
import {
  type AuditLogDto,
  type ListAuditLogsQuery,
  ListAuditLogsQuerySchema,
} from "@/lib/entities/audit-log/schema"

const MODULE = "audit-log"

export async function getAuditLogs(query: Partial<ListAuditLogsQuery> = {}): Promise<AuditLogDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "audit-log.view")
  const q = ListAuditLogsQuerySchema.parse(query)
  return repo.listAuditLogs({ orgId: s.orgId }, q)
}

export async function getAuditLogCount(query: Partial<ListAuditLogsQuery> = {}): Promise<number> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "audit-log.view")
  const q = ListAuditLogsQuerySchema.parse(query)
  return repo.countAuditLogs({ orgId: s.orgId }, q)
}

export async function getRecentAuditLogs(limit = 5): Promise<AuditLogDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "audit-log.view")
  return repo.listRecentLogs({ orgId: s.orgId }, Math.min(Math.max(limit, 1), 50))
}
