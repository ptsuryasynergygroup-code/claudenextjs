'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  createTaskAction,
  changeTaskStatusAction,
  deleteTaskAction,
} from './_actions'
import type { TaskDto, ProjectDto, TaskStatus } from '@/lib/entities/task/schema'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  todo: 'outline',
  in_progress: 'secondary',
  done: 'default',
  cancelled: 'destructive',
}
const priorityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
}
const statusOptions: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']

export function TasksView({
  tasks,
  projects,
  members,
  canCreate,
  canEdit,
  canDelete,
}: {
  tasks: TaskDto[]
  projects: ProjectDto[]
  members: { id: string; name: string }[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [projectId, setProjectId] = useState<string>('none')
  const [assignee, setAssignee] = useState<string>('none')

  const projectName = new Map(projects.map((p) => [p.id, p.name]))
  const memberName = new Map(members.map((m) => [m.id, m.name]))

  function onCreate() {
    startTransition(async () => {
      try {
        await createTaskAction({
          title,
          priority,
          projectId: projectId === 'none' ? null : projectId,
          assignedToId: assignee === 'none' ? null : assignee,
        })
        toast.success('Task created')
        setOpen(false)
        setTitle('')
        setPriority('medium')
        setProjectId('none')
        setAssignee('none')
      } catch {
        toast.error('Create failed')
      }
    })
  }

  function onStatus(id: string, status: TaskStatus) {
    startTransition(async () => {
      try {
        await changeTaskStatusAction(id, status)
      } catch {
        toast.error('Update failed')
      }
    })
  }

  function onDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTaskAction(id)
        toast.success('Task deleted')
      } catch {
        toast.error('Delete failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">{projects.length} projects · {tasks.length} tasks</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
                <DialogDescription>Create and optionally assign a task.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={onCreate} disabled={isPending || !title}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>{tasks.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="text-sm">
                    {task.projectId ? projectName.get(task.projectId) ?? '-' : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {task.assignedToId ? memberName.get(task.assignedToId) ?? '-' : 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityVariants[task.priority] ?? 'outline'}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={task.status}
                        onValueChange={(v) => onStatus(task.id, v as TaskStatus)}
                      >
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={statusVariants[task.status] ?? 'outline'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={isPending}
                            onClick={() => onDelete(task.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No tasks yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
