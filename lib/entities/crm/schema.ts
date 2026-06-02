import { z } from "zod"
import { StatusSchema } from "@/lib/entities/organization/schema"

export const LeadStatusSchema = z.enum(["new", "contacted", "qualified", "lost"])
export type LeadStatus = z.infer<typeof LeadStatusSchema>

export const OpportunityStageSchema = z.enum([
  "prospecting",
  "proposal",
  "negotiation",
  "won",
  "lost",
])
export type OpportunityStage = z.infer<typeof OpportunityStageSchema>

export const CustomerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type CustomerDto = z.infer<typeof CustomerSchema>

export const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  status: StatusSchema.default("active"),
})
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>

export const UpdateCustomerSchema = CreateCustomerSchema.partial()
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>

export const LeadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  source: z.string().nullable(),
  status: LeadStatusSchema,
  ownerId: z.string().nullable(),
  createdAt: z.date(),
})
export type LeadDto = z.infer<typeof LeadSchema>

export const CreateLeadSchema = z.object({
  name: z.string().min(1),
  source: z.string().nullable().optional(),
  status: LeadStatusSchema.default("new"),
  ownerId: z.string().nullable().optional(),
})
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const UpdateLeadSchema = CreateLeadSchema.partial()
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

export const OpportunitySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  customerId: z.string().nullable(),
  leadId: z.string().nullable(),
  stage: OpportunityStageSchema,
  amount: z.number().int(),
  ownerId: z.string().nullable(),
  createdAt: z.date(),
})
export type OpportunityDto = z.infer<typeof OpportunitySchema>

export const CreateOpportunitySchema = z.object({
  name: z.string().min(1),
  customerId: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
  stage: OpportunityStageSchema.default("prospecting"),
  amount: z.number().int().min(0).default(0),
  ownerId: z.string().nullable().optional(),
})
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial()
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>
