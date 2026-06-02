// Zod schemas for the Organization domain (Org, Branch, Department, Position).
// These are the source of truth for shape validation at every service boundary.

import { z } from "zod"

// -----------------------------------------------------------------------------
// Shared
// -----------------------------------------------------------------------------

export const StatusSchema = z.enum(["active", "inactive"])
export type Status = z.infer<typeof StatusSchema>

export const OrgStatusSchema = z.enum(["active", "inactive", "suspended"])
export type OrgStatus = z.infer<typeof OrgStatusSchema>

// -----------------------------------------------------------------------------
// Organization
// -----------------------------------------------------------------------------

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  taxNumber: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  website: z.string().nullable(),
  status: OrgStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type OrganizationDto = z.infer<typeof OrganizationSchema>

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  taxNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
  status: OrgStatusSchema.optional(),
})
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>

// -----------------------------------------------------------------------------
// Branch
// -----------------------------------------------------------------------------

export const BranchSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  manager: z.string().nullable(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type BranchDto = z.infer<typeof BranchSchema>

export const CreateBranchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  manager: z.string().nullable().optional(),
  status: StatusSchema.default("active"),
})
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>

export const UpdateBranchSchema = CreateBranchSchema.partial()
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>

// -----------------------------------------------------------------------------
// Department
// -----------------------------------------------------------------------------

export const DepartmentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  branchId: z.string().nullable(),
  parentId: z.string().nullable(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  headCount: z.number().int(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type DepartmentDto = z.infer<typeof DepartmentSchema>

export const CreateDepartmentSchema = z.object({
  branchId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  headCount: z.number().int().min(0).default(0),
  status: StatusSchema.default("active"),
})
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial()
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>

// -----------------------------------------------------------------------------
// Position
// -----------------------------------------------------------------------------

export const PositionSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  name: z.string(),
  code: z.string(),
  level: z.number().int(),
  description: z.string().nullable(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type PositionDto = z.infer<typeof PositionSchema>

export const CreatePositionSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  level: z.number().int().min(1).default(1),
  description: z.string().nullable().optional(),
  status: StatusSchema.default("active"),
})
export type CreatePositionInput = z.infer<typeof CreatePositionSchema>

export const UpdatePositionSchema = CreatePositionSchema.partial()
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>
