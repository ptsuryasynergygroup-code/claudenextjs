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
import { Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createVendorAction,
  createPurchaseRequestAction,
  decidePurchaseRequestAction,
  createPurchaseOrderAction,
  setPurchaseOrderStatusAction,
} from './_actions'
import type {
  VendorDto,
  PurchaseRequestDto,
  PurchaseOrderDto,
  PoStatus,
} from '@/lib/entities/procurement/schema'

const prVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}
const poStatuses: PoStatus[] = ['draft', 'sent', 'received', 'closed', 'cancelled']

export function ProcurementView({
  vendors,
  purchaseRequests,
  purchaseOrders,
  canCreate,
  canEdit,
  canApprove,
}: {
  vendors: VendorDto[]
  purchaseRequests: PurchaseRequestDto[]
  purchaseOrders: PurchaseOrderDto[]
  canCreate: boolean
  canEdit: boolean
  canApprove: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const vendorName = new Map(vendors.map((v) => [v.id, v.name]))

  const [vOpen, setVOpen] = useState(false)
  const [vName, setVName] = useState('')
  const [prOpen, setPrOpen] = useState(false)
  const [prNumber, setPrNumber] = useState('')
  const [prAmount, setPrAmount] = useState('')
  const [poOpen, setPoOpen] = useState(false)
  const [poNumber, setPoNumber] = useState('')
  const [poVendor, setPoVendor] = useState('')
  const [poAmount, setPoAmount] = useState('')

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
        <h1 className="text-2xl font-semibold tracking-tight">Procurement</h1>
        <p className="text-muted-foreground">Vendors, purchase requests and orders</p>
      </div>

      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={vOpen} onOpenChange={setVOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 size-4" />New Vendor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Vendor</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="vname">Name</Label>
                    <Input id="vname" value={vName} onChange={(e) => setVName(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isPending || !vName}
                      onClick={() =>
                        run(async () => {
                          await createVendorAction({ name: vName })
                          setVOpen(false)
                          setVName('')
                        }, 'Vendor created')
                      }
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>{vendors.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.email ?? '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {vendors.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No vendors yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={prOpen} onOpenChange={setPrOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 size-4" />New Request</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prnum">Number</Label>
                      <Input id="prnum" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pramt">Total Amount</Label>
                      <Input id="pramt" type="number" value={prAmount} onChange={(e) => setPrAmount(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isPending || !prNumber}
                      onClick={() =>
                        run(async () => {
                          await createPurchaseRequestAction({ number: prNumber, totalAmount: Number(prAmount) || 0 })
                          setPrOpen(false)
                          setPrNumber('')
                          setPrAmount('')
                        }, 'Request created')
                      }
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requests</CardTitle>
              <CardDescription>{purchaseRequests.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[180px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-mono text-sm">{pr.number}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(pr.totalAmount)}</TableCell>
                      <TableCell><Badge variant={prVariants[pr.status] ?? 'outline'}>{pr.status}</Badge></TableCell>
                      <TableCell>
                        {canApprove && pr.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={isPending}
                              onClick={() => run(() => decidePurchaseRequestAction(pr.id, 'approved'), 'Approved')}>
                              <Check className="mr-1 size-3" />Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending}
                              onClick={() => run(() => decidePurchaseRequestAction(pr.id, 'rejected'), 'Rejected')}>
                              <X className="mr-1 size-3" />Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseRequests.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No requests yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {canCreate && vendors.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={poOpen} onOpenChange={setPoOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 size-4" />New Order</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ponum">Number</Label>
                      <Input id="ponum" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Select value={poVendor} onValueChange={setPoVendor}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="poamt">Total Amount</Label>
                      <Input id="poamt" type="number" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isPending || !poNumber || !poVendor}
                      onClick={() =>
                        run(async () => {
                          await createPurchaseOrderAction({ number: poNumber, vendorId: poVendor, totalAmount: Number(poAmount) || 0 })
                          setPoOpen(false)
                          setPoNumber('')
                          setPoVendor('')
                          setPoAmount('')
                        }, 'Order created')
                      }
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>{purchaseOrders.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">{po.number}</TableCell>
                      <TableCell className="text-sm">{vendorName.get(po.vendorId) ?? '-'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(po.totalAmount)}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={po.status} onValueChange={(v) => run(() => setPurchaseOrderStatusAction(po.id, v as PoStatus), 'Updated')}>
                            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {poStatuses.map((st) => (
                                <SelectItem key={st} value={st}>{st}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{po.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No orders yet.</TableCell></TableRow>
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
