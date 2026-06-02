import { z } from "zod"

export const AccountTypeSchema = z.enum(["asset", "liability", "equity", "revenue", "expense"])
export type AccountType = z.infer<typeof AccountTypeSchema>

export const TransactionTypeSchema = z.enum(["debit", "credit"])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const InvoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue", "void"])
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>

export const AccountSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  parentId: z.string().nullable(),
  createdAt: z.date(),
})
export type AccountDto = z.infer<typeof AccountSchema>

export const CreateAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: AccountTypeSchema,
  parentId: z.string().nullable().optional(),
})
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>

export const UpdateAccountSchema = CreateAccountSchema.partial()
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>

export const TransactionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  accountId: z.string(),
  amount: z.number().int(),
  type: TransactionTypeSchema,
  transactionDate: z.date(),
  description: z.string().nullable(),
  reference: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type TransactionDto = z.infer<typeof TransactionSchema>

export const CreateTransactionSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().int(),
  type: TransactionTypeSchema,
  transactionDate: z.coerce.date(),
  description: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
})
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

export const InvoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  number: z.string(),
  customerName: z.string(),
  amount: z.number().int(),
  status: InvoiceStatusSchema,
  issueDate: z.date(),
  dueDate: z.date().nullable(),
  createdAt: z.date(),
})
export type InvoiceDto = z.infer<typeof InvoiceSchema>

export const CreateInvoiceSchema = z.object({
  number: z.string().min(1),
  customerName: z.string().min(1),
  amount: z.number().int().min(0).default(0),
  status: InvoiceStatusSchema.default("draft"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
})
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial()
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>

export const PaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceId: z.string().nullable(),
  amount: z.number().int(),
  method: z.string(),
  paymentDate: z.date(),
  reference: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type PaymentDto = z.infer<typeof PaymentSchema>

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().nullable().optional(),
  amount: z.number().int().min(0),
  method: z.string().default("transfer"),
  paymentDate: z.coerce.date(),
  reference: z.string().nullable().optional(),
})
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>
