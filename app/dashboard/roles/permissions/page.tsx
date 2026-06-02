'use client'

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
import { roles, permissions, rolePermissions, hasPermission } from '@/lib/data/roles'
import { MODULES, ACTIONS } from '@/lib/types'
import Link from 'next/link'

// Group permissions by module
const permissionsByModule = MODULES.map((module) => ({
  module,
  actions: ACTIONS.filter((action) =>
    permissions.some((p) => p.module === module && p.action === action)
  ),
}))

export default function PermissionsPage() {
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
                {permissionsByModule.map((moduleGroup) => (
                  <>
                    {/* Module Header Row */}
                    <TableRow key={`header-${moduleGroup.module}`} className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 font-medium capitalize">
                        {moduleGroup.module.replace('-', ' ')}
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={`${moduleGroup.module}-${role.id}-header`} />
                      ))}
                    </TableRow>
                    {/* Action Rows */}
                    {moduleGroup.actions.map((action) => (
                      <TableRow key={`${moduleGroup.module}-${action}`}>
                        <TableCell className="sticky left-0 bg-background pl-8 text-sm text-muted-foreground capitalize">
                          {action}
                        </TableCell>
                        {roles.map((role) => {
                          const hasAccess = hasPermission(role.id, moduleGroup.module, action)
                          return (
                            <TableCell key={`${moduleGroup.module}-${action}-${role.id}`} className="text-center">
                              <Checkbox
                                checked={hasAccess}
                                disabled={role.isSystem}
                                className="mx-auto"
                              />
                            </TableCell>
                          )
                        })}
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
          const rolePerms = rolePermissions.filter((rp) => rp.roleId === role.id)
          const moduleCount = new Set(
            rolePerms.map((rp) => {
              const perm = permissions.find((p) => p.id === rp.permissionId)
              return perm?.module
            })
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
                    <span className="font-medium">{rolePerms.length}</span>
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
