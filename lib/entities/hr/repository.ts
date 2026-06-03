import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type EmployeeDto,
  type AttendanceDto,
  type LeaveRequestDto,
  type LeaveTypeDto,
  type LeaveBalanceDto,
  type PayslipDto,
  type EmploymentStatus,
  type LeaveStatus,
  type PayslipStatus,
  type PayslipComponentType,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type CreateAttendanceInput,
  type CreateLeaveRequestInput,
  type CreateLeaveTypeInput,
  type SetLeaveBalanceInput,
  type CreatePayslipInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const empStatusOut: Record<string, EmploymentStatus> = {
  PERMANENT: "permanent",
  CONTRACT: "contract",
  PROBATION: "probation",
  TERMINATED: "terminated",
}
const empStatusIn: Record<EmploymentStatus, "PERMANENT" | "CONTRACT" | "PROBATION" | "TERMINATED"> = {
  permanent: "PERMANENT",
  contract: "CONTRACT",
  probation: "PROBATION",
  terminated: "TERMINATED",
}
const leaveStatusOut: Record<string, LeaveStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}
const leaveStatusIn: Record<LeaveStatus, "PENDING" | "APPROVED" | "REJECTED"> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
}
const payStatusOut: Record<string, PayslipStatus> = { DRAFT: "draft", FINALIZED: "finalized" }
const compTypeOut: Record<string, PayslipComponentType> = { EARNING: "earning", DEDUCTION: "deduction" }
const compTypeIn: Record<PayslipComponentType, "EARNING" | "DEDUCTION"> = {
  earning: "EARNING",
  deduction: "DEDUCTION",
}

type EmpRow = Prisma.EmployeeGetPayload<object>
type AttRow = Prisma.AttendanceGetPayload<object>
type LeaveRow = Prisma.LeaveRequestGetPayload<object>
type TypeRow = Prisma.LeaveTypeGetPayload<object>
type BalRow = Prisma.LeaveBalanceGetPayload<object>
type PayRow = Prisma.PayslipGetPayload<{ include: { components: true } }>

function toEmployee(e: EmpRow): EmployeeDto {
  return {
    id: e.id,
    organizationId: e.organizationId,
    userId: e.userId,
    employeeCode: e.employeeCode,
    fullName: e.fullName,
    nik: e.nik,
    dateOfBirth: e.dateOfBirth,
    gender: e.gender,
    maritalStatus: e.maritalStatus,
    religion: e.religion,
    address: e.address,
    phone: e.phone,
    personalEmail: e.personalEmail,
    branchId: e.branchId,
    departmentId: e.departmentId,
    positionId: e.positionId,
    joinDate: e.joinDate,
    endDate: e.endDate,
    employmentStatus: empStatusOut[e.employmentStatus] ?? "permanent",
    basicSalary: e.basicSalary,
    bankName: e.bankName,
    bankAccount: e.bankAccount,
    npwp: e.npwp,
    createdAt: e.createdAt,
  }
}
function toAttendance(a: AttRow): AttendanceDto {
  return {
    id: a.id, organizationId: a.organizationId, employeeId: a.employeeId,
    date: a.date, clockIn: a.clockIn, clockOut: a.clockOut, status: a.status, createdAt: a.createdAt,
  }
}
function toLeave(l: LeaveRow): LeaveRequestDto {
  return {
    id: l.id, organizationId: l.organizationId, employeeId: l.employeeId,
    leaveType: l.leaveType, leaveTypeId: l.leaveTypeId, startDate: l.startDate, endDate: l.endDate,
    reason: l.reason, status: leaveStatusOut[l.status] ?? "pending", createdAt: l.createdAt,
  }
}
function toLeaveType(t: TypeRow): LeaveTypeDto {
  return { id: t.id, organizationId: t.organizationId, name: t.name, daysPerYear: t.daysPerYear, createdAt: t.createdAt }
}
function toBalance(b: BalRow): LeaveBalanceDto {
  return { id: b.id, organizationId: b.organizationId, employeeId: b.employeeId, leaveTypeId: b.leaveTypeId, year: b.year, entitled: b.entitled, used: b.used }
}
function toPayslip(p: PayRow): PayslipDto {
  return {
    id: p.id, organizationId: p.organizationId, employeeId: p.employeeId, period: p.period,
    grossPay: p.grossPay, totalDeductions: p.totalDeductions, netPay: p.netPay,
    status: payStatusOut[p.status] ?? "draft", createdAt: p.createdAt,
    components: p.components.map((c) => ({
      id: c.id, payslipId: c.payslipId, type: compTypeOut[c.type] ?? "earning", name: c.name, amount: c.amount,
    })),
  }
}

