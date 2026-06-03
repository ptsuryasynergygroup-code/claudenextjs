import { getBranches, getDepartments, getPositions } from "@/lib/services/organization/service"
import { EmployeeForm } from "../employee-form"

export default async function NewEmployeePage() {
  const [branches, departments, positions] = await Promise.all([
    getBranches(),
    getDepartments(),
    getPositions(),
  ])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Employee</h1>
        <p className="text-muted-foreground">Create an employee record</p>
      </div>
      <EmployeeForm branches={branches} departments={departments} positions={positions} />
    </div>
  )
}
