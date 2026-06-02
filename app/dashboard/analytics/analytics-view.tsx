'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import { createKpiAction } from './_actions'
import type { KpiDto } from '@/lib/entities/analytics/schema'

export function AnalyticsView({ kpis, canCreate }: { kpis: KpiDto[]; canCreate: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [unit, setUnit] = useState('')

  function onCreate() {
    startTransition(async () => {
      try {
        await createKpiAction({ name, target: Number(target) || 0, current: Number(current) || 0, unit: unit || undefined })
        toast.success('KPI created')
        setOpen(false)
        setName('')
        setTarget('')
        setCurrent('')
        setUnit('')
      } catch {
        toast.error('Create failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">KPI monitoring</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New KPI</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New KPI</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="kn">Name</Label><Input id="kn" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="kt">Target</Label><Input id="kt" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="kc">Current</Label><Input id="kc" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="ku">Unit</Label><Input id="ku" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, IDR, count..." /></div>
              </div>
              <DialogFooter>
                <Button onClick={onCreate} disabled={isPending || !name}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {kpis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No KPIs yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => {
            const pct = k.target > 0 ? Math.min(100, Math.round((k.current / k.target) * 100)) : 0
            return (
              <Card key={k.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{k.name}</CardTitle>
                  {k.period && <CardDescription>{k.period}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {new Intl.NumberFormat('id-ID').format(k.current)}
                      {k.unit ? ` ${k.unit}` : ''}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {new Intl.NumberFormat('id-ID').format(k.target)}
                    </span>
                  </div>
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">{pct}% of target</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
