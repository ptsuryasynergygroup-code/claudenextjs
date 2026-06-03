import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/base"

const { auth } = NextAuth(authConfig)

const PUBLIC_PREFIXES = ["/signin", "/api/auth"]
const PROTECTED_PREFIXES = ["/dashboard", "/api"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

export default auth((req) => {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
