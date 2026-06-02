"use server"

import { revalidatePath } from "next/cache"
import {
  createTask,
  changeTaskStatus,
  assignTask,
  deleteTask,
  createProject,
} from "@/lib/services/task/service"
import type { TaskStatus } from "@/lib/entities/task/schema"

export async function createTaskAction(input: {
  title: string
  priority: "low" | "medium" | "high"
  projectId?: string | null
  assignedToId?: string | null
}) {
  await createTask({
    title: input.title,
    priority: input.priority,
    projectId: input.projectId ?? null,
    assignedToId: input.assignedToId ?? null,
  })
  revalidatePath("/dashboard/tasks")
}

export async function changeTaskStatusAction(id: string, status: TaskStatus) {
  await changeTaskStatus(id, { status })
  revalidatePath("/dashboard/tasks")
}

export async function assignTaskAction(id: string, assignedToId: string | null) {
  await assignTask(id, { assignedToId })
  revalidatePath("/dashboard/tasks")
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id)
  revalidatePath("/dashboard/tasks")
}

export async function createProjectAction(name: string, description?: string) {
  await createProject({ name, description: description ?? null })
  revalidatePath("/dashboard/tasks")
}
