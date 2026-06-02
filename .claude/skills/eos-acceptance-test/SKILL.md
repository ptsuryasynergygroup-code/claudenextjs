---
name: eos-acceptance-test
description: Create acceptance tests for an EOS module covering golden path, RBAC denial, entitlement denial, and audit emission. Use when user says "test modul X", "validasi modul", "acceptance test", or to satisfy PRD §8 definition of done.
---

# EOS Acceptance Test Template

Tests live in `tests/<domain>.test.ts`. Use `vitest` (install if not present — confirm with user first).

## 4 required test groups per module

### 1. Golden path
- seed: org A + admin user with full permissions
- create entity → read back → update → soft-delete → list excludes it

### 2. RBAC denial
- seed: org A + user with role missing `<module>.create`
- attempt create → expect throw with `code: 'FORBIDDEN'`
- audit_logs should NOT have a row for this attempt (guard rejected before service body)

### 3. Entitlement denial
- seed: org B WITHOUT module entitlement (no `OrganizationModule` row)
- user has the permission, but org doesn't have module → expect throw with `code: 'ENTITLEMENT_REQUIRED'`

### 4. Audit emission
- after successful create: assert one `audit_logs` row exists with matching `entityType`, `entityId`, `action: 'create'`, `userId`, `orgId`
- update: row with diff in `oldValue`/`newValue`
- soft-delete: row with `action: 'delete'`

## Cross-tenant isolation test (recommended, not required per module)
- seed: org A creates entity X; org B's admin tries to read X via API → 404 (NOT 403, to avoid leaking existence)

## Skeleton

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { resetDb, seedOrg, signInAs } from './_helpers'
import { createDocument } from '@/lib/services/document/service'

describe('document module', () => {
  beforeEach(resetDb)

  describe('golden path', () => {
    it('creates, reads, updates, soft-deletes', async () => {
      const { orgA, admin } = await seedOrg({ withEntitlements: ['documents'] })
      await signInAs(admin)
      const doc = await createDocument({ title: 'Test', orgId: orgA.id })
      expect(doc.id).toBeDefined()
      // ...
    })
  })

  describe('RBAC denial', () => {
    it('rejects user without documents.create', async () => {
      const { orgA, viewer } = await seedOrg({ withEntitlements: ['documents'] })
      await signInAs(viewer)
      await expect(createDocument({ title: 'X', orgId: orgA.id })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('entitlement denial', () => {
    it('rejects when org has no documents entitlement', async () => {
      const { orgA, admin } = await seedOrg({ withEntitlements: [] })
      await signInAs(admin)
      await expect(createDocument({ title: 'X', orgId: orgA.id })).rejects.toMatchObject({ code: 'ENTITLEMENT_REQUIRED' })
    })
  })

  describe('audit emission', () => {
    it('writes audit_logs row on create', async () => {
      const { orgA, admin } = await seedOrg({ withEntitlements: ['documents'] })
      await signInAs(admin)
      const doc = await createDocument({ title: 'X', orgId: orgA.id })
      const log = await prisma.auditLog.findFirst({ where: { entityId: doc.id, action: 'create' } })
      expect(log).toBeTruthy()
    })
  })
})
```

## Helpers expected in `tests/_helpers.ts`
- `resetDb()` — truncate all tables (or transactional rollback)
- `seedOrg({ withEntitlements })` — returns `{ orgA, admin, viewer }`
- `signInAs(user)` — sets the session for subsequent service calls
