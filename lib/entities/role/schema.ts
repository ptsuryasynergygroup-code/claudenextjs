// Zod schemas for Role + Permission + role-user assignment.

import { z } from "zod"
import { StatusSchema } from "@/lib/entities/organization/schema"

export const PermissionActionSchema = z.enum([
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "suspend",
  "grant",
  "revoke",
])
export type PermissionAction = z.infer<typeof PermissionActionSchema>

export const RoleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  userCount: z.number().int(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type RoleDto = z.infer<typeof RoleSchema>

export const PermissionSchema = z.object({
  id: z.string(),
  code: z.string(), // "module.action"
  module: z.string(),
  action: z.string(),
  description: z.string(),
})
export type PermissionDto = z.infer<typeof PermissionSchema>

export const CreateRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).default([]),
  status: StatusSchema.default("active"),
})
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
  status: StatusSchema.optional(),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>

export const AssignUserRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
})
export type AssignUserRoleInput = z.infer<typeof AssignUserRoleSchema>
