import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type EmployeeDto,
  type AttendanceDto,
  type LeaveRequestDto,
  type EmploymentStatus,
  type LeaveStatus,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type CreateAttendanceInput,
  type CreateLeaveRequestInput,
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

type EmpRow = Prisma.EmployeeGetPayload<object>
type AttRow = Prisma.AttendanceGetPayload<object>
type LeaveRow = Prisma.LeaveRequestGetPayload<object>

function toEmployee(e: EmpRow): EmployeeDto {
  return {
    id: e.id,
    organizationId: e.organizationId,
    userId: e.userId,
    employeeCode: e.employeeCode,
    joinDate: e.joinDate,
    employmentStatus: empStatusOut[e.employmentStatus] ?? "permanent",
    basicSalary: e.basicSalary,
    createdAt: e.createdAt,
  }
}

function toAttendance(a: AttRow): AttendanceDto {
  return {
    id: a.id,
    organizationId: a.organizationId,
    employeeId: a.employeeId,
    date: a.date,
    clockIn: a.clockIn,
    clockOut: a.clockOut,
    status: a.status,
    createdAt: a.createdAt,
  }
}

function toLeave(l: LeaveRow): LeaveRequestDto {
  return {
    id: l.id,
    organizationId: l.organizationId,
    employeeId: l.employeeId,
    leaveType: l.leaveType,
    startDate: l.startDate,
    endDate: l.endDate,
    reason: l.reason,
    status: leaveStatusOut[l.status] ?? "pending",
    createdAt: l.createdAt,
  }
}

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

export async function createEmployee(ctx: Ctx, data: CreateEmployeeInput): Promise<EmployeeDto> {
  const row = await db(ctx).employee.create({
    data: {
      organizationId: ctx.orgId,
      userId: data.userId ?? null,
      employeeCode: data.employeeCode,
      joinDate: data.joinDate,
      employmentStatus: empStatusIn[data.employmentStatus],
      basicSalary: data.basicSalary ?? null,
    },
  })
  return toEmployee(row)
}

export async function updateEmployee(
  ctx: Ctx,
  id: string,
  data: UpdateEmployeeInput,
): Promise<EmployeeDto> {
  const row = await db(ctx).employee.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      userId: data.userId,
      employeeCode: data.employeeCode,
      joinDate: data.joinDate,
      employmentStatus: data.employmentStatus ? empStatusIn[data.employmentStatus] : undefined,
      basicSalary: data.basicSalary,
    },
  })
  return toEmployee(row)
}

export async function softDeleteEmployee(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).employee.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Employee not found")
  await db(ctx).employee.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listAttendances(ctx: Ctx): Promise<AttendanceDto[]> {
  const rows = await db(ctx).attendance.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { date: "desc" },
    take: 200,
  })
  return rows.map(toAttendance)
}

export async function createAttendance(
  ctx: Ctx,
  data: CreateAttendanceInput,
): Promise<AttendanceDto> {
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

export async function listLeaveRequests(ctx: Ctx): Promise<LeaveRequestDto[]> {
  const rows = await db(ctx).leaveRequest.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toLeave)
}

export async function findLeaveRequest(ctx: Ctx, id: string): Promise<LeaveRequestDto | null> {
  const row = await db(ctx).leaveRequest.findFirst({
    where: { id, organizationId: ctx.orgId },
  })
  return row ? toLeave(row) : null
}

export async function createLeaveRequest(
  ctx: Ctx,
  data: CreateLeaveRequestInput,
): Promise<LeaveRequestDto> {
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
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason ?? null,
      status: "PENDING",
    },
  })
  return toLeave(row)
}

export async function setLeaveStatus(
  ctx: Ctx,
  id: string,
  status: LeaveStatus,
): Promise<LeaveRequestDto> {
  const row = await db(ctx).leaveRequest.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: leaveStatusIn[status] },
  })
  return toLeave(row)
}
