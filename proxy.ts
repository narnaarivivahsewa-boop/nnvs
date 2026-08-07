import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET!
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect Admin Pages & APIs
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    const token =
      req.cookies.get("nnvs_token")?.value;

    if (!token) {
      // API
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      // Page
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        secret
      );

      if (payload.role !== "ADMIN") {
        if (pathname.startsWith("/api/admin")) {
          return NextResponse.json(
            {
              success: false,
              message: "Forbidden",
            },
            {
              status: 403,
            }
          );
        }

        return NextResponse.redirect(
          new URL("/", req.url)
        );
      }

      return NextResponse.next();

    } catch (error) {
      console.error("PROXY ERROR:", error);

      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid Token",
          },
          {
            status: 401,
          }
        );
      }

      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};