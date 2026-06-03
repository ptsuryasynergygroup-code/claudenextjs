import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement, requireFeature } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/finance/repository"
import {
  type AccountDto,
  type TransactionDto,
  type InvoiceDto,
  type PaymentDto,
  type JournalEntryDto,
  type BudgetDto,
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateTransactionSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  CreatePaymentSchema,
  CreateJournalEntrySchema,
  SetBudgetSchema,
} from "@/lib/entities/finance/schema"
import { notFound } from "@/lib/errors"

const MODULE = "finance"
const F_BUDGET = "finance.budget"

export async function getAccounts(): Promise<AccountDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.view")
  return repo.listAccounts({ orgId: s.orgId })
}

export async function createAccount(input: unknown): Promise<AccountDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.create")
  const data = CreateAccountSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const a = await repo.createAccount({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Account",
      entityId: a.id,
      action: "create",
      description: `Created account: ${a.code} ${a.name}`,
      newValue: { code: a.code, type: a.type },
    })
    return a
  })
}

export async function updateAccount(id: string, input: unknown): Promise<AccountDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.edit")
  const data = UpdateAccountSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findAccount({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Account")
    const after = await repo.updateAccount({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { code: before.code, name: before.name, type: before.type },
      { code: after.code, name: after.name, type: after.type },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Account",
      entityId: after.id,
      action: "update",
      description: `Updated account: ${after.code}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteAccount(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findAccount({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Account")
    await repo.softDeleteAccount({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Account",
      entityId: id,
      action: "delete",
      description: `Deleted account: ${before.code}`,
      oldValue: { code: before.code },
    })
  })
}

export async function getTransactions(): Promise<TransactionDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.view")
  return repo.listTransactions({ orgId: s.orgId })
}

export async function createTransaction(input: unknown): Promise<TransactionDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.create")
  const data = CreateTransactionSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const t = await repo.createTransaction({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Transaction",
      entityId: t.id,
      action: "create",
      description: `Posted ${t.type} ${t.amount} to account ${t.accountId}`,
      newValue: { accountId: t.accountId, amount: t.amount, type: t.type },
    })
    return t
  })
}

export async function getInvoices(): Promise<InvoiceDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.view")
  return repo.listInvoices({ orgId: s.orgId })
}

export async function createInvoice(input: unknown): Promise<InvoiceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.create")
  const data = CreateInvoiceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const i = await repo.createInvoice({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Invoice",
      entityId: i.id,
      action: "create",
      description: `Created invoice: ${i.number}`,
      newValue: { number: i.number, amount: i.amount },
    })
    return i
  })
}

export async function updateInvoice(id: string, input: unknown): Promise<InvoiceDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.edit")
  const data = UpdateInvoiceSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findInvoice({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Invoice")
    const after = await repo.updateInvoice({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { number: before.number, amount: before.amount, status: before.status },
      { number: after.number, amount: after.amount, status: after.status },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Invoice",
      entityId: after.id,
      action: "update",
      description: `Updated invoice: ${after.number}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function deleteInvoice(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findInvoice({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Invoice")
    await repo.softDeleteInvoice({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Invoice",
      entityId: id,
      action: "delete",
      description: `Deleted invoice: ${before.number}`,
      oldValue: { number: before.number },
    })
  })
}

export async function getPayments(): Promise<PaymentDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.view")
  return repo.listPayments({ orgId: s.orgId })
}

export async function createPayment(input: unknown): Promise<PaymentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.create")
  const data = CreatePaymentSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const p = await repo.createPayment({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Payment",
      entityId: p.id,
      action: "create",
      description: `Recorded payment ${p.amount} via ${p.method}`,
      newValue: { amount: p.amount, method: p.method, invoiceId: p.invoiceId },
    })
    return p
  })
}

// Journal entries (core finance) ----------------------------------------------

export async function getJournalEntries(): Promise<JournalEntryDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.view")
  return repo.listJournalEntries({ orgId: s.orgId })
}

export async function createJournalEntry(input: unknown): Promise<JournalEntryDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.create")
  const data = CreateJournalEntrySchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const j = await repo.createJournalEntry({ orgId: s.orgId, tx }, data, s.userId)
    const total = j.lines.reduce((sum, l) => sum + l.debit, 0)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "JournalEntry", entityId: j.id, action: "create",
      description: `Created journal entry (${j.lines.length} lines, ${total})`,
      newValue: { reference: j.reference, lines: j.lines.length, total },
    })
    return j
  })
}

export async function postJournalEntry(id: string): Promise<JournalEntryDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "finance.edit")
  return prisma.$transaction(async (tx) => {
    const before = await repo.findJournalEntry({ orgId: s.orgId, tx }, id)
    if (!before) notFound("JournalEntry")
    const after = await repo.postJournalEntry({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "JournalEntry", entityId: after.id, action: "update",
      description: `Posted journal entry`,
      oldValue: { status: before.status }, newValue: { status: after.status },
    })
    return after
  })
}

// Budgets (feature: finance.budget) -------------------------------------------

export async function getBudgets(): Promise<BudgetDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_BUDGET)
  await requirePermission(s.userId, "finance.view")
  return repo.listBudgets({ orgId: s.orgId })
}

export async function setBudget(input: unknown): Promise<BudgetDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requireFeature(s.orgId, F_BUDGET)
  await requirePermission(s.userId, "finance.edit")
  const data = SetBudgetSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const b = await repo.setBudget({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Budget", entityId: b.id, action: "update",
      description: `Set budget for account ${b.accountId} (${b.period})`,
      newValue: { accountId: b.accountId, period: b.period, amount: b.amount },
    })
    return b
  })
}
