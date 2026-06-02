'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  Download,
  Clock,
  User,
  Globe,
  FileText,
  Eye,
  Filter,
} from 'lucide-react'
import { auditLogs, getRecentAuditLogs } from '@/lib/data/audit-log'
import { users } from '@/lib/data/users'
import type { AuditLog } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'

const actionVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  login: 'outline',
  logout: 'outline',
  view: 'outline',
  export: 'outline',
}

const entityTypes = [...new Set(auditLogs.map((log) => log.entityType))]
const actionTypes = [...new Set(auditLogs.map((log) => log.action))]

function AuditLogDetailDialog({ log }: { log: AuditLog }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Eye className="size-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            {log.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">User</p>
              <p className="text-sm text-muted-foreground">{log.userName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Action</p>
              <Badge variant={actionVariants[log.action]}>{log.action}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Entity Type</p>
              <p className="text-sm text-muted-foreground">{log.entityType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Entity ID</p>
              <p className="text-sm text-muted-foreground font-mono">{log.entityId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">IP Address</p>
              <p className="text-sm text-muted-foreground font-mono">{log.ipAddress}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Timestamp</p>
              <p className="text-sm text-muted-foreground">
                {format(log.createdAt, 'PPpp')}
              </p>
            </div>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div className="space-y-1">
              <p className="text-sm font-medium">User Agent</p>
              <p className="text-sm text-muted-foreground break-all">{log.userAgent}</p>
            </div>
          )}

          {/* Value Changes */}
          {(log.oldValue || log.newValue) && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Changes</p>
              <div className="grid gap-4 md:grid-cols-2">
                {log.oldValue && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Previous Value</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(log.oldValue, null, 2)}
                    </pre>
                  </div>
                )}
                {log.newValue && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">New Value</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const sortedLogs = useMemo(() => getRecentAuditLogs(), [])

  const filteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesUser = userFilter === 'all' || log.userId === userFilter
      const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      return matchesSearch && matchesUser && matchesEntity && matchesAction
    })
  }, [sortedLogs, searchQuery, userFilter, entityFilter, actionFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setUserFilter('all')
    setEntityFilter('all')
    setActionFilter('all')
  }

  const hasActiveFilters = searchQuery || userFilter !== 'all' || entityFilter !== 'all' || actionFilter !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track and monitor system activities
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 size-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Create Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter((l) => l.action === 'create').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Update Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {auditLogs.filter((l) => l.action === 'update').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Login/Logout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {auditLogs.filter((l) => l.action === 'login' || l.action === 'logout').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of {auditLogs.length} entries
                </CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Filter className="mr-2 size-4" />
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {log.entityId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-3 text-muted-foreground" />
                      <span className="text-sm">{log.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entityType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariants[log.action]}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Globe className="size-3 text-muted-foreground" />
                      <span className="text-sm font-mono">{log.ipAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AuditLogDetailDialog log={log} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
