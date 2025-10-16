import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl

  // Protected routes
  const protectedRoutes = ["/profile"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

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
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
