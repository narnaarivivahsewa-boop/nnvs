import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

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
      const payload = await verifyToken(token);

      const payloadMobile = String(payload.mobile || "").replace(/\D/g, "");
      const isPermAdmin = ["9871592002", "9577540005"].some((num) => payloadMobile.endsWith(num));

      if (payload.role !== "ADMIN" && !isPermAdmin) {
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