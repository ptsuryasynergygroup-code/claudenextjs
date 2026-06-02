import { z } from "zod"

export const AssetStatusSchema = z.enum(["active", "maintenance", "disposed"])
export type AssetStatus = z.infer<typeof AssetStatusSchema>

export const DepreciationMethodSchema = z.enum(["none", "straight_line"])
export type DepreciationMethod = z.infer<typeof DepreciationMethodSchema>

export const MaintenanceStatusSchema = z.enum(["scheduled", "done", "cancelled"])
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>

export const AssetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  acquisitionDate: z.date(),
  acquisitionCost: z.number().int(),
  usefulLifeMonths: z.number().int().nullable(),
  depreciationMethod: DepreciationMethodSchema,
  status: AssetStatusSchema,
  assignedToId: z.string().nullable(),
  createdAt: z.date(),
})
export type AssetDto = z.infer<typeof AssetSchema>

export const CreateAssetSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  acquisitionDate: z.coerce.date(),
  acquisitionCost: z.number().int().min(0).default(0),
  usefulLifeMonths: z.number().int().min(0).nullable().optional(),
  depreciationMethod: DepreciationMethodSchema.default("none"),
  status: AssetStatusSchema.default("active"),
  assignedToId: z.string().nullable().optional(),
})
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>

export const UpdateAssetSchema = CreateAssetSchema.partial()
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>

export const AssetMaintenanceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  assetId: z.string(),
  scheduledDate: z.date(),
  description: z.string().nullable(),
  cost: z.number().int().nullable(),
  status: MaintenanceStatusSchema,
  createdAt: z.date(),
})
export type AssetMaintenanceDto = z.infer<typeof AssetMaintenanceSchema>

export const CreateMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  scheduledDate: z.coerce.date(),
  description: z.string().nullable().optional(),
  cost: z.number().int().min(0).nullable().optional(),
})
export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema>

export const SetMaintenanceStatusSchema = z.object({ status: MaintenanceStatusSchema })
export type SetMaintenanceStatusInput = z.infer<typeof SetMaintenanceStatusSchema>
