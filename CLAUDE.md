# EOS — Enterprise Operating System

Next.js 16 / React 19 / Tailwind 4 / shadcn/ui / Zod.
Bootstrapped on Vercel v0, continued in Claude Code.

## Read first (in order)
1. `EOS_PRD_FOR_CLAUDE.md` — **source of truth**: invariants, layers, anti-patterns, per-module specs
2. `EOS_Foundation_ERD.txt` — entity relationships
3. `EOS_Core_Business_Entities_Spec.txt` — domain taxonomy & build phases

If a request conflicts with `EOS_PRD_FOR_CLAUDE.md`, surface the conflict to the user before coding.

## Non-negotiables (full list in PRD §1)
1. Every Prisma query scoped by `organizationId`
2. Guard order: `requireEntitlement` → `requirePermission` → handler
3. Every mutation emits an `audit_logs` row in the same transaction
4. Business logic in `lib/services/<domain>/`, never in client components
5. No imports from `lib/data/*.ts` outside `prisma/seed/`

## Stack guardrails
- **DB**: Prisma + PostgreSQL (Neon prod, local Postgres dev)
- **Auth**: Auth.js v5 (next-auth@beta) + `@auth/prisma-adapter`
- **Validation**: Zod, schemas in `lib/entities/<domain>/schema.ts`
- **UI**: shadcn/ui only — Radix wrappers in `components/ui/`. Don't add new UI libs.
- **Forms**: react-hook-form + zodResolver
- **Toast**: sonner (installed)
- **Icons**: lucide-react (installed)

## Folder layout (PRD §2 has full layer rules)
```
prisma/                         # Layer 0 — schema, migrations, seed
lib/
  entities/<domain>/            # Layer 1 — Zod + repository
  services/<domain>/            # Layer 2 — business logic + audit
  auth/, entitlement/, rbac/    # Layer 3 — guards
  audit/                        # Layer 3 — audit emitter
app/
  api/<domain>/route.ts         # Layer 4 — REST
  dashboard/<module>/           # Layer 4 — UI (v0 origin, preserve UX)
  middleware.ts                 # session + entitlement preflight
components/
  dashboard/                    # v0-authored shell — extend, don't rewrite
  ui/                           # shadcn — extend via new files, don't edit existing
lib/data/                       # v0 mock fixtures — seed source ONLY
tests/                          # acceptance tests
```

## Standard workflow for a new module
Run skill `create-eos-module <ModuleName>`. It enforces the 9-artifact Module Build Contract (PRD §3) and references the module's spec sheet (PRD §7).

## Standard workflow for cross-cutting change
1. Update `prisma/schema.prisma` → `pnpm prisma migrate dev --name <desc>`
2. Update Zod in `lib/entities/<domain>/schema.ts`
3. Update repository → service → handler/action → UI in that order
4. Add/update audit hook in service
5. Add/update permission seed in `prisma/seed/permissions.ts`
6. Run: `pnpm tsc --noEmit && pnpm lint`

## Audit & quality subagents (read-only)
- `eos-tenant-auditor` — finds Prisma queries missing `organizationId`
- `eos-rbac-auditor` — finds handlers missing guards
- `eos-audit-log-reviewer` — finds mutations missing audit emit
- `eos-ui-consistency` — checks new pages match v0 shell patterns
Run them before declaring a module done.

## Commands
- `pnpm dev` — Next.js dev server
- `pnpm build` — production build
- `pnpm tsc --noEmit` — type-check only
- `pnpm prisma migrate dev` — apply schema change (dev)
- `pnpm prisma studio` — DB UI
- `pnpm prisma db seed` — seed fixtures

## Out of scope (don't propose unless asked) — full list in PRD §9
- Mobile / desktop / marketplace
- Framework / ORM swap
- Mass UI refactor of v0 pages
- AI features (Phase 7)
- i18n library
