"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Check, X, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  recordAttendanceAction, createLeaveTypeAction, setLeaveBalanceAction,
  createLeaveRequestAction, decideLeaveAction, createPayslipAction, finalizePayslipAction,
} from "./_actions"
import type {
  EmployeeDto, AttendanceDto, LeaveTypeDto, LeaveBalanceDto, LeaveRequestDto, PayslipDto,
} from "@/lib/entities/hr/schema"

type Features = { attendance: boolean; leave: boolean; payroll: boolean }
type Perms = { canCreate: boolean; canEdit: boolean; canApprove: boolean; canDelete: boolean }

const leaveVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", approved: "default", rejected: "destructive",
}
const idr = (n: number) => new Intl.NumberFormat("id-ID").format(n)

export function HrView({
  employees, attendances, leaveTypes, leaveBalances, leaveRequests, payslips, features, perms,
}: {
  employees: EmployeeDto[]
  attendances: AttendanceDto[]
  leaveTypes: LeaveTypeDto[]
  leaveBalances: LeaveBalanceDto[]
  leaveRequests: LeaveRequestDto[]
  payslips: PayslipDto[]
  features: Features
  perms: Perms
}) {
  const [isPending, startTransition] = useTransition()
  const empName = new Map(employees.map((e) => [e.id, e.fullName || e.employeeCode]))
  const typeName = new Map(leaveTypes.map((t) => [t.id, t.name]))

  function run(fn: () => Promise<void>, ok: string) {
    startTransition(async () => {
      try { await fn(); toast.success(ok) } catch { toast.error("Action failed") }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Human Resources</h1>
          <p className="text-muted-foreground">{employees.length} employees</p>
        </div>
        {perms.canCreate && (
          <Link href="/dashboard/hr/employees/new"><Button><Plus className="mr-2 size-4" />Add Employee</Button></Link>
        )}
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          {features.attendance && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
          {features.leave && <TabsTrigger value="leave">Leave</TabsTrigger>}
          {features.payroll && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
        </TabsList>

        {/* Employees ------------------------------------------------------- */}
        <TabsContent value="employees">
          <Card>
            <CardHeader><CardTitle>Employees</CardTitle><CardDescription>{employees.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>NIK</TableHead>
                  <TableHead>Status</TableHead><TableHead>Join Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.employeeCode}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/employees/${e.id}`} className="font-medium hover:underline">
                          {e.fullName || "(no name)"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.nik ?? "-"}</TableCell>
                      <TableCell><Badge variant="secondary">{e.employmentStatus}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(e.joinDate, "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No employees yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance ----------------------------------------------------- */}
        {features.attendance && (
          <TabsContent value="attendance" className="space-y-4">
            {perms.canCreate && employees.length > 0 && (
              <div className="flex justify-end">
                <AttendanceDialog employees={employees} isPending={isPending} run={run} />
              </div>
            )}
            <Card>
              <CardHeader><CardTitle>Attendance</CardTitle><CardDescription>{attendances.length} records</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendances.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{empName.get(a.employeeId) ?? a.employeeId}</TableCell>
                        <TableCell className="text-sm">{format(a.date, "MMM d, yyyy")}</TableCell>
                        <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {attendances.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No records.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Leave ---------------------------------------------------------- */}
        {features.leave && (
          <TabsContent value="leave" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Leave Types</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {perms.canCreate && <LeaveTypeForm isPending={isPending} run={run} />}
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Days/Year</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {leaveTypes.map((t) => (
                        <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell>{t.daysPerYear}</TableCell></TableRow>
                      ))}
                      {leaveTypes.length === 0 && (<TableRow><TableCell colSpan={2} className="text-sm text-muted-foreground py-4 text-center">None yet.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Balances</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {perms.canEdit && leaveTypes.length > 0 && employees.length > 0 && (
                    <LeaveBalanceForm employees={employees} leaveTypes={leaveTypes} isPending={isPending} run={run} />
                  )}
                  <Table>
                    <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Year</TableHead><TableHead>Used/Entitled</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {leaveBalances.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="text-sm">{empName.get(b.employeeId) ?? "-"}</TableCell>
                          <TableCell className="text-sm">{typeName.get(b.leaveTypeId) ?? "-"}</TableCell>
                          <TableCell>{b.year}</TableCell>
                          <TableCell>{b.used}/{b.entitled}</TableCell>
                        </TableRow>
                      ))}
                      {leaveBalances.length === 0 && (<TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground py-4 text-center">None yet.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Leave Requests</CardTitle><CardDescription>{leaveRequests.length} total</CardDescription></div>
                  {perms.canCreate && employees.length > 0 && (
                    <LeaveRequestDialog employees={employees} leaveTypes={leaveTypes} isPending={isPending} run={run} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="w-[170px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {leaveRequests.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{empName.get(l.employeeId) ?? "-"}</TableCell>
                        <TableCell className="text-sm">{l.leaveType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(l.startDate, "MMM d")} – {format(l.endDate, "MMM d, yyyy")}</TableCell>
                        <TableCell><Badge variant={leaveVariants[l.status] ?? "outline"}>{l.status}</Badge></TableCell>
                        <TableCell>
                          {perms.canApprove && l.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => decideLeaveAction(l.id, "approved"), "Approved")}><Check className="mr-1 size-3" />Approve</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => run(() => decideLeaveAction(l.id, "rejected"), "Rejected")}><X className="mr-1 size-3" />Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {leaveRequests.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No requests.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Payroll -------------------------------------------------------- */}
        {features.payroll && (
          <TabsContent value="payroll" className="space-y-4">
            {perms.canCreate && employees.length > 0 && (
              <div className="flex justify-end"><PayslipDialog employees={employees} isPending={isPending} run={run} /></div>
            )}
            <Card>
              <CardHeader><CardTitle>Payslips</CardTitle><CardDescription>{payslips.length} total</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead className="w-[110px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payslips.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{empName.get(p.employeeId) ?? "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{p.period}</TableCell>
                        <TableCell>{idr(p.grossPay)}</TableCell>
                        <TableCell>{idr(p.totalDeductions)}</TableCell>
                        <TableCell className="font-medium">{idr(p.netPay)}</TableCell>
                        <TableCell><Badge variant={p.status === "finalized" ? "default" : "outline"}>{p.status}</Badge></TableCell>
                        <TableCell>
                          {perms.canEdit && p.status === "draft" && (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => finalizePayslipAction(p.id), "Finalized")}>Finalize</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {payslips.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No payslips.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// --- sub-dialogs -------------------------------------------------------------

type RunFn = (fn: () => Promise<void>, ok: string) => void

function AttendanceDialog({ employees, isPending, run }: { employees: EmployeeDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [emp, setEmp] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("present")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />Record Attendance</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Employee</Label>
            <Select value={emp} onValueChange={setEmp}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || e.employeeCode}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="present">Present</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="leave">Leave</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !emp || !date} onClick={() => run(async () => { await recordAttendanceAction({ employeeId: emp, date, status }); setOpen(false); setEmp(""); setDate(""); setStatus("present") }, "Recorded")}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LeaveTypeForm({ isPending, run }: { isPending: boolean; run: RunFn }) {
  const [name, setName] = useState("")
  const [days, setDays] = useState("12")
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1"><Label>New type</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual Leave" /></div>
      <div className="w-24 space-y-1"><Label>Days</Label><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
      <Button disabled={isPending || !name} onClick={() => run(async () => { await createLeaveTypeAction({ name, daysPerYear: Number(days) || 0 }); setName(""); setDays("12") }, "Type added")}>Add</Button>
    </div>
  )
}

function LeaveBalanceForm({ employees, leaveTypes, isPending, run }: { employees: EmployeeDto[]; leaveTypes: LeaveTypeDto[]; isPending: boolean; run: RunFn }) {
  const [emp, setEmp] = useState("")
  const [type, setType] = useState("")
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [entitled, setEntitled] = useState("12")
  return (
    <div className="grid grid-cols-2 gap-2 items-end">
      <div className="space-y-1"><Label>Employee</Label>
        <Select value={emp} onValueChange={setEmp}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || e.employeeCode}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="space-y-1"><Label>Type</Label>
        <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{leaveTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="space-y-1"><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
      <div className="space-y-1"><Label>Entitled</Label><Input type="number" value={entitled} onChange={(e) => setEntitled(e.target.value)} /></div>
      <div className="col-span-2">
        <Button className="w-full" disabled={isPending || !emp || !type} onClick={() => run(async () => { await setLeaveBalanceAction({ employeeId: emp, leaveTypeId: type, year: Number(year), entitled: Number(entitled) || 0 }) }, "Balance set")}>Set balance</Button>
      </div>
    </div>
  )
}

function LeaveRequestDialog({ employees, leaveTypes, isPending, run }: { employees: EmployeeDto[]; leaveTypes: LeaveTypeDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [emp, setEmp] = useState("")
  const [type, setType] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [reason, setReason] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Request</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Employee</Label>
            <Select value={emp} onValueChange={setEmp}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || e.employeeCode}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Leave Type</Label>
            <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{leaveTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-2"><Label>End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !emp || !type || !start || !end} onClick={() => run(async () => { await createLeaveRequestAction({ employeeId: emp, leaveType: type, startDate: start, endDate: end, reason: reason || null }); setOpen(false); setEmp(""); setType(""); setStart(""); setEnd(""); setReason("") }, "Request created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Comp = { type: "earning" | "deduction"; name: string; amount: string }

function PayslipDialog({ employees, isPending, run }: { employees: EmployeeDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [emp, setEmp] = useState("")
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [comps, setComps] = useState<Comp[]>([{ type: "earning", name: "Basic Salary", amount: "" }])

  function setComp(i: number, patch: Partial<Comp>) {
    setComps((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Payslip</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Payslip</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Employee</Label>
            <Select value={emp} onValueChange={setEmp}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName || e.employeeCode}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Period (YYYY-MM)</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-06" /></div>
          <div className="space-y-2">
            <Label>Components</Label>
            {comps.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={c.type} onValueChange={(val) => setComp(i, { type: val as Comp["type"] })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
                </Select>
                <Input className="flex-1" placeholder="Name" value={c.name} onChange={(e) => setComp(i, { name: e.target.value })} />
                <Input className="w-28" type="number" placeholder="Amount" value={c.amount} onChange={(e) => setComp(i, { amount: e.target.value })} />
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setComps((p) => p.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setComps((p) => [...p, { type: "earning", name: "", amount: "" }])}><Plus className="mr-1 size-3" />Add component</Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending || !emp || !/^\d{4}-\d{2}$/.test(period) || comps.some((c) => !c.name)}
            onClick={() => run(async () => {
              await createPayslipAction({
                employeeId: emp, period,
                components: comps.map((c) => ({ type: c.type, name: c.name, amount: Number(c.amount) || 0 })),
              })
              setOpen(false); setEmp(""); setComps([{ type: "earning", name: "Basic Salary", amount: "" }])
            }, "Payslip created")}
          >Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
