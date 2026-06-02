---
name: seed-permission-matrix
description: Generate or update the permission seed file from the MODULES × ACTIONS matrix. Use when user adds a new module to the registry and needs corresponding permission rows, or says "tambah permission untuk X".
---

# Seed Permission Matrix

## Generation rule
For each module in `prisma/seed/modules.ts`, generate permissions:
- Always: `view`, `create`, `edit`, `delete`
- If module supports approval workflow: add `approve`
- If module has reports/data export: add `export`

Module-specific overrides (from PRD §7):
- `audit-log` — only `view`, `export` (append-only entity, no create/edit/delete)
- `entitlement` — only `view`, `grant`, `revoke` (super-admin domain)
- `roles` — `view`, `create`, `edit`, `delete`, plus `permissions.view` (read-only for the permission list itself)

## Output shape
`prisma/seed/permissions.ts`:

```ts
import type { Prisma } from '@prisma/client'

export const permissions: Prisma.PermissionCreateInput[] = [
  // organization
  { code: 'organization.view', module: 'organization', action: 'view', description: 'View organization profile' },
  { code: 'organization.edit', module: 'organization', action: 'edit', description: 'Edit organization profile' },
  // branches / departments / positions analogous
  // ...
]
```

## Idempotent seed
In `prisma/seed.ts`:
```ts
for (const p of permissions) {
  await prisma.permission.upsert({ where: { code: p.code }, update: p, create: p })
}
```

## System roles wiring
After permissions seed, update `prisma/seed/roles.ts`:
- `super-admin` — gets ALL permissions
- `org-admin` — all except `entitlement.*`
- `viewer` — only `.view` actions
- Module-specific roles (e.g. `finance-manager`, `hr-manager`) — defined per module spec

## Verification
After running `pnpm prisma db seed`:
- `select count(*) from permissions` matches expected (modules × actions, minus exclusions)
- Super-admin role has full coverage: count of role_permissions for super-admin === count of permissions
