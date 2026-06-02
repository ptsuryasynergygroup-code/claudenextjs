import { z } from "zod"

export const QuotationStatusSchema = z.enum(["draft", "sent", "accepted", "rejected"])
export type QuotationStatus = z.infer<typeof QuotationStatusSchema>

export const SalesOrderStatusSchema = z.enum(["draft", "confirmed", "fulfilled", "cancelled"])
export type SalesOrderStatus = z.infer<typeof SalesOrderStatusSchema>

export const QuotationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  number: z.string(),
  customerId: z.string(),
  amount: z.number().int(),
  status: QuotationStatusSchema,
  validUntil: z.date().nullable(),
  createdAt: z.date(),
})
export type QuotationDto = z.infer<typeof QuotationSchema>

export const CreateQuotationSchema = z.object({
  number: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().int().min(0).default(0),
  validUntil: z.coerce.date().nullable().optional(),
})
export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>

export const UpdateQuotationStatusSchema = z.object({ status: QuotationStatusSchema })
export type UpdateQuotationStatusInput = z.infer<typeof UpdateQuotationStatusSchema>

export const SalesOrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  number: z.string(),
  customerId: z.string(),
  quotationId: z.string().nullable(),
  amount: z.number().int(),
  status: SalesOrderStatusSchema,
  createdAt: z.date(),
})
export type SalesOrderDto = z.infer<typeof SalesOrderSchema>

export const CreateSalesOrderSchema = z.object({
  number: z.string().min(1),
  customerId: z.string().min(1),
  quotationId: z.string().nullable().optional(),
  amount: z.number().int().min(0).default(0),
})
export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderSchema>

export const UpdateSalesOrderStatusSchema = z.object({ status: SalesOrderStatusSchema })
export type UpdateSalesOrderStatusInput = z.infer<typeof UpdateSalesOrderStatusSchema>
