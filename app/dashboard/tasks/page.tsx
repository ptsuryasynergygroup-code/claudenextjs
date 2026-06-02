import { getTasks, getProjects } from '@/lib/services/task/service'
import { getUsers } from '@/lib/services/user/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { TasksView } from './tasks-view'

export default async function TasksPage() {
  const session = await requireSession()
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()])

  let members: { id: string; name: string }[] = []
  try {
    members = (await getUsers()).map((u) => ({ id: u.id, name: u.name }))
  } catch {
    members = []
  }

  const [canCreate, canEdit, canDelete] = await Promise.all([
    hasPermission(session.userId, 'tasks.create'),
    hasPermission(session.userId, 'tasks.edit'),
    hasPermission(session.userId, 'tasks.delete'),
  ])

  return (
    <TasksView
      tasks={tasks}
      projects={projects}
      members={members}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
