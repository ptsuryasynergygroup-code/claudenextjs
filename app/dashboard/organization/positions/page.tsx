'use client'

import { useState } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Briefcase, MoreHorizontal, Plus, Search, Layers } from 'lucide-react'
import { positions, departments, getDepartmentById } from '@/lib/data/organization'
import { format } from 'date-fns'

const levelLabels: Record<number, string> = {
  1: 'Director',
  2: 'Manager',
  3: 'Senior',
  4: 'Staff',
  5: 'Junior',
}

export default function PositionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const filteredPositions = positions.filter((pos) => {
    const matchesSearch =
      pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || pos.departmentId === departmentFilter
    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Positions</h1>
          <p className="text-muted-foreground">
            Manage job positions and hierarchy levels
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Positions</CardTitle>
              <CardDescription>
                {positions.length} positions total, {positions.filter((p) => p.status === 'active').length} active
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
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
                  placeholder="Search positions..."
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
                <TableHead>Position</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((pos) => {
                const department = getDepartmentById(pos.departmentId)
                return (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Briefcase className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{pos.name}</p>
                          {pos.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {pos.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pos.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {department ? (
                        <span className="text-sm">{department.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="size-3 text-muted-foreground" />
                        <span className="text-sm">
                          Level {pos.level}
                          {levelLabels[pos.level] && (
                            <span className="text-muted-foreground"> ({levelLabels[pos.level]})</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pos.status === 'active' ? 'default' : 'secondary'}>
                        {pos.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(pos.createdAt, 'MMM d, yyyy')}
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
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Position</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            {pos.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
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