// Employees -------------------------------------------------------------------

export async function listEmployees(ctx: Ctx): Promise<EmployeeDto[]> {
  const rows = await db(ctx).employee.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toEmployee)
}

export async function findEmployee(ctx: Ctx, id: string): Promise<EmployeeDto | null> {
  const row = await db(ctx).employee.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toEmployee(row) : null
}

function employeeData(data: CreateEmployeeInput | UpdateEmployeeInput) {
  return {
    employeeCode: data.employeeCode,
    fullName: data.fullName,
    nik: data.nik ?? undefined,
    dateOfBirth: data.dateOfBirth ?? undefined,
    gender: data.gender ?? undefined,
    maritalStatus: data.maritalStatus ?? undefined,
    religion: data.religion ?? undefined,
    address: data.address ?? undefined,
    phone: data.phone ?? undefined,
    personalEmail: data.personalEmail ?? undefined,
    branchId: data.branchId ?? undefined,
    departmentId: data.departmentId ?? undefined,
    positionId: data.positionId ?? undefined,
    joinDate: data.joinDate,
    endDate: data.endDate ?? undefined,
    employmentStatus: data.employmentStatus ? empStatusIn[data.employmentStatus] : undefined,
    basicSalary: data.basicSalary ?? undefined,
    bankName: data.bankName ?? undefined,
    bankAccount: data.bankAccount ?? undefined,
    npwp: data.npwp ?? undefined,
    userId: data.userId ?? undefined,
  }
}

export async function createEmployee(ctx: Ctx, data: CreateEmployeeInput): Promise<EmployeeDto> {
  const row = await db(ctx).employee.create({
    data: {
      organizationId: ctx.orgId,
      ...employeeData(data),
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      joinDate: data.joinDate,
      employmentStatus: empStatusIn[data.employmentStatus],
    },
  })
  return toEmployee(row)
}

export async function updateEmployee(ctx: Ctx, id: string, data: UpdateEmployeeInput): Promise<EmployeeDto> {
  const row = await db(ctx).employee.update({
    where: { id, organizationId: ctx.orgId },
    data: employeeData(data),
  })
  return toEmployee(row)
}

export async function softDeleteEmployee(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).employee.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Employee not found")
  await db(ctx).employee.update({ where: { id, organizationId: ctx.orgId }, data: { deletedAt: new Date() } })
}

// Attendance ------------------------------------------------------------------

export async function listAttendances(ctx: Ctx): Promise<AttendanceDto[]> {
  const rows = await db(ctx).attendance.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { date: "desc" },
    take: 200,
  })
  return rows.map(toAttendance)
}

export async function createAttendance(ctx: Ctx, data: CreateAttendanceInput): Promise<AttendanceDto> {
  const emp = await db(ctx).employee.findFirst({
    where: { id: data.employeeId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!emp) throw new Error("Employee not found in this organization")
  const row = await db(ctx).attendance.create({
    data: {
      organizationId: ctx.orgId,
      employeeId: data.employeeId,
      date: data.date,
      clockIn: data.clockIn ?? null,
      clockOut: data.clockOut ?? null,
      status: data.status,
    },
  })
  return toAttendance(row)
}

// Leave types -----------------------------------------------------------------

export async function listLeaveTypes(ctx: Ctx): Promise<LeaveTypeDto[]> {
  const rows = await db(ctx).leaveType.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { name: "asc" },
  })
  return rows.map(toLeaveType)
}

export async function createLeaveType(ctx: Ctx, data: CreateLeaveTypeInput): Promise<LeaveTypeDto> {
  const row = await db(ctx).leaveType.create({
    data: { organizationId: ctx.orgId, name: data.name, daysPerYear: data.daysPerYear },
  })
  return toLeaveType(row)
}

