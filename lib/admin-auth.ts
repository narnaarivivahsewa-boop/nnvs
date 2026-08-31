import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

type AdminAuthResult =
  | {
      authorized: true;
      user: Awaited<ReturnType<typeof verifyToken>>;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

export async function requireAdmin(
  req: NextRequest
): Promise<AdminAuthResult> {
  const token = req.cookies.get("nnvs_token")?.value;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  try {
    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN") {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user: payload,
    };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}
