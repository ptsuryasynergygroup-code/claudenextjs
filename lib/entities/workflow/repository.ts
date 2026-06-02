import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type WorkflowDto,
  type WorkflowInstanceDto,
  type WorkflowInstanceStatus,
  type ApprovalDecision,
  type CreateWorkflowInput,
  type UpdateWorkflowInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const instStatusOut: Record<string, WorkflowInstanceStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
}

const instStatusIn: Record<WorkflowInstanceStatus, "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
}

const decisionOut: Record<string, ApprovalDecision> = {
  APPROVE: "approve",
  REJECT: "reject",
}

const statusOut: Record<string, "active" | "inactive"> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}

const statusIn: Record<"active" | "inactive", "ACTIVE" | "INACTIVE"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
}

const workflowInclude = {
  steps: {
    orderBy: { stepOrder: "asc" as const },
    include: { approvers: true },
  },
}

type WorkflowRow = Prisma.WorkflowGetPayload<{ include: typeof workflowInclude }>
type InstanceRow = Prisma.WorkflowInstanceGetPayload<{ include: { actions: true } }>

function toWorkflowDto(w: WorkflowRow): WorkflowDto {
  return {
    id: w.id,
    organizationId: w.organizationId,
    name: w.name,
    description: w.description,
    entityType: w.entityType,
    status: statusOut[w.status] ?? "inactive",
    createdAt: w.createdAt,
    steps: w.steps.map((s) => ({
      id: s.id,
      workflowId: s.workflowId,
      stepOrder: s.stepOrder,
      name: s.name,
      slaHours: s.slaHours,
      escalationHours: s.escalationHours,
      approvers: s.approvers.map((a) => ({
        id: a.id,
        workflowStepId: a.workflowStepId,
        roleId: a.roleId,
        userId: a.userId,
      })),
    })),
  }
}

function toInstanceDto(i: InstanceRow): WorkflowInstanceDto {
  return {
    id: i.id,
    organizationId: i.organizationId,
    workflowId: i.workflowId,
    entityType: i.entityType,
    entityId: i.entityId,
    status: instStatusOut[i.status] ?? "pending",
    currentStepOrder: i.currentStepOrder,
    startedBy: i.startedBy,
    createdAt: i.createdAt,
    completedAt: i.completedAt,
    actions: i.actions
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((a) => ({
        id: a.id,
        instanceId: a.instanceId,
        stepOrder: a.stepOrder,
        actorId: a.actorId,
        decision: decisionOut[a.decision] ?? "approve",
        comment: a.comment,
        createdAt: a.createdAt,
      })),
  }
}

export async function listWorkflows(ctx: Ctx): Promise<WorkflowDto[]> {
  const rows = await db(ctx).workflow.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: workflowInclude,
  })
  return rows.map(toWorkflowDto)
}

export async function findWorkflow(ctx: Ctx, id: string): Promise<WorkflowDto | null> {
  const row = await db(ctx).workflow.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    include: workflowInclude,
  })
  return row ? toWorkflowDto(row) : null
}

export async function findWorkflowByEntityType(
  ctx: Ctx,
  entityType: string,
): Promise<WorkflowDto | null> {
  const row = await db(ctx).workflow.findFirst({
    where: { entityType, organizationId: ctx.orgId, deletedAt: null, status: "ACTIVE" },
    include: workflowInclude,
  })
  return row ? toWorkflowDto(row) : null
}

export async function createWorkflow(ctx: Ctx, data: CreateWorkflowInput): Promise<WorkflowDto> {
  const row = await db(ctx).workflow.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      description: data.description ?? null,
      entityType: data.entityType,
      status: statusIn[data.status],
      steps: {
        create: data.steps.map((s) => ({
          stepOrder: s.stepOrder,
          name: s.name,
          slaHours: s.slaHours ?? null,
          escalationHours: s.escalationHours ?? null,
          approvers: {
            create: s.approvers.map((a) => ({
              roleId: a.roleId ?? null,
              userId: a.userId ?? null,
            })),
          },
        })),
      },
    },
    include: workflowInclude,
  })
  return toWorkflowDto(row)
}

