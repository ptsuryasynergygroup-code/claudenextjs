---
name: create-eos-module
description: Build a new EOS module end-to-end following the 9-artifact Module Build Contract from EOS_PRD_FOR_CLAUDE.md §3. Use when the user says "buat modul X", "tambah domain Y", "scaffold module Z", or any phrase requesting a new EOS domain implementation.
---

# Create EOS Module

## When to invoke
User asks to create/build/scaffold a new EOS module (e.g. Document, Workflow, Vendor, Customer).

## Pre-flight
1. Read `EOS_PRD_FOR_CLAUDE.md` §1 (invariants), §3 (contract), §7 (spec sheet for this module if Phase 1, else extrapolate from §4).
2. Read `EOS_Foundation_ERD.txt` for the entity's relationships.
3. Confirm phase dependencies are met (e.g. don't build Workflow before User+Org done).
4. Check `prisma/schema.prisma` exists. If not, abort and tell user to bootstrap DB first.

## Build steps (all 9 MUST be done in this order)

### 1. Prisma model
Add to `prisma/schema.prisma`. MUST include:
- `id String @id @default(cuid())`
- `organizationId String` + relation to `Organization`
- `createdAt`, `updatedAt`, `deletedAt DateTime?`
- `@@index([organizationId])`, `@@index([organizationId, deletedAt])`
- snake_case columns via `@map`

Then: `pnpm prisma migrate dev --name add-<domain>`

### 2. Zod schemas
Create `lib/entities/<domain>/schema.ts`:
- `<Domain>Schema` — full entity
- `Create<Domain>Schema` — input for create (omit id, timestamps)
- `Update<Domain>Schema` — partial of Create
- Export inferred TS types

### 3. Repository
Create `lib/entities/<domain>/repository.ts`:
- All functions accept `ctx: { orgId: string; tx?: Prisma.TransactionClient }` as first arg
- Default filter: `{ organizationId: ctx.orgId, deletedAt: null }`
- Functions: `findMany`, `findById`, `create`, `update`, `softDelete`

### 4. Service
Create `lib/services/<domain>/service.ts`:
- Each public function: `requireEntitlement` → `requirePermission` → Zod parse → `prisma.$transaction(async tx => { repo.X(...); audit.emit(...) })`
- Import `auditLog` from `lib/audit`
- Import guards from `lib/entitlement`, `lib/rbac`

### 5. Handler (server action OR REST)
Prefer server action for UI-coupled forms. REST for external API.
- Server action: `app/dashboard/<module>/_actions.ts`
- REST: `app/api/<domain>/route.ts`
- Both delegate to service, never to repository

### 6. UI page
Create `app/dashboard/<module>/page.tsx`:
- Server component fetches via service
- Reuse `components/dashboard/{app-sidebar,header}.tsx` shell
- Reuse table/card patterns from existing `app/dashboard/organization/` or `users/`
- Forms use react-hook-form + zodResolver + sonner for toast

### 7. Permission seed
Append to `prisma/seed/permissions.ts`:
- `<module>.view`, `.create`, `.edit`, `.delete`, plus `.approve`, `.export` if relevant

### 8. Module registry entry
Append to `prisma/seed/modules.ts`:
- `{ code, name, description, dependencies: [...] }`

### 9. Acceptance test
Create `tests/<domain>.test.ts`:
- Golden path: create → read → update → soft-delete
- RBAC denial: user without `<module>.create` permission → 403
- Entitlement denial: org without `<module>` entitlement → 403
- Audit emit: after create, `audit_logs` has matching row

## Post-flight
1. `pnpm tsc --noEmit` — zero errors
2. `pnpm lint` — zero errors
3. Spawn `eos-tenant-auditor` agent — zero unsafe queries
4. Spawn `eos-rbac-auditor` agent — zero unguarded handlers
5. Spawn `eos-audit-log-reviewer` agent — zero unaudited mutations
6. Tell user to run `pnpm prisma db seed && pnpm dev` and verify in browser

## Anti-patterns to avoid (from PRD §5)
- Don't import `lib/data/*.ts` — that's v0 mock, only for seed
- Don't skip the entitlement check even if "obviously available"
- Don't bypass service to call repository from UI
- Don't use `any` to silence type errors — fix the type
