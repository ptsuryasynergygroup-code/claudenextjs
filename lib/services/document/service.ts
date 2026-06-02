import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/document/repository"
import {
  type DocumentDto,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  AddVersionSchema,
} from "@/lib/entities/document/schema"
import { notFound } from "@/lib/errors"

const MODULE = "documents"

export async function getDocuments(): Promise<DocumentDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.view")
  return repo.listDocuments({ orgId: s.orgId })
}

export async function getDocument(id: string): Promise<DocumentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.view")
  const d = await repo.findDocument({ orgId: s.orgId }, id)
  if (!d) notFound("Document")
  return d
}

export async function createDocument(input: unknown): Promise<DocumentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.create")
  const data = CreateDocumentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const d = await repo.createDocument({ orgId: s.orgId, tx }, data, s.userId)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Document",
      entityId: d.id,
      action: "create",
      description: `Uploaded document: ${d.title}`,
      newValue: { title: d.title, documentType: d.documentType },
    })
    return d
  })
}

export async function updateDocument(id: string, input: unknown): Promise<DocumentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.edit")
  const data = UpdateDocumentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findDocument({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Document")
    const after = await repo.updateDocument({ orgId: s.orgId, tx }, id, data)
    const d = diff(
      { title: before.title, documentType: before.documentType, status: before.status },
      { title: after.title, documentType: after.documentType, status: after.status },
    )
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Document",
      entityId: after.id,
      action: "update",
      description: `Updated document: ${after.title}`,
      oldValue: d.old,
      newValue: d.new,
    })
    return after
  })
}

export async function addDocumentVersion(id: string, input: unknown): Promise<DocumentDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.edit")
  const data = AddVersionSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const before = await repo.findDocument({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Document")
    const after = await repo.addVersion({ orgId: s.orgId, tx }, id, data, s.userId)
    const newVersion = after.versions[0]?.version ?? null
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Document",
      entityId: after.id,
      action: "update",
      description: `Added version ${newVersion} to: ${after.title}`,
      newValue: { version: newVersion, fileName: data.fileName },
    })
    return after
  })
}

export async function deleteDocument(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "documents.delete")

  await prisma.$transaction(async (tx) => {
    const before = await repo.findDocument({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Document")
    await repo.softDeleteDocument({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx,
      orgId: s.orgId,
      userId: s.userId,
      userName: s.name,
      entityType: "Document",
      entityId: id,
      action: "delete",
      description: `Deleted document: ${before.title}`,
      oldValue: { title: before.title },
    })
  })
}
