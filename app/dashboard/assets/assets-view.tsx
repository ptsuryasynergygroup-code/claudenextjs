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
import { Plus, Check } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  createAssetAction,
  createMaintenanceAction,
  setMaintenanceStatusAction,
} from './_actions'
import type { AssetDto, AssetMaintenanceDto } from '@/lib/entities/asset/schema'

const assetVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  maintenance: 'secondary',
  disposed: 'destructive',
}
const maintVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline',
  done: 'default',
  cancelled: 'destructive',
}

export function AssetsView({
  assets,
  maintenances,
  canCreate,
  canEdit,
}: {
  assets: AssetDto[]
  maintenances: AssetMaintenanceDto[]
  canCreate: boolean
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const assetName = new Map(assets.map((a) => [a.id, a.name]))

  const [aOpen, setAOpen] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [acqDate, setAcqDate] = useState('')
  const [cost, setCost] = useState('')

  const [mOpen, setMOpen] = useState(false)
  const [mAsset, setMAsset] = useState('')
  const [mDate, setMDate] = useState('')
  const [mDesc, setMDesc] = useState('')

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
        <h1 className="text-2xl font-semibold tracking-tight">Asset Management</h1>
        <p className="text-muted-foreground">Assets and maintenance</p>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={aOpen} onOpenChange={setAOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Asset</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Asset</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="ac">Code</Label><Input id="ac" value={code} onChange={(e) => setCode(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="an">Name</Label><Input id="an" value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="ad">Acquisition Date</Label><Input id="ad" type="date" value={acqDate} onChange={(e) => setAcqDate(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="acost">Acquisition Cost</Label><Input id="acost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !code || !name || !acqDate}
                      onClick={() => run(async () => {
                        await createAssetAction({ code, name, acquisitionDate: acqDate, acquisitionCost: Number(cost) || 0 })
                        setAOpen(false); setCode(''); setName(''); setAcqDate(''); setCost('')
                      }, 'Asset created')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Assets</CardTitle><CardDescription>{assets.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Acquired</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.code}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(a.acquisitionDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{new Intl.NumberFormat('id-ID').format(a.acquisitionCost)}</TableCell>
                      <TableCell><Badge variant={assetVariants[a.status] ?? 'outline'}>{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No assets yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          {canCreate && assets.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={mOpen} onOpenChange={setMOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />Schedule Maintenance</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Asset</Label>
                      <Select value={mAsset} onValueChange={setMAsset}>
                        <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                        <SelectContent>{assets.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="md">Scheduled Date</Label><Input id="md" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="mdesc">Description</Label><Input id="mdesc" value={mDesc} onChange={(e) => setMDesc(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !mAsset || !mDate}
                      onClick={() => run(async () => {
                        await createMaintenanceAction({ assetId: mAsset, scheduledDate: mDate, description: mDesc || undefined })
                        setMOpen(false); setMAsset(''); setMDate(''); setMDesc('')
                      }, 'Maintenance scheduled')}>Schedule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Maintenance</CardTitle><CardDescription>{maintenances.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Scheduled</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintenances.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{assetName.get(m.assetId) ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(m.scheduledDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell><Badge variant={maintVariants[m.status] ?? 'outline'}>{m.status}</Badge></TableCell>
                      <TableCell>
                        {canEdit && m.status === 'scheduled' && (
                          <Button size="sm" variant="outline" disabled={isPending}
                            onClick={() => run(() => setMaintenanceStatusAction(m.id, 'done'), 'Marked done')}>
                            <Check className="mr-1 size-3" />Done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {maintenances.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No maintenance records.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
