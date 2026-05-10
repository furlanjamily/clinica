import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  })

  if (!token) {
    if (process.env.PORTFOLIO_DEMO_AUTH === "true") {
      const path = req.nextUrl.pathname
      const dest =
        path === "/"
          ? "/dashboard"
          : `${path}${req.nextUrl.search}`
      const safePath = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/dashboard"
      const auto = new URL("/portfolio-auto", req.url)
      auto.searchParams.set("callbackUrl", safePath)
      return NextResponse.redirect(auto)
    }

    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
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
    "/finance/:path*",
    "/settings/:path*",
  ],
}
