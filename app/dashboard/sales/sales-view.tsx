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
import {
  createQuotationAction,
  setQuotationStatusAction,
  createSalesOrderAction,
  setSalesOrderStatusAction,
} from './_actions'
import type {
  QuotationDto,
  SalesOrderDto,
  QuotationStatus,
  SalesOrderStatus,
} from '@/lib/entities/sales/schema'

const quoStatuses: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected']
const soStatuses: SalesOrderStatus[] = ['draft', 'confirmed', 'fulfilled', 'cancelled']

export function SalesView({
  quotations,
  salesOrders,
  customers,
  canCreate,
  canEdit,
}: {
  quotations: QuotationDto[]
  salesOrders: SalesOrderDto[]
  customers: { id: string; name: string }[]
  canCreate: boolean
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const customerName = new Map(customers.map((c) => [c.id, c.name]))

  const [qOpen, setQOpen] = useState(false)
  const [qNumber, setQNumber] = useState('')
  const [qCustomer, setQCustomer] = useState('')
  const [qAmount, setQAmount] = useState('')
  const [soOpen, setSoOpen] = useState(false)
  const [soNumber, setSoNumber] = useState('')
  const [soCustomer, setSoCustomer] = useState('')
  const [soAmount, setSoAmount] = useState('')

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
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">Quotations and sales orders</p>
      </div>

      <Tabs defaultValue="quotations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="orders">Sales Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="quotations" className="space-y-4">
          {canCreate && customers.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={qOpen} onOpenChange={setQOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Quotation</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qnum">Number</Label>
                      <Input id="qnum" value={qNumber} onChange={(e) => setQNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={qCustomer} onValueChange={setQCustomer}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qamt">Amount</Label>
                      <Input id="qamt" type="number" value={qAmount} onChange={(e) => setQAmount(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !qNumber || !qCustomer}
                      onClick={() => run(async () => {
                        await createQuotationAction({ number: qNumber, customerId: qCustomer, amount: Number(qAmount) || 0 })
                        setQOpen(false); setQNumber(''); setQCustomer(''); setQAmount('')
                      }, 'Quotation created')}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Quotations</CardTitle><CardDescription>{quotations.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-sm">{q.number}</TableCell>
                      <TableCell className="text-sm">{customerName.get(q.customerId) ?? '-'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(q.amount)}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={q.status} onValueChange={(v) => run(() => setQuotationStatusAction(q.id, v as QuotationStatus), 'Updated')}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{quoStatuses.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{q.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {quotations.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No quotations yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {canCreate && customers.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={soOpen} onOpenChange={setSoOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Sales Order</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Sales Order</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sonum">Number</Label>
                      <Input id="sonum" value={soNumber} onChange={(e) => setSoNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={soCustomer} onValueChange={setSoCustomer}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="soamt">Amount</Label>
                      <Input id="soamt" type="number" value={soAmount} onChange={(e) => setSoAmount(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !soNumber || !soCustomer}
                      onClick={() => run(async () => {
                        await createSalesOrderAction({ number: soNumber, customerId: soCustomer, amount: Number(soAmount) || 0 })
                        setSoOpen(false); setSoNumber(''); setSoCustomer(''); setSoAmount('')
                      }, 'Sales order created')}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Sales Orders</CardTitle><CardDescription>{salesOrders.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {salesOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">{o.number}</TableCell>
                      <TableCell className="text-sm">{customerName.get(o.customerId) ?? '-'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(o.amount)}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={o.status} onValueChange={(v) => run(() => setSalesOrderStatusAction(o.id, v as SalesOrderStatus), 'Updated')}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{soStatuses.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{o.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {salesOrders.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No sales orders yet.</TableCell></TableRow>
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
