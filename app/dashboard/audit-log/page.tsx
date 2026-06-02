import { getAuditLogs } from '@/lib/services/audit-log/service'
import { getUsers } from '@/lib/services/user/service'
import { AuditLogView } from './audit-log-view'

export default async function AuditLogPage() {
  const logs = await getAuditLogs({ limit: 500 })

  // User filter dropdown needs the user list; degrade to empty if not entitled.
  let users: { id: string; name: string }[] = []
  try {
    users = (await getUsers()).map((u) => ({ id: u.id, name: u.name }))
  } catch {
    users = []
  }

  return <AuditLogView logs={logs} users={users} />
}
