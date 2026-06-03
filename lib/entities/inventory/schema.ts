import { z } from "zod"
import { StatusSchema } from "@/lib/entities/organization/schema"

export const StockMovementTypeSchema = z.enum(["in", "out", "adjust"])
export type StockMovementType = z.infer<typeof StockMovementTypeSchema>

export const ProductSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  unit: z.string(),
  barcode: z.string().nullable(),
  costPrice: z.number().int(),
  sellPrice: z.number().int(),
  minStock: z.number().int(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type ProductDto = z.infer<typeof ProductSchema>

export const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  unit: z.string().default("pcs"),
  barcode: z.string().nullable().optional(),
  costPrice: z.number().int().min(0).default(0),
  sellPrice: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  status: StatusSchema.default("active"),
})
export type CreateProductInput = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = CreateProductSchema.partial()
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

export const WarehouseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  location: z.string().nullable(),
  status: StatusSchema,
  createdAt: z.date(),
})
export type WarehouseDto = z.infer<typeof WarehouseSchema>

export const CreateWarehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  location: z.string().nullable().optional(),
  status: StatusSchema.default("active"),
})
export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>

export const StockSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int(),
})
export type StockDto = z.infer<typeof StockSchema>

export const StockMovementSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  type: StockMovementTypeSchema,
  quantity: z.number().int(),
  reference: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type StockMovementDto = z.infer<typeof StockMovementSchema>

export const CreateStockMovementSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  type: StockMovementTypeSchema,
  quantity: z.number().int(),
  reference: z.string().nullable().optional(),
})
export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>

export const StockTransferSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productId: z.string(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  quantity: z.number().int(),
  reference: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type StockTransferDto = z.infer<typeof StockTransferSchema>

export const CreateStockTransferSchema = z
  .object({
    productId: z.string().min(1),
    fromWarehouseId: z.string().min(1),
    toWarehouseId: z.string().min(1),
    quantity: z.number().int().min(1),
    reference: z.string().nullable().optional(),
  })
  .refine((v) => v.fromWarehouseId !== v.toWarehouseId, {
    message: "Source and destination warehouses must differ",
  })
export type CreateStockTransferInput = z.infer<typeof CreateStockTransferSchema>
