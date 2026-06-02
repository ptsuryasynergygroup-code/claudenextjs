import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Edit,
  MoreHorizontal,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EosError } from '@/lib/errors'
import { getUser } from '@/lib/services/user/service'
import { getBranches, getDepartments, getPositions } from '@/lib/services/organization/service'
import { getUserRoles, getRolePermissions } from '@/lib/services/role/service'
import { getAuditLogs } from '@/lib/services/audit-log/service'
import type { RoleDto, PermissionDto } from '@/lib/entities/role/schema'
import type { AuditLogDto } from '@/lib/entities/audit-log/schema'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let user
  try {
    user = await getUser(id)
  } catch (e) {
    if (e instanceof EosError && e.code === 'NOT_FOUND') notFound()
    throw e
  }

  const [branches, departments, positions] = await Promise.all([
    getBranches(),
    getDepartments(),
    getPositions(),
  ])
  const branch = user.branchId ? branches.find((b) => b.id === user.branchId) : null
  const department = user.departmentId ? departments.find((d) => d.id === user.departmentId) : null
  const position = user.positionId ? positions.find((p) => p.id === user.positionId) : null

  // Roles + their permissions, and this user's recent activity — degrade if forbidden.
  let userRoles: RoleDto[] = []
  let permsByRole: Record<string, PermissionDto[]> = {}
  try {
    userRoles = await getUserRoles(user.id)
    permsByRole = Object.fromEntries(
      await Promise.all(
        userRoles.map(async (r) => [r.id, await getRolePermissions(r.id)] as const),
      ),
    )
  } catch {
    userRoles = []
  }

  let userLogs: AuditLogDto[] = []
  try {
    userLogs = (await getAuditLogs({ userId: user.id, limit: 10 })).slice(0, 10)
  } catch {
    userLogs = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground">
              {position?.name || 'No position'} {department && `at ${department.name}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{user.employeeId ?? '-'}</Badge>
              <Badge variant={statusVariants[user.status]}>{user.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="mr-2 size-4" />
            Edit Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Reset Password</DropdownMenuItem>
              <DropdownMenuItem>Send Invite</DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'active' ? (
                <>
                  <DropdownMenuItem>Deactivate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem>Activate</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{user.phone || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Branch</p>
                    <p className="text-sm text-muted-foreground">{branch?.name || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{department?.name || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Briefcase className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Position</p>
                    <p className="text-sm text-muted-foreground">{position?.name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created At</p>
                    <p className="text-sm text-muted-foreground">
                      {format(user.createdAt, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {user.lastLogin
                        ? `${format(user.lastLogin, 'MMM d, yyyy HH:mm')} (${formatDistanceToNow(user.lastLogin, { addSuffix: true })})`
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assigned Roles</span>
                  <span className="font-medium">{userRoles.length}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Activity Logs</span>
                  <span className="font-medium">{userLogs.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assigned Roles</CardTitle>
                  <CardDescription>
                    Roles and permissions assigned to this user
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Shield className="mr-2 size-4" />
                  Manage Roles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userRoles.length > 0 ? (
                <div className="space-y-4">
                  {userRoles.map((role) => {
                    const permissions = permsByRole[role.id] ?? []
                    return (
                      <div key={role.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{role.name}</h4>
                              {role.isSystem && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          </div>
                          <Badge variant="secondary">{permissions.length} permissions</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {permissions.slice(0, 8).map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.module}:{perm.action}
                            </Badge>
                          ))}
                          {permissions.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{permissions.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No roles assigned to this user
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent activities performed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userLogs.length > 0 ? (
                <div className="space-y-4">
                  {userLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity logs found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
