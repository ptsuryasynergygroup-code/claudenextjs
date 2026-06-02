import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type ProjectDto,
  type TaskDto,
  type ProjectStatus,
  type TaskStatus,
  type TaskPriority,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const projStatusOut: Record<string, ProjectStatus> = {
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
}
const projStatusIn: Record<ProjectStatus, "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED"> = {
  active: "ACTIVE",
  on_hold: "ON_HOLD",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
}
const taskStatusOut: Record<string, TaskStatus> = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
}
const taskStatusIn: Record<TaskStatus, "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"> = {
  todo: "TODO",
  in_progress: "IN_PROGRESS",
  done: "DONE",
  cancelled: "CANCELLED",
}
const prioOut: Record<string, TaskPriority> = { LOW: "low", MEDIUM: "medium", HIGH: "high" }
const prioIn: Record<TaskPriority, "LOW" | "MEDIUM" | "HIGH"> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
}

type ProjectRow = Prisma.ProjectGetPayload<object>
type TaskRow = Prisma.TaskGetPayload<object>

function toProjectDto(p: ProjectRow): ProjectDto {
  return {
    id: p.id,
    organizationId: p.organizationId,
    name: p.name,
    description: p.description,
    status: projStatusOut[p.status] ?? "active",
    ownerId: p.ownerId,
    startDate: p.startDate,
    endDate: p.endDate,
    createdAt: p.createdAt,
  }
}

function toTaskDto(t: TaskRow): TaskDto {
  return {
    id: t.id,
    organizationId: t.organizationId,
    projectId: t.projectId,
    milestoneId: t.milestoneId,
    title: t.title,
    description: t.description,
    assignedToId: t.assignedToId,
    status: taskStatusOut[t.status] ?? "todo",
    priority: prioOut[t.priority] ?? "medium",
    dueDate: t.dueDate,
    createdById: t.createdById,
    createdAt: t.createdAt,
  }
}

export async function listProjects(ctx: Ctx): Promise<ProjectDto[]> {
  const rows = await db(ctx).project.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toProjectDto)
}

export async function findProject(ctx: Ctx, id: string): Promise<ProjectDto | null> {
  const row = await db(ctx).project.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toProjectDto(row) : null
}

export async function createProject(ctx: Ctx, data: CreateProjectInput): Promise<ProjectDto> {
  const row = await db(ctx).project.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      description: data.description ?? null,
      status: projStatusIn[data.status],
      ownerId: data.ownerId ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    },
  })
  return toProjectDto(row)
}

export async function updateProject(
  ctx: Ctx,
  id: string,
  data: UpdateProjectInput,
): Promise<ProjectDto> {
  const row = await db(ctx).project.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status ? projStatusIn[data.status] : undefined,
      ownerId: data.ownerId,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  })
  return toProjectDto(row)
}

export async function softDeleteProject(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).project.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Project not found")
  await db(ctx).project.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listTasks(ctx: Ctx): Promise<TaskDto[]> {
  const rows = await db(ctx).task.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toTaskDto)
}

export async function findTask(ctx: Ctx, id: string): Promise<TaskDto | null> {
  const row = await db(ctx).task.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toTaskDto(row) : null
}

export async function createTask(
  ctx: Ctx,
  data: CreateTaskInput,
  createdById: string,
): Promise<TaskDto> {
  const row = await db(ctx).task.create({
    data: {
      organizationId: ctx.orgId,
      projectId: data.projectId ?? null,
      milestoneId: data.milestoneId ?? null,
      title: data.title,
      description: data.description ?? null,
      assignedToId: data.assignedToId ?? null,
      status: taskStatusIn[data.status],
      priority: prioIn[data.priority],
      dueDate: data.dueDate ?? null,
      createdById,
    },
  })
  return toTaskDto(row)
}

export async function updateTask(ctx: Ctx, id: string, data: UpdateTaskInput): Promise<TaskDto> {
  const row = await db(ctx).task.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId,
      status: data.status ? taskStatusIn[data.status] : undefined,
      priority: data.priority ? prioIn[data.priority] : undefined,
      dueDate: data.dueDate,
    },
  })
  return toTaskDto(row)
}

export async function changeTaskStatus(
  ctx: Ctx,
  id: string,
  status: TaskStatus,
): Promise<TaskDto> {
  const row = await db(ctx).task.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: taskStatusIn[status] },
  })
  return toTaskDto(row)
}

export async function assignTask(
  ctx: Ctx,
  id: string,
  assignedToId: string | null,
): Promise<TaskDto> {
  if (assignedToId) {
    const u = await db(ctx).user.findFirst({
      where: { id: assignedToId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    })
    if (!u) throw new Error("Assignee not found in this organization")
  }
  const row = await db(ctx).task.update({
    where: { id, organizationId: ctx.orgId },
    data: { assignedToId },
  })
  return toTaskDto(row)
}

export async function softDeleteTask(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).task.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Task not found")
  await db(ctx).task.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}
