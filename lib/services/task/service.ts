import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/task/repository"
import {
  type ProjectDto,
  type TaskDto,
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  ChangeTaskStatusSchema,
  AssignTaskSchema,
} from "@/lib/entities/task/schema"
import { notFound } from "@/lib/errors"

const MODULE = "tasks"

export async function getProjects(): Promise<ProjectDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.view")
  return repo.listProjects({ orgId: s.orgId })
}

export async function createProject(input: unknown): Promise<ProjectDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.create")
  const data = CreateProjectSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const p = await repo.createProject({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Project",
      entityId: p.id,
      action: "create",
      description: `Created project: ${p.name}`,
      newValue: { name: p.name },
    })
    return p
  })
}

export async function updateProject(id: string, input: unknown): Promise<ProjectDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.edit")
  const data = UpdateProjectSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findProject({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Project")
    const after = await repo.updateProject({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { name: before.name, status: before.status },
      { name: after.name, status: after.status },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Project",
      entityId: after.id,
      action: "update",
      description: `Updated project: ${after.name}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteProject(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findProject({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Project")
    await repo.softDeleteProject({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Project",
      entityId: id,
      action: "delete",
      description: `Deleted project: ${before.name}`,
      oldValue: { name: before.name },
    })
  })
}

export async function getTasks(): Promise<TaskDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.view")
  return repo.listTasks({ orgId: s.orgId })
}

export async function getTask(id: string): Promise<TaskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.view")
  const t = await repo.findTask({ orgId: s.orgId }, id)
  if (!t) notFound("Task")
  return t
}

export async function createTask(input: unknown): Promise<TaskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.create")
  const data = CreateTaskSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const t = await repo.createTask({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Task",
      entityId: t.id,
      action: "create",
      description: `Created task: ${t.title}`,
      newValue: { title: t.title, assignedToId: t.assignedToId },
    })
    return t
  })
}

export async function updateTask(id: string, input: unknown): Promise<TaskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.edit")
  const data = UpdateTaskSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findTask({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Task")
    const after = await repo.updateTask({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { title: before.title, status: before.status, priority: before.priority, assignedToId: before.assignedToId },
      { title: after.title, status: after.status, priority: after.priority, assignedToId: after.assignedToId },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Task",
      entityId: after.id,
      action: "update",
      description: `Updated task: ${after.title}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function changeTaskStatus(id: string, input: unknown): Promise<TaskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.edit")
  const { status } = ChangeTaskStatusSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findTask({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Task")
    const after = await repo.changeTaskStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Task",
      entityId: after.id,
      action: "update",
      description: `Task status: ${before.title} (${before.status} → ${after.status})`,
      oldValue: { status: before.status },
      newValue: { status: after.status },
    })
    return after
  })
}

export async function assignTask(id: string, input: unknown): Promise<TaskDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.edit")
  const { assignedToId } = AssignTaskSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findTask({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Task")
    const after = await repo.assignTask({ orgId: s.orgId, tx }, id, assignedToId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Task",
      entityId: after.id,
      action: "update",
      description: `Assigned task: ${after.title}`,
      oldValue: { assignedToId: before.assignedToId },
      newValue: { assignedToId: after.assignedToId },
    })
    return after
  })
}

export async function deleteTask(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "tasks.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findTask({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Task")
    await repo.softDeleteTask({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Task",
      entityId: id,
      action: "delete",
      description: `Deleted task: ${before.title}`,
      oldValue: { title: before.title },
    })
  })
}
