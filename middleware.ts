import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("nnvs_token")?.value;

  const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/profiles",
  "/membership",
  "/settings",
  "/admin",
];

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
  "/dashboard/:path*",
  "/profile/:path*",
  "/profiles/:path*",
  "/membership/:path*",
  "/settings/:path*",
  "/admin/:path*",
],
}