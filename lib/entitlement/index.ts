// Entitlement guard — PRD invariant I2 (organization-level module activation).
// Called AFTER requireSession, BEFORE requirePermission.
//
// Source of truth: the operator (vendor) server when OPERATOR_URL +
// CLIENT_API_KEY are configured and reachable; otherwise the local
// organization_modules / organization_features tables (fallback).

import { prisma } from "@/lib/prisma"
import { entitlementRequired } from "@/lib/errors"
import { fetchOperatorEntitlements } from "@/lib/entitlement/operator"

export async function requireEntitlement(orgId: string, moduleCode: string): Promise<void> {
  const ok = await hasEntitlement(orgId, moduleCode)
  if (!ok) entitlementRequired(moduleCode)
}

export async function hasEntitlement(orgId: string, moduleCode: string): Promise<boolean> {
  const op = await fetchOperatorEntitlements()
  if (op) return op.modules.includes(moduleCode)

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
 * Returns the set of module codes enabled for this deployment. Used by
 * sidebar/menu rendering and middleware preflight to avoid N+1 checks.
 */
export async function listEnabledModules(orgId: string): Promise<string[]> {
  const op = await fetchOperatorEntitlements()
  if (op) return op.modules

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
  const op = await fetchOperatorEntitlements()
  if (op) return op.features.includes(featureCode)

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

/** Throws ENTITLEMENT_REQUIRED if a sub-feature is not enabled for the org. */
export async function requireFeature(orgId: string, featureCode: string): Promise<void> {
  const ok = await hasFeature(orgId, featureCode)
  if (!ok) entitlementRequired(featureCode)
}

/** Enabled feature codes for this deployment (operator source, else DB). */
export async function listEnabledFeatures(orgId: string): Promise<string[]> {
  const op = await fetchOperatorEntitlements()
  if (op) return op.features

  const rows = await prisma.organizationFeature.findMany({
    where: { organizationId: orgId, enabled: true },
    select: { feature: { select: { code: true } } },
  })
  return rows.map((r) => r.feature.code)
}
