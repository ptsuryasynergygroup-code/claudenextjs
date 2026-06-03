import {
  getAccounts,
  getInvoices,
  getPayments,
  getJournalEntries,
  getBudgets,
} from "@/lib/services/finance/service"
import { requireSession } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac"
import { listEnabledFeatures } from "@/lib/entitlement"
import type { PaymentDto, JournalEntryDto, BudgetDto } from "@/lib/entities/finance/schema"
import { FinanceView } from "./finance-view"

export default async function FinancePage() {
  const session = await requireSession()
  const features = await listEnabledFeatures(session.orgId)
  const hasBudget = features.includes("finance.budget")

  const [accounts, invoices, payments, journal] = await Promise.all([
    getAccounts(),
    getInvoices(),
    getPayments().catch((): PaymentDto[] => []),
    getJournalEntries().catch((): JournalEntryDto[] => []),
  ])

  let budgets: BudgetDto[] = []
  if (hasBudget) budgets = await getBudgets().catch(() => [])

  const [canCreate, canEdit] = await Promise.all([
    hasPermission(session.userId, "finance.create"),
    hasPermission(session.userId, "finance.edit"),
  ])

  return (
    <FinanceView
      accounts={accounts}
      invoices={invoices}
      payments={payments}
      journal={journal}
      budgets={budgets}
      features={{ budget: hasBudget }}
      perms={{ canCreate, canEdit }}
    />
  )
}
