"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  createEmployeeAction,
  updateEmployeeAction,
  type EmployeeFormValues,
} from "../_actions"
import type { EmployeeDto } from "@/lib/entities/hr/schema"
import type { BranchDto, DepartmentDto, PositionDto } from "@/lib/entities/organization/schema"

type Opt = { id: string; name: string }

function toDateInput(d: Date | null): string {
  if (!d) return ""
  return new Date(d).toISOString().slice(0, 10)
}

export function EmployeeForm({
  initial,
  branches,
  departments,
  positions,
}: {
  initial?: EmployeeDto
  branches: BranchDto[]
  departments: DepartmentDto[]
  positions: PositionDto[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const edit = Boolean(initial)

  const [v, setV] = useState<EmployeeFormValues>({
    employeeCode: initial?.employeeCode ?? "",
    fullName: initial?.fullName ?? "",
    nik: initial?.nik ?? "",
    dateOfBirth: toDateInput(initial?.dateOfBirth ?? null),
    gender: (initial?.gender as "male" | "female" | null) ?? null,
    maritalStatus: initial?.maritalStatus ?? "",
    religion: initial?.religion ?? "",
    address: initial?.address ?? "",
    phone: initial?.phone ?? "",
    personalEmail: initial?.personalEmail ?? "",
    branchId: initial?.branchId ?? null,
    departmentId: initial?.departmentId ?? null,
    positionId: initial?.positionId ?? null,
    joinDate: toDateInput(initial?.joinDate ?? new Date()),
    endDate: toDateInput(initial?.endDate ?? null),
    employmentStatus: initial?.employmentStatus ?? "permanent",
    basicSalary: initial?.basicSalary ?? null,
    bankName: initial?.bankName ?? "",
    bankAccount: initial?.bankAccount ?? "",
    npwp: initial?.npwp ?? "",
  })

  function set<K extends keyof EmployeeFormValues>(k: K, val: EmployeeFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }))
  }

  function onSubmit() {
    startTransition(async () => {
      try {
        if (edit && initial) {
          await updateEmployeeAction(initial.id, v)
          toast.success("Employee updated")
        } else {
          await createEmployeeAction(v)
          toast.success("Employee created")
        }
        router.push("/dashboard/hr")
        router.refresh()
      } catch {
        toast.error("Save failed — check required fields and code uniqueness")
      }
    })
  }

  const text = (k: keyof EmployeeFormValues, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={type}
        value={(v[k] as string) ?? ""}
        onChange={(e) => set(k, (type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value) as never)}
      />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {text("employeeCode", "Employee Code *")}
          {text("fullName", "Full Name *")}
          {text("nik", "NIK")}
          {text("dateOfBirth", "Date of Birth", "date")}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={v.gender ?? "none"} onValueChange={(val) => set("gender", val === "none" ? null : (val as "male" | "female"))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {text("maritalStatus", "Marital Status")}
          {text("religion", "Religion")}
          {text("npwp", "NPWP")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {text("phone", "Phone")}
          {text("personalEmail", "Personal Email", "email")}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={v.branchId ?? "none"} onValueChange={(val) => set("branchId", val === "none" ? null : val)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {branches.map((b: Opt) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={v.departmentId ?? "none"} onValueChange={(val) => set("departmentId", val === "none" ? null : val)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {departments.map((d: Opt) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={v.positionId ?? "none"} onValueChange={(val) => set("positionId", val === "none" ? null : val)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {positions.map((p: Opt) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Employment Status</Label>
            <Select value={v.employmentStatus} onValueChange={(val) => set("employmentStatus", val as EmployeeFormValues["employmentStatus"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {text("joinDate", "Join Date *", "date")}
          {text("endDate", "End Date", "date")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payroll details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {text("basicSalary", "Basic Salary", "number")}
          {text("bankName", "Bank Name")}
          {text("bankAccount", "Bank Account")}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={isPending || !v.employeeCode || !v.fullName || !v.joinDate}>
          {edit ? "Save changes" : "Create employee"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard/hr")}>Cancel</Button>
      </div>
    </div>
  )
}
