import { getUsers } from '@/lib/services/user/service'
import { getDepartments, getPositions } from '@/lib/services/organization/service'
import { getAllUserRoles } from '@/lib/services/role/service'
import { UsersView } from './users-view'

export default async function UsersPage() {
  const [users, departments, positions] = await Promise.all([
    getUsers(),
    getDepartments(),
    getPositions(),
  ])

  // Role badges need roles.view; if the user lacks it, show users without roles.
  let userRolesMap: Record<string, { id: string; name: string }[]> = {}
  try {
    userRolesMap = await getAllUserRoles()
  } catch {
    userRolesMap = {}
  }

  return (
    <UsersView
      users={users}
      departments={departments}
      positions={positions}
      userRolesMap={userRolesMap}
    />
  )
}
