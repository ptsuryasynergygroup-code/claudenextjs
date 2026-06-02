'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Plus, MoreHorizontal, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createDocumentAction, deleteDocumentAction } from './_actions'
import type { DocumentDto } from '@/lib/entities/document/schema'

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  archived: 'secondary',
}

export function DocumentsView({
  documents,
  canCreate,
  canDelete,
}: {
  documents: DocumentDto[]
  canCreate: boolean
  canDelete: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [fileName, setFileName] = useState('')

  function onCreate() {
    startTransition(async () => {
      try {
        await createDocumentAction({
          title,
          documentType,
          fileName,
          mimeType: 'application/octet-stream',
        })
        toast.success('Document uploaded')
        setOpen(false)
        setTitle('')
        setDocumentType('')
        setFileName('')
      } catch {
        toast.error('Upload failed')
      }
    })
  }

  function onDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteDocumentAction(id)
        toast.success('Document deleted')
      } catch {
        toast.error('Delete failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage documents and versions</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Create a new document with its first version.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Input
                    id="type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder="contract, invoice, policy..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File Name</Label>
                  <Input
                    id="file"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="document.pdf"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={onCreate}
                  disabled={isPending || !title || !documentType || !fileName}
                >
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>{documents.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        {doc.versions[0] && (
                          <p className="text-xs text-muted-foreground">{doc.versions[0].fileName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.documentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Layers className="size-3 text-muted-foreground" />
                      <span className="text-sm">{doc.versions.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[doc.status] ?? 'outline'}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(doc.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={isPending}
                            onClick={() => onDelete(doc.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No documents yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