// Leave balances --------------------------------------------------------------

export async function listLeaveBalances(ctx: Ctx): Promise<LeaveBalanceDto[]> {
  const rows = await db(ctx).leaveBalance.findMany({ where: { organizationId: ctx.orgId } })
  return rows.map(toBalance)
}

export async function setLeaveBalance(ctx: Ctx, data: SetLeaveBalanceInput): Promise<LeaveBalanceDto> {
  const emp = await db(ctx).employee.findFirst({
    where: { id: data.employeeId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!emp) throw new Error("Employee not found in this organization")
  const row = await db(ctx).leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId: data.employeeId, leaveTypeId: data.leaveTypeId, year: data.year } },
    update: { entitled: data.entitled },
    create: {
      organizationId: ctx.orgId,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      year: data.year,
      entitled: data.entitled,
      used: 0,
    },
  })
  return toBalance(row)
}

// Leave requests --------------------------------------------------------------

export async function listLeaveRequests(ctx: Ctx): Promise<LeaveRequestDto[]> {
  const rows = await db(ctx).leaveRequest.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toLeave)
}

export async function findLeaveRequest(ctx: Ctx, id: string): Promise<LeaveRequestDto | null> {
  const row = await db(ctx).leaveRequest.findFirst({ where: { id, organizationId: ctx.orgId } })
  return row ? toLeave(row) : null
}

export async function createLeaveRequest(ctx: Ctx, data: CreateLeaveRequestInput): Promise<LeaveRequestDto> {
  const emp = await db(ctx).employee.findFirst({
    where: { id: data.employeeId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!emp) throw new Error("Employee not found in this organization")
  const row = await db(ctx).leaveRequest.create({
    data: {
      organizationId: ctx.orgId,
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      leaveTypeId: data.leaveTypeId ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason ?? null,
      status: "PENDING",
    },
  })
  return toLeave(row)
}

export async function setLeaveStatus(ctx: Ctx, id: string, status: LeaveStatus): Promise<LeaveRequestDto> {
  const row = await db(ctx).leaveRequest.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: leaveStatusIn[status] },
  })
  return toLeave(row)
}

// Payroll ---------------------------------------------------------------------

const payInclude = { components: true }

export async function listPayslips(ctx: Ctx): Promise<PayslipDto[]> {
  const rows = await db(ctx).payslip.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { period: "desc" },
    include: payInclude,
  })
  return rows.map(toPayslip)
}

export async function findPayslip(ctx: Ctx, id: string): Promise<PayslipDto | null> {
  const row = await db(ctx).payslip.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: payInclude,
  })
  return row ? toPayslip(row) : null
}

export async function createPayslip(
  ctx: Ctx,
  data: CreatePayslipInput,
  createdBy: string,
): Promise<PayslipDto> {
  const emp = await db(ctx).employee.findFirst({
    where: { id: data.employeeId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!emp) throw new Error("Employee not found in this organization")

  const gross = data.components.filter((c) => c.type === "earning").reduce((s, c) => s + c.amount, 0)
  const deductions = data.components.filter((c) => c.type === "deduction").reduce((s, c) => s + c.amount, 0)

  const row = await db(ctx).payslip.create({
    data: {
      organizationId: ctx.orgId,
      employeeId: data.employeeId,
      period: data.period,
      grossPay: gross,
      totalDeductions: deductions,
      netPay: gross - deductions,
      status: "DRAFT",
      createdBy,
      components: {
        create: data.components.map((c) => ({ type: compTypeIn[c.type], name: c.name, amount: c.amount })),
      },
    },
    include: payInclude,
  })
  return toPayslip(row)
}

export async function finalizePayslip(ctx: Ctx, id: string): Promise<PayslipDto> {
  const existing = await db(ctx).payslip.findFirst({
    where: { id, organizationId: ctx.orgId },
    select: { id: true },
  })
  if (!existing) throw new Error("Payslip not found")
  const row = await db(ctx).payslip.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: "FINALIZED" },
    include: payInclude,
  })
  return toPayslip(row)
}
