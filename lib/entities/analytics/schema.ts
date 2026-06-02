import { z } from "zod"

export const KpiSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  metric: z.string().nullable(),
  target: z.number().int(),
  current: z.number().int(),
  unit: z.string().nullable(),
  period: z.string().nullable(),
  createdAt: z.date(),
})
export type KpiDto = z.infer<typeof KpiSchema>

export const CreateKpiSchema = z.object({
  name: z.string().min(1),
  metric: z.string().nullable().optional(),
  target: z.number().int().default(0),
  current: z.number().int().default(0),
  unit: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
})
export type CreateKpiInput = z.infer<typeof CreateKpiSchema>

export const UpdateKpiSchema = CreateKpiSchema.partial()
export type UpdateKpiInput = z.infer<typeof UpdateKpiSchema>
