// Typed application errors used by guards (auth, entitlement, rbac).
// Handlers convert these to HTTP responses; tests assert on `.code`.

export type EosErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ENTITLEMENT_REQUIRED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL"

export class EosError extends Error {
  readonly code: EosErrorCode
  readonly status: number
  readonly meta?: Record<string, unknown>

  constructor(code: EosErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message)
    this.name = "EosError"
    this.code = code
    this.meta = meta
    this.status = statusFor(code)
  }
}

function statusFor(code: EosErrorCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401
    case "FORBIDDEN":
    case "ENTITLEMENT_REQUIRED":
      return 403
    case "NOT_FOUND":
      return 404
    case "VALIDATION":
      return 422
    case "CONFLICT":
      return 409
    default:
      return 500
  }
}

export function unauthenticated(meta?: Record<string, unknown>): never {
  throw new EosError("UNAUTHENTICATED", "Not signed in", meta)
}

export function forbidden(meta?: Record<string, unknown>): never {
  throw new EosError("FORBIDDEN", "Permission denied", meta)
}

export function entitlementRequired(moduleCode: string): never {
  throw new EosError("ENTITLEMENT_REQUIRED", `Module not enabled: ${moduleCode}`, { moduleCode })
}

export function notFound(entityType?: string): never {
  throw new EosError("NOT_FOUND", entityType ? `${entityType} not found` : "Not found", { entityType })
}
