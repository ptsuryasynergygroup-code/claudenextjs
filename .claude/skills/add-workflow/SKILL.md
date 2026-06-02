---
name: add-workflow
description: Attach a multi-step approval workflow to an EOS entity (e.g. PurchaseRequest, LeaveRequest, Document). Use when user says "approval flow", "multi-step approval", "perlu disetujui", "workflow untuk X", or any approval/escalation/SLA requirement.
---

# Add Workflow

## Phase gate
Workflow engine is **Phase 2** (PRD §4). Don't build per-entity workflows until the engine core exists: `Workflow`, `WorkflowStep`, `WorkflowApprover`, `WorkflowInstance`, `WorkflowAction`, `Escalation`.

If engine missing, build it first (separate task; tell user).

## Pattern (entity-side, once engine exists)

### 1. Schema link
Add to the entity table:
```prisma
workflowInstanceId String?  @map("workflow_instance_id")
workflowInstance   WorkflowInstance? @relation(fields: [workflowInstanceId], references: [id])
```

### 2. Trigger from service
On create (or specific status transition), instantiate workflow:
```ts
const wf = await workflowService.start({
  orgId, userId,
  workflowCode: 'purchase-request-approval',
  entityType: 'purchase-request',
  entityId: pr.id,
})
await repo.update({ orgId, tx }, pr.id, { workflowInstanceId: wf.id, status: 'pending-approval' })
```

### 3. Approval handler
`POST /api/workflow/instance/:id/approve` and `.../reject`:
- Guard: `requirePermission(userId, '<module>.approve')`
- Service moves instance to next step OR completes; on complete, calls entity-specific callback to flip status.
- Emit audit log entry `action: 'approve' | 'reject'` on entity, not just workflow.

### 4. SLA & escalation
Each `WorkflowStep` has `slaHours`. A scheduled job scans for overdue active steps and:
- Sends reminder notification to current approver(s)
- After `escalationHours`, notifies the next approver level

Use Vercel cron or a separate worker — workflow logic itself MUST stay deterministic (no `Date.now()` inside engine code — pass `now` as input).

### 5. Definition seed
In `prisma/seed/workflows.ts`, define the workflow + steps + approver rules per org (or system-template clonable per org).

## Anti-patterns
- Don't hardcode approver `userId` — use role-based (`roleCode: 'finance-manager'`) so it survives staff changes.
- Don't bypass audit when an approval completes a workflow — log on both `workflow_instance` and the entity.
- Don't put `Date.now()` inside the engine's step-transition function. Inject clock.
- Don't allow self-approval — check `requesterId !== approverId` in service.
