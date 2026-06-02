import {
  getProducts,
  getWarehouses,
  getStocks,
  getMovements,
} from '@/lib/services/inventory/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { InventoryView } from './inventory-view'

export default async function InventoryPage() {
  const session = await requireSession()
  const [products, warehouses, stocks, movements] = await Promise.all([
    getProducts(),
    getWarehouses(),
    getStocks(),
    getMovements(),
  ])
  const canCreate = await hasPermission(session.userId, 'inventory.create')
  return (
    <InventoryView
      products={products}
      warehouses={warehouses}
      stocks={stocks}
      movements={movements}
      canCreate={canCreate}
    />
  )
}
