import { getDocuments } from '@/lib/services/document/service'
import { hasPermission } from '@/lib/rbac'
import { requireSession } from '@/lib/auth'
import { DocumentsView } from './documents-view'

export default async function DocumentsPage() {
  const session = await requireSession()
  const documents = await getDocuments()
  const [canCreate, canDelete] = await Promise.all([
    hasPermission(session.userId, 'documents.create'),
    hasPermission(session.userId, 'documents.delete'),
  ])
  return <DocumentsView documents={documents} canCreate={canCreate} canDelete={canDelete} />
}
