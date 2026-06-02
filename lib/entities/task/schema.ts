import { z } from "zod"

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskPrioritySchema = z.enum(["low", "medium", "high"])
export type TaskPriority = z.infer<typeof TaskPrioritySchema>

export const ProjectStatusSchema = z.enum(["active", "on_hold", "completed", "cancelled"])
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

export const ProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: ProjectStatusSchema,
  ownerId: z.string().nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
})
export type ProjectDto = z.infer<typeof ProjectSchema>

export const TaskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullable(),
  milestoneId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  assignedToId: z.string().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: z.date().nullable(),
  createdById: z.string(),
  createdAt: z.date(),
})
export type TaskDto = z.infer<typeof TaskSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: ProjectStatusSchema.default("active"),
  ownerId: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const UpdateProjectSchema = CreateProjectSchema.partial()
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("medium"),
  dueDate: z.coerce.date().nullable().optional(),
})
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>

export const UpdateTaskSchema = CreateTaskSchema.partial()
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

export const ChangeTaskStatusSchema = z.object({ status: TaskStatusSchema })
export type ChangeTaskStatusInput = z.infer<typeof ChangeTaskStatusSchema>

export const AssignTaskSchema = z.object({ assignedToId: z.string().nullable() })
export type AssignTaskInput = z.infer<typeof AssignTaskSchema>
