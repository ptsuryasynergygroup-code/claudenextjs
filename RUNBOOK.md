# EOS — Runbook

Operational guide for the Enterprise Operating System (EOS). Covers what was
built, how to run it, and how it's structured.

---

## 1. What this is

A multi-tenant business platform. Started as a Vercel v0 UI scaffold, continued
in Claude Code into a full backend + 18 functional modules across 6 build phases.

**Stack**
- Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui
- Prisma ORM + PostgreSQL (Neon)
- Auth.js v5 (next-auth beta) for login/sessions
- Zod for validation

Repo: https://github.com/ptsuryasynergygroup-code/claudenextjs

---

## 2. First-time setup

Requires Node.js, a Neon Postgres database, and pnpm.

```bash
cd "C:/vercel v0/continue-project (2)"

# 1. Install pnpm (if needed)
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Create env file
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgresql://...   # from the Neon dashboard
AUTH_SECRET=...                 # generate next step
AUTH_URL=http://localhost:3000
```

```bash
# 4. Generate AUTH_SECRET, paste output into .env.local
npx auth secret

# 5. Create all tables (~50)
pnpm db:migrate          # migration name when prompted: init

# 6. Seed starter data
pnpm db:seed

# 7. Run
pnpm dev
```

Open http://localhost:3000 → redirects to `/signin`.

### Seeded logins (dev password for all: `password123`)
| Email | Role | Sees |
|---|---|---|
| ahmad.wijaya@suryasynergy.com | Super Admin | everything |
| siti.rahayu@suryasynergy.com | HR Manager | HR, not Finance |
| budi.santoso@suryasynergy.com | Finance Manager | Finance |
| kevin.pratama@suryasynergy.com | Employee | limited menu |

---

## 3. Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run locally |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check only (`tsc --noEmit`) |
| `pnpm db:migrate` | Apply schema changes |
| `pnpm db:seed` | Re-seed (idempotent, safe to re-run) |
| `pnpm db:studio` | GUI to browse/edit the DB |

After any change to `prisma/schema.prisma`, run `pnpm db:migrate`.

---

## 4. Modules (sidebar)

A module appears only if the org has it enabled AND the user's role has permission.

**Phase 1 — Foundation**
- Organization — company, branches, departments, positions
- Users — accounts, profile, status
- Roles & Permissions — RBAC matrix
- Audit Log — every change, filterable, with old/new values

**Phase 2 — Workflow & Communication**
- Workflows — multi-step approvals (sample: Purchase Request Approval)
- Notifications — in-app inbox

**Phase 3 — Documents & Tasks**
- Documents — upload + versioning
- Tasks — tasks + projects, assignment, status

**Phase 4 — HR + Finance**
- HR — employees, leave requests (approve/reject)
- Finance — chart of accounts, invoices

**Phase 5 — Procurement / CRM / Sales**
- Procurement — vendors, purchase requests (approval), purchase orders
- CRM — customers, leads, opportunities
- Sales — quotations, sales orders

**Phase 6 — Inventory / Asset / Risk / Analytics**
- Inventory — products, warehouses, stock, movements
- Assets — register, maintenance
- Risk — register + controls
- Analytics — KPI cards

Phase 7 (AI Layer) is not built — optional per the PRD.

---

## 5. Architecture

Every module follows the same layered flow; data never skips a layer:

```
prisma/schema.prisma                 Layer 0 — tables
lib/entities/<module>/schema.ts      Layer 1 — Zod shapes
lib/entities/<module>/repository.ts  Layer 1 — DB queries (org-scoped)
lib/services/<module>/service.ts     Layer 2 — logic + guards + audit
lib/auth | entitlement | rbac | audit  Layer 3 — guards
app/dashboard/<module>/page.tsx      Layer 4 — server page (calls service)
app/dashboard/<module>/<m>-view.tsx  Layer 4 — client UI
app/dashboard/<module>/_actions.ts   Layer 4 — server actions
```

### Non-negotiable invariants (enforced in every service)
1. **Tenant isolation** — every query filters by `organizationId`.
2. **Guard order** — `requireSession` → `requireEntitlement(org, module)` → `requirePermission(user, "module.action")` → handler.
3. **Audit-first** — every mutation writes an `audit_logs` row in the same transaction.

These drive: the per-user sidebar, 403s for unauthorized users, and full audit history.

---

## 6. Claude Code governance (`.claude/`)

- `EOS_PRD_FOR_CLAUDE.md` — refined spec / source of truth
- `CLAUDE.md` — rules auto-loaded each session
- `.claude/skills/` (8) — procedures, e.g. `/create-eos-module`, `/add-rbac-guard`
- `.claude/agents/` (6) — audit bots: `eos-tenant-auditor`, `eos-rbac-auditor`, `eos-audit-log-reviewer`, etc.
- `.claude/settings.json` — permissions + post-edit type-check hook

---

## 7. Status & caveat

All six phases verified with `pnpm typecheck` + `pnpm build` (compiles and builds).
**Not yet run against a live database** — the full ~50-table schema is created on
the first `pnpm db:migrate`. The first real end-to-end test is section 2, steps 1–7.

To extend: add Phase 7 (AI), or build any new module with the `/create-eos-module`
skill, which enforces the 9-artifact Module Build Contract from the PRD.
