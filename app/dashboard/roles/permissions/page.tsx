import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { getRoles, getPermissions, getRolePermissions } from '@/lib/services/role/service'

export default async function PermissionsPage() {
  const [roles, permissions] = await Promise.all([getRoles(), getPermissions()])

  // Per-role granted permission codes → fast membership lookup for the matrix.
  const grantedByRole = Object.fromEntries(
    await Promise.all(
      roles.map(async (r) => {
        const perms = await getRolePermissions(r.id)
        return [r.id, new Set(perms.map((p) => p.code))] as const
      }),
    ),
  )

  // Group permissions by module, preserving discovered action order.
  const moduleOrder: string[] = []
  const actionsByModule: Record<string, string[]> = {}
  for (const p of permissions) {
    if (!actionsByModule[p.module]) {
      actionsByModule[p.module] = []
      moduleOrder.push(p.module)
    }
    if (!actionsByModule[p.module].includes(p.action)) {
      actionsByModule[p.module].push(p.action)
    }
  }

  const has = (roleId: string, module: string, action: string) =>
    grantedByRole[roleId]?.has(`${module}.${action}`) ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Permission Matrix</h1>
            <p className="text-muted-foreground">
              View and manage role permissions across all modules
            </p>
          </div>
        </div>
        <Button>
          <Save className="mr-2 size-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role-Permission Matrix</CardTitle>
          <CardDescription>
            Check the permissions assigned to each role. System roles cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background min-w-[200px]">Module / Action</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center min-w-[120px]">
                      <div className="space-y-1">
                        <p className="font-medium">{role.name}</p>
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleOrder.map((module) => (
                  <>
                    <TableRow key={`header-${module}`} className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 font-medium capitalize">
                        {module.replace('-', ' ')}
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={`${module}-${role.id}-header`} />
                      ))}
                    </TableRow>
                    {actionsByModule[module].map((action) => (
                      <TableRow key={`${module}-${action}`}>
                        <TableCell className="sticky left-0 bg-background pl-8 text-sm text-muted-foreground capitalize">
                          {action}
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={`${module}-${action}-${role.id}`} className="text-center">
                            <Checkbox
                              checked={has(role.id, module, action)}
                              disabled
                              className="mx-auto"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.slice(0, 4).map((role) => {
          const granted = grantedByRole[role.id] ?? new Set<string>()
          const moduleCount = new Set(
            [...granted].map((code) => code.split('.')[0]),
          ).size
          return (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {role.name}
                  {role.isSystem && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permissions</span>
                    <span className="font-medium">{granted.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modules</span>
                    <span className="font-medium">{moduleCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Users</span>
                    <span className="font-medium">{role.userCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
