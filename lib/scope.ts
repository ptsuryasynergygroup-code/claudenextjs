// Location-based row scoping (PRD multi-branch). Layered ON TOP of the
// organizationId tenant filter:
//   ORG       → sees all branches/warehouses in the org
//   BRANCH    → only their assigned branch
//   WAREHOUSE → only their assigned warehouse (within their branch)
//
// Helpers return Prisma `where` fragments to spread into a query. A scoped
// user with a null branch/warehouse resolves to an impossible id so they see
// nothing (fail-closed) rather than everything.

import type { AccessScope } from "@/lib/auth/base"

export type ScopeCtx = {
  scope: AccessScope
  branchId: string | null
  warehouseId: string | null
}

const NONE = "__no_access__"

export function fromSession(s: {
  scope: AccessScope
  branchId: string | null
  warehouseId: string | null
}): ScopeCtx {
  return { scope: s.scope, branchId: s.branchId, warehouseId: s.warehouseId }
}

/** Entity that has its own `branchId` column (Department, Employee, Warehouse). */
export function branchColumn(sc: ScopeCtx): Record<string, unknown> {
  if (sc.scope === "org") return {}
  return { branchId: sc.branchId ?? NONE }
}

/** The Branch entity itself (filter by id). */
export function branchSelf(sc: ScopeCtx): Record<string, unknown> {
  if (sc.scope === "org") return {}
  return { id: sc.branchId ?? NONE }
}

/** The Warehouse entity itself. */
export function warehouseSelf(sc: ScopeCtx): Record<string, unknown> {
  if (sc.scope === "org") return {}
  if (sc.scope === "warehouse") return { id: sc.warehouseId ?? NONE }
  return { branchId: sc.branchId ?? NONE }
}

/** Entity scoped through a `warehouse` relation (Stock, StockMovement-like). */
export function viaWarehouse(sc: ScopeCtx): Record<string, unknown> {
  if (sc.scope === "org") return {}
  if (sc.scope === "warehouse") return { warehouseId: sc.warehouseId ?? NONE }
  return { warehouse: { branchId: sc.branchId ?? NONE } }
}

/** Entity scoped through an `employee` relation (Attendance, LeaveRequest). */
export function viaEmployee(sc: ScopeCtx): Record<string, unknown> {
  if (sc.scope === "org") return {}
  return { employee: { branchId: sc.branchId ?? NONE } }
}
