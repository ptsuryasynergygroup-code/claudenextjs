'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createCustomerAction, createLeadAction, createOpportunityAction } from './_actions'
import type {
  CustomerDto,
  LeadDto,
  OpportunityDto,
  LeadStatus,
  OpportunityStage,
} from '@/lib/entities/crm/schema'

export function CrmView({
  customers,
  leads,
  opportunities,
  canCreate,
}: {
  customers: CustomerDto[]
  leads: LeadDto[]
  opportunities: OpportunityDto[]
  canCreate: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const customerName = new Map(customers.map((c) => [c.id, c.name]))

  const [cOpen, setCOpen] = useState(false)
  const [cName, setCName] = useState('')
  const [lOpen, setLOpen] = useState(false)
  const [lName, setLName] = useState('')
  const [lStatus, setLStatus] = useState<LeadStatus>('new')
  const [oOpen, setOOpen] = useState(false)
  const [oName, setOName] = useState('')
  const [oAmount, setOAmount] = useState('')
  const [oStage, setOStage] = useState<OpportunityStage>('prospecting')
  const [oCustomer, setOCustomer] = useState('none')

  function run(fn: () => Promise<void>, okMsg: string) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(okMsg)
      } catch {
        toast.error('Action failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">Customers, leads and opportunities</p>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={cOpen} onOpenChange={setCOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Customer</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="cname">Name</Label>
                    <Input id="cname" value={cName} onChange={(e) => setCName(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !cName}
                      onClick={() => run(async () => { await createCustomerAction({ name: cName }); setCOpen(false); setCName('') }, 'Customer created')}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Customers</CardTitle><CardDescription>{customers.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email ?? '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {customers.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No customers yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={lOpen} onOpenChange={setLOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Lead</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lname">Name</Label>
                      <Input id="lname" value={lName} onChange={(e) => setLName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={lStatus} onValueChange={(v) => setLStatus(v as LeadStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !lName}
                      onClick={() => run(async () => { await createLeadAction({ name: lName, status: lStatus }); setLOpen(false); setLName(''); setLStatus('new') }, 'Lead created')}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Leads</CardTitle><CardDescription>{leads.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.source ?? '-'}</TableCell>
                      <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No leads yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={oOpen} onOpenChange={setOOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Opportunity</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="oname">Name</Label>
                      <Input id="oname" value={oName} onChange={(e) => setOName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oamt">Amount</Label>
                      <Input id="oamt" type="number" value={oAmount} onChange={(e) => setOAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select value={oStage} onValueChange={(v) => setOStage(v as OpportunityStage)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospecting">Prospecting</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={oCustomer} onValueChange={setOCustomer}>
                        <SelectTrigger><SelectValue placeholder="No customer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No customer</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !oName}
                      onClick={() => run(async () => {
                        await createOpportunityAction({ name: oName, amount: Number(oAmount) || 0, stage: oStage, customerId: oCustomer === 'none' ? null : oCustomer })
                        setOOpen(false); setOName(''); setOAmount(''); setOStage('prospecting'); setOCustomer('none')
                      }, 'Opportunity created')}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Opportunities</CardTitle><CardDescription>{opportunities.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader>
                <TableBody>
                  {opportunities.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="text-sm">{o.customerId ? customerName.get(o.customerId) ?? '-' : '-'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(o.amount)}</TableCell>
                      <TableCell><Badge variant="outline">{o.stage}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {opportunities.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No opportunities yet.</TableCell></TableRow>
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
