import { z } from "zod"

export const EmploymentStatusSchema = z.enum(["permanent", "contract", "probation", "terminated"])
export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>

export const LeaveStatusSchema = z.enum(["pending", "approved", "rejected"])
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>

export const GenderSchema = z.enum(["male", "female"])
export type Gender = z.infer<typeof GenderSchema>

// -----------------------------------------------------------------------------
// Employee
// -----------------------------------------------------------------------------

export const EmployeeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string().nullable(),
  employeeCode: z.string(),
  fullName: z.string(),
  nik: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  gender: z.string().nullable(),
  maritalStatus: z.string().nullable(),
  religion: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  personalEmail: z.string().nullable(),
  branchId: z.string().nullable(),
  departmentId: z.string().nullable(),
  positionId: z.string().nullable(),
  joinDate: z.date(),
  endDate: z.date().nullable(),
  employmentStatus: EmploymentStatusSchema,
  basicSalary: z.number().int().nullable(),
  bankName: z.string().nullable(),
  bankAccount: z.string().nullable(),
  npwp: z.string().nullable(),
  createdAt: z.date(),
})
export type EmployeeDto = z.infer<typeof EmployeeSchema>

const optStr = z.string().trim().min(1).nullable().optional()

export const CreateEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  fullName: z.string().min(1),
  nik: optStr,
  dateOfBirth: z.coerce.date().nullable().optional(),
  gender: GenderSchema.nullable().optional(),
  maritalStatus: optStr,
  religion: optStr,
  address: optStr,
  phone: optStr,
  personalEmail: z.string().email().nullable().optional(),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  positionId: z.string().nullable().optional(),
  joinDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  employmentStatus: EmploymentStatusSchema.default("permanent"),
  basicSalary: z.number().int().min(0).nullable().optional(),
  bankName: optStr,
  bankAccount: optStr,
  npwp: optStr,
  userId: z.string().nullable().optional(),
})
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>

// -----------------------------------------------------------------------------
// Attendance
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Leave (types, balances, requests)
// -----------------------------------------------------------------------------

export const LeaveTypeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  daysPerYear: z.number().int(),
  createdAt: z.date(),
})
export type LeaveTypeDto = z.infer<typeof LeaveTypeSchema>

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(1),
  daysPerYear: z.number().int().min(0).default(12),
})
export type CreateLeaveTypeInput = z.infer<typeof CreateLeaveTypeSchema>

export const LeaveBalanceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  leaveTypeId: z.string(),
  year: z.number().int(),
  entitled: z.number().int(),
  used: z.number().int(),
})
export type LeaveBalanceDto = z.infer<typeof LeaveBalanceSchema>

export const SetLeaveBalanceSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  year: z.number().int(),
  entitled: z.number().int().min(0),
})
export type SetLeaveBalanceInput = z.infer<typeof SetLeaveBalanceSchema>

export const LeaveRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  leaveType: z.string(),
  leaveTypeId: z.string().nullable(),
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
  leaveTypeId: z.string().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().nullable().optional(),
})
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>

export const DecideLeaveSchema = z.object({ status: z.enum(["approved", "rejected"]) })
export type DecideLeaveInput = z.infer<typeof DecideLeaveSchema>

// -----------------------------------------------------------------------------
// Payroll
// -----------------------------------------------------------------------------

export const PayslipStatusSchema = z.enum(["draft", "finalized"])
export type PayslipStatus = z.infer<typeof PayslipStatusSchema>

export const PayslipComponentTypeSchema = z.enum(["earning", "deduction"])
export type PayslipComponentType = z.infer<typeof PayslipComponentTypeSchema>

export const PayslipComponentSchema = z.object({
  id: z.string(),
  payslipId: z.string(),
  type: PayslipComponentTypeSchema,
  name: z.string(),
  amount: z.number().int(),
})
export type PayslipComponentDto = z.infer<typeof PayslipComponentSchema>

export const PayslipSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  period: z.string(),
  grossPay: z.number().int(),
  totalDeductions: z.number().int(),
  netPay: z.number().int(),
  status: PayslipStatusSchema,
  createdAt: z.date(),
  components: z.array(PayslipComponentSchema),
})
export type PayslipDto = z.infer<typeof PayslipSchema>

export const CreatePayslipSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
  components: z
    .array(
      z.object({
        type: PayslipComponentTypeSchema,
        name: z.string().min(1),
        amount: z.number().int().min(0),
      }),
    )
    .min(1),
})
export type CreatePayslipInput = z.infer<typeof CreatePayslipSchema>
