import { z } from "zod"

export const DocumentStatusSchema = z.enum(["draft", "active", "archived"])
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

export const DocumentVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  version: z.number().int(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  notes: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
})
export type DocumentVersionDto = z.infer<typeof DocumentVersionSchema>

export const DocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  documentType: z.string(),
  status: DocumentStatusSchema,
  uploadedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  versions: z.array(DocumentVersionSchema),
})
export type DocumentDto = z.infer<typeof DocumentSchema>

export const CreateDocumentSchema = z.object({
  title: z.string().min(1),
  documentType: z.string().min(1),
  status: DocumentStatusSchema.default("draft"),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().int().min(0).default(0),
  mimeType: z.string().min(1),
  notes: z.string().nullable().optional(),
})
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  documentType: z.string().min(1).optional(),
  status: DocumentStatusSchema.optional(),
})
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>

export const AddVersionSchema = z.object({
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().int().min(0).default(0),
  mimeType: z.string().min(1),
  notes: z.string().nullable().optional(),
})
export type AddVersionInput = z.infer<typeof AddVersionSchema>
