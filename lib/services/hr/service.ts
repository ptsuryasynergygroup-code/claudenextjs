import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/hr/repository"
import {
  type EmployeeDto,
  type AttendanceDto,
  type LeaveRequestDto,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateAttendanceSchema,
  CreateLeaveRequestSchema,
  DecideLeaveSchema,
} from "@/lib/entities/hr/schema"
import { notFound } from "@/lib/errors"

const MODULE = "hr"

export async function getEmployees(): Promise<EmployeeDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  return repo.listEmployees({ orgId: s.orgId })
}

export async function createEmployee(input: unknown): Promise<EmployeeDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateEmployeeSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const e = await repo.createEmployee({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Employee",
      entityId: e.id,
      action: "create",
      description: `Created employee: ${e.employeeCode}`,
      newValue: { employeeCode: e.employeeCode },
    })
    return e
  })
}

export async function updateEmployee(id: string, input: unknown): Promise<EmployeeDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.edit")
  const data = UpdateEmployeeSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findEmployee({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Employee")
    const after = await repo.updateEmployee({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { employmentStatus: before.employmentStatus, basicSalary: before.basicSalary },
      { employmentStatus: after.employmentStatus, basicSalary: after.basicSalary },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Employee",
      entityId: after.id,
      action: "update",
      description: `Updated employee: ${after.employeeCode}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteEmployee(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findEmployee({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Employee")
    await repo.softDeleteEmployee({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Employee",
      entityId: id,
      action: "delete",
      description: `Deleted employee: ${before.employeeCode}`,
      oldValue: { employeeCode: before.employeeCode },
    })
  })
}

export async function getAttendances(): Promise<AttendanceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  return repo.listAttendances({ orgId: s.orgId })
}

export async function recordAttendance(input: unknown): Promise<AttendanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateAttendanceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const a = await repo.createAttendance({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Attendance",
      entityId: a.id,
      action: "create",
      description: `Recorded attendance for employee ${a.employeeId}`,
      newValue: { employeeId: a.employeeId, status: a.status },
    })
    return a
  })
}

export async function getLeaveRequests(): Promise<LeaveRequestDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  return repo.listLeaveRequests({ orgId: s.orgId })
}

export async function createLeaveRequest(input: unknown): Promise<LeaveRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateLeaveRequestSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const l = await repo.createLeaveRequest({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "LeaveRequest",
      entityId: l.id,
      action: "create",
      description: `Leave request for employee ${l.employeeId}`,
      newValue: { leaveType: l.leaveType, startDate: l.startDate, endDate: l.endDate },
    })
    return l
  })
}

export async function decideLeaveRequest(id: string, input: unknown): Promise<LeaveRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.approve")
  const { status } = DecideLeaveSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findLeaveRequest({ orgId: s.orgId, tx }, id)
    if (!before) notFound("LeaveRequest")
    const after = await repo.setLeaveStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "LeaveRequest",
      entityId: after.id,
      action: status === "approved" ? "approve" : "reject",
      description: `Leave ${status}: employee ${after.employeeId}`,
      oldValue: { status: before.status },
      newValue: { status: after.status },
    })
    return after
  })
}
