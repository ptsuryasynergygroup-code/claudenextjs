import { getPositions, getDepartments } from '@/lib/services/organization/service'
import { PositionsView } from './positions-view'

export default async function PositionsPage() {
  const [positions, departments] = await Promise.all([getPositions(), getDepartments()])
  return <PositionsView positions={positions} departments={departments} />
}
