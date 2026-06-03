import { z } from "zod"

export const EmployeeDocTypeSchema = z.enum([
  "cv",
  "ijazah",
  "sertifikasi",
  "kontrak",
  "ktp",
  "lainnya",
])
export type EmployeeDocType = z.infer<typeof EmployeeDocTypeSchema>

export const EmployeeDocTypeLabels: Record<EmployeeDocType, string> = {
  cv: "CV / Resume",
  ijazah: "Ijazah",
  sertifikasi: "Sertifikasi",
  kontrak: "Kontrak Kerja",
  ktp: "KTP",
  lainnya: "Lainnya",
}

export const EmployeeDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  docType: z.string(),
  title: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  uploadedBy: z.string(),
  createdAt: z.date(),
})
export type EmployeeDocumentDto = z.infer<typeof EmployeeDocumentSchema>
