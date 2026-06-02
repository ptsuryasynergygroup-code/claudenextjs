import { getAccounts, getInvoices } from '@/lib/services/finance/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { FinanceView } from './finance-view'

export default async function FinancePage() {
  const session = await requireSession()
  const [accounts, invoices] = await Promise.all([getAccounts(), getInvoices()])
  const canCreate = await hasPermission(session.userId, 'finance.create')
  return <FinanceView accounts={accounts} invoices={invoices} canCreate={canCreate} />
}
