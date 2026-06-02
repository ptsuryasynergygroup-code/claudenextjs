'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GitBranch, Plus, Check, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { decideAction } from './_actions'
import type { WorkflowDto, WorkflowInstanceDto } from '@/lib/entities/workflow/schema'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  cancelled: 'secondary',
}

export function WorkflowsView({
  workflows,
  instances,
  canApprove,
  workflowNameById,
}: {
  workflows: WorkflowDto[]
  instances: WorkflowInstanceDto[]
  canApprove: boolean
  workflowNameById: Record<string, string>
}) {
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  function onDecide(instanceId: string, decision: 'approve' | 'reject') {
    setActiveId(instanceId)
    startTransition(async () => {
      try {
        await decideAction(instanceId, decision)
        toast.success(decision === 'approve' ? 'Approved' : 'Rejected')
      } catch {
        toast.error('Action failed')
      } finally {
        setActiveId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Approval flows and active instances</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Create Workflow
        </Button>
      </div>

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="instances">Active Instances</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Instances</CardTitle>
              <CardDescription>{instances.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="w-[180px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GitBranch className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {workflowNameById[inst.workflowId] ?? inst.workflowId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{inst.entityType}</div>
                        <div className="text-xs text-muted-foreground font-mono">{inst.entityId}</div>
                      </TableCell>
                      <TableCell className="text-sm">{inst.currentStepOrder}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[inst.status] ?? 'outline'}>{inst.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(inst.createdAt, 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canApprove && inst.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending && activeId === inst.id}
                              onClick={() => onDecide(inst.id, 'approve')}
                            >
                              <Check className="mr-1 size-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={isPending && activeId === inst.id}
                              onClick={() => onDecide(inst.id, 'reject')}
                            >
                              <X className="mr-1 size-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {instances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No workflow instances yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Definitions</CardTitle>
              <CardDescription>{workflows.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((wf) => (
                    <TableRow key={wf.id}>
                      <TableCell>
                        <div className="font-medium">{wf.name}</div>
                        {wf.description && (
                          <div className="text-xs text-muted-foreground">{wf.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{wf.entityType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{wf.steps.length}</TableCell>
                      <TableCell>
                        <Badge variant={wf.status === 'active' ? 'default' : 'secondary'}>
                          {wf.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(wf.createdAt, 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {workflows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No workflow definitions yet.
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
