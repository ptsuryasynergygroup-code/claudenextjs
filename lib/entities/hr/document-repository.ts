import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import { type EmployeeDocumentDto } from "./document-schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

type Row = Prisma.EmployeeDocumentGetPayload<object>

function toDto(d: Row): EmployeeDocumentDto {
  return {
    id: d.id,
    organizationId: d.organizationId,
    employeeId: d.employeeId,
    docType: d.docType,
    title: d.title,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedBy: d.uploadedBy,
    createdAt: d.createdAt,
  }
}

export async function listByEmployee(ctx: Ctx, employeeId: string): Promise<EmployeeDocumentDto[]> {
  const rows = await db(ctx).employeeDocument.findMany({
    where: { organizationId: ctx.orgId, employeeId },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toDto)
}

export async function create(
  ctx: Ctx,
  data: {
    employeeId: string
    docType: string
    title: string | null
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadedBy: string
  },
): Promise<EmployeeDocumentDto> {
  const row = await db(ctx).employeeDocument.create({
    data: { organizationId: ctx.orgId, ...data },
  })
  return toDto(row)
}

/** Returns full row incl. filePath — only for the authenticated download route. */
export async function findForDownload(ctx: Ctx, id: string) {
  return db(ctx).employeeDocument.findFirst({
    where: { id, organizationId: ctx.orgId },
  })
}

export async function findMeta(ctx: Ctx, id: string): Promise<EmployeeDocumentDto | null> {
  const row = await db(ctx).employeeDocument.findFirst({ where: { id, organizationId: ctx.orgId } })
  return row ? toDto(row) : null
}

export async function remove(ctx: Ctx, id: string): Promise<void> {
  await db(ctx).employeeDocument.deleteMany({ where: { id, organizationId: ctx.orgId } })
}
