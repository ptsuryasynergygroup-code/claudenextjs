import { getRoles, getRolePermissionCounts } from '@/lib/services/role/service'
import { RolesView } from './roles-view'

export default async function RolesPage() {
  const [roles, permCountByRole] = await Promise.all([
    getRoles(),
    getRolePermissionCounts(),
  ])
  return <RolesView roles={roles} permCountByRole={permCountByRole} />
}
