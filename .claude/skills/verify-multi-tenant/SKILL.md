---
name: verify-multi-tenant
description: Audit the codebase for Prisma queries missing organizationId filter. Use when user says "cek scoping", "audit queries", "verify multi-tenant", or before declaring a module done. Read-only.
---

# Verify Multi-Tenant Scoping (PRD Invariant I1)

## What to grep
```
prisma\.\w+\.(findMany|findFirst|findUnique|update|updateMany|delete|deleteMany|count|aggregate)
```

For each hit, check the call expression includes `where: { organizationId: ... }` (or `where: { ..., organizationId: ... }`) within the same call.

## Allowed exceptions
- `findUnique({ where: { id: ... } })` IF the id is a globally unique cuid AND a follow-up assertion `if (result.organizationId !== ctx.orgId) throw forbidden()` exists immediately after. The exception is fragile — prefer adding `organizationId` to the unique compound or using `findFirst`.
- Queries against tenant-less tables: `Module`, `Feature`, `Package`, `Permission`, `Session` (Auth.js), `Account` (Auth.js).
- Queries inside `prisma/seed/` scripts.
- Queries inside `lib/audit/emit.ts` if it itself takes `orgId` as required param.

## Output format
For each violation:
```
<file>:<line>  prisma.X.METHOD(...)  — missing organizationId filter
```

## When invoked as the `eos-tenant-auditor` subagent
Return a single Markdown table:

| File | Line | Call | Severity |
|---|---|---|---|
| `lib/services/document/service.ts` | 42 | `prisma.document.findMany({ where: { status: 'draft' } })` | High |

Severity: **High** if a mutation, **Medium** if a read.

## Remediation
- Add `organizationId: ctx.orgId` to the `where` clause.
- If `ctx.orgId` isn't in scope, the function signature is wrong — repository functions MUST accept `ctx` as first arg.
