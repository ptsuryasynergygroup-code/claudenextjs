// Operator (vendor) entitlement source. When OPERATOR_URL + CLIENT_API_KEY are
// configured, the operator server is the source of truth for which modules and
// features this client deployment may use. Result is cached in-process.
//
// Returns null when: not configured, operator unreachable, or a non-definitive
// error — callers then fall back to the local organization_modules table.
// A 403 (client suspended) is definitive and returns an empty entitlement set.

type Entitlements = { modules: string[]; features: string[] }

const TTL_MS = 60_000
const TIMEOUT_MS = 3000

let cache: { data: Entitlements; expires: number } | null = null

export function isOperatorConfigured(): boolean {
  return Boolean(process.env.OPERATOR_URL && process.env.CLIENT_API_KEY)
}

export async function fetchOperatorEntitlements(): Promise<Entitlements | null> {
  const base = process.env.OPERATOR_URL
  const key = process.env.CLIENT_API_KEY
  if (!base || !key) return null

  if (cache && cache.expires > Date.now()) return cache.data

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/entitlements.php`, {
      headers: { "X-Client-Key": key },
      signal: controller.signal,
      cache: "no-store",
    })

    if (res.status === 403) {
      const data: Entitlements = { modules: [], features: [] }
      cache = { data, expires: Date.now() + TTL_MS }
      return data
    }
    if (!res.ok) return null

    const json = (await res.json()) as Partial<Entitlements>
    const data: Entitlements = {
      modules: Array.isArray(json.modules) ? json.modules : [],
      features: Array.isArray(json.features) ? json.features : [],
    }
    cache = { data, expires: Date.now() + TTL_MS }
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
