import { getCustomers, getLeads, getOpportunities } from '@/lib/services/crm/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { CrmView } from './crm-view'

export default async function CrmPage() {
  const session = await requireSession()
  const [customers, leads, opportunities] = await Promise.all([
    getCustomers(),
    getLeads(),
    getOpportunities(),
  ])
  const canCreate = await hasPermission(session.userId, 'crm.create')
  return (
    <CrmView
      customers={customers}
      leads={leads}
      opportunities={opportunities}
      canCreate={canCreate}
    />
  )
}
