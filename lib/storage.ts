import { mkdir, writeFile, readFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"

// Local filesystem storage for uploaded files. Files live OUTSIDE the public
// web root (./storage) and are only served through authenticated, org-scoped
// route handlers. For production/object-storage, swap the impl behind these
// functions — callers only see relative paths + buffers.

const STORAGE_ROOT = path.join(process.cwd(), "storage")

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

export function validateUpload(size: number, mime: string): string | null {
  if (size <= 0) return "Empty file"
  if (size > MAX_BYTES) return "File exceeds 10 MB"
  if (!ALLOWED_MIME.has(mime)) return "Unsupported file type (pdf, image, or doc only)"
  return null
}

function safeExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : ""
}

/** Writes a buffer under storage/<subdir>/ with a random name. Returns the
 *  path relative to the storage root (what gets persisted in the DB). */
export async function saveFile(subdir: string, originalName: string, data: Buffer): Promise<string> {
  const dir = path.join(STORAGE_ROOT, subdir)
  await mkdir(dir, { recursive: true })
  const name = randomBytes(16).toString("hex") + safeExt(originalName)
  const rel = path.posix.join(subdir, name)
  await writeFile(path.join(STORAGE_ROOT, rel), data)
  return rel
}

/** Reads a stored file by its relative path. Guards against path traversal. */
export async function readStoredFile(relPath: string): Promise<Buffer> {
  const abs = path.resolve(STORAGE_ROOT, relPath)
  if (!abs.startsWith(STORAGE_ROOT + path.sep)) throw new Error("Invalid path")
  return readFile(abs)
}
