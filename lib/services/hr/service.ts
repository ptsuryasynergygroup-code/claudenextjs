import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement, requireFeature } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { fromSession } from "@/lib/scope"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/hr/repository"
import {
  type EmployeeDto,
  type AttendanceDto,
  type LeaveRequestDto,
  type LeaveTypeDto,
  type LeaveBalanceDto,
  type PayslipDto,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateAttendanceSchema,
  CreateLeaveRequestSchema,
  CreateLeaveTypeSchema,
  SetLeaveBalanceSchema,
  DecideLeaveSchema,
  CreatePayslipSchema,
} from "@/lib/entities/hr/schema"
import { notFound } from "@/lib/errors"

const MODULE = "hr"
const F_ATTENDANCE = "hr.attendance"
const F_LEAVE = "hr.leave"
const F_PAYROLL = "hr.payroll"

// Employees (base hr module) --------------------------------------------------

export async function getEmployees(): Promise<EmployeeDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  return repo.listEmployees({ orgId: s.orgId, sc: fromSession(s) })
}

export async function getEmployee(id: string): Promise<EmployeeDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  const e = await repo.findEmployee({ orgId: s.orgId }, id)
  if (!e) notFound("Employee")
  return e
}

export async function createEmployee(input: unknown): Promise<EmployeeDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateEmployeeSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const e = await repo.createEmployee({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Employee", entityId: e.id, action: "create",
      description: `Created employee: ${e.fullName} (${e.employeeCode})`,
      newValue: { employeeCode: e.employeeCode, fullName: e.fullName },
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
    const d = diff(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Employee", entityId: after.id, action: "update",
      description: `Updated employee: ${after.fullName}`,
      oldValue: d.old, newValue: d.new,
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
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Employee", entityId: id, action: "delete",
      description: `Deleted employee: ${before.fullName}`, oldValue: { employeeCode: before.employeeCode },
    })
  })
}

// Attendance (feature: hr.attendance) -----------------------------------------

export async function getAttendances(): Promise<AttendanceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_ATTENDANCE)
  await requirePermission(s.userId, "hr.view")
  return repo.listAttendances({ orgId: s.orgId, sc: fromSession(s) })
}

export async function recordAttendance(input: unknown): Promise<AttendanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_ATTENDANCE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateAttendanceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const a = await repo.createAttendance({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Attendance", entityId: a.id, action: "create",
      description: `Recorded attendance for employee ${a.employeeId}`,
      newValue: { employeeId: a.employeeId, status: a.status },
    })
    return a
  })
}

// Leave (feature: hr.leave) ---------------------------------------------------

export async function getLeaveTypes(): Promise<LeaveTypeDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.view")
  return repo.listLeaveTypes({ orgId: s.orgId })
}

export async function createLeaveType(input: unknown): Promise<LeaveTypeDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateLeaveTypeSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const t = await repo.createLeaveType({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "LeaveType", entityId: t.id, action: "create",
      description: `Created leave type: ${t.name}`, newValue: { name: t.name, daysPerYear: t.daysPerYear },
    })
    return t
  })
}

export async function getLeaveBalances(): Promise<LeaveBalanceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.view")
  return repo.listLeaveBalances({ orgId: s.orgId })
}

export async function setLeaveBalance(input: unknown): Promise<LeaveBalanceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.edit")
  const data = SetLeaveBalanceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const b = await repo.setLeaveBalance({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "LeaveBalance", entityId: b.id, action: "update",
      description: `Set leave balance for employee ${b.employeeId}`,
      newValue: { leaveTypeId: b.leaveTypeId, year: b.year, entitled: b.entitled },
    })
    return b
  })
}

export async function getLeaveRequests(): Promise<LeaveRequestDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.view")
  return repo.listLeaveRequests({ orgId: s.orgId, sc: fromSession(s) })
}

export async function createLeaveRequest(input: unknown): Promise<LeaveRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.create")
  const data = CreateLeaveRequestSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const l = await repo.createLeaveRequest({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "LeaveRequest", entityId: l.id, action: "create",
      description: `Leave request for employee ${l.employeeId}`,
      newValue: { leaveType: l.leaveType, startDate: l.startDate, endDate: l.endDate },
    })
    return l
  })
}

export async function decideLeaveRequest(id: string, input: unknown): Promise<LeaveRequestDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_LEAVE)
  await requirePermission(s.userId, "hr.approve")
  const { status } = DecideLeaveSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findLeaveRequest({ orgId: s.orgId, tx }, id)
    if (!before) notFound("LeaveRequest")
    const after = await repo.setLeaveStatus({ orgId: s.orgId, tx }, id, status)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "LeaveRequest", entityId: after.id,
      action: status === "approved" ? "approve" : "reject",
      description: `Leave ${status}: employee ${after.employeeId}`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}

// Payroll (feature: hr.payroll) -----------------------------------------------

export async function getPayslips(): Promise<PayslipDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_PAYROLL)
  await requirePermission(s.userId, "hr.view")
  return repo.listPayslips({ orgId: s.orgId })
}

export async function createPayslip(input: unknown): Promise<PayslipDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_PAYROLL)
  await requirePermission(s.userId, "hr.create")
  const data = CreatePayslipSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const p = await repo.createPayslip({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Payslip", entityId: p.id, action: "create",
      description: `Created payslip ${p.period} for employee ${p.employeeId}`,
      newValue: { period: p.period, netPay: p.netPay },
    })
    return p
  })
}

export async function finalizePayslip(id: string): Promise<PayslipDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_PAYROLL)
  await requirePermission(s.userId, "hr.edit")
  return prisma.$transaction(async (tx) => {
    const before = await repo.findPayslip({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Payslip")
    const after = await repo.finalizePayslip({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Payslip", entityId: after.id, action: "update",
      description: `Finalized payslip ${after.period}`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}
