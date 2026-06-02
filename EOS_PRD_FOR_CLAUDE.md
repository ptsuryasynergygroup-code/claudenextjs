# EOS — Refined PRD for Claude Code

> Source of truth for all agent work. Read before any code change.
> Derived from `EOS_PRD.TXT`, `EOS_Foundation_ERD.txt`, `EOS_Core_Business_Entities_Spec.txt`.
> Format: declarative rules + acceptance criteria, not narrative.

---

## 1. NON-NEGOTIABLE INVARIANTS

These rules are checked by `eos-rbac-auditor`, `eos-tenant-auditor`, `eos-audit-log-reviewer`. Violations are bugs.

| # | Rule | Why |
|---|------|-----|
| I1 | Every Prisma query against a tenant table MUST filter by `organizationId` | Multi-tenant isolation |
| I2 | Every route handler / server action MUST pass through `requireEntitlement(orgId, moduleCode)` BEFORE `requirePermission(userId, 'module.action')` | Entitlement gates module; RBAC gates user |
| I3 | Every mutation (create/update/delete) MUST emit one `audit_logs` row in the same transaction | Audit-first principle |
| I4 | Business logic lives in `lib/services/<domain>/`. Client components only render and dispatch | API-first / reusability |
| I5 | Validation lives in `lib/entities/<domain>/schema.ts` (Zod). Service input/output MUST be Zod-parsed | Type-safe boundaries |
| I6 | No `Math.random()`, `Date.now()`, `new Date()` inside workflow step logic — inject via param | Determinism (workflow replay) |
| I7 | No `any`, `as any`, `@ts-ignore`, `// eslint-disable` without comment explaining why | Type safety |
| I8 | No imports from `lib/data/*.ts` outside `prisma/seed/` | Mock data is fixture only |
| I9 | PII fields (email, phone, NIK, salary) MUST be marked in schema and redacted in audit `old_value`/`new_value` | Compliance |
| I10 | Soft delete only (`deletedAt`). Repository filters `deletedAt: null` by default | Auditability of removals |

---

## 2. ARCHITECTURAL LAYERS

```
Layer 0  prisma/                    schema, migrations, seed
Layer 1  lib/entities/<domain>/     schema.ts (Zod) + repository.ts (Prisma CRUD, scoped)
Layer 2  lib/services/<domain>/     service.ts (txn + audit + workflow trigger)
Layer 3  lib/auth/                  Auth.js v5 setup, session helpers
         lib/entitlement/           requireEntitlement(orgId, moduleCode)
         lib/rbac/                  requirePermission(userId, 'module.action')
         lib/audit/                 emit(entityType, entityId, action, old, new, ctx)
Layer 4  app/api/<domain>/route.ts  REST handlers
         app/dashboard/<module>/    UI (server components for data, client for forms)
         middleware.ts              session + entitlement preflight
Layer 5  lib/workflow/              engine: workflows, steps, instances, approvals
         (Phase 2)
```

**Rule:** higher layer may import from lower, never reverse. Layer 4 never imports Prisma directly — only services.

---

## 3. MODULE BUILD CONTRACT

Every new module MUST produce all 9 artifacts. The skill `create-eos-module` enforces this checklist.

1. **Prisma model** in `prisma/schema.prisma` with `organizationId`, `createdAt`, `updatedAt`, `deletedAt`
2. **Zod schemas** in `lib/entities/<domain>/schema.ts` — `CreateXSchema`, `UpdateXSchema`, `XSchema`
3. **Repository** in `lib/entities/<domain>/repository.ts` — CRUD scoped by orgId, soft-delete aware
4. **Service** in `lib/services/<domain>/service.ts` — orchestrates repo + audit + workflow + entitlement/RBAC guard
5. **Server actions** in `app/dashboard/<module>/_actions.ts` OR REST in `app/api/<domain>/route.ts`
6. **UI page** in `app/dashboard/<module>/page.tsx` reusing `components/dashboard/*` patterns from v0
7. **Permission seed entries** in `prisma/seed/permissions.ts` for module × {view, create, edit, delete, approve, export}
8. **Module registry entry** in `prisma/seed/modules.ts` — code, name, description, dependencies
9. **Acceptance test** in `tests/<domain>.test.ts` covering: golden path, RBAC denial, entitlement denial, audit emission

---

## 4. BUILD ORDER

Derived from `EOS_Foundation_ERD.txt` + `EOS_Core_Business_Entities_Spec.txt`. Each phase fully satisfies invariants before next phase starts.

| Phase | Modules | Acceptance Criteria |
|-------|---------|---------------------|
| **1 — Identity Foundation** *(v0 scaffolded UI, no real backend yet)* | Organization, Branch, Department, Position, User, Role, Permission, AuditLog, Module/Feature/Package (entitlement) | All 4 v0 UIs read from DB; sign in works; RBAC blocks unauthorized routes; entitlement hides modules; every mutation logged. |
| **2 — Workflow & Communication** | Workflow, WorkflowStep, WorkflowInstance, Approval, Notification | Multi-step approval flow runs end-to-end with SLA + reminder. Notification sent in-app. |
| **3 — Documents & Tasks** | Document, DocumentVersion, Attachment, Task, Project, Milestone | Upload → version → assign → workflow approval → audit chain. |
| **4 — HR + Finance Foundation** | Employee, Attendance, Leave, Account, Transaction, Invoice, Payment | Payroll-ready employee record; double-entry journal posts; cashflow report. |
| **5 — Procurement / CRM / Sales** | Vendor, PR, PO, Customer, Lead, Opportunity, Quotation, SalesOrder | PR → PO → Receiving (with approval workflow); Lead → Opportunity → SO → Invoice. |
| **6 — Inventory / Asset / Risk / Analytics** | Product, Warehouse, Stock, StockMovement, Asset, Maintenance, Depreciation, Risk, KPI, Dashboard | Multi-warehouse stock; depreciation schedule; KPI dashboard widget. |
| **7 — AI Layer** | AIAgent, AIInsight, AIRecommendation, AIAlert, AIMemory, AICase | AI Assistant Q&A grounded in EOS data; fraud alert raised on anomalous transaction. |

