// Entitlement guard — PRD invariant I2 (organization-level module activation).
// Called AFTER requireSession, BEFORE requirePermission.

import { prisma } from "@/lib/prisma"
import { entitlementRequired } from "@/lib/errors"

/**
 * Throws ENTITLEMENT_REQUIRED if the organization does not have the module enabled.
 *
 * Reads from organization_modules (denormalized for fast checks). The denorm is
 * kept in sync by package grant/revoke flows in lib/services/entitlement.
 */
export async function requireEntitlement(orgId: string, moduleCode: string): Promise<void> {
  const ok = await hasEntitlement(orgId, moduleCode)
  if (!ok) entitlementRequired(moduleCode)
}

export async function hasEntitlement(orgId: string, moduleCode: string): Promise<boolean> {
  const row = await prisma.organizationModule.findFirst({
    where: {
      organizationId: orgId,
      enabled: true,
      module: { code: moduleCode },
    },
    select: { organizationId: true },
  })
  return row !== null
}

/**
 * Returns the set of module codes enabled for an org. Used by sidebar/menu
 * rendering and middleware preflight to avoid N+1 entitlement checks.
 */
export async function listEnabledModules(orgId: string): Promise<string[]> {
  const rows = await prisma.organizationModule.findMany({
    where: { organizationId: orgId, enabled: true },
    select: { module: { select: { code: true } } },
  })
  return rows.map((r) => r.module.code)
}

/**
 * Optional feature flag check (PRD §7.1). Use for sub-features within a module.
 */
export async function hasFeature(orgId: string, featureCode: string): Promise<boolean> {
  const row = await prisma.organizationFeature.findFirst({
    where: {
      organizationId: orgId,
      enabled: true,
      feature: { code: featureCode },
    },
    select: { organizationId: true },
  })
  return row !== null
}
