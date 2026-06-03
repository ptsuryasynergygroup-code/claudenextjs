"use server"

import { revalidatePath } from "next/cache"
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  recordAttendance,
  createLeaveType,
  setLeaveBalance,
  createLeaveRequest,
  decideLeaveRequest,
  createPayslip,
  finalizePayslip,
} from "@/lib/services/hr/service"

export type EmployeeFormValues = {
  employeeCode: string
  fullName: string
  nik?: string | null
  dateOfBirth?: string | null
  gender?: "male" | "female" | null
  maritalStatus?: string | null
  religion?: string | null
  address?: string | null
  phone?: string | null
  personalEmail?: string | null
  branchId?: string | null
  departmentId?: string | null
  positionId?: string | null
  joinDate: string
  endDate?: string | null
  employmentStatus: "permanent" | "contract" | "probation" | "terminated"
  basicSalary?: number | null
  bankName?: string | null
  bankAccount?: string | null
  npwp?: string | null
}

function clean(v: EmployeeFormValues) {
  // strip empty strings to null/undefined so optional Zod fields validate
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v)) {
    out[k] = val === "" ? null : val
  }
  return out
}

export async function createEmployeeAction(input: EmployeeFormValues) {
  await createEmployee(clean(input))
  revalidatePath("/dashboard/hr")
}

export async function updateEmployeeAction(id: string, input: EmployeeFormValues) {
  await updateEmployee(id, clean(input))
  revalidatePath("/dashboard/hr")
  revalidatePath(`/dashboard/hr/employees/${id}`)
}

export async function deleteEmployeeAction(id: string) {
  await deleteEmployee(id)
  revalidatePath("/dashboard/hr")
}

export async function recordAttendanceAction(input: {
  employeeId: string
  date: string
  status: string
}) {
  await recordAttendance(input)
  revalidatePath("/dashboard/hr")
}

export async function createLeaveTypeAction(input: { name: string; daysPerYear: number }) {
  await createLeaveType(input)
  revalidatePath("/dashboard/hr")
}

export async function setLeaveBalanceAction(input: {
  employeeId: string
  leaveTypeId: string
  year: number
  entitled: number
}) {
  await setLeaveBalance(input)
  revalidatePath("/dashboard/hr")
}

export async function createLeaveRequestAction(input: {
  employeeId: string
  leaveType: string
  leaveTypeId?: string | null
  startDate: string
  endDate: string
  reason?: string | null
}) {
  await createLeaveRequest(input)
  revalidatePath("/dashboard/hr")
}

export async function decideLeaveAction(id: string, status: "approved" | "rejected") {
  await decideLeaveRequest(id, { status })
  revalidatePath("/dashboard/hr")
}

export async function createPayslipAction(input: {
  employeeId: string
  period: string
  components: { type: "earning" | "deduction"; name: string; amount: number }[]
}) {
  await createPayslip(input)
  revalidatePath("/dashboard/hr")
}

export async function finalizePayslipAction(id: string) {
  await finalizePayslip(id)
  revalidatePath("/dashboard/hr")
}
