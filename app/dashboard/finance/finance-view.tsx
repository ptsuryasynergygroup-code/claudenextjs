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
import { Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  createAccountAction, createInvoiceAction, createPaymentAction,
  createJournalEntryAction, postJournalEntryAction, setBudgetAction,
} from "./_actions"
import type {
  AccountDto, InvoiceDto, PaymentDto, JournalEntryDto, BudgetDto,
} from "@/lib/entities/finance/schema"

const idr = (n: number) => new Intl.NumberFormat("id-ID").format(n)
const invoiceVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline", sent: "secondary", paid: "default", overdue: "destructive", void: "secondary",
}

type Features = { budget: boolean }
type Perms = { canCreate: boolean; canEdit: boolean }
type RunFn = (fn: () => Promise<void>, ok: string) => void

export function FinanceView({
  accounts, invoices, payments, journal, budgets, features, perms,
}: {
  accounts: AccountDto[]
  invoices: InvoiceDto[]
  payments: PaymentDto[]
  journal: JournalEntryDto[]
  budgets: BudgetDto[]
  features: Features
  perms: Perms
}) {
  const [isPending, startTransition] = useTransition()
  const acctName = new Map(accounts.map((a) => [a.id, `${a.code} ${a.name}`]))
  const invoiceNo = new Map(invoices.map((i) => [i.id, i.number]))

  function run(fn: () => Promise<void>, ok: string) {
    startTransition(async () => {
      try { await fn(); toast.success(ok) } catch { toast.error("Action failed") }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">Accounts, journal, invoices, payments{features.budget ? ", budgets" : ""}</p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          {features.budget && <TabsTrigger value="budgets">Budgets</TabsTrigger>}
        </TabsList>

        {/* Accounts ------------------------------------------------------- */}
        <TabsContent value="accounts" className="space-y-4">
          {perms.canCreate && (
            <div className="flex justify-end"><AccountDialog isPending={isPending} run={run} /></div>
          )}
          <Card>
            <CardHeader><CardTitle>Chart of Accounts</CardTitle><CardDescription>{accounts.length} accounts</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.code}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No accounts yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal -------------------------------------------------------- */}
        <TabsContent value="journal" className="space-y-4">
          {perms.canCreate && accounts.length > 0 && (
            <div className="flex justify-end"><JournalDialog accounts={accounts} isPending={isPending} run={run} /></div>
          )}
          <Card>
            <CardHeader><CardTitle>Journal Entries</CardTitle><CardDescription>{journal.length} entries (double-entry)</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {journal.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No journal entries yet.</p>}
              {journal.map((j) => {
                const total = j.lines.reduce((s, l) => s + l.debit, 0)
                return (
                  <div key={j.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">
                        <span className="font-medium">{format(j.entryDate, "MMM d, yyyy")}</span>
                        {j.reference && <span className="text-muted-foreground"> · {j.reference}</span>}
                        {j.memo && <span className="text-muted-foreground"> — {j.memo}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={j.status === "posted" ? "default" : "outline"}>{j.status}</Badge>
                        {perms.canEdit && j.status === "draft" && (
                          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => postJournalEntryAction(j.id), "Posted")}>Post</Button>
                        )}
                      </div>
                    </div>
                    <Table>
                      <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {j.lines.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm">{acctName.get(l.accountId) ?? l.accountId}</TableCell>
                            <TableCell className="text-right">{l.debit ? idr(l.debit) : ""}</TableCell>
                            <TableCell className="text-right">{l.credit ? idr(l.credit) : ""}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="text-sm font-medium">Total</TableCell>
                          <TableCell className="text-right font-medium">{idr(total)}</TableCell>
                          <TableCell className="text-right font-medium">{idr(total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices ------------------------------------------------------- */}
        <TabsContent value="invoices" className="space-y-4">
          {perms.canCreate && (
            <div className="flex justify-end"><InvoiceDialog isPending={isPending} run={run} /></div>
          )}
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>{invoices.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Issued</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-sm">{i.number}</TableCell>
                      <TableCell className="font-medium">{i.customerName}</TableCell>
                      <TableCell>{idr(i.amount)}</TableCell>
                      <TableCell><Badge variant={invoiceVariants[i.status] ?? "outline"}>{i.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(i.issueDate, "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No invoices yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments ------------------------------------------------------- */}
        <TabsContent value="payments" className="space-y-4">
          {perms.canCreate && (
            <div className="flex justify-end"><PaymentDialog invoices={invoices} isPending={isPending} run={run} /></div>
          )}
          <Card>
            <CardHeader><CardTitle>Payments</CardTitle><CardDescription>{payments.length} total</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{format(p.paymentDate, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm">{p.invoiceId ? invoiceNo.get(p.invoiceId) ?? "-" : "-"}</TableCell>
                      <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                      <TableCell className="font-medium">{idr(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No payments yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets -------------------------------------------------------- */}
        {features.budget && (
          <TabsContent value="budgets" className="space-y-4">
            {perms.canEdit && accounts.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Set Budget</CardTitle></CardHeader>
                <CardContent><BudgetForm accounts={accounts} isPending={isPending} run={run} /></CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Budgets</CardTitle><CardDescription>{budgets.length} entries</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {budgets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm">{acctName.get(b.accountId) ?? b.accountId}</TableCell>
                        <TableCell className="font-mono text-sm">{b.period}</TableCell>
                        <TableCell className="font-medium">{idr(b.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {budgets.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No budgets yet.</TableCell></TableRow>)}
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

// --- dialogs -----------------------------------------------------------------

function AccountDialog({ isPending, run }: { isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<"asset" | "liability" | "equity" | "revenue" | "expense">("asset")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Account</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !code || !name} onClick={() => run(async () => { await createAccountAction({ code, name, type }); setOpen(false); setCode(""); setName(""); setType("asset") }, "Account created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvoiceDialog({ isPending, run }: { isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState("")
  const [customer, setCustomer] = useState("")
  const [amount, setAmount] = useState("")
  const [issueDate, setIssueDate] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Invoice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Number</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
          <div className="space-y-2"><Label>Customer</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !number || !customer || !issueDate} onClick={() => run(async () => { await createInvoiceAction({ number, customerName: customer, amount: Number(amount) || 0, issueDate }); setOpen(false); setNumber(""); setCustomer(""); setAmount(""); setIssueDate("") }, "Invoice created")}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentDialog({ invoices, isPending, run }: { invoices: InvoiceDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [invoiceId, setInvoiceId] = useState("none")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("transfer")
  const [date, setDate] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />Record Payment</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Invoice</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {invoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.number} — {i.customerName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-2"><Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || !amount || !date} onClick={() => run(async () => { await createPaymentAction({ invoiceId: invoiceId === "none" ? null : invoiceId, amount: Number(amount) || 0, method, paymentDate: date }); setOpen(false); setInvoiceId("none"); setAmount(""); setMethod("transfer"); setDate("") }, "Payment recorded")}>Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type JLine = { accountId: string; debit: string; credit: string }

function JournalDialog({ accounts, isPending, run }: { accounts: AccountDto[]; isPending: boolean; run: RunFn }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState("")
  const [lines, setLines] = useState<JLine[]>([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ])

  function setLine(i: number, patch: Partial<JLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = totalDebit === totalCredit && totalDebit > 0
  const allHaveAccount = lines.every((l) => l.accountId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 size-4" />New Journal Entry</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Lines</Label>
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={l.accountId} onValueChange={(v) => setLine(i, { accountId: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="w-28" type="number" placeholder="Debit" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: "" })} />
                <Input className="w-28" type="number" placeholder="Credit" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: "" })} />
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setLines((p) => [...p, { accountId: "", debit: "", credit: "" }])}><Plus className="mr-1 size-3" />Add line</Button>
              <span className={`text-sm ${balanced ? "text-green-600" : "text-muted-foreground"}`}>
                D {idr(totalDebit)} / C {idr(totalCredit)} {balanced ? "✓ balanced" : ""}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending || !balanced || !allHaveAccount}
            onClick={() => run(async () => {
              await createJournalEntryAction({
                entryDate: date, reference: reference || null,
                lines: lines.map((l) => ({ accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
              })
              setOpen(false); setReference(""); setLines([{ accountId: "", debit: "", credit: "" }, { accountId: "", debit: "", credit: "" }])
            }, "Journal entry created")}
          >Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BudgetForm({ accounts, isPending, run }: { accounts: AccountDto[]; isPending: boolean; run: RunFn }) {
  const [accountId, setAccountId] = useState("")
  const [period, setPeriod] = useState(String(new Date().getFullYear()))
  const [amount, setAmount] = useState("")
  return (
    <div className="flex gap-2 items-end flex-wrap">
      <div className="flex-1 min-w-[200px] space-y-1"><Label>Account</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="w-32 space-y-1"><Label>Period</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026 or 2026-06" /></div>
      <div className="w-32 space-y-1"><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <Button disabled={isPending || !accountId || !/^\d{4}(-\d{2})?$/.test(period)} onClick={() => run(async () => { await setBudgetAction({ accountId, period, amount: Number(amount) || 0 }) }, "Budget set")}>Set</Button>
    </div>
  )
}
