import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type DocumentDto,
  type DocumentStatus,
  type CreateDocumentInput,
  type UpdateDocumentInput,
  type AddVersionInput,
} from "./schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const statusOut: Record<string, DocumentStatus> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
}

const statusIn: Record<DocumentStatus, "DRAFT" | "ACTIVE" | "ARCHIVED"> = {
  draft: "DRAFT",
  active: "ACTIVE",
  archived: "ARCHIVED",
}

const include = { versions: { orderBy: { version: "desc" as const } } }
type Row = Prisma.DocumentGetPayload<{ include: typeof include }>

function toDto(d: Row): DocumentDto {
  return {
    id: d.id,
    organizationId: d.organizationId,
    title: d.title,
    documentType: d.documentType,
    status: statusOut[d.status] ?? "draft",
    uploadedBy: d.uploadedBy,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    versions: d.versions.map((v) => ({
      id: v.id,
      documentId: v.documentId,
      version: v.version,
      fileName: v.fileName,
      filePath: v.filePath,
      fileSize: v.fileSize,
      mimeType: v.mimeType,
      notes: v.notes,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
    })),
  }
}

export async function listDocuments(ctx: Ctx): Promise<DocumentDto[]> {
  const rows = await db(ctx).document.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include,
  })
  return rows.map(toDto)
}

export async function findDocument(ctx: Ctx, id: string): Promise<DocumentDto | null> {
  const row = await db(ctx).document.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    include,
  })
  return row ? toDto(row) : null
}

export async function createDocument(
  ctx: Ctx,
  data: CreateDocumentInput,
  uploadedBy: string,
): Promise<DocumentDto> {
  const row = await db(ctx).document.create({
    data: {
      organizationId: ctx.orgId,
      title: data.title,
      documentType: data.documentType,
      status: statusIn[data.status],
      uploadedBy,
      versions: {
        create: {
          version: 1,
          fileName: data.fileName,
          filePath: data.filePath,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          notes: data.notes ?? null,
          createdBy: uploadedBy,
        },
      },
    },
    include,
  })
  return toDto(row)
}

export async function updateDocument(
  ctx: Ctx,
  id: string,
  data: UpdateDocumentInput,
): Promise<DocumentDto> {
  const row = await db(ctx).document.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      title: data.title,
      documentType: data.documentType,
      status: data.status ? statusIn[data.status] : undefined,
    },
    include,
  })
  return toDto(row)
}

export async function addVersion(
  ctx: Ctx,
  id: string,
  data: AddVersionInput,
  createdBy: string,
): Promise<DocumentDto> {
  const existing = await db(ctx).document.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  })
  if (!existing) throw new Error("Document not found")
  const nextVersion = (existing.versions[0]?.version ?? 0) + 1

  await db(ctx).documentVersion.create({
    data: {
      documentId: id,
      version: nextVersion,
      fileName: data.fileName,
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      notes: data.notes ?? null,
      createdBy,
    },
  })

  const row = await db(ctx).document.findFirstOrThrow({
    where: { id, organizationId: ctx.orgId },
    include,
  })
  return toDto(row)
}

export async function softDeleteDocument(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).document.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Document not found")
  await db(ctx).document.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}
