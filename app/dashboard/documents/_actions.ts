"use server"

import { revalidatePath } from "next/cache"
import {
  createDocument,
  deleteDocument,
  addDocumentVersion,
} from "@/lib/services/document/service"

export async function createDocumentAction(input: {
  title: string
  documentType: string
  fileName: string
  mimeType: string
}) {
  await createDocument({
    title: input.title,
    documentType: input.documentType,
    fileName: input.fileName,
    filePath: `/uploads/${input.fileName}`,
    mimeType: input.mimeType,
    fileSize: 0,
  })
  revalidatePath("/dashboard/documents")
}

export async function addVersionAction(id: string, fileName: string, mimeType: string) {
  await addDocumentVersion(id, {
    fileName,
    filePath: `/uploads/${fileName}`,
    mimeType,
    fileSize: 0,
  })
  revalidatePath("/dashboard/documents")
}

export async function deleteDocumentAction(id: string) {
  await deleteDocument(id)
  revalidatePath("/dashboard/documents")
}
