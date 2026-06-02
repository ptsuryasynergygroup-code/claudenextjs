import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Shield, FileText, TrendingUp, Clock } from 'lucide-react'
import { branches, departments, positions } from '@/lib/data/organization'
import { users } from '@/lib/data/users'
import { roles } from '@/lib/data/roles'
import { getRecentAuditLogs } from '@/lib/data/audit-log'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

const stats = [
  {
    title: 'Total Branches',
    value: branches.filter((b) => b.status === 'active').length,
    total: branches.length,
    icon: Building2,
    description: 'Active branches',
  },
  {
    title: 'Departments',
    value: departments.filter((d) => d.status === 'active').length,
    total: departments.length,
    icon: Building2,
    description: 'Active departments',
  },
  {
    title: 'Total Users',
    value: users.filter((u) => u.status === 'active').length,
    total: users.length,
    icon: Users,
    description: 'Active users',
  },
  {
    title: 'Roles',
    value: roles.filter((r) => r.status === 'active').length,
    total: roles.length,
    icon: Shield,
    description: 'Active roles',
  },
]

export default function DashboardPage() {
  const recentLogs = getRecentAuditLogs(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to EOS - Enterprise Operating System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description} of {stat.total} total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Organization Overview
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Positions</span>
              <span className="font-medium">{positions.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">System Roles</span>
              <span className="font-medium">{roles.filter((r) => r.isSystem).length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Custom Roles</span>
              <span className="font-medium">{roles.filter((r) => !r.isSystem).length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Suspended Users</span>
              <span className="font-medium text-destructive">
                {users.filter((u) => u.status === 'suspended').length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <FileText className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="leading-tight">{log.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{log.userName}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(log.createdAt, { addSuffix: true })}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
