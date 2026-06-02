import { getQuotations, getSalesOrders } from '@/lib/services/sales/service'
import { getCustomers } from '@/lib/services/crm/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { SalesView } from './sales-view'

export default async function SalesPage() {
  const session = await requireSession()
  const [quotations, salesOrders] = await Promise.all([getQuotations(), getSalesOrders()])

  let customers: { id: string; name: string }[] = []
  try {
    customers = (await getCustomers()).map((c) => ({ id: c.id, name: c.name }))
  } catch {
    customers = []
  }

  const [canCreate, canEdit] = await Promise.all([
    hasPermission(session.userId, 'sales.create'),
    hasPermission(session.userId, 'sales.edit'),
  ])

  return (
    <SalesView
      quotations={quotations}
      salesOrders={salesOrders}
      customers={customers}
      canCreate={canCreate}
      canEdit={canEdit}
    />
  )
}
