import { NextRequest, NextResponse } from "next/server";
import { isSecureCookieRequest } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  const secureCookie = isSecureCookieRequest(req);

  response.cookies.set("nnvs_token", "", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("activeProfileId", "", {
    httpOnly: false,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
