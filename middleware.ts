import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ["/profile"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Check for session cookie (NextAuth sets this cookie)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value || // Production
    req.cookies.get("__Secure-authjs.session-token")?.value // HTTPS

  const isAuthenticated = !!sessionToken

  // Redirect to login if trying to access protected route while not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to home if trying to access login while authenticated
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run on protected routes and login page (lighter than matching everything)
    "/profile/:path*",
    "/login",
  ],
}
