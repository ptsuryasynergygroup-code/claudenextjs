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
  createProductAction,
  createWarehouseAction,
  recordMovementAction,
  createTransferAction,
} from './_actions'
import type {
  ProductDto,
  WarehouseDto,
  StockDto,
  StockMovementDto,
  StockMovementType,
  StockTransferDto,
} from '@/lib/entities/inventory/schema'

export function InventoryView({
  products,
  warehouses,
  stocks,
  movements,
  transfers,
  features,
  canCreate,
}: {
  products: ProductDto[]
  warehouses: WarehouseDto[]
  stocks: StockDto[]
  movements: StockMovementDto[]
  transfers: StockTransferDto[]
  features: { transfer: boolean }
  canCreate: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const productName = new Map(products.map((p) => [p.id, p.name]))
  const productMin = new Map(products.map((p) => [p.id, p.minStock]))
  const warehouseName = new Map(warehouses.map((w) => [w.id, w.name]))

  const [pOpen, setPOpen] = useState(false)
  const [sku, setSku] = useState('')
  const [pName, setPName] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [pCategory, setPCategory] = useState('')
  const [pBarcode, setPBarcode] = useState('')
  const [pCost, setPCost] = useState('')
  const [pSell, setPSell] = useState('')
  const [pMin, setPMin] = useState('')

  const [tOpen, setTOpen] = useState(false)
  const [tProduct, setTProduct] = useState('')
  const [tFrom, setTFrom] = useState('')
  const [tTo, setTTo] = useState('')
  const [tQty, setTQty] = useState('')

  const [wOpen, setWOpen] = useState(false)
  const [wCode, setWCode] = useState('')
  const [wName, setWName] = useState('')

  const [mOpen, setMOpen] = useState(false)
  const [mProduct, setMProduct] = useState('')
  const [mWarehouse, setMWarehouse] = useState('')
  const [mType, setMType] = useState<StockMovementType>('in')
  const [mQty, setMQty] = useState('')

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
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Products, stock and movements</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          {features.transfer && <TabsTrigger value="transfers">Transfers</TabsTrigger>}
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={pOpen} onOpenChange={setPOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Product</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="un">Unit</Label><Input id="un" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="pn">Name</Label><Input id="pn" value={pName} onChange={(e) => setPName(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label htmlFor="cat">Category</Label><Input id="cat" value={pCategory} onChange={(e) => setPCategory(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="bc">Barcode</Label><Input id="bc" value={pBarcode} onChange={(e) => setPBarcode(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2"><Label htmlFor="cost">Cost</Label><Input id="cost" type="number" value={pCost} onChange={(e) => setPCost(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="sell">Sell</Label><Input id="sell" type="number" value={pSell} onChange={(e) => setPSell(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="min">Min Stock</Label><Input id="min" type="number" value={pMin} onChange={(e) => setPMin(e.target.value)} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !sku || !pName}
                      onClick={() => run(async () => { await createProductAction({ sku, name: pName, unit, category: pCategory || null, barcode: pBarcode || null, costPrice: Number(pCost) || 0, sellPrice: Number(pSell) || 0, minStock: Number(pMin) || 0 }); setPOpen(false); setSku(''); setPName(''); setUnit('pcs'); setPCategory(''); setPBarcode(''); setPCost(''); setPSell(''); setPMin('') }, 'Product created')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Products</CardTitle><CardDescription>{products.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Sell Price</TableHead><TableHead>Min</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.category ?? '-'}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(p.sellPrice)}</TableCell>
                      <TableCell className="text-sm">{p.minStock}</TableCell>
                      <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No products yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={wOpen} onOpenChange={setWOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Warehouse</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Warehouse</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="wc">Code</Label><Input id="wc" value={wCode} onChange={(e) => setWCode(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="wn">Name</Label><Input id="wn" value={wName} onChange={(e) => setWName(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !wCode || !wName}
                      onClick={() => run(async () => { await createWarehouseAction({ code: wCode, name: wName }); setWOpen(false); setWCode(''); setWName('') }, 'Warehouse created')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Warehouses</CardTitle><CardDescription>{warehouses.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {warehouses.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-sm">{w.code}</TableCell>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell><Badge variant="secondary">{w.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {warehouses.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No warehouses yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader><CardTitle>Stock Levels</CardTitle><CardDescription>{stocks.length} entries</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead>Quantity</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {stocks.map((st) => {
                    const min = productMin.get(st.productId) ?? 0
                    const low = min > 0 && st.quantity <= min
                    return (
                      <TableRow key={st.id}>
                        <TableCell className="text-sm">{productName.get(st.productId) ?? '-'}</TableCell>
                        <TableCell className="text-sm">{warehouseName.get(st.warehouseId) ?? '-'}</TableCell>
                        <TableCell className="font-medium">{st.quantity}</TableCell>
                        <TableCell>{low && <Badge variant="destructive">Low stock</Badge>}</TableCell>
                      </TableRow>
                    )
                  })}
                  {stocks.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No stock yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {canCreate && products.length > 0 && warehouses.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={mOpen} onOpenChange={setMOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />Record Movement</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select value={mProduct} onValueChange={setMProduct}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Warehouse</Label>
                      <Select value={mWarehouse} onValueChange={setMWarehouse}>
                        <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                        <SelectContent>{warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={mType} onValueChange={(v) => setMType(v as StockMovementType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">In</SelectItem>
                          <SelectItem value="out">Out</SelectItem>
                          <SelectItem value="adjust">Adjust (set to)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="mq">Quantity</Label><Input id="mq" type="number" value={mQty} onChange={(e) => setMQty(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !mProduct || !mWarehouse || !mQty}
                      onClick={() => run(async () => {
                        await recordMovementAction({ productId: mProduct, warehouseId: mWarehouse, type: mType, quantity: Number(mQty) || 0 })
                        setMOpen(false); setMProduct(''); setMWarehouse(''); setMType('in'); setMQty('')
                      }, 'Movement recorded')}>Record</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Stock Movements</CardTitle><CardDescription>{movements.length} recent</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead>Type</TableHead><TableHead>Qty</TableHead></TableRow></TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{productName.get(m.productId) ?? '-'}</TableCell>
                      <TableCell className="text-sm">{warehouseName.get(m.warehouseId) ?? '-'}</TableCell>
                      <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                      <TableCell>{m.quantity}</TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No movements yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {features.transfer && (
          <TabsContent value="transfers" className="space-y-4">
            {canCreate && products.length > 0 && warehouses.length >= 2 && (
              <div className="flex justify-end">
                <Dialog open={tOpen} onOpenChange={setTOpen}>
                  <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Transfer</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Stock Transfer</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={tProduct} onValueChange={setTProduct}>
                          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>From</Label>
                          <Select value={tFrom} onValueChange={setTFrom}>
                            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                            <SelectContent>{warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>To</Label>
                          <Select value={tTo} onValueChange={setTTo}>
                            <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                            <SelectContent>{warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="tq">Quantity</Label><Input id="tq" type="number" value={tQty} onChange={(e) => setTQty(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                      <Button disabled={isPending || !tProduct || !tFrom || !tTo || tFrom === tTo || !tQty}
                        onClick={() => run(async () => {
                          await createTransferAction({ productId: tProduct, fromWarehouseId: tFrom, toWarehouseId: tTo, quantity: Number(tQty) || 0 })
                          setTOpen(false); setTProduct(''); setTFrom(''); setTTo(''); setTQty('')
                        }, 'Transfer recorded')}>Transfer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <Card>
              <CardHeader><CardTitle>Stock Transfers</CardTitle><CardDescription>{transfers.length} recent</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Qty</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{productName.get(t.productId) ?? '-'}</TableCell>
                        <TableCell className="text-sm">{warehouseName.get(t.fromWarehouseId) ?? '-'}</TableCell>
                        <TableCell className="text-sm">{warehouseName.get(t.toWarehouseId) ?? '-'}</TableCell>
                        <TableCell>{t.quantity}</TableCell>
                      </TableRow>
                    ))}
                    {transfers.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No transfers yet.</TableCell></TableRow>)}
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
