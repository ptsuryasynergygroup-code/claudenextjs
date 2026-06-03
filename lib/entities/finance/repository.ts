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
  type JournalEntryDto,
  type JournalStatus,
  type BudgetDto,
  type CreateJournalEntryInput,
  type SetBudgetInput,
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

// Journal entries -------------------------------------------------------------

const journalStatusOut: Record<string, JournalStatus> = { DRAFT: "draft", POSTED: "posted" }

const journalInclude = { lines: true }
type JournalRow = Prisma.JournalEntryGetPayload<{ include: typeof journalInclude }>

function toJournal(j: JournalRow): JournalEntryDto {
  return {
    id: j.id,
    organizationId: j.organizationId,
    entryDate: j.entryDate,
    reference: j.reference,
    memo: j.memo,
    status: journalStatusOut[j.status] ?? "draft",
    createdAt: j.createdAt,
    lines: j.lines.map((l) => ({
      id: l.id,
      journalEntryId: l.journalEntryId,
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      description: l.description,
    })),
  }
}

export async function listJournalEntries(ctx: Ctx): Promise<JournalEntryDto[]> {
  const rows = await db(ctx).journalEntry.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { entryDate: "desc" },
    include: journalInclude,
    take: 200,
  })
  return rows.map(toJournal)
}

export async function findJournalEntry(ctx: Ctx, id: string): Promise<JournalEntryDto | null> {
  const row = await db(ctx).journalEntry.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: journalInclude,
  })
  return row ? toJournal(row) : null
}

export async function createJournalEntry(
  ctx: Ctx,
  data: CreateJournalEntryInput,
  createdBy: string,
): Promise<JournalEntryDto> {
  const accountIds = Array.from(new Set(data.lines.map((l) => l.accountId)))
  const count = await db(ctx).ledgerAccount.count({
    where: { id: { in: accountIds }, organizationId: ctx.orgId, deletedAt: null },
  })
  if (count !== accountIds.length) throw new Error("One or more accounts not found in this organization")

  const row = await db(ctx).journalEntry.create({
    data: {
      organizationId: ctx.orgId,
      entryDate: data.entryDate,
      reference: data.reference ?? null,
      memo: data.memo ?? null,
      status: "DRAFT",
      createdBy,
      lines: {
        create: data.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description ?? null,
        })),
      },
    },
    include: journalInclude,
  })
  return toJournal(row)
}

export async function postJournalEntry(ctx: Ctx, id: string): Promise<JournalEntryDto> {
  const existing = await db(ctx).journalEntry.findFirst({
    where: { id, organizationId: ctx.orgId },
    select: { id: true },
  })
  if (!existing) throw new Error("Journal entry not found")
  const row = await db(ctx).journalEntry.update({
    where: { id, organizationId: ctx.orgId },
    data: { status: "POSTED" },
    include: journalInclude,
  })
  return toJournal(row)
}

// Budgets ---------------------------------------------------------------------

type BudgetRow = Prisma.BudgetGetPayload<object>

function toBudget(b: BudgetRow): BudgetDto {
  return {
    id: b.id,
    organizationId: b.organizationId,
    accountId: b.accountId,
    period: b.period,
    amount: b.amount,
  }
}

export async function listBudgets(ctx: Ctx): Promise<BudgetDto[]> {
  const rows = await db(ctx).budget.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { period: "desc" },
  })
  return rows.map(toBudget)
}

export async function setBudget(ctx: Ctx, data: SetBudgetInput): Promise<BudgetDto> {
  const acct = await db(ctx).ledgerAccount.findFirst({
    where: { id: data.accountId, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!acct) throw new Error("Account not found in this organization")
  const row = await db(ctx).budget.upsert({
    where: {
      organizationId_accountId_period: {
        organizationId: ctx.orgId,
        accountId: data.accountId,
        period: data.period,
      },
    },
    update: { amount: data.amount },
    create: {
      organizationId: ctx.orgId,
      accountId: data.accountId,
      period: data.period,
      amount: data.amount,
    },
  })
  return toBudget(row)
}
