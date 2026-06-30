import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import {
  getDefaultRouteForRole,
  isRouteForbiddenForRole,
} from "@/lib/auth/permissions"
import type { UserRoleType } from "@/types/auth"

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  })

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  const role = token.role as UserRoleType | null | undefined
  const pathname = req.nextUrl.pathname

  if (isRouteForbiddenForRole(pathname, role)) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), req.url))
  }

  if (pathname === "/" && role) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/schedule/:path*",
    "/attendance/:path*",
    "/medical-record/:path*",
    "/new-patient/:path*",
    "/doctors",
    "/doctors/:path*",
    "/users",
    "/users/:path*",
    "/finance",
    "/finance/:path*",
    "/chat",
    "/chat/:path*",
    "/settings/:path*",
  ],
}
