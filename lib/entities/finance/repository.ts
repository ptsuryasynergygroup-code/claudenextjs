import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type AccountDto,
  type TransactionDto,
  type InvoiceDto,
  type PaymentDto,
  type AccountType,
  type TransactionType,
  type InvoiceStatus,
  type CreateAccountInput,
  type UpdateAccountInput,
  type CreateTransactionInput,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type CreatePaymentInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const acctTypeOut: Record<string, AccountType> = {
  ASSET: "asset",
  LIABILITY: "liability",
  EQUITY: "equity",
  REVENUE: "revenue",
  EXPENSE: "expense",
}
const acctTypeIn: Record<AccountType, "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"> = {
  asset: "ASSET",
  liability: "LIABILITY",
  equity: "EQUITY",
  revenue: "REVENUE",
  expense: "EXPENSE",
}
const txTypeOut: Record<string, TransactionType> = { DEBIT: "debit", CREDIT: "credit" }
const txTypeIn: Record<TransactionType, "DEBIT" | "CREDIT"> = { debit: "DEBIT", credit: "CREDIT" }
const invStatusOut: Record<string, InvoiceStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  PAID: "paid",
  OVERDUE: "overdue",
  VOID: "void",
}
const invStatusIn: Record<InvoiceStatus, "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID"> = {
  draft: "DRAFT",
  sent: "SENT",
  paid: "PAID",
  overdue: "OVERDUE",
  void: "VOID",
}

type AcctRow = Prisma.LedgerAccountGetPayload<object>
type TxRow = Prisma.TransactionGetPayload<object>
type InvRow = Prisma.InvoiceGetPayload<object>
type PayRow = Prisma.PaymentGetPayload<object>

function toAccount(a: AcctRow): AccountDto {
  return {
    id: a.id,
    organizationId: a.organizationId,
    code: a.code,
    name: a.name,
    type: acctTypeOut[a.type] ?? "asset",
    parentId: a.parentId,
    createdAt: a.createdAt,
  }
}
function toTransaction(t: TxRow): TransactionDto {
  return {
    id: t.id,
    organizationId: t.organizationId,
    accountId: t.accountId,
    amount: t.amount,
    type: txTypeOut[t.type] ?? "debit",
    transactionDate: t.transactionDate,
    description: t.description,
    reference: t.reference,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
  }
}
function toInvoice(i: InvRow): InvoiceDto {
  return {
    id: i.id,
    organizationId: i.organizationId,
    number: i.number,
    customerName: i.customerName,
    amount: i.amount,
    status: invStatusOut[i.status] ?? "draft",
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    createdAt: i.createdAt,
  }
}
function toPayment(p: PayRow): PaymentDto {
  return {
    id: p.id,
    organizationId: p.organizationId,
    invoiceId: p.invoiceId,
    amount: p.amount,
    method: p.method,
    paymentDate: p.paymentDate,
    reference: p.reference,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
  }
}

export async function listAccounts(ctx: Ctx): Promise<AccountDto[]> {
  const rows = await db(ctx).ledgerAccount.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { code: "asc" },
  })
  return rows.map(toAccount)
}

export async function findAccount(ctx: Ctx, id: string): Promise<AccountDto | null> {
  const row = await db(ctx).ledgerAccount.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toAccount(row) : null
}

export async function createAccount(ctx: Ctx, data: CreateAccountInput): Promise<AccountDto> {
  const row = await db(ctx).ledgerAccount.create({
    data: {
      organizationId: ctx.orgId,
      code: data.code,
      name: data.name,
      type: acctTypeIn[data.type],
      parentId: data.parentId ?? null,
    },
  })
  return toAccount(row)
}

export async function updateAccount(
  ctx: Ctx,
  id: string,
  data: UpdateAccountInput,
): Promise<AccountDto> {
  const row = await db(ctx).ledgerAccount.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      code: data.code,
      name: data.name,
      type: data.type ? acctTypeIn[data.type] : undefined,
      parentId: data.parentId,
    },
  })
  return toAccount(row)
}

export async function softDeleteAccount(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).ledgerAccount.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Account not found")
  await db(ctx).ledgerAccount.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listTransactions(ctx: Ctx): Promise<TransactionDto[]> {
  const rows = await db(ctx).transaction.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { transactionDate: "desc" },
    take: 200,
  })
  return rows.map(toTransaction)
}

export async function createTransaction(
  ctx: Ctx,
  data: CreateTransactionInput,
  createdBy: string,
): Promise<TransactionDto> {
  const acct = await db(ctx).ledgerAccount.findFirst({
    where: { id: data.accountId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!acct) throw new Error("Account not found in this organization")
  const row = await db(ctx).transaction.create({
    data: {
      organizationId: ctx.orgId,
      accountId: data.accountId,
      amount: data.amount,
      type: txTypeIn[data.type],
      transactionDate: data.transactionDate,
      description: data.description ?? null,
      reference: data.reference ?? null,
      createdBy,
    },
  })
  return toTransaction(row)
}

export async function listInvoices(ctx: Ctx): Promise<InvoiceDto[]> {
  const rows = await db(ctx).invoice.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { issueDate: "desc" },
  })
  return rows.map(toInvoice)
}

export async function findInvoice(ctx: Ctx, id: string): Promise<InvoiceDto | null> {
  const row = await db(ctx).invoice.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toInvoice(row) : null
}

export async function createInvoice(ctx: Ctx, data: CreateInvoiceInput): Promise<InvoiceDto> {
  const row = await db(ctx).invoice.create({
    data: {
      organizationId: ctx.orgId,
      number: data.number,
      customerName: data.customerName,
      amount: data.amount,
      status: invStatusIn[data.status],
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
    },
  })
  return toInvoice(row)
}

export async function updateInvoice(
  ctx: Ctx,
  id: string,
  data: UpdateInvoiceInput,
): Promise<InvoiceDto> {
  const row = await db(ctx).invoice.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      number: data.number,
      customerName: data.customerName,
      amount: data.amount,
      status: data.status ? invStatusIn[data.status] : undefined,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
    },
  })
  return toInvoice(row)
}

export async function softDeleteInvoice(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).invoice.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Invoice not found")
  await db(ctx).invoice.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listPayments(ctx: Ctx): Promise<PaymentDto[]> {
  const rows = await db(ctx).payment.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { paymentDate: "desc" },
    take: 200,
  })
  return rows.map(toPayment)
}

export async function createPayment(
  ctx: Ctx,
  data: CreatePaymentInput,
  createdBy: string,
): Promise<PaymentDto> {
  if (data.invoiceId) {
    const inv = await db(ctx).invoice.findFirst({
      where: { id: data.invoiceId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    })
    if (!inv) throw new Error("Invoice not found in this organization")
  }
  const row = await db(ctx).payment.create({
    data: {
      organizationId: ctx.orgId,
      invoiceId: data.invoiceId ?? null,
      amount: data.amount,
      method: data.method,
      paymentDate: data.paymentDate,
      reference: data.reference ?? null,
      createdBy,
    },
  })
  return toPayment(row)
}
