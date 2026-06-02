import { getDepartments, getBranches } from '@/lib/services/organization/service'
import { DepartmentsView } from './departments-view'

export default async function DepartmentsPage() {
  const [departments, branches] = await Promise.all([getDepartments(), getBranches()])
  return <DepartmentsView departments={departments} branches={branches} />
}
