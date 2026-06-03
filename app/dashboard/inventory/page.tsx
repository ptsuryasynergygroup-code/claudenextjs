import {
  getProducts,
  getWarehouses,
  getStocks,
  getMovements,
  getTransfers,
} from '@/lib/services/inventory/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { listEnabledFeatures } from '@/lib/entitlement'
import type { StockTransferDto } from '@/lib/entities/inventory/schema'
import { InventoryView } from './inventory-view'

export default async function InventoryPage() {
  const session = await requireSession()
  const features = await listEnabledFeatures(session.orgId)
  const hasTransfer = features.includes('inventory.transfer')

  const [products, warehouses, stocks, movements] = await Promise.all([
    getProducts(),
    getWarehouses(),
    getStocks(),
    getMovements(),
  ])

  let transfers: StockTransferDto[] = []
  if (hasTransfer) transfers = await getTransfers().catch(() => [])

  const canCreate = await hasPermission(session.userId, 'inventory.create')
  return (
    <InventoryView
      products={products}
      warehouses={warehouses}
      stocks={stocks}
      movements={movements}
      transfers={transfers}
      features={{ transfer: hasTransfer }}
      canCreate={canCreate}
    />
  )
}
