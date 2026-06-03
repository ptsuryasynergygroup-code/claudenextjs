import { getEmployeeDocumentDownload } from "@/lib/services/hr/document-service"
import { EosError } from "@/lib/errors"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const doc = await getEmployeeDocumentDownload(id)
    if (!doc) return new Response("Not found", { status: 404 })
    return new Response(new Uint8Array(doc.bytes), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (e) {
    if (e instanceof EosError) return new Response(e.message, { status: e.status })
    return new Response("Error", { status: 500 })
  }
}
