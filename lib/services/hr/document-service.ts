import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog } from "@/lib/audit"
import { saveFile, readStoredFile, validateUpload } from "@/lib/storage"
import * as repo from "@/lib/entities/hr/document-repository"
import { EmployeeDocTypeSchema, type EmployeeDocumentDto } from "@/lib/entities/hr/document-schema"
import { notFound, forbidden } from "@/lib/errors"
import { z } from "zod"

const MODULE = "hr"

const UploadMetaSchema = z.object({
  employeeId: z.string().min(1),
  docType: EmployeeDocTypeSchema,
  title: z.string().trim().min(1).nullable().optional(),
})

export async function listEmployeeDocuments(employeeId: string): Promise<EmployeeDocumentDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  return repo.listByEmployee({ orgId: s.orgId }, employeeId)
}

export async function uploadEmployeeDocument(input: {
  employeeId: string
  docType: string
  title?: string | null
  fileName: string
  mimeType: string
  bytes: Buffer
}): Promise<EmployeeDocumentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.edit")

  const meta = UploadMetaSchema.parse({
    employeeId: input.employeeId,
    docType: input.docType,
    title: input.title ?? null,
  })

  const err = validateUpload(input.bytes.length, input.mimeType)
  if (err) forbidden({ reason: err })

  const emp = await prisma.employee.findFirst({
    where: { id: meta.employeeId, organizationId: s.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!emp) notFound("Employee")

  const filePath = await saveFile(`employee-docs/${s.orgId}`, input.fileName, input.bytes)

  return prisma.$transaction(async (tx) => {
    const doc = await repo.create(
      { orgId: s.orgId, tx },
      {
        employeeId: meta.employeeId,
        docType: meta.docType,
        title: meta.title ?? null,
        fileName: input.fileName,
        filePath,
        fileSize: input.bytes.length,
        mimeType: input.mimeType,
        uploadedBy: s.userId,
      },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "EmployeeDocument",
      entityId: doc.id,
      action: "create",
      description: `Uploaded ${meta.docType} for employee ${meta.employeeId}: ${input.fileName}`,
      newValue: { docType: meta.docType, fileName: input.fileName },
    })
    return doc
  })
}

export async function deleteEmployeeDocument(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.delete")
  const before = await repo.findMeta({ orgId: s.orgId }, id)
  if (!before) notFound("EmployeeDocument")
  await prisma.$transaction(async (tx) => {
    await repo.remove({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "EmployeeDocument",
      entityId: id,
      action: "delete",
      description: `Deleted document: ${before.fileName}`,
      oldValue: { fileName: before.fileName },
    })
  })
}

/** Authenticated download — guards then returns the file bytes + headers. */
export async function getEmployeeDocumentDownload(id: string): Promise<{
  fileName: string
  mimeType: string
  bytes: Buffer
} | null> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "hr.view")
  const row = await repo.findForDownload({ orgId: s.orgId }, id)
  if (!row) return null
  const bytes = await readStoredFile(row.filePath)
  return { fileName: row.fileName, mimeType: row.mimeType, bytes }
}
