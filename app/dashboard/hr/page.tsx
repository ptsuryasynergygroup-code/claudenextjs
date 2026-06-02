import { getEmployees, getLeaveRequests } from '@/lib/services/hr/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { HrView } from './hr-view'

export default async function HrPage() {
  const session = await requireSession()
  const [employees, leaveRequests] = await Promise.all([getEmployees(), getLeaveRequests()])
  const [canCreate, canApprove] = await Promise.all([
    hasPermission(session.userId, 'hr.create'),
    hasPermission(session.userId, 'hr.approve'),
  ])
  return (
    <HrView
      employees={employees}
      leaveRequests={leaveRequests}
      canCreate={canCreate}
      canApprove={canApprove}
    />
  )
}
