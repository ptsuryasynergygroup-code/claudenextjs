import { getWorkflows, getInstances } from '@/lib/services/workflow/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { WorkflowsView } from './workflows-view'

export default async function WorkflowsPage() {
  const session = await requireSession()
  const [workflows, instances] = await Promise.all([getWorkflows(), getInstances()])
  const canApprove = await hasPermission(session.userId, 'workflows.approve')

  const workflowNameById = Object.fromEntries(workflows.map((w) => [w.id, w.name]))

  return (
    <WorkflowsView
      workflows={workflows}
      instances={instances}
      canApprove={canApprove}
      workflowNameById={workflowNameById}
    />
  )
}
