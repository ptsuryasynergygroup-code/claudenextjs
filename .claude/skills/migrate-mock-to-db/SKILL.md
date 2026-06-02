---
name: migrate-mock-to-db
description: Migrate a v0-generated mock data file (lib/data/*.ts) to real DB-backed service + repository. Use when user says "ganti mock data", "pakai database", "switch to Prisma", or to convert one of organization/users/roles/audit-log from mock to real.
---

# Migrate Mock → DB

The v0 scaffold seeded `lib/data/{organization,users,roles,audit-log}.ts` with static fixtures. This skill converts ONE such module to real Prisma + service.

## Pre-flight
1. `prisma/schema.prisma` exists; target model defined; migration applied.
2. The 4-artifact base for the module already planned: entity Zod schema, repository, service, action.
3. UI page from v0 exists and is the target consumer.

## Steps

### 1. Copy mock → seed
Read `lib/data/<module>.ts`. Move its arrays into `prisma/seed/fixtures/<module>.ts`. Convert to `Prisma.<Model>CreateInput[]` shape:
- `id` becomes the cuid string from mock (preserve to keep referential integrity in dev)
- Convert nested objects to scalar fields matching schema
- `createdAt: new Date(...)` → keep as Date

### 2. Write idempotent seed
In `prisma/seed.ts`, upsert each fixture:
```ts
for (const item of fixtures.branches) {
  await prisma.branch.upsert({ where: { id: item.id }, update: item, create: item })
}
```

### 3. Replace mock imports in UI
Grep for `from '@/lib/data/<module>'`. For each import site:
- If server component: replace with `await service.findMany(...)` or `await service.findById(...)`
- If client component: lift the fetch to its server parent and pass as prop. Do NOT add `useEffect` fetching.

### 4. Delete the mock file
Once zero imports remain (verify with grep), delete `lib/data/<module>.ts`. If you keep helpers (e.g. `getBranchById`), move them to the repository — they're real queries now.

### 5. Verify
- `pnpm prisma db seed` — seeds without error
- `pnpm tsc --noEmit` — passes
- `pnpm dev` — page renders identical to v0 version, but data comes from DB
- Spawn `eos-tenant-auditor` — zero unsafe queries

## Anti-patterns
- Don't keep `lib/data/<module>.ts` "for reference" — it'll be used accidentally. Delete it.
- Don't mass-migrate all four modules in one PR — one at a time, verify each in browser.
- Don't add `useEffect`/`useState` to client components to fetch new data — push to server.
- Don't re-derive cuid ids; preserve the originals from the mock so dev fixtures keep working.