export async function updateWorkflow(
  ctx: Ctx,
  id: string,
  data: UpdateWorkflowInput,
): Promise<WorkflowDto> {
  const conn = db(ctx)
  const existing = await conn.workflow.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Workflow not found")

  if (data.steps) {
    await conn.workflowStep.deleteMany({ where: { workflowId: id } })
    for (const s of data.steps) {
      await conn.workflowStep.create({
        data: {
          workflowId: id,
          stepOrder: s.stepOrder,
          name: s.name,
          slaHours: s.slaHours ?? null,
          escalationHours: s.escalationHours ?? null,
          approvers: {
            create: s.approvers.map((a) => ({
              roleId: a.roleId ?? null,
              userId: a.userId ?? null,
            })),
          },
        },
      })
    }
  }

  const row = await conn.workflow.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status ? statusIn[data.status] : undefined,
    },
    include: workflowInclude,
  })
  return toWorkflowDto(row)
}

export async function softDeleteWorkflow(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).workflow.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Workflow not found")
  await db(ctx).workflow.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listInstances(ctx: Ctx): Promise<WorkflowInstanceDto[]> {
  const rows = await db(ctx).workflowInstance.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    include: { actions: true },
  })
  return rows.map(toInstanceDto)
}

export async function findInstance(
  ctx: Ctx,
  id: string,
): Promise<WorkflowInstanceDto | null> {
  const row = await db(ctx).workflowInstance.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: { actions: true },
  })
  return row ? toInstanceDto(row) : null
}

export async function createInstance(
  ctx: Ctx,
  data: { workflowId: string; entityType: string; entityId: string; startedBy: string },
): Promise<WorkflowInstanceDto> {
  const row = await db(ctx).workflowInstance.create({
    data: {
      organizationId: ctx.orgId,
      workflowId: data.workflowId,
      entityType: data.entityType,
      entityId: data.entityId,
      startedBy: data.startedBy,
      status: "PENDING",
      currentStepOrder: 1,
    },
    include: { actions: true },
  })
  return toInstanceDto(row)
}

export async function recordAction(
  ctx: Ctx,
  data: {
    instanceId: string
    stepOrder: number
    actorId: string
    decision: ApprovalDecision
    comment?: string | null
  },
): Promise<void> {
  await db(ctx).approvalAction.create({
    data: {
      instanceId: data.instanceId,
      stepOrder: data.stepOrder,
      actorId: data.actorId,
      decision: data.decision === "approve" ? "APPROVE" : "REJECT",
      comment: data.comment ?? null,
    },
  })
}

export async function updateInstanceProgress(
  ctx: Ctx,
  id: string,
  data: { status: WorkflowInstanceStatus; currentStepOrder: number; completed: boolean },
): Promise<WorkflowInstanceDto> {
  const row = await db(ctx).workflowInstance.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      status: instStatusIn[data.status],
      currentStepOrder: data.currentStepOrder,
      completedAt: data.completed ? new Date() : null,
    },
    include: { actions: true },
  })
  return toInstanceDto(row)
}

export async function resolveStepApproverUserIds(
  ctx: Ctx,
  workflowId: string,
  stepOrder: number,
): Promise<string[]> {
  const step = await db(ctx).workflowStep.findFirst({
    where: { workflowId, stepOrder, workflow: { organizationId: ctx.orgId } },
    include: { approvers: true },
  })
  if (!step) return []

  const direct = step.approvers
    .map((a) => a.userId)
    .filter((u): u is string => Boolean(u))

  const roleIds = step.approvers
    .map((a) => a.roleId)
    .filter((r): r is string => Boolean(r))

  let fromRoles: string[] = []
  if (roleIds.length > 0) {
    const rows = await db(ctx).userRole.findMany({
      where: {
        roleId: { in: roleIds },
        user: { organizationId: ctx.orgId, deletedAt: null, status: "ACTIVE" },
      },
      select: { userId: true },
    })
    fromRoles = rows.map((r) => r.userId)
  }

  return Array.from(new Set([...direct, ...fromRoles]))
}
