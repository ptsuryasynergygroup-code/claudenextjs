import {
  getVendors,
  getPurchaseRequests,
  getPurchaseOrders,
} from '@/lib/services/procurement/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { ProcurementView } from './procurement-view'

export default async function ProcurementPage() {
  const session = await requireSession()
  const [vendors, purchaseRequests, purchaseOrders] = await Promise.all([
    getVendors(),
    getPurchaseRequests(),
    getPurchaseOrders(),
  ])
  const [canCreate, canEdit, canApprove] = await Promise.all([
    hasPermission(session.userId, 'procurement.create'),
    hasPermission(session.userId, 'procurement.edit'),
    hasPermission(session.userId, 'procurement.approve'),
  ])
  return (
    <ProcurementView
      vendors={vendors}
      purchaseRequests={purchaseRequests}
      purchaseOrders={purchaseOrders}
      canCreate={canCreate}
      canEdit={canEdit}
      canApprove={canApprove}
    />
  )
}
