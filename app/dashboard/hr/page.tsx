import {
  getEmployees,
  getAttendances,
  getLeaveTypes,
  getLeaveBalances,
  getLeaveRequests,
  getPayslips,
} from "@/lib/services/hr/service"
import { requireSession } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac"
import { listEnabledFeatures } from "@/lib/entitlement"
import type { AttendanceDto, LeaveTypeDto, LeaveBalanceDto, LeaveRequestDto, PayslipDto } from "@/lib/entities/hr/schema"
import { HrView } from "./hr-view"

export default async function HrPage() {
  const session = await requireSession()
  const features = await listEnabledFeatures(session.orgId)
  const hasAttendance = features.includes("hr.attendance")
  const hasLeave = features.includes("hr.leave")
  const hasPayroll = features.includes("hr.payroll")

  const employees = await getEmployees()

  let attendances: AttendanceDto[] = []
  let leaveTypes: LeaveTypeDto[] = []
  let leaveBalances: LeaveBalanceDto[] = []
  let leaveRequests: LeaveRequestDto[] = []
  let payslips: PayslipDto[] = []

  if (hasAttendance) attendances = await getAttendances().catch(() => [])
  if (hasLeave) {
    leaveTypes = await getLeaveTypes().catch(() => [])
    leaveBalances = await getLeaveBalances().catch(() => [])
    leaveRequests = await getLeaveRequests().catch(() => [])
  }
  if (hasPayroll) payslips = await getPayslips().catch(() => [])

  const [canCreate, canEdit, canApprove, canDelete] = await Promise.all([
    hasPermission(session.userId, "hr.create"),
    hasPermission(session.userId, "hr.edit"),
    hasPermission(session.userId, "hr.approve"),
    hasPermission(session.userId, "hr.delete"),
  ])

  return (
    <HrView
      employees={employees}
      attendances={attendances}
      leaveTypes={leaveTypes}
      leaveBalances={leaveBalances}
      leaveRequests={leaveRequests}
      payslips={payslips}
      features={{ attendance: hasAttendance, leave: hasLeave, payroll: hasPayroll }}
      perms={{ canCreate, canEdit, canApprove, canDelete }}
    />
  )
}
