// Zod schemas for the User domain.

import { z } from "zod"

export const UserStatusSchema = z.enum(["active", "inactive", "suspended"])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const UserSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  branchId: z.string().nullable(),
  departmentId: z.string().nullable(),
  positionId: z.string().nullable(),
  employeeId: z.string().nullable(), // surfaced under v0 name (DB column: employee_code)
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatar: z.string().nullable(),
  status: UserStatusSchema,
  lastLogin: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type UserDto = z.infer<typeof UserSchema>

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  positionId: z.string().nullable().optional(),
  employeeId: z.string().nullable().optional(),
  password: z.string().min(8).optional(), // optional at create — admin can invite via email
  status: UserStatusSchema.default("active"),
})
export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = CreateUserSchema.omit({ password: true }).partial()
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export const ChangeUserStatusSchema = z.object({
  status: UserStatusSchema,
})
export type ChangeUserStatusInput = z.infer<typeof ChangeUserStatusSchema>
