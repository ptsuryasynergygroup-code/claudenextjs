import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/workflow/repository"
import * as notifications from "@/lib/entities/notification/repository"
import {
  type WorkflowDto,
  type WorkflowInstanceDto,
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  StartInstanceSchema,
  DecideSchema,
} from "@/lib/entities/workflow/schema"
import { notFound, forbidden } from "@/lib/errors"

const MODULE = "workflows"

export async function getWorkflows(): Promise<WorkflowDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.view")
  return repo.listWorkflows({ orgId: s.orgId })
}

export async function getWorkflow(id: string): Promise<WorkflowDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.view")
  const w = await repo.findWorkflow({ orgId: s.orgId }, id)
  if (!w) notFound("Workflow")
  return w
}

export async function getInstances(): Promise<WorkflowInstanceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.view")
  return repo.listInstances({ orgId: s.orgId })
}

export async function getInstance(id: string): Promise<WorkflowInstanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.view")
  const i = await repo.findInstance({ orgId: s.orgId }, id)
  if (!i) notFound("WorkflowInstance")
  return i
}

export async function createWorkflow(input: unknown): Promise<WorkflowDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.create")
  const data = CreateWorkflowSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const w = await repo.createWorkflow({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Workflow",
      entityId: w.id,
      action: "create",
      description: `Created workflow: ${w.name}`,
      newValue: { name: w.name, entityType: w.entityType, steps: w.steps.length },
    })
    return w
  })
}

export async function updateWorkflow(id: string, input: unknown): Promise<WorkflowDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.edit")
  const data = UpdateWorkflowSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findWorkflow({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Workflow")
    const after = await repo.updateWorkflow({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { name: before.name, description: before.description, status: before.status },
      { name: after.name, description: after.description, status: after.status },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Workflow",
      entityId: after.id,
      action: "update",
      description: `Updated workflow: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteWorkflow(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findWorkflow({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Workflow")
    await repo.softDeleteWorkflow({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Workflow",
      entityId: id,
      action: "delete",
      description: `Deleted workflow: ${before.name}`,
      oldValue: { name: before.name },
    })
  })
}

export async function startInstance(input: unknown): Promise<WorkflowInstanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.create")
  const data = StartInstanceSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const ctx = { orgId: s.orgId, tx }
    const workflow = await repo.findWorkflowByEntityType(ctx, data.entityType)
    if (!workflow) notFound("Workflow")

    const instance = await repo.createInstance(ctx, {
      workflowId: workflow.id,
      entityType: data.entityType,
      entityId: data.entityId,
      startedBy: s.userId,
    })

    const approverIds = await repo.resolveStepApproverUserIds(ctx, workflow.id, 1)
    await notifications.createMany(
      ctx,
      approverIds
        .filter((uid) => uid !== s.userId)
        .map((uid) => ({
          userId: uid,
          title: "Approval required",
          message: `${workflow.name}: a ${data.entityType} requires your approval.`,
          entityType: "WorkflowInstance",
          entityId: instance.id,
        })),
    )

    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "WorkflowInstance",
      entityId: instance.id,
      action: "create",
      description: `Started workflow ${workflow.name} for ${data.entityType}`,
      newValue: { workflowId: workflow.id, entityType: data.entityType, entityId: data.entityId },
    })
    return instance
  })
}

export async function decide(instanceId: string, input: unknown): Promise<WorkflowInstanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "workflows.approve")
  const data = DecideSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const ctx = { orgId: s.orgId, tx }
    const instance = await repo.findInstance(ctx, instanceId)
    if (!instance) notFound("WorkflowInstance")
    if (instance.status !== "pending") forbidden({ reason: "instance not pending" })
    if (instance.startedBy === s.userId) forbidden({ reason: "self-approval not allowed" })

    const workflow = await repo.findWorkflow(ctx, instance.workflowId)
    if (!workflow) notFound("Workflow")

    const eligible = await repo.resolveStepApproverUserIds(
      ctx,
      workflow.id,
      instance.currentStepOrder,
    )
    if (eligible.length > 0 && !eligible.includes(s.userId)) {
      forbidden({ reason: "not an approver for the current step" })
    }

    await repo.recordAction(ctx, {
      instanceId: instance.id,
      stepOrder: instance.currentStepOrder,
      actorId: s.userId,
      decision: data.decision,
      comment: data.comment ?? null,
    })

    const maxStep = Math.max(...workflow.steps.map((st) => st.stepOrder))
    let updated: WorkflowInstanceDto

    if (data.decision === "reject") {
      updated = await repo.updateInstanceProgress(ctx, instance.id, {
        status: "rejected",
        currentStepOrder: instance.currentStepOrder,
        completed: true,
      })
      await notifications.createMany(ctx, [
        {
          userId: instance.startedBy,
          title: "Request rejected",
          message: `${workflow.name}: your ${instance.entityType} was rejected.`,
          entityType: "WorkflowInstance",
          entityId: instance.id,
        },
      ])
    } else if (instance.currentStepOrder >= maxStep) {
      updated = await repo.updateInstanceProgress(ctx, instance.id, {
        status: "approved",
        currentStepOrder: instance.currentStepOrder,
        completed: true,
      })
      await notifications.createMany(ctx, [
        {
          userId: instance.startedBy,
          title: "Request approved",
          message: `${workflow.name}: your ${instance.entityType} was approved.`,
          entityType: "WorkflowInstance",
          entityId: instance.id,
        },
      ])
    } else {
      const nextStep = instance.currentStepOrder + 1
      updated = await repo.updateInstanceProgress(ctx, instance.id, {
        status: "pending",
        currentStepOrder: nextStep,
        completed: false,
      })
      const nextApprovers = await repo.resolveStepApproverUserIds(ctx, workflow.id, nextStep)
      await notifications.createMany(
        ctx,
        nextApprovers
          .filter((uid) => uid !== instance.startedBy)
          .map((uid) => ({
            userId: uid,
            title: "Approval required",
            message: `${workflow.name}: a ${instance.entityType} requires your approval.`,
            entityType: "WorkflowInstance",
            entityId: instance.id,
          })),
      )
    }

    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "WorkflowInstance",
      entityId: instance.id,
      action: data.decision === "approve" ? "approve" : "reject",
      description: `${data.decision === "approve" ? "Approved" : "Rejected"} step ${instance.currentStepOrder} of ${workflow.name}`,
      newValue: { decision: data.decision, comment: data.comment ?? null },
    })
    return updated
  })
}
