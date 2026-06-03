import { z } from "zod"
import { StatusSchema } from "@/lib/entities/organization/schema"

export const PrStatusSchema = z.enum(["draft", "pending", "approved", "rejected"])
export type PrStatus = z.infer<typeof PrStatusSchema>

export const PoStatusSchema = z.enum(["draft", "sent", "received", "closed", "cancelled"])
export type PoStatus = z.infer<typeof PoStatusSchema>

export const VendorSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  taxNumber: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  rating: z.number().int(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type VendorDto = z.infer<typeof VendorSchema>

export const VendorEvaluationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  vendorId: z.string(),
  score: z.number().int(),
  notes: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type VendorEvaluationDto = z.infer<typeof VendorEvaluationSchema>

export const CreateVendorEvaluationSchema = z.object({
  vendorId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  notes: z.string().nullable().optional(),
})
export type CreateVendorEvaluationInput = z.infer<typeof CreateVendorEvaluationSchema>

export const CreateVendorSchema = z.object({
  name: z.string().min(1),
  taxNumber: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  status: StatusSchema.default("active"),
})
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>

export const UpdateVendorSchema = CreateVendorSchema.partial()
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>

export const LineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  amount: z.number().int(),
})
export type LineItemDto = z.infer<typeof LineItemSchema>

export const PoLineItemSchema = LineItemSchema.extend({ receivedQty: z.number().int() })
export type PoLineItemDto = z.infer<typeof PoLineItemSchema>

const createItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().int().min(0).default(0),
})

export const PurchaseRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  number: z.string(),
  requesterId: z.string(),
  status: PrStatusSchema,
  totalAmount: z.number().int(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  items: z.array(LineItemSchema),
})
export type PurchaseRequestDto = z.infer<typeof PurchaseRequestSchema>

export const CreatePurchaseRequestSchema = z.object({
  number: z.string().min(1),
  notes: z.string().nullable().optional(),
  items: z.array(createItemSchema).min(1),
})
export type CreatePurchaseRequestInput = z.infer<typeof CreatePurchaseRequestSchema>

export const DecidePurchaseRequestSchema = z.object({ status: z.enum(["approved", "rejected"]) })
export type DecidePurchaseRequestInput = z.infer<typeof DecidePurchaseRequestSchema>

export const PurchaseOrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  number: z.string(),
  vendorId: z.string(),
  purchaseRequestId: z.string().nullable(),
  status: PoStatusSchema,
  totalAmount: z.number().int(),
  createdAt: z.date(),
  items: z.array(PoLineItemSchema),
})
export type PurchaseOrderDto = z.infer<typeof PurchaseOrderSchema>

export const CreatePurchaseOrderSchema = z.object({
  number: z.string().min(1),
  vendorId: z.string().min(1),
  purchaseRequestId: z.string().nullable().optional(),
  items: z.array(createItemSchema).min(1),
})
export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>

export const UpdatePurchaseOrderStatusSchema = z.object({ status: PoStatusSchema })
export type UpdatePurchaseOrderStatusInput = z.infer<typeof UpdatePurchaseOrderStatusSchema>

export const ReceivePurchaseOrderSchema = z.object({
  items: z.array(z.object({ itemId: z.string(), receivedQty: z.number().int().min(0) })).min(1),
})
export type ReceivePurchaseOrderInput = z.infer<typeof ReceivePurchaseOrderSchema>
