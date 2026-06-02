---
name: add-rbac-guard
description: Add or fix entitlement + RBAC guards on an EOS route handler, server action, or service function. Use when the user says "tambah permission", "guard route", "protect endpoint", "cek akses", or when an audit reports a handler without guards.
---

# Add RBAC + Entitlement Guard

## Guard order (PRD invariant I2)
ALWAYS in this order:
1. `requireSession()` — get authenticated user + orgId
2. `requireEntitlement(orgId, moduleCode)` — org has this module active
3. `requirePermission(userId, '<module>.<action>')` — user's role allows action
4. Then the actual work

## Pattern (service function)

```ts
// lib/services/document/service.ts
import { requireSession } from '@/lib/auth'
import { requireEntitlement } from '@/lib/entitlement'
import { requirePermission } from '@/lib/rbac'
import { auditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { CreateDocumentSchema } from '@/lib/entities/document/schema'
import * as repo from '@/lib/entities/document/repository'

export async function createDocument(input: unknown) {
  const session = await requireSession()
  await requireEntitlement(session.orgId, 'documents')
  await requirePermission(session.userId, 'documents.create')
  const data = CreateDocumentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const doc = await repo.create({ orgId: session.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: session.orgId,
      userId: session.userId,
      entityType: 'document',
      entityId: doc.id,
      action: 'create',
      newValue: doc,
    })
    return doc
  })
}
```

## Pattern (route handler)
Route handlers delegate to services — they don't repeat the guard themselves. Only middleware does a coarse entitlement preflight on the route prefix.

```ts
// app/api/document/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const doc = await createDocument(body) // service does the guards
  return Response.json(doc)
}
```

## Permission naming
`<moduleCode>.<action>` — module codes are kebab-case, actions are: `view`, `create`, `edit`, `delete`, `approve`, `export`.

Examples: `users.create`, `audit-log.export`, `purchase-order.approve`.

## When adding a NEW permission
1. Add entry to `prisma/seed/permissions.ts`
2. Re-run `pnpm prisma db seed` (or write an idempotent upsert)
3. Update `prisma/seed/roles.ts` to wire it to relevant system roles

## Anti-patterns
- Don't gate UI with permission check but skip it in the service. UI is convenience, service is enforcement.
- Don't skip entitlement check assuming "user has permission so org must have module" — those are independent layers.
- Don't catch and silently return `null` when guard fails. Let it throw, handler converts to 403.
