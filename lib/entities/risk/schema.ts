import { z } from "zod"

export const RiskLevelSchema = z.enum(["low", "medium", "high"])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

export const RiskStatusSchema = z.enum(["open", "mitigated", "closed"])
export type RiskStatus = z.infer<typeof RiskStatusSchema>

export const RiskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  likelihood: RiskLevelSchema,
  impact: RiskLevelSchema,
  status: RiskStatusSchema,
  ownerId: z.string().nullable(),
  createdAt: z.date(),
})
export type RiskDto = z.infer<typeof RiskSchema>

export const CreateRiskSchema = z.object({
  title: z.string().min(1),
  category: z.string().nullable().optional(),
  likelihood: RiskLevelSchema.default("medium"),
  impact: RiskLevelSchema.default("medium"),
  ownerId: z.string().nullable().optional(),
})
export type CreateRiskInput = z.infer<typeof CreateRiskSchema>

export const UpdateRiskSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  likelihood: RiskLevelSchema.optional(),
  impact: RiskLevelSchema.optional(),
  status: RiskStatusSchema.optional(),
  ownerId: z.string().nullable().optional(),
})
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>

export const RiskControlSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  riskId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  effectiveness: RiskLevelSchema,
  createdAt: z.date(),
})
export type RiskControlDto = z.infer<typeof RiskControlSchema>

export const CreateRiskControlSchema = z.object({
  riskId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  effectiveness: RiskLevelSchema.default("medium"),
})
export type CreateRiskControlInput = z.infer<typeof CreateRiskControlSchema>
