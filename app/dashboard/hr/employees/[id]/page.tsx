import { notFound } from "next/navigation"
import Link from "next/link"
import { getEmployee } from "@/lib/services/hr/service"
import { getBranches, getDepartments, getPositions } from "@/lib/services/organization/service"
import { EosError } from "@/lib/errors"
import { EmployeeForm } from "../employee-form"

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let employee
  try {
    employee = await getEmployee(id)
  } catch (e) {
    if (e instanceof EosError && e.code === "NOT_FOUND") notFound()
    throw e
  }

  const [branches, departments, positions] = await Promise.all([
    getBranches(),
    getDepartments(),
    getPositions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p><Link href="/dashboard/hr" className="text-sm text-primary hover:underline">&larr; Back to HR</Link></p>
        <h1 className="text-2xl font-semibold tracking-tight">{employee.fullName}</h1>
        <p className="text-muted-foreground">{employee.employeeCode} · {employee.employmentStatus}</p>
      </div>
      <EmployeeForm initial={employee} branches={branches} departments={departments} positions={positions} />
    </div>
  )
}
