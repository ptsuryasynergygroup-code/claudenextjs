'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Plus, Search, Mail, Phone, Building2 } from 'lucide-react'
import { users } from '@/lib/data/users'
import { branches, departments, getDepartmentById, getBranchById, getPositionById } from '@/lib/data/organization'
import { getUserRoles } from '@/lib/data/roles'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || user.departmentId === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {users.filter((u) => u.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const department = user.departmentId ? getDepartmentById(user.departmentId) : null
                const position = user.positionId ? getPositionById(user.positionId) : null
                const branch = user.branchId ? getBranchById(user.branchId) : null
                const userRoles = getUserRoles(user.id)
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            href={`/dashboard/users/${user.id}`}
                            className="font-medium hover:underline"
                          >
                            {user.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.employeeId}</Badge>
                    </TableCell>
                    <TableCell>
                      {department ? (
                        <div>
                          <p className="text-sm">{department.name}</p>
                          {position && (
                            <p className="text-xs text-muted-foreground">{position.name}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userRoles.slice(0, 2).map((role) => (
                          <Badge key={role.id} variant="secondary" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                        {userRoles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{userRoles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[user.status]}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin
                        ? formatDistanceToNow(user.lastLogin, { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/users/${user.id}`}>View Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Manage Roles</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'active' ? (
                            <>
                              <DropdownMenuItem>Deactivate</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                            </>
                          ) : user.status === 'suspended' ? (
                            <DropdownMenuItem>Reactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>Activate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
