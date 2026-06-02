// RBAC guard — PRD invariant I2.
// Called AFTER requireEntitlement. Checks role → permission for a user.

import { prisma } from "@/lib/prisma"
import { forbidden } from "@/lib/errors"

/**
 * Throws FORBIDDEN if the user has no role granting the given permission code.
 * Permission code format: "<module>.<action>", e.g. "users.create".
 */
export async function requirePermission(userId: string, permissionCode: string): Promise<void> {
  const ok = await hasPermission(userId, permissionCode)
  if (!ok) forbidden({ permission: permissionCode })
}

export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  // Single query: join user → user_roles → role_permissions → permissions.
  const row = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        deletedAt: null,
        status: "ACTIVE",
        rolePermissions: { some: { permission: { code: permissionCode } } },
      },
    },
    select: { userId: true },
  })
  return row !== null
}

/**
 * Bulk check used by UI to grey-out forbidden actions in one round-trip.
 * Returns the subset of provided codes the user actually has.
 */
export async function listGrantedPermissions(userId: string, codes: string[]): Promise<string[]> {
  if (codes.length === 0) return []
  const rows = await prisma.permission.findMany({
    where: {
      code: { in: codes },
      rolePermissions: {
        some: {
          role: {
            deletedAt: null,
            status: "ACTIVE",
            userRoles: { some: { userId } },
          },
        },
      },
    },
    select: { code: true },
  })
  return rows.map((r) => r.code)
}
