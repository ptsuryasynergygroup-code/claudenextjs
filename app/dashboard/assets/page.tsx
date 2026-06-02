import { getAssets, getMaintenances } from '@/lib/services/asset/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { AssetsView } from './assets-view'

export default async function AssetsPage() {
  const session = await requireSession()
  const [assets, maintenances] = await Promise.all([getAssets(), getMaintenances()])
  const [canCreate, canEdit] = await Promise.all([
    hasPermission(session.userId, 'assets.create'),
    hasPermission(session.userId, 'assets.edit'),
  ])
  return (
    <AssetsView assets={assets} maintenances={maintenances} canCreate={canCreate} canEdit={canEdit} />
  )
}
