"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Download, Trash2, Upload } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { uploadEmployeeDocumentAction, deleteEmployeeDocumentAction } from "../_actions"
import {
  EmployeeDocTypeLabels,
  type EmployeeDocumentDto,
} from "@/lib/entities/hr/document-schema"

function humanSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function EmployeeDocuments({
  employeeId,
  documents,
  canEdit,
  canDelete,
}: {
  employeeId: string
  documents: EmployeeDocumentDto[]
  canEdit: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function onUpload(formData: FormData) {
    setUploading(true)
    try {
      await uploadEmployeeDocumentAction(formData)
      toast.success("Document uploaded")
      formRef.current?.reset()
      router.refresh()
    } catch {
      toast.error("Upload failed — check file type (pdf/image/doc) and size (≤10MB)")
    } finally {
      setUploading(false)
    }
  }

  function onDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteEmployeeDocumentAction(id, employeeId)
        toast.success("Document deleted")
        router.refresh()
      } catch {
        toast.error("Delete failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>CV, ijazah, sertifikasi, kontrak, KTP, and other files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <form ref={formRef} action={onUpload} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
            <input type="hidden" name="employeeId" value={employeeId} />
            <div className="space-y-1">
              <Label htmlFor="docType">Type</Label>
              <select id="docType" name="docType" defaultValue="cv" className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(EmployeeDocTypeLabels).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1 min-w-[160px]">
              <Label htmlFor="title">Title (optional)</Label>
              <Input id="title" name="title" placeholder="e.g. S1 Teknik Informatika" />
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" />
            </div>
            <Button type="submit" disabled={uploading}>
              <Upload className="mr-2 size-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </form>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell><Badge variant="secondary">{EmployeeDocTypeLabels[d.docType as keyof typeof EmployeeDocTypeLabels] ?? d.docType}</Badge></TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{d.title || d.fileName}</div>
                  {d.title && <div className="text-xs text-muted-foreground">{d.fileName}</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{humanSize(d.fileSize)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(d.createdAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <a href={`/api/hr/documents/${d.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="size-8"><Download className="size-4" /></Button>
                    </a>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" disabled={isPending} onClick={() => onDelete(d.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No documents uploaded.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
