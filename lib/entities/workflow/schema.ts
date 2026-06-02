import { z } from "zod"
import { StatusSchema } from "@/lib/entities/organization/schema"

export const WorkflowInstanceStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
])
export type WorkflowInstanceStatus = z.infer<typeof WorkflowInstanceStatusSchema>

export const ApprovalDecisionSchema = z.enum(["approve", "reject"])
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>

export const WorkflowApproverSchema = z.object({
  id: z.string(),
  workflowStepId: z.string(),
  roleId: z.string().nullable(),
  userId: z.string().nullable(),
})
export type WorkflowApproverDto = z.infer<typeof WorkflowApproverSchema>

export const WorkflowStepSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  stepOrder: z.number().int(),
  name: z.string(),
  slaHours: z.number().int().nullable(),
  escalationHours: z.number().int().nullable(),
  approvers: z.array(WorkflowApproverSchema),
})
export type WorkflowStepDto = z.infer<typeof WorkflowStepSchema>

export const WorkflowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  entityType: z.string(),
  status: StatusSchema,
  createdAt: z.date(),
  steps: z.array(WorkflowStepSchema),
})
export type WorkflowDto = z.infer<typeof WorkflowSchema>

export const CreateWorkflowStepSchema = z.object({
  stepOrder: z.number().int().min(1),
  name: z.string().min(1),
  slaHours: z.number().int().min(0).nullable().optional(),
  escalationHours: z.number().int().min(0).nullable().optional(),
  approvers: z
    .array(
      z.object({
        roleId: z.string().nullable().optional(),
        userId: z.string().nullable().optional(),
      }),
    )
    .default([]),
})
export type CreateWorkflowStepInput = z.infer<typeof CreateWorkflowStepSchema>

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  entityType: z.string().min(1),
  status: StatusSchema.default("active"),
  steps: z.array(CreateWorkflowStepSchema).min(1),
})
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: StatusSchema.optional(),
  steps: z.array(CreateWorkflowStepSchema).min(1).optional(),
})
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>

export const ApprovalActionSchema = z.object({
  id: z.string(),
  instanceId: z.string(),
  stepOrder: z.number().int(),
  actorId: z.string(),
  decision: ApprovalDecisionSchema,
  comment: z.string().nullable(),
  createdAt: z.date(),
})
export type ApprovalActionDto = z.infer<typeof ApprovalActionSchema>

export const WorkflowInstanceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  workflowId: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  status: WorkflowInstanceStatusSchema,
  currentStepOrder: z.number().int(),
  startedBy: z.string(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  actions: z.array(ApprovalActionSchema),
})
export type WorkflowInstanceDto = z.infer<typeof WorkflowInstanceSchema>

export const StartInstanceSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
})
export type StartInstanceInput = z.infer<typeof StartInstanceSchema>

export const DecideSchema = z.object({
  decision: ApprovalDecisionSchema,
  comment: z.string().nullable().optional(),
})
export type DecideInput = z.infer<typeof DecideSchema>
