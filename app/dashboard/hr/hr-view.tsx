'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createEmployeeAction, decideLeaveAction } from './_actions'
import type { EmployeeDto, LeaveRequestDto } from '@/lib/entities/hr/schema'

const leaveVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
}

export function HrView({
  employees,
  leaveRequests,
  canCreate,
  canApprove,
}: {
  employees: EmployeeDto[]
  leaveRequests: LeaveRequestDto[]
  canCreate: boolean
  canApprove: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [joinDate, setJoinDate] = useState('')
  const [status, setStatus] = useState<'permanent' | 'contract' | 'probation' | 'terminated'>('permanent')

  function onCreate() {
    startTransition(async () => {
      try {
        await createEmployeeAction({ employeeCode: code, joinDate, employmentStatus: status })
        toast.success('Employee added')
        setOpen(false)
        setCode('')
        setJoinDate('')
        setStatus('permanent')
      } catch {
        toast.error('Create failed')
      }
    })
  }

  function onDecide(id: string, decision: 'approved' | 'rejected') {
    startTransition(async () => {
      try {
        await decideLeaveAction(id, decision)
        toast.success(decision === 'approved' ? 'Leave approved' : 'Leave rejected')
      } catch {
        toast.error('Action failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Human Resources</h1>
          <p className="text-muted-foreground">{employees.length} employees</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>Create an employee record.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Employee Code</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join">Join Date</Label>
                  <Input id="join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={onCreate} disabled={isPending || !code || !joinDate}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>{employees.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.employeeCode}</TableCell>
                      <TableCell className="text-sm">{format(e.joinDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{e.employmentStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                        No employees yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>{leaveRequests.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[180px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm font-mono">{l.employeeId}</TableCell>
                      <TableCell className="text-sm">{l.leaveType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(l.startDate, 'MMM d')} – {format(l.endDate, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={leaveVariants[l.status] ?? 'outline'}>{l.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {canApprove && l.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => onDecide(l.id, 'approved')}
                            >
                              <Check className="mr-1 size-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={isPending}
                              onClick={() => onDecide(l.id, 'rejected')}
                            >
                              <X className="mr-1 size-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaveRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No leave requests.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
