import { z } from "zod"

export const EmploymentStatusSchema = z.enum(["permanent", "contract", "probation", "terminated"])
export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>

export const LeaveStatusSchema = z.enum(["pending", "approved", "rejected"])
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>

export const EmployeeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string().nullable(),
  employeeCode: z.string(),
  joinDate: z.date(),
  employmentStatus: EmploymentStatusSchema,
  basicSalary: z.number().int().nullable(),
  createdAt: z.date(),
})
export type EmployeeDto = z.infer<typeof EmployeeSchema>

export const CreateEmployeeSchema = z.object({
  userId: z.string().nullable().optional(),
  employeeCode: z.string().min(1),
  joinDate: z.coerce.date(),
  employmentStatus: EmploymentStatusSchema.default("permanent"),
  basicSalary: z.number().int().min(0).nullable().optional(),
})
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>

export const AttendanceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  date: z.date(),
  clockIn: z.date().nullable(),
  clockOut: z.date().nullable(),
  status: z.string(),
  createdAt: z.date(),
})
export type AttendanceDto = z.infer<typeof AttendanceSchema>

export const CreateAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.coerce.date(),
  clockIn: z.coerce.date().nullable().optional(),
  clockOut: z.coerce.date().nullable().optional(),
  status: z.string().default("present"),
})
export type CreateAttendanceInput = z.infer<typeof CreateAttendanceSchema>

export const LeaveRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  leaveType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().nullable(),
  status: LeaveStatusSchema,
  createdAt: z.date(),
})
export type LeaveRequestDto = z.infer<typeof LeaveRequestSchema>

export const CreateLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().nullable().optional(),
})
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>

export const DecideLeaveSchema = z.object({ status: z.enum(["approved", "rejected"]) })
export type DecideLeaveInput = z.infer<typeof DecideLeaveSchema>
