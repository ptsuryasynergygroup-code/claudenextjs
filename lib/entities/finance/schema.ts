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

// -----------------------------------------------------------------------------
// Journal entries (double-entry)
// -----------------------------------------------------------------------------

export const JournalStatusSchema = z.enum(["draft", "posted"])
export type JournalStatus = z.infer<typeof JournalStatusSchema>

export const JournalLineSchema = z.object({
  id: z.string(),
  journalEntryId: z.string(),
  accountId: z.string(),
  debit: z.number().int(),
  credit: z.number().int(),
  description: z.string().nullable(),
})
export type JournalLineDto = z.infer<typeof JournalLineSchema>

export const JournalEntrySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entryDate: z.date(),
  reference: z.string().nullable(),
  memo: z.string().nullable(),
  status: JournalStatusSchema,
  createdAt: z.date(),
  lines: z.array(JournalLineSchema),
})
export type JournalEntryDto = z.infer<typeof JournalEntrySchema>

export const CreateJournalEntrySchema = z
  .object({
    entryDate: z.coerce.date(),
    reference: z.string().nullable().optional(),
    memo: z.string().nullable().optional(),
    lines: z
      .array(
        z.object({
          accountId: z.string().min(1),
          debit: z.number().int().min(0).default(0),
          credit: z.number().int().min(0).default(0),
          description: z.string().nullable().optional(),
        }),
      )
      .min(2),
  })
  .refine(
    (v) => {
      const d = v.lines.reduce((s, l) => s + l.debit, 0)
      const c = v.lines.reduce((s, l) => s + l.credit, 0)
      return d === c && d > 0
    },
    { message: "Total debit must equal total credit and be greater than zero" },
  )
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>

// -----------------------------------------------------------------------------
// Budget (feature: finance.budget)
// -----------------------------------------------------------------------------

export const BudgetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  accountId: z.string(),
  period: z.string(),
  amount: z.number().int(),
})
export type BudgetDto = z.infer<typeof BudgetSchema>

export const SetBudgetSchema = z.object({
  accountId: z.string().min(1),
  period: z.string().regex(/^\d{4}(-\d{2})?$/, "Use YYYY or YYYY-MM"),
  amount: z.number().int().min(0),
})
export type SetBudgetInput = z.infer<typeof SetBudgetSchema>
