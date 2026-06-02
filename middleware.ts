// Next.js middleware — runs at the edge before any route handler.
//
// Responsibility (PRD §2 layer 4):
//   1. Bounce unauthenticated requests to /signin for protected routes.
//   2. (Future) coarse-grained entitlement preflight per route prefix.
//
// Fine-grained guards (entitlement + RBAC + audit) live in lib/services/* and
// run at the service boundary — NOT here. Middleware is best-effort UX, not
// the source of truth for security.

import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth/config"

const PUBLIC_PREFIXES = ["/signin", "/api/auth", "/_next", "/favicon.ico"]
const PROTECTED_PREFIXES = ["/dashboard", "/api"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

export default auth(async (req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl

  if (isPublic(pathname) || !isProtected(pathname)) {
    return NextResponse.next()
  }

  if (!req.auth) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  // Skip Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
