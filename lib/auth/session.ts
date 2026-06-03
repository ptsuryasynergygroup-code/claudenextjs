// Session helper used by every service function as the first guard.
// PRD invariant I2: requireSession → requireEntitlement → requirePermission.

import { auth } from "@/lib/auth/config"
import { unauthenticated } from "@/lib/errors"
import type { AccessScope } from "@/lib/auth/base"

export type EosSession = {
  userId: string
  orgId: string
  branchId: string | null
  warehouseId: string | null
  scope: AccessScope
  email: string
  name: string
}

export async function requireSession(): Promise<EosSession> {
  const session = await auth()
  if (!session?.user?.id || !session.user.organizationId) {
    unauthenticated()
  }
  return {
    userId: session.user.id,
    orgId: session.user.organizationId,
    branchId: session.user.branchId ?? null,
    warehouseId: session.user.warehouseId ?? null,
    scope: session.user.scope ?? "org",
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  }
}

/**
 * Like requireSession but returns null instead of throwing. Use in
 * places where unauthenticated is a legitimate state (e.g. middleware
 * deciding whether to redirect to /signin).
 */
export async function getSession(): Promise<EosSession | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.organizationId) return null
  return {
    userId: session.user.id,
    orgId: session.user.organizationId,
    branchId: session.user.branchId ?? null,
    warehouseId: session.user.warehouseId ?? null,
    scope: session.user.scope ?? "org",
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  }
}
