"use server"

import { revalidatePath } from "next/cache"
import {
  createEmployee,
  decideLeaveRequest,
} from "@/lib/services/hr/service"

export async function createEmployeeAction(input: {
  employeeCode: string
  joinDate: string
  employmentStatus: "permanent" | "contract" | "probation" | "terminated"
}) {
  await createEmployee(input)
  revalidatePath("/dashboard/hr")
}

export async function decideLeaveAction(id: string, status: "approved" | "rejected") {
  await decideLeaveRequest(id, { status })
  revalidatePath("/dashboard/hr")
}
