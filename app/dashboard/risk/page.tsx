import { getRisks, getControls } from '@/lib/services/risk/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { RiskView } from './risk-view'

export default async function RiskPage() {
  const session = await requireSession()
  const [risks, controls] = await Promise.all([getRisks(), getControls()])
  const [canCreate, canEdit] = await Promise.all([
    hasPermission(session.userId, 'risk.create'),
    hasPermission(session.userId, 'risk.edit'),
  ])
  return <RiskView risks={risks} controls={controls} canCreate={canCreate} canEdit={canEdit} />
}
