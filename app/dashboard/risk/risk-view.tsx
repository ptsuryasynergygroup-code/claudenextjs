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
import { createRiskAction, setRiskStatusAction, createControlAction } from './_actions'
import type { RiskDto, RiskControlDto, RiskLevel, RiskStatus } from '@/lib/entities/risk/schema'

const levelVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
}
const riskStatuses: RiskStatus[] = ['open', 'mitigated', 'closed']

export function RiskView({
  risks,
  controls,
  canCreate,
  canEdit,
}: {
  risks: RiskDto[]
  controls: RiskControlDto[]
  canCreate: boolean
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const riskTitle = new Map(risks.map((r) => [r.id, r.title]))

  const [rOpen, setROpen] = useState(false)
  const [title, setTitle] = useState('')
  const [likelihood, setLikelihood] = useState<RiskLevel>('medium')
  const [impact, setImpact] = useState<RiskLevel>('medium')

  const [cOpen, setCOpen] = useState(false)
  const [cRisk, setCRisk] = useState('')
  const [cName, setCName] = useState('')
  const [cEff, setCEff] = useState<RiskLevel>('medium')

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
        <h1 className="text-2xl font-semibold tracking-tight">Risk &amp; Compliance</h1>
        <p className="text-muted-foreground">Risk register and controls</p>
      </div>

      <Tabs defaultValue="risks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-4">
          {canCreate && (
            <div className="flex justify-end">
              <Dialog open={rOpen} onOpenChange={setROpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Risk</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Risk</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="rt">Title</Label><Input id="rt" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Likelihood</Label>
                      <Select value={likelihood} onValueChange={(v) => setLikelihood(v as RiskLevel)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Impact</Label>
                      <Select value={impact} onValueChange={(v) => setImpact(v as RiskLevel)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !title}
                      onClick={() => run(async () => { await createRiskAction({ title, likelihood, impact }); setROpen(false); setTitle(''); setLikelihood('medium'); setImpact('medium') }, 'Risk created')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Risk Register</CardTitle><CardDescription>{risks.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Likelihood</TableHead><TableHead>Impact</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {risks.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell><Badge variant={levelVariants[r.likelihood] ?? 'outline'}>{r.likelihood}</Badge></TableCell>
                      <TableCell><Badge variant={levelVariants[r.impact] ?? 'outline'}>{r.impact}</Badge></TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={r.status} onValueChange={(v) => run(() => setRiskStatusAction(r.id, v as RiskStatus), 'Updated')}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{riskStatuses.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{r.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {risks.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No risks yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          {canCreate && risks.length > 0 && (
            <div className="flex justify-end">
              <Dialog open={cOpen} onOpenChange={setCOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Control</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Control</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Risk</Label>
                      <Select value={cRisk} onValueChange={setCRisk}>
                        <SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
                        <SelectContent>{risks.map((r) => (<SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="cn">Name</Label><Input id="cn" value={cName} onChange={(e) => setCName(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Effectiveness</Label>
                      <Select value={cEff} onValueChange={(v) => setCEff(v as RiskLevel)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button disabled={isPending || !cRisk || !cName}
                      onClick={() => run(async () => { await createControlAction({ riskId: cRisk, name: cName, effectiveness: cEff }); setCOpen(false); setCRisk(''); setCName(''); setCEff('medium') }, 'Control added')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle>Controls</CardTitle><CardDescription>{controls.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Risk</TableHead><TableHead>Effectiveness</TableHead></TableRow></TableHeader>
                <TableBody>
                  {controls.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm">{riskTitle.get(c.riskId) ?? '-'}</TableCell>
                      <TableCell><Badge variant={levelVariants[c.effectiveness] ?? 'outline'}>{c.effectiveness}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {controls.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No controls yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