---

## 5. ANTI-PATTERNS (explicit "JANGAN")

- JANGAN import dari `lib/data/*.ts` di production code. Itu fixture v0; only `prisma/seed/` boleh pakai.
- JANGAN tulis `prisma.X.findMany()` tanpa `where: { organizationId, deletedAt: null }`.
- JANGAN render link/menu modul tanpa cek `hasEntitlement(orgId, moduleCode)`.
- JANGAN tulis mutation handler tanpa `auditLog.emit(...)` di transaksi yang sama.
- JANGAN expose Prisma type langsung ke client component — selalu lewat Zod-validated DTO.
- JANGAN bikin field PII tanpa marker `@pii` di comment & list di `lib/audit/redact.ts`.
- JANGAN pakai `useEffect` untuk fetch data — gunakan server component / server action.
- JANGAN refactor UI v0 secara massal kecuali user minta. UI v0 = source of UX truth.
- JANGAN ganti shadcn dengan UI lib lain.
- JANGAN install package baru tanpa konfirmasi user.

---

## 6. NAMING & CONVENTIONS

- **Files**: `kebab-case.ts`. React components: `kebab-case.tsx` exporting `PascalCase`.
- **DB columns**: `snake_case`. **TS fields**: `camelCase`. Pakai `@map` di Prisma.
- **IDs**: `cuid()` (default Prisma).
- **Timestamps**: `createdAt`, `updatedAt`, `deletedAt` (Date, nullable for deletedAt).
- **Enum**: TS const-as `as const` + `z.enum([...])`. Hindari TS `enum` keyword.
- **Permission code**: `<module>.<action>`, e.g. `users.create`, `audit-log.export`.
- **Module code**: kebab-case singular, e.g. `organization`, `audit-log`, `purchase-order`.
- **Service function**: verb-first, e.g. `createUser`, `archiveDocument`, not `userCreate`.
- **Repository function**: same verb-first; receives `ctx: { orgId, userId, tx? }` first param.
- **Server action**: suffix `Action`, e.g. `createUserAction`.

---

## 7. PER-MODULE SPEC SHEETS (Phase 1)

### 7.1 Organization (modul code: `organization`)
- Entitas: `Organization`, `Branch`, `Department`, `Position`
- Permissions: `organization.{view,create,edit,delete}`, `branch.*`, `department.*`, `position.*`
- Workflows: none (Phase 1)
- Acceptance: list/edit dari DB; create branch/department/position scoped by orgId; audit emit on mutation; RBAC enforced.
- Dependencies: none (root)

### 7.2 User & Auth (modul code: `users`)
- Entitas: `User`, `Session`, `Account` (Auth.js)
- Permissions: `users.{view,create,edit,delete,suspend}`
- Workflows: none (Phase 1; Phase 2 adds onboarding approval)
- Acceptance: signup with org context; login via Auth.js; session has `orgId` + role list; suspend blocks login.
- Dependencies: Organization

### 7.3 Role & Permission (modul code: `roles`)
- Entitas: `Role`, `Permission`, `RolePermission`, `UserRole`
- Permissions: `roles.{view,create,edit,delete}`, `permissions.view`
- Workflows: none
- Acceptance: permission matrix UI; assign role to user; system roles (super-admin, org-admin) seeded and non-editable.
- Dependencies: User, Organization

### 7.4 Audit Log (modul code: `audit-log`)
- Entitas: `AuditLog`
- Permissions: `audit-log.{view,export}` (no create/edit/delete — append-only)
- Workflows: none
- Acceptance: every mutation in all modules creates row; filter by user/entity/action/date; export CSV.
- Dependencies: User, Organization

### 7.5 Entitlement (cross-cutting, modul code: `entitlement` — admin-only UI)
- Entitas: `Module`, `Feature`, `Package`, `PackageModule`, `PackageFeature`, `OrganizationPackage`, `OrganizationModule`, `OrganizationFeature`
- Permissions: `entitlement.{view,grant,revoke}` (super-admin only)
- Workflows: none
- Acceptance: org admin can see active modules; super-admin can grant package; menu dinamis based on `OrganizationModule`.
- Dependencies: Organization, Module registry

---

## 8. DEFINITION OF DONE (per module)

- [ ] All 9 Module Build Contract artifacts exist
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm prisma migrate dev` applied
- [ ] Acceptance tests in `tests/<domain>.test.ts` pass
- [ ] `eos-tenant-auditor` reports zero unsafe queries
- [ ] `eos-rbac-auditor` reports zero unguarded handlers
- [ ] `eos-audit-log-reviewer` reports zero unaudited mutations
- [ ] Manual verification in `pnpm dev`: golden path + RBAC denial + entitlement denial each tested

---

## 9. OUT OF SCOPE (do not propose unless user asks)

- Mobile app, desktop app, marketplace
- Switching framework (Next.js → other) or ORM (Prisma → other)
- Mass UI refactor of v0-generated pages
- AI features (reserved for Phase 7)
- Internationalization (string keys ok, but no i18n lib yet)
- Real-time / websocket layer
