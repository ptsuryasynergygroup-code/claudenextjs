// PII redaction for audit_logs old_value/new_value.
// PRD invariant I9: PII fields are masked before persisting.
//
// Source of truth for what counts as PII = `/// @pii` comments in prisma/schema.prisma.
// When you add a new PII field, add its NAME (camelCase as Prisma surfaces it) below.

const PII_FIELDS = new Set<string>([
  "email",
  "phone",
  "address",
  "taxNumber",
  "passwordHash",
  "ipAddress",
  // HR/Finance (will grow as Phase 3-4 modules land):
  "nik",
  "salary",
  "bankAccount",
  "npwp",
])

// Fields that should never appear in audit at all (security secrets).
const NEVER_LOG_FIELDS = new Set<string>([
  "passwordHash",
  "refresh_token",
  "access_token",
  "id_token",
])

type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

/**
 * Returns a copy of the input with PII masked and security fields stripped.
 * Pass `null` through unchanged.
 */
export function redact<T>(value: T): T {
  return redactValue(value as unknown as Json) as unknown as T
}

function redactValue(value: Json): Json {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(redactValue)
  if (typeof value !== "object") return value

  const out: Record<string, Json> = {}
  for (const [k, v] of Object.entries(value)) {
    if (NEVER_LOG_FIELDS.has(k)) continue
    if (PII_FIELDS.has(k)) {
      out[k] = maskField(k, v)
    } else if (v && typeof v === "object") {
      out[k] = redactValue(v as Json)
    } else {
      out[k] = v
    }
  }
  return out
}

function maskField(key: string, value: Json): Json {
  if (value === null || value === undefined) return value
  if (typeof value !== "string") return "[REDACTED]"

  switch (key) {
    case "email":
      return maskEmail(value)
    case "phone":
      return maskPhone(value)
    case "ipAddress":
      return maskIp(value)
    default:
      return "[REDACTED]"
  }
}

function maskEmail(v: string): string {
  const at = v.indexOf("@")
  if (at <= 1) return "[REDACTED]"
  return `${v[0]}***${v.slice(at)}`
}

function maskPhone(v: string): string {
  if (v.length < 6) return "[REDACTED]"
  return `${v.slice(0, 3)}***${v.slice(-3)}`
}

function maskIp(v: string): string {
  // IPv4: keep first two octets, IPv6: keep prefix.
  if (v.includes(".")) {
    const parts = v.split(".")
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.x.x` : "[REDACTED]"
  }
  if (v.includes(":")) return `${v.split(":").slice(0, 2).join(":")}::x`
  return "[REDACTED]"
}
