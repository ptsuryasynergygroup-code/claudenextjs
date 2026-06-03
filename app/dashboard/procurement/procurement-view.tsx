"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Check, X, Trash2, PackageCheck } from "lucide-react"
import { toast } from "sonner"
import {
  createVendorAction, createEvaluationAction, createPurchaseRequestAction,
  decidePurchaseRequestAction, createPurchaseOrderAction, setPurchaseOrderStatusAction,
  receivePurchaseOrderAction,
} from "./_actions"
import type {
  VendorDto, VendorEvaluationDto, PurchaseRequestDto, PurchaseOrderDto, PoStatus,
} from "@/lib/entities/procurement/schema"

const idr = (n: number) => new Intl.NumberFormat("id-ID").format(n)
const prVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { draft: "outline", pending: "secondary", approved: "default", rejected: "destructive" }
const poStatuses: PoStatus[] = ["draft", "sent", "received", "closed", "cancelled"]

type Features = { receiving: boolean; evaluation: boolean }
type Perms = { canCreate: boolean; canEdit: boolean; canApprove: boolean }
type RunFn = (fn: () => Promise<void>, ok: string) => void
type ItemRow = { description: string; quantity: string; unitPrice: string }

export function ProcurementView({
  vendors, purchaseRequests, purchaseOrders, evaluations, features, perms,
}: {
  vendors: VendorDto[]
  purchaseRequests: PurchaseRequestDto[]
  purchaseOrders: PurchaseOrderDto[]
  evaluations: VendorEvaluationDto[]
  features: Features
  perms: Perms
}) {
  const [isPending, startTransition] = useTransition()
  const vendorName = new Map(vendors.map((v) => [v.id, v.name]))

  function run(fn: () => Promise<void>, ok: string) {
    startTransition(async () => {
      try { await fn(); toast.success(ok) } catch { toast.error("Action failed") }
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
          {features.evaluation && <TabsTrigger value="evaluations">Evaluations</TabsTrigger>}
        </TabsList>

        {/* Vendors -------------------------------------------------------- */}
        <TabsContent value="vendors" className="space-y-4">
          {perms.canCreate && <div className="flex justify-end"><VendorDialog isPending={isPending} run={run} /></div>}
          <Card>
            <CardHeader><CardTitle>Vendors</CardTitle><CardDescription>{vendors.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.email ?? "-"}</TableCell>
                      <TableCell>{v.rating > 0 ? "★".repeat(v.rating) : "-"}</TableCell>
                      <TableCell><Badge variant="secondary">{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {vendors.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No vendors yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests ------------------------------------------------------- */}
        <TabsContent value="requests" className="space-y-4">
          {perms.canCreate && <div className="flex justify-end"><PrDialog isPending={isPending} run={run} /></div>}
          <Card>
            <CardHeader><CardTitle>Purchase Requests</CardTitle><CardDescription>{purchaseRequests.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="w-[180px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {purchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-mono text-sm">{pr.number}</TableCell>
                      <TableCell className="text-sm">{pr.items.length}</TableCell>
                      <TableCell>{idr(pr.totalAmount)}</TableCell>
                      <TableCell><Badge variant={prVariants[pr.status] ?? "outline"}>{pr.status}</Badge></TableCell>
                      <TableCell>
                        {perms.canApprove && pr.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => decidePurchaseRequestAction(pr.id, "approved"), "Approved")}><Check className="mr-1 size-3" />Approve</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => run(() => decidePurchaseRequestAction(pr.id, "rejected"), "Rejected")}><X className="mr-1 size-3" />Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseRequests.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No requests yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders --------------------------------------------------------- */}
        <TabsContent value="orders" className="space-y-4">
          {perms.canCreate && vendors.length > 0 && <div className="flex justify-end"><PoDialog vendors={vendors} isPending={isPending} run={run} /></div>}
          <Card>
            <CardHeader><CardTitle>Purchase Orders</CardTitle><CardDescription>{purchaseOrders.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Vendor</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="w-[160px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">{po.number}</TableCell>
                      <TableCell className="text-sm">{vendorName.get(po.vendorId) ?? "-"}</TableCell>
                      <TableCell>{idr(po.totalAmount)}</TableCell>
                      <TableCell>
                        {perms.canEdit ? (
                          <Select value={po.status} onValueChange={(v) => run(() => setPurchaseOrderStatusAction(po.id, v as PoStatus), "Updated")}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{poStatuses.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : <Badge variant="secondary">{po.status}</Badge>}
                      </TableCell>
                      <TableCell>
                        {features.receiving && perms.canEdit && (
                          <ReceiveDialog po={po} isPending={isPending} run={run} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseOrders.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No orders yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluations ---------------------------------------------------- */}
        {features.evaluation && (
          <TabsContent value="evaluations" className="space-y-4">
            {perms.canEdit && vendors.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Evaluate Vendor</CardTitle></CardHeader>
                <CardContent><EvaluationForm vendors={vendors} isPending={isPending} run={run} /></CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Evaluations</CardTitle><CardDescription>{evaluations.length} total</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Score</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {evaluations.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{vendorName.get(e.vendorId) ?? "-"}</TableCell>
                        <TableCell>{"★".repeat(e.score)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    {evaluations.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No evaluations yet.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// --- shared items editor -----------------------------------------------------

function ItemsEditor({ items, setItems }: { items: ItemRow[]; setItems: (v: ItemRow[]) => void }) {
  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  return (
    <div className="space-y-2">
      <Label>Items</Label>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input className="flex-1" placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
          <Input className="w-20" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} />
          <Input className="w-28" type="number" placeholder="Unit price" value={it.unitPrice} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, unitPrice: e.target.value } : x))} />
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /></Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setItems([...items, { description: "", quantity: "1", unitPrice: "" }])}><Plus className="mr-1 size-3" />Add item</Button>
        <span className="text-sm font-medium">Total {idr(total)}</span>
      </div>
    </div>
  )
}

function mapItems(items: ItemRow[]) {
  return items
    .filter((i) => i.description)
    .map((i) => ({ description: i.description, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) || 0 }))
}

// --- dialogs -----------------------------------------------------------------

function VendorDialog({ isPending, run }: { isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Vendor</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Vendor</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !name} onClick={() => run(async () => { await createVendorAction({ name, email: email || undefined }); setOpen(false); setName(""); setEmail("") }, "Vendor created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PrDialog({ isPending, run }: { isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState("")
  const [items, setItems] = useState<ItemRow[]>([{ description: "", quantity: "1", unitPrice: "" }])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Request</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Number</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
          <ItemsEditor items={items} setItems={setItems} />
        </div>
        <DialogFooter>
          <Button disabled={isPending || !number || mapItems(items).length === 0}
            onClick={() => run(async () => { await createPurchaseRequestAction({ number, items: mapItems(items) }); setOpen(false); setNumber(""); setItems([{ description: "", quantity: "1", unitPrice: "" }]) }, "Request created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PoDialog({ vendors, isPending, run }: { vendors: VendorDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [items, setItems] = useState<ItemRow[]>([{ description: "", quantity: "1", unitPrice: "" }])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Order</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Number</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <ItemsEditor items={items} setItems={setItems} />
        </div>
        <DialogFooter>
          <Button disabled={isPending || !number || !vendorId || mapItems(items).length === 0}
            onClick={() => run(async () => { await createPurchaseOrderAction({ number, vendorId, items: mapItems(items) }); setOpen(false); setNumber(""); setVendorId(""); setItems([{ description: "", quantity: "1", unitPrice: "" }]) }, "Order created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReceiveDialog({ po, isPending, run }: { po: PurchaseOrderDto; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [received, setReceived] = useState<Record<string, string>>(
    Object.fromEntries(po.items.map((i) => [i.id, String(i.receivedQty)])),
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><PackageCheck className="mr-1 size-3" />Receive</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive goods — {po.number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {po.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{it.description} <span className="text-muted-foreground">(ordered {it.quantity})</span></span>
              <Input className="w-24" type="number" value={received[it.id] ?? "0"} onChange={(e) => setReceived({ ...received, [it.id]: e.target.value })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button disabled={isPending}
            onClick={() => run(async () => {
              await receivePurchaseOrderAction(po.id, po.items.map((it) => ({ itemId: it.id, receivedQty: Number(received[it.id]) || 0 })))
              setOpen(false)
            }, "Goods received")}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EvaluationForm({ vendors, isPending, run }: { vendors: VendorDto[]; isPending: boolean; run: RunFn }) {
  const [vendorId, setVendorId] = useState("")
  const [score, setScore] = useState("5")
  const [notes, setNotes] = useState("")
  return (
    <div className="flex gap-2 items-end flex-wrap">
      <div className="flex-1 min-w-[180px] space-y-1"><Label>Vendor</Label>
        <Select value={vendorId} onValueChange={setVendorId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="w-28 space-y-1"><Label>Score</Label>
        <Select value={score} onValueChange={setScore}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="flex-1 min-w-[180px] space-y-1"><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <Button disabled={isPending || !vendorId} onClick={() => run(async () => { await createEvaluationAction({ vendorId, score: Number(score), notes: notes || undefined }); setNotes("") }, "Evaluation saved")}>Save</Button>
    </div>
  )
}
