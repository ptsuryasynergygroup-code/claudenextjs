import { getKpis } from '@/lib/services/analytics/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { AnalyticsView } from './analytics-view'

export default async function AnalyticsPage() {
  const session = await requireSession()
  const kpis = await getKpis()
  const canCreate = await hasPermission(session.userId, 'analytics.create')
  return <AnalyticsView kpis={kpis} canCreate={canCreate} />
}
