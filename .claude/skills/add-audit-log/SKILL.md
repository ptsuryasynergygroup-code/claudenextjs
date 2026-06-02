---
name: add-audit-log
description: Add audit logging to a mutation (create/update/delete) in an EOS service. Use when the user says "log perubahan", "audit-able", "track changes", "add audit", or when eos-audit-log-reviewer flags a mutation without emit.
---

# Add Audit Log

## Invariant (PRD I3)
Every mutation MUST write one `audit_logs` row in the **same transaction** as the data change. If the data change rolls back, the audit row rolls back too — and vice versa.

## Pattern

```ts
return prisma.$transaction(async (tx) => {
  const before = await repo.findById({ orgId, tx }, id)        // for update/delete
  const after = await repo.update({ orgId, tx }, id, data)     // the actual mutation
  await auditLog.emit({
    tx,
    orgId,
    userId,
    entityType: 'document',
    entityId: after.id,
    action: 'update',
    oldValue: redact(before),
    newValue: redact(after),
  })
  return after
})
```

## Action values
`create | update | delete | login | logout | view | export | approve | reject`

Only use `view` for **sensitive** views (e.g. payroll detail, audit log export). Not for normal list/detail browsing — that floods the log.

## Redaction (PRD I9)
Fields marked PII in the entity schema MUST be redacted before storing in `oldValue`/`newValue`:
- `email` → `j***@example.com`
- `phone` → `+62***1234`
- `nik`, `tax_number` → fully masked
- `salary`, `bankAccount` → `[REDACTED]`

Maintain the redaction list in `lib/audit/redact.ts`. Add new PII fields there when introducing new entities.

## Diff strategy
For updates: store the **diff** (only changed fields), not the whole record. Saves storage and makes log readable.

```ts
const diff = computeDiff(before, after) // returns { changed: {...}, old: {...} }
auditLog.emit({ ..., oldValue: diff.old, newValue: diff.changed })
```

## Anti-patterns
- Don't emit outside the transaction — risk of audit-data mismatch on rollback.
- Don't store raw passwords, tokens, or session secrets even if marked PII.
- Don't audit reads except for sensitive ones (else log becomes useless noise).
- Don't audit from the route handler — do it in the service so all entry points are covered.
