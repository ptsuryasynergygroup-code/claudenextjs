import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Phone, Mail, Globe, Hash, Users } from 'lucide-react'
import {
  getOrganization,
  getBranches,
  getDepartments,
  getPositions,
} from '@/lib/services/organization/service'
import { getUsers } from '@/lib/services/user/service'
import type { UserDto } from '@/lib/entities/user/schema'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function OrganizationPage() {
  const [organization, branches, departments, positions] = await Promise.all([
    getOrganization(),
    getBranches(),
    getDepartments(),
    getPositions(),
  ])

  // Employee count needs users.view; degrade to org headcount-less if forbidden.
  let users: UserDto[] = []
  try {
    users = await getUsers()
  } catch {
    users = []
  }

  const stats = [
    {
      title: 'Branches',
      value: branches.length,
      active: branches.filter((b) => b.status === 'active').length,
      href: '/dashboard/organization/branches',
    },
    {
      title: 'Departments',
      value: departments.length,
      active: departments.filter((d) => d.status === 'active').length,
      href: '/dashboard/organization/departments',
    },
    {
      title: 'Positions',
      value: positions.length,
      active: positions.filter((p) => p.status === 'active').length,
      href: '/dashboard/organization/positions',
    },
    {
      title: 'Employees',
      value: users.length,
      active: users.filter((u) => u.status === 'active').length,
      href: '/dashboard/users',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">
          Manage your organization structure and settings
        </p>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-7" />
              </div>
              <div>
                <CardTitle className="text-xl">{organization.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{organization.code}</Badge>
                  <Badge variant={organization.status === 'active' ? 'default' : 'secondary'}>
                    {organization.status}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Button variant="outline">Edit Details</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <Hash className="size-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tax Number</p>
                <p className="text-sm text-muted-foreground">{organization.taxNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="size-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{organization.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="size-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{organization.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="size-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{organization.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="size-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Website</p>
                <p className="text-sm text-muted-foreground">{organization.website || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.active} active
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/organization/branches">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4" />
                Manage Branches
              </CardTitle>
              <CardDescription>
                Add, edit, or deactivate branch locations
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/organization/departments">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" />
                Manage Departments
              </CardTitle>
              <CardDescription>
                Configure department structure and assignments
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/organization/positions">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" />
                Manage Positions
              </CardTitle>
              <CardDescription>
                Define job positions and hierarchy levels
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
