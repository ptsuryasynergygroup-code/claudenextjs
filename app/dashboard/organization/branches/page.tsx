import { getBranches } from '@/lib/services/organization/service'
import { BranchesView } from './branches-view'

export default async function BranchesPage() {
  const branches = await getBranches()
  return <BranchesView branches={branches} />
}
